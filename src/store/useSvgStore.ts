import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type SvgElement } from '@/lib/utils/parseSvgElements';

export interface SvgPatch {
    id: string;
    attribute: string;
    subKey?: string;
    oldValue: any;
    newValue: any;
}

interface SvgStore {
    // Data
    originalSvg: string;
    elements: Record<string, SvgElement>;
    elementOrder: string[];
    selectedElementId: string | null;

    // Undo/Redo
    history: SvgPatch[][];
    historyIndex: number;

    // Actions
    setInitialSvg: (svg: string) => void;
    updateElement: (id: string, updates: Partial<SvgElement>, undoable?: boolean) => void;
    selectElement: (id: string | null) => void;
    reorderElements: (newOrder: string[], undoable?: boolean) => void;

    // History Actions
    undo: () => void;
    redo: () => void;

    // Getters
    getOrderedElements: () => SvgElement[];
}

export const useSvgStore = create<SvgStore>()(
    subscribeWithSelector((set, get) => ({
        originalSvg: '',
        elements: {},
        elementOrder: [],
        selectedElementId: null,
        history: [],
        historyIndex: -1,

        setInitialSvg: (svg) => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svg.trim(), "image/svg+xml");
            const allElements = Array.from(svgDoc.querySelectorAll("*")).filter(el => el.tagName.toLowerCase() !== "svg");

            const elementsMap: Record<string, SvgElement> = {};
            const order: string[] = [];
            const idCount: Record<string, number> = {};

            allElements.forEach((domEl) => {
                const tag = domEl.tagName.toLowerCase();
                const nonEditableTags = [
                    'defs', 'style', 'lineargradient', 'radialgradient',
                    'pattern', 'clippath', 'mask', 'filter', 'fegaussianblur', 'feoffset', 'feflood', 'fecomposite', 'femerge', 'femergenode'
                ];

                if (nonEditableTags.includes(tag)) return;

                let id = domEl.getAttribute("id");
                let internalIdAttr = domEl.getAttribute("data-internal-id");
                let baseId = id || internalIdAttr || `el-${tag}`;
                idCount[baseId] = (idCount[baseId] || 0) + 1;
                const internalId = idCount[baseId] > 1 ? `${baseId}_${idCount[baseId]}` : baseId;

                domEl.setAttribute('data-internal-id', internalId);

                const attributes = Object.fromEntries(
                    Array.from(domEl.attributes).map(attr => [attr.name, attr.value])
                );

                // Smart text extraction (similar to parseSvgElements.ts)
                let innerText = "";
                const hasTspans = domEl.querySelectorAll("tspan").length > 0;
                if (hasTspans) {
                    innerText = Array.from(domEl.childNodes)
                        .map(node => {
                            if (node.nodeType === 3) return node.textContent?.trim() || "";
                            if (node.nodeType === 1 && (node as Element).tagName.toLowerCase() === "tspan") return node.textContent || "";
                            return "";
                        })
                        .filter(text => text.length > 0)
                        .join("\n");
                } else {
                    innerText = domEl.textContent?.trim() || "";
                }

                if (innerText.toLowerCase() === "test document") return;

                const element: SvgElement = {
                    tag,
                    id: id || undefined,
                    originalId: id || undefined,
                    internalId: internalId as any,
                    attributes,
                    innerText: innerText || undefined
                };

                elementsMap[internalId] = element;
                order.push(internalId);
            });

            const serializer = new XMLSerializer();
            const modifiedSvg = serializer.serializeToString(svgDoc);

            set({
                originalSvg: modifiedSvg,
                elements: elementsMap,
                elementOrder: order,
                history: [],
                historyIndex: -1,
                selectedElementId: null
            });
        },

        updateElement: (id, updates, undoable = true) => {
            const { elements, history, historyIndex } = get();
            const currentElement = elements[id];
            if (!currentElement) return;

            const patches: SvgPatch[] = [];

            if (undoable) {
                (Object.keys(updates) as (keyof SvgElement)[]).forEach((key) => {
                    if (key === 'attributes') {
                        const attrUpdates = updates.attributes || {};
                        Object.keys(attrUpdates).forEach(subKey => {
                            if (attrUpdates[subKey] !== currentElement.attributes[subKey]) {
                                patches.push({
                                    id, attribute: 'attributes', subKey,
                                    oldValue: currentElement.attributes[subKey],
                                    newValue: attrUpdates[subKey]
                                });
                            }
                        });
                    } else if (updates[key] !== currentElement[key]) {
                        patches.push({
                            id, attribute: key,
                            oldValue: currentElement[key],
                            newValue: updates[key]
                        });
                    }
                });
            }

            const newElements = {
                ...elements,
                [id]: {
                    ...currentElement,
                    ...updates,
                    attributes: {
                        ...currentElement.attributes,
                        ...(updates.attributes || {})
                    }
                }
            };

            const newState: Partial<SvgStore> = { elements: newElements };
            if (undoable && patches.length > 0) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(patches);
                newState.history = newHistory;
                newState.historyIndex = historyIndex + 1;
            }
            set(newState);
        },

        selectElement: (id) => set({ selectedElementId: id }),

        reorderElements: (newOrder, undoable = true) => {
            const { elementOrder, history, historyIndex } = get();
            const newState: Partial<SvgStore> = { elementOrder: newOrder };
            if (undoable) {
                const patches: SvgPatch[] = [{ id: 'global', attribute: 'reorder', oldValue: elementOrder, newValue: newOrder }];
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(patches);
                newState.history = newHistory;
                newState.historyIndex = historyIndex + 1;
            }
            set(newState);
        },

        undo: () => {
            const { history, historyIndex, elements, elementOrder } = get();
            if (historyIndex < 0) return;
            const patches = history[historyIndex];
            const newElements = { ...elements };
            let newOrder = [...elementOrder];
            patches.forEach((patch) => {
                if (patch.id === 'global' && patch.attribute === 'reorder') {
                    newOrder = patch.oldValue;
                } else if (patch.attribute === 'attributes' && patch.subKey) {
                    const el = newElements[patch.id];
                    if (el) newElements[patch.id] = { ...el, attributes: { ...el.attributes, [patch.subKey]: patch.oldValue } };
                } else {
                    const el = newElements[patch.id];
                    if (el) newElements[patch.id] = { ...el, [patch.attribute]: patch.oldValue };
                }
            });
            set({ elements: newElements, elementOrder: newOrder, historyIndex: historyIndex - 1 });
        },

        redo: () => {
            const { history, historyIndex, elements, elementOrder } = get();
            if (historyIndex >= history.length - 1) return;
            const nextIndex = historyIndex + 1;
            const patches = history[nextIndex];
            const newElements = { ...elements };
            let newOrder = [...elementOrder];
            patches.forEach((patch) => {
                if (patch.id === 'global' && patch.attribute === 'reorder') {
                    newOrder = patch.newValue;
                } else if (patch.attribute === 'attributes' && patch.subKey) {
                    const el = newElements[patch.id];
                    if (el) newElements[patch.id] = { ...el, attributes: { ...el.attributes, [patch.subKey]: patch.newValue } };
                } else {
                    const el = newElements[patch.id];
                    if (el) newElements[patch.id] = { ...el, [patch.attribute]: patch.newValue };
                }
            });
            set({ elements: newElements, elementOrder: newOrder, historyIndex: nextIndex });
        },

        getOrderedElements: () => {
            const { elements, elementOrder } = get();
            return elementOrder.map(id => elements[id]);
        }
    }))
);

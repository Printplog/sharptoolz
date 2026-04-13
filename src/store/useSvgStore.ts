import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { type SvgElement } from '@/lib/utils/parseSvgElements';
import { regenerateSvg } from '@/components/Admin/ToolBuilder/SvgEditor/utils/regenerateSvg';
import { getAdaptiveDebounce } from '@/lib/utils/deviceDetection';
import { type SvgPatch as ExternalPatch } from '@/types';

export interface HistoryPatch {
    id: string;
    attribute: string;
    subKey?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    oldValue: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValue: any;
}

export interface MismatchReport {
    unmatchedNew: { id: string, tag: string }[]; // elements in new SVG with no old match
    unmatchedOld: { id: string, tag: string }[]; // full IDs from old elements not found in new SVG
}

interface SvgStore {
    // Data
    originalSvg: string;
    workingSvg: string; // Patched SVG for canvas display
    elements: Record<string, SvgElement>;
    elementOrder: string[];
    selectedElementId: string | null;
    hoveredElementId: string | null;
    commitTimeout: ReturnType<typeof setTimeout> | null;

    // Undo/Redo
    history: HistoryPatch[][];
    historyIndex: number;

    // Actions
    setInitialSvg: (svg: string, preserveFrom?: Record<string, SvgElement>, manualMap?: Record<string, string>) => MismatchReport | null;
    updateElement: (id: string, updates: Partial<SvgElement>, undoable?: boolean) => void;
    commitChanges: (immediate?: boolean) => void; // Bake elements into workingSvg
    selectElement: (id: string | null) => void;
    setHoveredElementId: (id: string | null) => void;
    reorderElements: (newOrder: string[], undoable?: boolean) => void;

    // History Actions
    undo: () => void;
    redo: () => void;

    // Element Management
    deleteElement: (id: string, undoable?: boolean) => void;
    duplicateElement: (id: string, undoable?: boolean) => void;

    // Reset
    reset: () => void;

    // Patches
    applyPatches: (patches: ExternalPatch[]) => void;

    // Getters
    getOrderedElements: () => SvgElement[];
}

export const useSvgStore = create<SvgStore>()(
    subscribeWithSelector((set, get) => ({
        originalSvg: '',
        workingSvg: '',
        elements: {},
        elementOrder: [],
        selectedElementId: null,
        hoveredElementId: null,
        commitTimeout: null,
        history: [],
        historyIndex: -1,

        setInitialSvg: (svg, preserveFrom, manualMap) => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svg.trim(), "image/svg+xml");
            const allElements = Array.from(svgDoc.querySelectorAll("*")).filter(el => el.tagName.toLowerCase() !== "svg");

            const elementsMap: Record<string, SvgElement> = {};
            const order: string[] = [];
            const idCount: Record<string, number> = {};
            const claimedPreserveIds = new Set<string>();
            const claimedOldBaseIds = new Set<string>();
            const unmatchedNew: { id: string, tag: string }[] = [];

            allElements.forEach((domEl) => {
                const tag = domEl.tagName.toLowerCase();
                const nonEditableTags = [
                    'defs', 'style', 'lineargradient', 'radialgradient',
                    'pattern', 'clippath', 'mask', 'filter', 'fegaussianblur', 'feoffset', 'feflood', 'fecomposite', 'femerge', 'femergenode'
                ];

                if (nonEditableTags.includes(tag)) return;

                const id = domEl.getAttribute("id");

                // OPTIMIZATION for >20MB SVGs:
                // Only track elements that are interesting. An element is interesting if:
                // 1. It has an ID
                // 2. It is a text or image node
                const isInteresting = !!id || ['text', 'image', 'foreignobject'].includes(tag);

                if (!isInteresting) return;

                const originalFileId = domEl.getAttribute("id");
                const internalIdAttr = domEl.getAttribute("data-internal-id");
                
                let finalId: string | undefined = undefined;
                let baseIdForInternal: string = "";

                // --- 1. PRESERVATION FIRST ---
                let matchFound = false;
                if (preserveFrom) {
                    const cleanBaseId = (originalFileId || internalIdAttr || `el-${tag}`).split('.')[0];
                    const match = Object.values(preserveFrom).find(el => {
                        if (!el.id || claimedPreserveIds.has(el.id)) return false;
                        const elBaseId = (el.originalId || el.id || "").split('.')[0];
                        return elBaseId === cleanBaseId;
                    });

                    if (match?.id) {
                        finalId = match.id;
                        console.log(`[Store] PRESERVED: "${cleanBaseId}" -> "${finalId}"`);
                        matchFound = true;
                        claimedPreserveIds.add(finalId);
                        claimedOldBaseIds.add((match.originalId || match.id || "").split('.')[0]);
                    } else {
                        // Check manual overrides
                        const manualMatchId = manualMap?.[cleanBaseId];
                        if (manualMatchId) {
                            console.log(`[Store] MANUAL: "${cleanBaseId}" -> "${manualMatchId}"`);
                            finalId = manualMatchId;
                            matchFound = true;
                        } 
                    }
                }

                // --- 2. FALLBACK TO FILE ID ---
                if (!matchFound) {
                    finalId = originalFileId || undefined;
                    if (originalFileId) {
                        unmatchedNew.push({ id: originalFileId, tag });
                    }
                }

                // --- 3. APPLY TO DOM & COMPUTE INTERNAL ID ---
                if (finalId) {
                    domEl.setAttribute('id', finalId);
                    baseIdForInternal = finalId;
                } else {
                    baseIdForInternal = internalIdAttr || `el-${tag}`;
                }

                idCount[baseIdForInternal] = (idCount[baseIdForInternal] || 0) + 1;
                const internalId = idCount[baseIdForInternal] > 1 ? `${baseIdForInternal}_${idCount[baseIdForInternal]}` : baseIdForInternal;

                domEl.setAttribute('data-internal-id', internalId);
                console.log(`[Store] ELEMENT CREATED: internalId="${internalId}" assignedId="${finalId || "none"}"`);

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
                    id: finalId,
                    originalId: originalFileId || undefined,
                    internalId: internalId,
                    attributes,
                    innerText: innerText || undefined
                };

                // --- 4. LIVE ATTRIBUTE TRANSPLANT ---
                // If we found a match from the current session, carry over user-controlled attributes
                if (matchFound && preserveFrom) {
                    const cleanBaseId = (originalFileId || internalIdAttr || `el-${tag}`).split('.')[0];
                    const match = Object.values(preserveFrom).find(el => {
                        const elBaseId = (el.originalId || el.id || "").split('.')[0];
                        return elBaseId === cleanBaseId && el.id === finalId;
                    });

                    if (match) {
                        // Carry over text
                        if (match.innerText) {
                            element.innerText = match.innerText;
                            domEl.textContent = match.innerText;
                        }
                        
                        // Carry over transformations (absolute)
                        if (match.attributes.transform) {
                            element.attributes.transform = match.attributes.transform;
                            domEl.setAttribute('transform', match.attributes.transform);
                        }
                        // Carry over styling (contains transform-origin, colors, etc.)
                        if (match.attributes.style) {
                            element.attributes.style = match.attributes.style;
                            domEl.setAttribute('style', match.attributes.style);
                        }
                    }
                }

                elementsMap[internalId] = element;
                order.push(internalId);
            });

            const serializer = new XMLSerializer();
            const modifiedSvg = serializer.serializeToString(svgDoc);

            const currentSelectedId = get().selectedElementId;
            const newSelectedId = (currentSelectedId && elementsMap[currentSelectedId]) ? currentSelectedId : null;

            set({
                originalSvg: modifiedSvg,
                workingSvg: modifiedSvg,
                elements: elementsMap,
                elementOrder: order,
                history: [],
                historyIndex: -1,
                selectedElementId: newSelectedId
            });

            let mismatchReport: MismatchReport | null = null;
            if (preserveFrom) {
                const oldIds = Object.values(preserveFrom)
                    .filter(el => el.id)
                    .map(el => ({ 
                        id: el.id as string,
                        tag: el.tag
                    }));
                
                const unmatchedOld = oldIds.filter(o => !claimedPreserveIds.has(o.id));
                if (unmatchedNew.length > 0 || unmatchedOld.length > 0) {
                    mismatchReport = { unmatchedNew, unmatchedOld };
                }
            }
            return mismatchReport;
        },

        updateElement: (id, updates, undoable = true) => {
            const { elements, history, historyIndex } = get();
            const currentElement = elements[id];
            if (!currentElement) return;

            const patches: HistoryPatch[] = [];

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
            get().commitChanges();
        },

        commitChanges: (immediate = false) => {
            const { originalSvg, elements, elementOrder, commitTimeout } = get();

            if (commitTimeout) clearTimeout(commitTimeout);

            const run = () => {
                const orderedElements = elementOrder.map(id => elements[id]);
                const newWorkingSvg = regenerateSvg(originalSvg, orderedElements, { keepInternalIds: true });

                if (newWorkingSvg !== get().workingSvg) {
                    set({ workingSvg: newWorkingSvg, commitTimeout: null });
                } else {
                    set({ commitTimeout: null });
                }
            };

            if (immediate) {
                run();
            } else {
                // Adaptive debounce: 1000ms on high-end, 2000ms on low-end devices
                const debounceMs = getAdaptiveDebounce(1000, 2000);
                const timeout = setTimeout(run, debounceMs);
                set({ commitTimeout: timeout });
            }
        },

        selectElement: (id) => set({ selectedElementId: id }),
        setHoveredElementId: (id) => set({ hoveredElementId: id }),

        reorderElements: (newOrder, undoable = true) => {
            const { elementOrder, history, historyIndex } = get();
            const newState: Partial<SvgStore> = { elementOrder: newOrder };
            if (undoable) {
                const patches: HistoryPatch[] = [{ id: 'global', attribute: 'reorder', oldValue: elementOrder, newValue: newOrder }];
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(patches);
                newState.history = newHistory;
                newState.historyIndex = historyIndex + 1;
            }
            set(newState);
            get().commitChanges();
        },

        undo: () => {
            const { history, historyIndex, elements, elementOrder } = get();
            if (historyIndex < 0) return;
            const patches = history[historyIndex];
            const newElements = { ...elements };
            let newOrder = [...elementOrder];
            patches.forEach((patch) => {
                if (patch.id === 'global') {
                    if (patch.attribute === 'reorder') {
                        newOrder = patch.oldValue as string[];
                    } else if (patch.attribute === 'delete') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { id, element, orderIndex } = patch.oldValue as any;
                        newElements[id] = element;
                        newOrder.splice(orderIndex, 0, id);
                    } else if (patch.attribute === 'add') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { id } = patch.newValue as any;
                        delete newElements[id];
                        newOrder = newOrder.filter(oid => oid !== id);
                    }
                } else if (patch.attribute === 'attributes' && patch.subKey) {
                    const el = newElements[patch.id];
                    if (el) newElements[patch.id] = { ...el, attributes: { ...el.attributes, [patch.subKey]: patch.oldValue as string } };
                } else {
                    const el = newElements[patch.id];
                    if (el) newElements[patch.id] = { ...el, [patch.attribute]: patch.oldValue };
                }
            });
            set({ elements: newElements, elementOrder: newOrder, historyIndex: historyIndex - 1 });
            get().commitChanges();
        },

        redo: () => {
            const { history, historyIndex, elements, elementOrder } = get();
            if (historyIndex >= history.length - 1) return;
            const nextIndex = historyIndex + 1;
            const patches = history[nextIndex];
            const newElements = { ...elements };
            let newOrder = [...elementOrder];
            patches.forEach((patch) => {
                if (patch.id === 'global') {
                    if (patch.attribute === 'reorder') {
                        newOrder = patch.newValue as string[];
                    } else if (patch.attribute === 'add') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { id, element, orderIndex } = patch.newValue as any;
                        newElements[id] = element;
                        newOrder.splice(orderIndex, 0, id);
                    } else if (patch.attribute === 'delete') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const { id } = patch.oldValue as any;
                        delete newElements[id];
                        newOrder = newOrder.filter(oid => oid !== id);
                    }
                } else if (patch.attribute === 'attributes' && patch.subKey) {
                    const el = newElements[patch.id];
                    if (el) newElements[patch.id] = { ...el, attributes: { ...el.attributes, [patch.subKey]: patch.newValue as string } };
                } else {
                    const el = newElements[patch.id];
                    if (el) newElements[patch.id] = { ...el, [patch.attribute]: patch.newValue };
                }
            });
            set({ elements: newElements, elementOrder: newOrder, historyIndex: nextIndex });
            get().commitChanges();
        },

        deleteElement: (id, undoable = true) => {
            const { elements, elementOrder, history, historyIndex } = get();
            const element = elements[id];
            if (!element) return;

            const newElements = { ...elements };
            delete newElements[id];
            const newOrder = elementOrder.filter(orderId => orderId !== id);

            const newState: Partial<SvgStore> = { elements: newElements, elementOrder: newOrder, selectedElementId: null };

            if (undoable) {
                const patches: HistoryPatch[] = [{
                    id: 'global',
                    attribute: 'delete',
                    oldValue: { id, element, orderIndex: elementOrder.indexOf(id) },
                    newValue: null
                }];
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(patches);
                newState.history = newHistory;
                newState.historyIndex = historyIndex + 1;
            }
            set(newState);
            get().commitChanges();
        },

        duplicateElement: (id, undoable = true) => {
            const { elements, elementOrder, history, historyIndex } = get();
            const element = elements[id];
            if (!element) return;

            // Generate new ID
            const newId = `${id}_copy_${Date.now()}`;
            const newElement = {
                ...element,
                internalId: newId,
                attributes: {
                    ...element.attributes,
                    x: String(parseFloat(element.attributes.x || '0') + 20),
                    y: String(parseFloat(element.attributes.y || '0') + 20),
                    id: `${element.id || 'el'}_copy`
                }
            };

            const newElements = { ...elements, [newId]: newElement };
            const index = elementOrder.indexOf(id);
            const newOrder = [...elementOrder];
            newOrder.splice(index + 1, 0, newId);

            const newState: Partial<SvgStore> = { elements: newElements, elementOrder: newOrder, selectedElementId: newId };

            if (undoable) {
                const patches: HistoryPatch[] = [{
                    id: 'global',
                    attribute: 'add',
                    oldValue: null,
                    newValue: { id: newId, element: newElement, orderIndex: index + 1 }
                }];
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(patches);
                newState.history = newHistory;
                newState.historyIndex = historyIndex + 1;
            }
            set(newState);
            get().commitChanges();
        },

        reset: () => set({
            originalSvg: '',
            workingSvg: '',
            elements: {},
            elementOrder: [],
            selectedElementId: null,
            history: [],
            historyIndex: -1
        }),

        applyPatches: (patches: ExternalPatch[]) => {
            const { elements, elementOrder } = get();
            const newElements = { ...elements };
            let hasChanged = false;

            const rootProperties = ['id', 'innerText', 'tag', 'originalId', 'internalId'];

            patches.forEach(patch => {
                // Find internal ID by the stable ID in the patch
                const internalId = elementOrder.find(id => elements[id].id === patch.id);
                if (!internalId) return;

                const el = newElements[internalId];
                if (!el) return;

                hasChanged = true;
                
                if (patch.attribute === 'attributes' && (patch as any).subKey) {
                    // Handle legacy subKey format if it somehow appears
                    newElements[internalId] = {
                        ...el,
                        attributes: { ...el.attributes, [(patch as any).subKey]: patch.value }
                    };
                } else if (rootProperties.includes(patch.attribute)) {
                    // Apply to root properties
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    newElements[internalId] = { ...el, [patch.attribute]: patch.value } as any;
                } else {
                    // Everything else is an attribute (transform, fill, x, y, style, etc.)
                    // Ensure the value is stringified for the attributes map
                    newElements[internalId] = {
                        ...el,
                        attributes: { ...el.attributes, [patch.attribute]: String(patch.value ?? "") }
                    };
                }
            });

            if (hasChanged) {
                set({ elements: newElements });
                get().commitChanges(true); // Commit immediately for visual sync
            }
        },

        getOrderedElements: () => {
            const { elements, elementOrder } = get();
            return elementOrder.map(id => elements[id]);
        }
    }))
);

/**
 * Utility to strip internal data attributes from an SVG string
 */
export function stripInternalIds(svg: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const elements = doc.querySelectorAll("[data-internal-id]");
    elements.forEach(el => el.removeAttribute("data-internal-id"));
    return new XMLSerializer().serializeToString(doc);
}

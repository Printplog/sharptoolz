// ElementNavigation component for selecting SVG elements
import { useState, memo, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSvgStore } from "@/store/useSvgStore";

interface ElementNavigationProps {
  onElementClick: (index: number | null) => void;
  onElementReorder: (elements: SvgElement[]) => void;
  selectedElementIndex: number | null;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
}

interface SortableElementButtonProps {
  elementId: string;
  originalIndex: number;
  isSelected: boolean;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
  onElementClick: (index: number) => void;
  extraClasses?: string;
  isOver?: boolean;
}

const SortableElementButton = memo(({
  elementId,
  originalIndex,
  isSelected,
  isTextElement,
  isImageElement,
  onElementClick,
  extraClasses = '',
  isOver = false,
}: SortableElementButtonProps) => {
  // Subscribe ATOMICALLY to this specific element
  const element = useSvgStore(state => state.elements[elementId]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: elementId });

  if (!element) return null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
  };

  const displayName = element.id || `${element.tag} ${originalIndex + 1}`;
  const elementType = isTextElement(element) ? '📝' : isImageElement(element) ? '🖼️' : '🔧';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-all duration-200 ${isDragging
        ? 'opacity-30 scale-95 z-50'
        : isOver
          ? 'scale-105 z-40'
          : 'opacity-100'
        }`}
    >
      {isOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full animate-pulse" />
      )}

      <div className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-primary/80 text-white text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-white/20">
        {originalIndex + 1}
      </div>

      <Button
        onClick={() => onElementClick(originalIndex)}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        className={`text-xs h-8 w-full px-1 flex items-center gap-1 justify-start transition-all rounded-full ${isOver ? 'border-primary border-2 shadow-lg shadow-primary/50' : ''
          } ${extraClasses}`}
        title={`${element.tag} element${element.id ? ` (ID: ${element.id})` : ''} - Position ${originalIndex + 1}`}
      >
        <span
          className={`cursor-grab active:cursor-grabbing px-1.5 py-1 rounded transition-all ${isDragging
            ? 'bg-primary/20'
            : 'hover:bg-white/20 hover:scale-110'
            }`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <span className="text-xs leading-none inline-block">⋮⋮</span>
        </span>
        <span className="pointer-events-none">{elementType}</span>
        <span className="truncate flex-1 text-left pointer-events-none">{displayName}</span>
      </Button>
    </div>
  );
});

function createDisplayList(elements: SvgElement[], expandedGroups: Set<string>) {
  const groups: Record<string, { elements: { elementId: string; originalIndex: number }[] }> = {};
  const processedIndices = new Set<number>();
  const result: {
    type: 'group' | 'element';
    id: string;
    elementId?: string;
    originalIndex?: number;
    groupName?: string;
    isExpanded?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    groupElements?: { elementId: string; originalIndex: number }[];
  }[] = [];

  elements.forEach((element, index) => {
    const id = element.id || '';
    const internalId = element.internalId || id;
    if (id.includes('.select_')) {
      const groupName = id.split('.select_')[0];
      if (!groups[groupName]) {
        groups[groupName] = { elements: [] };
      }
      groups[groupName].elements.push({ elementId: internalId, originalIndex: index });
      groups[groupName].elements.sort((a, b) => a.originalIndex - b.originalIndex);
    }
  });

  const addedGroups = new Set<string>();
  elements.forEach((element, index) => {
    if (processedIndices.has(index)) return;

    const id = element.id || '';
    const internalId = element.internalId || id;
    if (id.includes('.select_')) {
      const groupName = id.split('.select_')[0];

      if (!addedGroups.has(groupName)) {
        addedGroups.add(groupName);
        result.push({
          type: 'group',
          id: `group-${groupName}`,
          groupName,
          isExpanded: expandedGroups.has(groupName),
          groupElements: groups[groupName].elements
        });

        if (expandedGroups.has(groupName)) {
          const groupElements = groups[groupName].elements;
          groupElements.forEach((groupEl, groupIndex) => {
            result.push({
              type: 'element',
              id: groupEl.elementId,
              elementId: groupEl.elementId,
              originalIndex: groupEl.originalIndex,
              groupName,
              isFirst: groupIndex === 0,
              isLast: groupIndex === groupElements.length - 1
            });
            processedIndices.add(groupEl.originalIndex);
          });
        } else {
          groups[groupName].elements.forEach(groupEl => {
            processedIndices.add(groupEl.originalIndex);
          });
        }
      }
    } else {
      result.push({
        type: 'element',
        id: internalId,
        elementId: internalId,
        originalIndex: index
      });
    }
  });

  return result;
}

function GroupButton({
  groupName,
  isExpanded,
  elementCount,
  onToggle
}: {
  groupName: string;
  isExpanded: boolean;
  elementCount: number;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${groupName}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      <Button
        onClick={onToggle}
        variant={isExpanded ? "default" : "outline"}
        size="sm"
        className="text-xs h-8 w-full px-1 flex items-center gap-1 justify-start rounded-full"
      >
        <span
          className="cursor-grab hover:bg-white/10 px-1 py-1 rounded text-xs leading-none"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </span>
        <span className="pointer-events-none">📋</span>
        <span className="truncate flex-1 text-left pointer-events-none">{groupName}</span>
        <span className="pointer-events-none text-xs opacity-60">({elementCount})</span>
      </Button>
    </div>
  );
}

function ElementNavigationComponent({
  onElementClick,
  onElementReorder,
  selectedElementIndex,
  isTextElement,
  isImageElement
}: ElementNavigationProps) {
  const elementOrder = useSvgStore(state => state.elementOrder);

  // Stable string — only changes when IDs or order change, not on attribute edits
  const elementIdSig = useSvgStore(state =>
    state.elementOrder.map(id => `${id}:${state.elements[id]?.id || ''}`).join('|')
  );

  // Minimal objects for createDisplayList — only id + internalId needed for grouping
  const elements = useMemo(() => {
    const snap = useSvgStore.getState();
    return snap.elementOrder.map(id => ({
      id: snap.elements[id]?.id || '',
      internalId: id
    })) as SvgElement[];
  }, [elementIdSig]);

  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allItems = useMemo(() => createDisplayList(elements, expandedGroups), [elements, expandedGroups]);

  const displayList = useMemo(() => {
    if (searchQuery.trim() === "") return allItems;
    const map = useSvgStore.getState().elements;
    return allItems.filter(item => {
      if (item.type === 'group') return item.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
      const el = map[item.elementId!];
      const name = el?.id || `${el?.tag} ${item.originalIndex! + 1}`;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [allItems, searchQuery]);

  function toggleGroup(groupName: string) {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) newSet.delete(groupName);
      else newSet.add(groupName);
      return newSet;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setActiveElementId(id);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id as string | null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id && over?.id) {
      const oldIdx = elementOrder.indexOf(active.id as string);
      const newIdx = elementOrder.indexOf(over.id as string);
      if (oldIdx !== -1 && newIdx !== -1) {
        const newOrder = arrayMove(elementOrder, oldIdx, newIdx);
        const newElements = newOrder.map(id => useSvgStore.getState().elements[id]);
        onElementReorder(newElements);
      }
    }
    setActiveElementId(null);
    setOverId(null);
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  // Snapshot of the dragged element — only re-reads store on drag start/end
  const draggedElement = useMemo(() =>
    activeElementId ? useSvgStore.getState().elements[activeElementId] : null,
    [activeElementId]
  );

  // Auto-scroll selected element into view
  useEffect(() => {
    if (selectedElementIndex !== null && scrollRef.current) {
      const container = scrollRef.current;
      const selectedEl = container.querySelector(`[data-index="${selectedElementIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedElementIndex]);

  if (elements.length === 0) return null;

  return (
    <div className="flex flex-col relative">
      {/* Sticky Search Only */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md p-3 mb-4">
        <div className="bg-white/5 rounded-lg p-1 border border-white/5">
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <Input
              placeholder="Search layers..."
              className="pl-8 h-8 bg-transparent border-none text-xs shadow-none placeholder:text-white/30 focus-visible:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/80">Layers</h3>
        <div className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
          {elements.length}
        </div>
      </div>

      <div ref={scrollRef}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={{ acceleration: 2 }}
        >
          <SortableContext items={displayList.map(item => item.id)} strategy={rectSortingStrategy}>
            <div className="flex flex-col gap-2">
              {displayList.length > 0 ? displayList.map((item) => {
                if (item.type === 'group') {
                  return (
                    <GroupButton
                      key={item.id}
                      groupName={item.groupName!}
                      isExpanded={item.isExpanded!}
                      elementCount={item.groupElements?.length || 0}
                      onToggle={() => toggleGroup(item.groupName!)}
                    />
                  );
                }
                const isSelected = selectedElementIndex === item.originalIndex;
                const isOver = overId === item.id && activeElementId !== item.id;
                return (
                  <div key={item.id} className="relative w-full" data-index={item.originalIndex}>
                    {item.isFirst && <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 text-primary font-bold">⌊</div>}
                    <SortableElementButton
                      elementId={item.elementId!}
                      originalIndex={item.originalIndex!}
                      isSelected={isSelected}
                      isTextElement={isTextElement}
                      isImageElement={isImageElement}
                      onElementClick={onElementClick}
                      isOver={isOver}
                      extraClasses={item.groupName ? "bg-primary/10 border-primary/40" : ""}
                    />
                    {item.isLast && <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-primary font-bold">⌋</div>}
                  </div>
                );
              }) : (
                <div className="py-12 text-center col-span-full">
                  <p className="text-xs text-white/20 italic">No matching elements found</p>
                </div>
              )}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={null}>
            {activeElementId && draggedElement ? (
              <div className="opacity-90 cursor-grabbing">
                <Button variant="default" size="sm" className="h-8 gap-2 shadow-2xl border-2 border-primary/50 ring-4 ring-primary/20 rounded-full">
                  <span className="text-xs">⋮⋮</span>
                  <span className="truncate max-w-[150px]">{draggedElement.id || draggedElement.tag}</span>
                </Button>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

const ElementNavigation = memo(ElementNavigationComponent);
export default ElementNavigation;

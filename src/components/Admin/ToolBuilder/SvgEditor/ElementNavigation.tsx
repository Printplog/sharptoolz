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
    transform: CSS.Translate.toString(transform),
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
        className={`text-xs h-8 w-full px-1 flex items-center gap-1 justify-start transition-all ${isOver ? 'border-primary border-2 shadow-lg shadow-primary/50' : ''
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
    const internalId = (element as any).internalId || id;
    if (id.includes('.select_')) {
      const groupName = id.split('.select_')[0];
      if (!groups[groupName]) {
        groups[groupName] = { elements: [] };
      }
      groups[groupName].elements.push({ elementId: internalId, originalIndex: index });
      groups[groupName].elements.sort((a, b) => a.originalIndex - b.originalIndex);
    }
  });

  elements.forEach((element, index) => {
    if (processedIndices.has(index)) return;

    const id = element.id || '';
    const internalId = (element as any).internalId || id;
    if (id.includes('.select_')) {
      const groupName = id.split('.select_')[0];
      const groupExists = result.some(item => item.type === 'group' && item.groupName === groupName);

      if (!groupExists) {
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
    transform: CSS.Translate.toString(transform),
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
        className="text-xs h-8 w-full px-1 flex items-center gap-1 justify-start"
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
  const elementsMap = useSvgStore(state => state.elements);
  const elementOrder = useSvgStore(state => state.elementOrder);
  const elements = useMemo(() => elementOrder.map(id => elementsMap[id]), [elementOrder, elementsMap]);

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
    return allItems.filter(item => {
      if (item.type === 'group') return item.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
      const el = elementsMap[item.elementId!];
      const name = el?.id || `${el?.tag} ${item.originalIndex! + 1}`;
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [allItems, searchQuery, elementsMap]);

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
        const newElements = newOrder.map(id => elementsMap[id]);
        onElementReorder(newElements);
      }
    }
    setActiveElementId(null);
    setOverId(null);
  }

  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-medium text-white/80">Select Element</h3>
        <div className="text-xs text-white/60">
          {elements.length} elements
        </div>
      </div>

      <div className="relative mb-4 shrink-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search..."
          className="pl-9 bg-white/5 border-white/10 h-9 text-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div ref={scrollRef} className="max-h-[500px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={{ acceleration: 2 }}
        >
          <SortableContext items={displayList.map(item => item.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 auto-rows-fr">
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

          <DragOverlay>
            {activeElementId && elementsMap[activeElementId] ? (
              <div className="transform rotate-3 scale-110 opacity-80">
                <Button variant="default" size="sm" className="h-8 gap-2">
                  <span>⋮⋮</span>
                  <span>{elementsMap[activeElementId].id || elementsMap[activeElementId].tag}</span>
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

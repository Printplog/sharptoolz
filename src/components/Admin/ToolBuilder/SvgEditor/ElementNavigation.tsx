// ElementNavigation component for selecting SVG elements
import { useState, memo, useMemo } from "react";
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

  // Snippet preview for text elements
  const snippet = element.innerText ? (element.innerText.length > 25 ? element.innerText.slice(0, 25) + "..." : element.innerText) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-all duration-200 group ${isDragging
        ? 'opacity-30 scale-95 z-50'
        : isOver
          ? 'translate-y-1 z-40'
          : 'opacity-100'
        }`}
    >
      {isOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full animate-pulse z-50" />
      )}

      <div
        onClick={() => onElementClick(originalIndex)}
        className={`flex items-center gap-3 w-full p-2.5 rounded-xl border transition-all cursor-pointer group/card ${isSelected
          ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]"
          : "bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]"
          } ${extraClasses}`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 rounded-md hover:bg-white/10 text-white/20 hover:text-white/60 transition-colors"
        >
          <span className="text-xs leading-none inline-block">⋮⋮</span>
        </div>

        {/* Index Badge */}
        <div className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-colors ${isSelected ? "bg-primary text-black border-primary" : "bg-white/5 text-white/40 border-white/10"
          }`}>
          {originalIndex + 1}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] opacity-60 grayscale group-hover/card:grayscale-0 transition-all">{elementType}</span>
            <span className={`text-[11px] font-semibold truncate ${isSelected ? "text-primary" : "text-white/80"}`}>
              {displayName}
            </span>
          </div>
          {snippet && (
            <div className={`text-[9px] truncate font-mono h-3 ${isSelected ? "text-white/60" : "text-white/30"}`}>
              "{snippet}"
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </div>
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
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 z-50' : ''}`}
      {...attributes}
    >
      <Button
        onClick={onToggle}
        variant={isExpanded ? "default" : "outline"}
        size="sm"
        className="text-xs h-8 w-full px-1 flex items-center gap-1 justify-start"
      >
        <span
          className="cursor-grab hover:bg-white/10 px-1 py-1 rounded text-xs leading-none"
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

  if (elements.length === 0) return null;

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

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0 px-1">
        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Select Element</h3>
        <div className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
          {elements.length} TOTAL
        </div>
      </div>

      <div className="relative mb-4 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        <Input
          placeholder="Search by ID or content..."
          className="pl-9 bg-white/5 border-white/10 h-10 text-xs rounded-xl focus:ring-primary/20 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={{ acceleration: 2 }}
        >
          <SortableContext items={displayList.map(item => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pb-4">
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
                    {item.isFirst && (
                      <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-primary/40 rounded-full z-10" />
                    )}
                    <SortableElementButton
                      elementId={item.elementId!}
                      originalIndex={item.originalIndex!}
                      isSelected={isSelected}
                      isTextElement={isTextElement}
                      isImageElement={isImageElement}
                      onElementClick={onElementClick}
                      isOver={isOver}
                      extraClasses={item.groupName ? "bg-primary/5 border-primary/20 ml-2" : ""}
                    />
                  </div>
                );
              }) : (
                <div className="py-12 text-center">
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
      );
}

      const ElementNavigation = memo(ElementNavigationComponent);
      export default ElementNavigation;

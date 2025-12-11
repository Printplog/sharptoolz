// ElementNavigation component for selecting SVG elements
import { useState } from "react";
import { Button } from "@/components/ui/button";
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



interface ElementNavigationProps {
  elements: SvgElement[];
  onElementClick: (index: number) => void;
  onElementReorder: (elements: SvgElement[]) => void;
  selectedElementIndex: number | null;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
}

interface SortableElementButtonProps {
  element: SvgElement;
  index: number;
  originalIndex: number;
  isSelected: boolean;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
  onElementClick: (index: number) => void;
  extraClasses?: string;
}

function SortableElementButton({
  element,
  index,
  originalIndex,
  isSelected,
  isTextElement,
  isImageElement,
  onElementClick,
  extraClasses = '',
  isOver = false,
}: SortableElementButtonProps & { isOver?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `element-${index}` });

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
      className={`relative transition-all duration-200 ${
        isDragging 
          ? 'opacity-30 scale-95 z-50' 
          : isOver 
            ? 'scale-105 z-40' 
            : 'opacity-100'
      }`}
      {...attributes}
    >
      {/* Drop indicator line */}
      {isOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full animate-pulse" />
      )}
      
      {/* Order number badge */}
      <div className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-primary/80 text-white text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-white/20">
        {originalIndex + 1}
      </div>

      <Button
        onClick={() => onElementClick(originalIndex)}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        className={`text-xs h-8 w-full px-1 flex items-center gap-1 justify-start transition-all ${
          isOver ? 'border-primary border-2 shadow-lg shadow-primary/50' : ''
        } ${extraClasses}`}
        title={`${element.tag} element${element.id ? ` (ID: ${element.id})` : ''} - Position ${originalIndex + 1}`}
      >
        {/* Enhanced drag handle */}
        <span 
          className={`cursor-grab active:cursor-grabbing px-1.5 py-1 rounded transition-all ${
            isDragging 
              ? 'bg-primary/20' 
              : 'hover:bg-white/20 hover:scale-110'
          }`}
          title="Drag to reorder"
          {...listeners}
        >
          <span className="text-xs leading-none inline-block">⋮⋮</span>
        </span>
        <span className="pointer-events-none">{elementType}</span>
        <span className="truncate max-w-20 pointer-events-none">{displayName}</span>
      </Button>
    </div>
  );
}

// Helper function to create flat display list with group awareness
function createDisplayList(elements: SvgElement[], expandedGroups: Set<string>) {
  const groups: Record<string, { elements: { element: SvgElement; originalIndex: number }[] }> = {};
  const processedIndices = new Set<number>();
  const result: {
    type: 'group' | 'element';
    id: string;
    element?: SvgElement;
    originalIndex?: number;
    groupName?: string;
    isExpanded?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    groupElements?: { element: SvgElement; originalIndex: number }[];
  }[] = [];

  // First pass: identify all groups and their elements
  elements.forEach((element, index) => {
    const id = element.id || '';
    
    if (id.includes('.select_')) {
      const groupName = id.split('.select_')[0];
      
      if (!groups[groupName]) {
        groups[groupName] = { elements: [] };
      }
      
      groups[groupName].elements.push({ element, originalIndex: index });
      // Sort by original index to maintain order
      groups[groupName].elements.sort((a, b) => a.originalIndex - b.originalIndex);
    }
  });

  // Second pass: create display list with groups and their children together
  elements.forEach((element, index) => {
    // Skip if already processed as part of a group
    if (processedIndices.has(index)) {
      return;
    }

    const id = element.id || '';
    
    if (id.includes('.select_')) {
      const groupName = id.split('.select_')[0];
      
      // Check if this group's main button is already added
      const groupExists = result.some(item => item.type === 'group' && item.groupName === groupName);
      
      if (!groupExists) {
        // Add main group button
        result.push({
          type: 'group',
          id: `group-${groupName}`,
          groupName,
          isExpanded: expandedGroups.has(groupName),
          groupElements: groups[groupName].elements
        });
        
        // If group is expanded, immediately add all its children right after
        if (expandedGroups.has(groupName)) {
          const groupElements = groups[groupName].elements;
          groupElements.forEach((groupEl, groupIndex) => {
            result.push({
              type: 'element',
              id: `element-${groupEl.originalIndex}`,
              element: groupEl.element,
              originalIndex: groupEl.originalIndex,
              groupName,
              isFirst: groupIndex === 0,
              isLast: groupIndex === groupElements.length - 1
            });
            processedIndices.add(groupEl.originalIndex);
          });
        } else {
          // Even if not expanded, mark all children as processed so they don't show
          groups[groupName].elements.forEach(groupEl => {
            processedIndices.add(groupEl.originalIndex);
          });
        }
      }
    } else {
      // Regular individual element
      result.push({
        type: 'element',
        id: `element-${index}`,
        element,
        originalIndex: index
      });
    }
  });

  return result;
}

// Component for group button (looks like regular button but represents a group)
function GroupButton({ 
  groupName, 
  isExpanded,
  elementCount,
  onToggle,
  onGroupClick 
}: { 
  groupName: string;
  isExpanded: boolean;
  elementCount: number;
  onToggle: () => void;
  onGroupClick?: () => void;
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

  const handleClick = () => {
    onToggle();
    if (onGroupClick) onGroupClick();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 z-50' : ''}`}
      {...attributes}
    >
      <Button
        onClick={handleClick}
        variant={isExpanded ? "default" : "outline"}
        size="sm"
        className="text-xs h-8 w-full px-1 flex items-center gap-1 justify-start"
        title={`${groupName} dropdown (${elementCount} options) - Click to ${isExpanded ? 'hide' : 'show'} options`}
      >
        {/* Drag handle for the group */}
        <span 
          className="cursor-grab hover:bg-white/10 px-1 py-1 rounded text-xs leading-none"
          title="Drag to reorder entire group"
          {...listeners}
        >
          ⋮⋮
        </span>
        <span className="pointer-events-none">📋</span>
        <span className="truncate max-w-20 pointer-events-none">{groupName}</span>
        <span className="pointer-events-none text-xs opacity-60">({elementCount})</span>
      </Button>
    </div>
  );
}

export default function ElementNavigation({ 
  elements, 
  onElementClick, 
  onElementReorder,
  selectedElementIndex,
  isTextElement, 
  isImageElement 
}: ElementNavigationProps) {
  const [activeElement, setActiveElement] = useState<SvgElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (elements.length === 0) return null;

  function toggleGroup(groupName: string) {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }

  // Create display list based on current expanded state
  const displayList = createDisplayList(elements, expandedGroups);

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    setActiveId(id);
    
    if (id.startsWith('group-')) {
      // Dragging a group, find the first element for preview
      const groupName = id.replace('group-', '');
      const firstGroupElement = elements.find(el => 
        el.id && el.id.includes('.select_') && el.id.split('.select_')[0] === groupName
      );
      if (firstGroupElement) {
        setActiveElement(firstGroupElement);
      }
    } else {
      // Dragging an individual element
      const elementIndex = parseInt(id.replace('element-', ''));
      if (elementIndex >= 0 && elementIndex < elements.length) {
        setActiveElement(elements[elementIndex]);
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    setOverId(over?.id as string | null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      // Check if we're dragging a group or individual element
      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;
      
      if (activeIdStr.startsWith('group-')) {
        // Group-level drag and drop
        handleGroupReorder(activeIdStr, overIdStr);
      } else {
        // Individual element drag and drop
        const oldIndex = parseInt(activeIdStr.replace('element-', ''));
        const newIndex = parseInt(overIdStr.replace('element-', ''));

        if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0 && 
            oldIndex < elements.length && newIndex < elements.length) {
          const reorderedElements = arrayMove(elements, oldIndex, newIndex);
          onElementReorder(reorderedElements);
        }
      }
    }
    
    setActiveElement(null);
    setActiveId(null);
    setOverId(null);
  }

  function handleDragCancel() {
    setActiveElement(null);
    setActiveId(null);
    setOverId(null);
  }

  function handleGroupReorder(activeGroupId: string, overElementId: string) {
    // Extract group name from ID
    const groupName = activeGroupId.replace('group-', '');
    
    // Find all elements belonging to this group
    const groupElements: { element: SvgElement; originalIndex: number }[] = [];
    elements.forEach((element, index) => {
      if (element.id && element.id.includes('.select_') && 
          element.id.split('.select_')[0] === groupName) {
        groupElements.push({ element, originalIndex: index });
      }
    });
    
    if (groupElements.length === 0) return;

    // Find the target element index (could be another group or element)
    let overIndex: number;
    if (overElementId.startsWith('group-')) {
      // Dropping on another group - find first element of that group
      const overGroupName = overElementId.replace('group-', '');
      const firstOverElement = elements.findIndex(el => 
        el.id && el.id.includes('.select_') && el.id.split('.select_')[0] === overGroupName
      );
      overIndex = firstOverElement >= 0 ? firstOverElement : 0;
    } else {
      overIndex = parseInt(overElementId.replace('element-', ''));
    }
    
    if (overIndex < 0 || overIndex >= elements.length) return;

    // Get all indices of elements in the active group
    const groupIndices = groupElements.map(e => e.originalIndex).sort((a, b) => a - b);
    
    // Remove group elements from original positions (in reverse order to maintain indices)
    const newElements = [...elements];
    groupIndices.reverse().forEach(index => {
      newElements.splice(index, 1);
    });
    
    // Adjust target index after removals
    let adjustedTargetIndex = overIndex;
    groupIndices.forEach(removedIndex => {
      if (removedIndex < overIndex) {
        adjustedTargetIndex--;
      }
    });
    
    // Insert group elements at new position
    const elementsToInsert = groupIndices.reverse().map(index => elements[index]);
    newElements.splice(adjustedTargetIndex, 0, ...elementsToInsert);
    
    onElementReorder(newElements);
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white/80">
          Select Element to Edit
        </h3>
        <div className="text-xs text-white/60 flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="text-primary">⋮⋮</span>
            <span>Drag to reorder</span>
          </span>
          <span className="text-white/40">•</span>
          <span>{elements.length} element{elements.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext 
          items={displayList.map(item => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 auto-rows-fr">
            {displayList.map((item) => {
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
              } else {
                // Regular element or select option
                const isSelected = selectedElementIndex === item.originalIndex;
                const itemId = item.id;
                const isOver = overId === itemId && activeId !== itemId;
                
                if (item.groupName) {
                  // This is a select option - add visual group indicators
                  return (
                    <div key={itemId} className="relative w-full">
                      {/* Left bracket for first element */}
                      {item.isFirst && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10">
                          <div className="text-primary font-bold text-lg leading-none">⌊</div>
                        </div>
                      )}
                      
                      <SortableElementButton
                        element={item.element!}
                        index={item.originalIndex!}
                        originalIndex={item.originalIndex!}
                        isSelected={isSelected}
                        isTextElement={isTextElement}
                        isImageElement={isImageElement}
                        onElementClick={onElementClick}
                        extraClasses="bg-primary/10 border-primary/40"
                        isOver={isOver}
                      />
                      
                      {/* Right bracket for last element */}
                      {item.isLast && (
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                          <div className="text-primary font-bold text-lg leading-none">⌋</div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Regular individual element
                  return (
                    <SortableElementButton
                      key={itemId}
                      element={item.element!}
                      index={item.originalIndex!}
                      originalIndex={item.originalIndex!}
                      isSelected={isSelected}
                      isTextElement={isTextElement}
                      isImageElement={isImageElement}
                      onElementClick={onElementClick}
                      isOver={isOver}
                    />
                  );
                }
              }
            })}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeElement ? (
            <div className="transform rotate-3 scale-110 transition-transform">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 px-1 flex items-center gap-1 shadow-2xl border-2 border-primary bg-black/90 backdrop-blur-sm"
              >
                <div className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-white/20">
                  {activeElement.id ? 
                    (elements.findIndex(el => el.id === activeElement.id) + 1) :
                    (elements.findIndex(el => el.tag === activeElement.tag && el.innerText === activeElement.innerText) + 1)
                  }
                </div>
                <span className="text-xs leading-none">⋮⋮</span>
                <span>{isTextElement(activeElement) ? '📝' : isImageElement(activeElement) ? '🖼️' : '🔧'}</span>
                <span className="truncate max-w-20 font-semibold">
                  {activeElement.id || `${activeElement.tag}`}
                </span>
              </Button>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

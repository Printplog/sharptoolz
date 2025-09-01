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
}: SortableElementButtonProps) {
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
    transition,
  };

  const displayName = element.id || `${element.tag} ${originalIndex + 1}`;
  const elementType = isTextElement(element) ? '📝' : isImageElement(element) ? '🖼️' : '🔧';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 z-50' : ''}`}
      {...attributes}
    >
      <Button
        onClick={() => onElementClick(originalIndex)}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        className={`text-xs h-8 px-1 flex items-center gap-1 ${
          isSelected ? 'bg-primary text-background' : ''
        } ${extraClasses}`}
        title={`${element.tag} element${element.id ? ` (ID: ${element.id})` : ''}`}
      >
        {/* Separate drag handle */}
        <span 
          className="cursor-grab hover:bg-white/10 px-1 py-1 rounded text-xs leading-none"
          title="Drag to reorder"
          {...listeners}
        >
          ⋮⋮
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

  // First pass: identify groups
  elements.forEach((element, index) => {
    const id = element.id || '';
    
    if (id.includes('.select_')) {
      const groupName = id.split('.select_')[0];
      
      if (!groups[groupName]) {
        groups[groupName] = { elements: [] };
      }
      
      groups[groupName].elements.push({ element, originalIndex: index });
    }
  });

  // Second pass: create display list
  elements.forEach((element, index) => {
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
      }
      
      // Add individual select element if group is expanded
      if (expandedGroups.has(groupName)) {
        const groupElementsCount = groups[groupName].elements.length;
        const elementIndexInGroup = groups[groupName].elements.findIndex(e => e.originalIndex === index);
        
        result.push({
          type: 'element',
          id: `element-${index}`,
          element,
          originalIndex: index,
          groupName,
          isFirst: elementIndexInGroup === 0,
          isLast: elementIndexInGroup === groupElementsCount - 1
        });
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
        className={`text-xs h-8 px-1 flex items-center gap-1 ${
          isExpanded ? 'bg-primary text-background' : ''
        }`}
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
    const activeId = event.active.id as string;
    
    if (activeId.startsWith('group-')) {
      // Dragging a group, find the first element for preview
      const groupName = activeId.replace('group-', '');
      const firstGroupElement = elements.find(el => 
        el.id && el.id.includes('.select_') && el.id.split('.select_')[0] === groupName
      );
      if (firstGroupElement) {
        setActiveElement(firstGroupElement);
      }
    } else {
      // Dragging an individual element
      const elementIndex = parseInt(activeId.replace('element-', ''));
      if (elementIndex >= 0 && elementIndex < elements.length) {
        setActiveElement(elements[elementIndex]);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      // Check if we're dragging a group or individual element
      const activeId = active.id as string;
      const overId = over.id as string;
      
      if (activeId.startsWith('group-')) {
        // Group-level drag and drop
        handleGroupReorder(activeId, overId);
      } else {
        // Individual element drag and drop
        const oldIndex = parseInt(activeId.replace('element-', ''));
        const newIndex = parseInt(overId.replace('element-', ''));

        if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0 && 
            oldIndex < elements.length && newIndex < elements.length) {
          const reorderedElements = arrayMove(elements, oldIndex, newIndex);
          onElementReorder(reorderedElements);
        }
      }
    }
    
    setActiveElement(null);
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
      <h3 className="text-sm font-medium mb-3 text-white/80">
        Select Element to Edit 
        <span className="text-xs text-white/60 ml-2">(Drag buttons to reorder elements)</span>
      </h3>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={displayList.map(item => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="flex flex-wrap gap-2">
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
                
                if (item.groupName) {
                  // This is a select option - add visual group indicators
                  return (
                    <div key={item.id} className="relative flex items-center">
                      {/* Left bracket for first element */}
                      {item.isFirst && (
                        <div className="flex items-center mr-1">
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
                      />
                      
                      {/* Right bracket for last element */}
                      {item.isLast && (
                        <div className="flex items-center ml-1">
                          <div className="text-primary font-bold text-lg leading-none">⌋</div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Regular individual element
                  return (
                    <SortableElementButton
                      key={item.id}
                      element={item.element!}
                      index={item.originalIndex!}
                      originalIndex={item.originalIndex!}
                      isSelected={isSelected}
                      isTextElement={isTextElement}
                      isImageElement={isImageElement}
                      onElementClick={onElementClick}
                    />
                  );
                }
              }
            })}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeElement ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-1 flex items-center gap-1 opacity-90 shadow-lg border-2 border-primary"
            >
              <span className="text-xs leading-none">⋮⋮</span>
              <span>{isTextElement(activeElement) ? '📝' : isImageElement(activeElement) ? '🖼️' : '🔧'}</span>
              <span className="truncate max-w-20">
                {activeElement.id || `${activeElement.tag}`}
              </span>
            </Button>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

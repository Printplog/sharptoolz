import { type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type SortableRowProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

/**
 * A single reorderable row. Dragging is confined to the grip so the inputs,
 * selects and buttons inside the row stay clickable.
 */
function SortableRow({ id, children, className }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        // Zeroing x keeps the drag on the vertical axis without pulling in
        // @dnd-kit/modifiers just for restrictToVerticalAxis.
        transform: CSS.Transform.toString(transform && { ...transform, x: 0 }),
        transition,
      }}
      className={cn(
        "flex items-center gap-2",
        isDragging && "relative z-50 opacity-80 shadow-lg shadow-black/40",
        className,
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        title="Drag to reorder"
        className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-white/25 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type SortableListProps<T> = {
  items: T[];
  /**
   * Receives the reordered array plus the moved indices, so callers holding
   * index-keyed state alongside the list can remap it in the same update.
   */
  onReorder: (items: T[], from: number, to: number) => void;
  children: (item: T, index: number) => ReactNode;
  rowClassName?: string;
  /**
   * Stable id per item. Omit only for lists whose items have no identity of
   * their own, in which case position is used as the fallback.
   */
  getId?: (item: T, index: number) => string;
};

/**
 * Vertical drag-to-reorder list. Rows are addressed by position, which is the
 * only stable handle these builders have — their parts are plain values with no
 * identity of their own and are rebuilt on every edit.
 */
export function SortableList<T>({
  items,
  onReorder,
  children,
  rowClassName,
  getId,
}: SortableListProps<T>) {
  const sensors = useSensors(
    // A small threshold so a click on the grip still registers as a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map((item, index) => getId?.(item, index) ?? `sortable-${index}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    onReorder(arrayMove(items, from, to), from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <SortableRow key={ids[index]} id={ids[index]} className={rowClassName}>
            {children(item, index)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}

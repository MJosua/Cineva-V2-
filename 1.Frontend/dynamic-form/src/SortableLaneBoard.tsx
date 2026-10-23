import { DragDropContext, Draggable, Droppable, type DraggableProvidedDragHandleProps, type DropResult } from "@hello-pangea/dnd";
import type { ReactNode } from "react";

export type SortableLane<T> = {
  id: string;
  title: ReactNode;
  items: T[];
  footer?: ReactNode;
};

export type SortableLaneBoardProps<T> = {
  lanes: SortableLane<T>[];
  getItemId: (item: T) => string;
  canDrag?: (item: T) => boolean;
  renderItem: (item: T, lane: SortableLane<T>, dragHandleProps: DraggableProvidedDragHandleProps | null) => ReactNode;
  onReorder: (payload: {
    sourceLaneId: string;
    destinationLaneId: string;
    sourceIndex: number;
    destinationIndex: number;
    lanes: SortableLane<T>[];
  }) => void | Promise<void>;
  className?: string;
};

export function SortableLaneBoard<T>({
  lanes,
  getItemId,
  canDrag,
  renderItem,
  onReorder,
  className = "",
}: SortableLaneBoardProps<T>) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceLane = lanes.find((lane) => lane.id === result.source.droppableId);
    const destinationLane = lanes.find((lane) => lane.id === result.destination?.droppableId);
    if (!sourceLane || !destinationLane) return;
    onReorder({
      sourceLaneId: sourceLane.id,
      destinationLaneId: destinationLane.id,
      sourceIndex: result.source.index,
      destinationIndex: result.destination.index,
      lanes,
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={`hdf-sortable-lane-board ${className}`.trim()}>
        {lanes.map((lane) => (
          <Droppable droppableId={lane.id} key={lane.id}>
            {(dropProvided, dropSnapshot) => (
              <section
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`hdf-sortable-lane ${dropSnapshot.isDraggingOver ? "is-dragging-over" : ""}`.trim()}
              >
                <header>{lane.title}</header>
                <div className="hdf-sortable-lane-items">
                  {lane.items.map((item, index) => {
                    const draggableId = getItemId(item);
                    const isDragDisabled = canDrag ? !canDrag(item) : false;
                    return (
                      <Draggable draggableId={draggableId} index={index} isDragDisabled={isDragDisabled} key={draggableId}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`hdf-sortable-lane-item ${dragSnapshot.isDragging ? "is-dragging" : ""}`.trim()}
                          >
                            {renderItem(item, lane, isDragDisabled ? null : dragProvided.dragHandleProps)}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {dropProvided.placeholder}
                </div>
                {lane.footer && <footer>{lane.footer}</footer>}
              </section>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

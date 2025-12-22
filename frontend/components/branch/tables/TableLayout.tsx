"use client";

import React, { useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TableWithStatusDto } from "@/types/api.types";
import { cn } from "@/lib/utils";

interface TableLayoutProps {
  tables: TableWithStatusDto[];
  onTableClick?: (table: TableWithStatusDto) => void;
  onTablePositionChange?: (tableId: number, position: { x: number; y: number }) => void;
  isEditMode?: boolean;
}

// Individual draggable table component
function DraggableTable({
  table,
  onClick,
  isEditMode,
}: {
  table: TableWithStatusDto;
  onClick?: (table: TableWithStatusDto) => void;
  isEditMode?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `table-${table.id}`,
    data: table,
    disabled: !isEditMode,
  });

  const style = {
    position: "absolute" as const,
    left: `${table.position.x}%`,
    top: `${table.position.y}%`,
    width: `${table.dimensions.width}%`,
    height: `${table.dimensions.height}%`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : 1,
    rotate: `${table.position.rotation}deg`,
  };

  const getStatusColor = () => {
    switch (table.status) {
      case "occupied":
        return "bg-red-500 border-red-600 text-white";
      case "reserved":
        return "bg-yellow-500 border-yellow-600 text-white";
      default:
        return "bg-green-500 border-green-600 text-white";
    }
  };

  const getShapeClass = () => {
    switch (table.dimensions.shape) {
      case "Circle":
        return "rounded-full";
      case "Square":
        return "rounded-lg";
      default:
        return "rounded-md";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onClick?.(table)}
      className={cn(
        "flex flex-col items-center justify-center border-2 transition-all cursor-pointer select-none",
        getStatusColor(),
        getShapeClass(),
        isDragging && "opacity-50 cursor-grabbing",
        isEditMode && !isDragging && "cursor-grab hover:scale-105",
        !isEditMode && "hover:scale-105 hover:shadow-lg"
      )}
    >
      <div className="font-bold text-sm">{table.name}</div>
      <div className="text-xs opacity-90">Table {table.number}</div>
      {table.status === "occupied" && (
        <>
          <div className="text-xs mt-1">{table.guestCount} guests</div>
          <div className="text-xs">{table.orderTime}</div>
        </>
      )}
    </div>
  );
}

export default function TableLayout({
  tables,
  onTableClick,
  onTablePositionChange,
  isEditMode = false,
}: TableLayoutProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { setNodeRef } = useDroppable({
    id: "table-layout-drop-zone",
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    if (!onTablePositionChange) return;

    const table = tables.find(t => `table-${t.id}` === active.id);
    if (!table) return;

    // Calculate new position as percentage
    const container = document.getElementById("table-layout-container");
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const deltaXPercent = (delta.x / containerRect.width) * 100;
    const deltaYPercent = (delta.y / containerRect.height) * 100;

    const newX = Math.max(0, Math.min(100 - table.dimensions.width, table.position.x + deltaXPercent));
    const newY = Math.max(0, Math.min(100 - table.dimensions.height, table.position.y + deltaYPercent));

    onTablePositionChange(table.id, { x: newX, y: newY });
  };

  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          id="table-layout-container"
          ref={setNodeRef}
          className="relative w-full h-full bg-white border-2 border-dashed border-gray-300"
          style={{ minHeight: "600px" }}
        >
          {/* Grid overlay in edit mode */}
          {isEditMode && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full">
                <defs>
                  <pattern
                    id="grid"
                    width="50"
                    height="50"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="gray"
                      strokeWidth="0.5"
                      opacity="0.2"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          )}

          {/* Render all tables */}
          {tables.map((table) => (
            <DraggableTable
              key={table.id}
              table={table}
              onClick={onTableClick}
              isEditMode={isEditMode}
            />
          ))}

          {/* Empty state */}
          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg font-semibold">No tables yet</p>
                <p className="text-sm">Add your first table to get started</p>
              </div>
            </div>
          )}
        </div>
      </DndContext>

      {/* Legend */}
      <div className="flex gap-4 p-4 bg-gray-50 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 border border-green-600 rounded"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 border border-red-600 rounded"></div>
          <span className="text-sm">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 border border-yellow-600 rounded"></div>
          <span className="text-sm">Reserved</span>
        </div>
      </div>
    </div>
  );
}

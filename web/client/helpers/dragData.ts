import type React from "react";

// DataTransfer contents can't be read during dragover, so drag payloads are kept here instead.

let data: Record<string, string> = {};

export function setDragData(newData: Record<string, string>) {
  data = { ...newData };
}

export function getDragData(key: string): string | undefined {
  return data[key];
}

export function clearDragData() {
  data = {};
}

export function startDrag(ev: React.DragEvent, newData: Record<string, string>) {
  ev.dataTransfer.setData("text/plain", ""); // Firefox won't start a drag without any data
  setDragData(newData);
}

export function markDragHandled() {
  data.handled = "true";
}

// Logo and the modules bar act as a trash for dragged tabs
export const removeTabDropTarget = {
  onDragOver(ev: React.DragEvent) {
    if(getDragData("januszTab") === "true") {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "move";
    }
  },
  onDrop(ev: React.DragEvent) {
    if(getDragData("januszTab") === "true") {
      ev.preventDefault();
      data.remove = "true";
    }
  },
};

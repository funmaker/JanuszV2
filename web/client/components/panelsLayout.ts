
export interface PanelsSplit {
  vertical: boolean;
  first: PanelsLayout;
  second: PanelsLayout;
  size?: number; // Fraction of the first pane or legacy pixel size
}

export type PanelsLayout = null | string[] | PanelsSplit;

export type PanelPath = Array<"first" | "second">;

export type LayoutUpdater = (layout: PanelsLayout) => PanelsLayout;

export interface TabSource {
  path: PanelPath;
  index: number;
}

export function isSplit(layout: PanelsLayout): layout is PanelsSplit {
  return !!layout && !Array.isArray(layout);
}

export function getAt(layout: PanelsLayout, path: PanelPath): PanelsLayout {
  for(const key of path) {
    if(!isSplit(layout)) return null;
    layout = layout[key];
  }
  return layout;
}

export function setAt(layout: PanelsLayout, path: PanelPath, value: PanelsLayout): PanelsLayout {
  if(path.length === 0) return value;
  if(!isSplit(layout)) return layout;
  
  const [key, ...rest] = path;
  return { ...layout, [key]: setAt(layout[key], rest, value) };
}

// Collapses empty tab lists and splits with a missing side
export function reduceLayout(layout: PanelsLayout): PanelsLayout {
  if(Array.isArray(layout)) return layout.length > 0 ? layout : null;
  if(!layout) return null;
  
  const first = reduceLayout(layout.first);
  const second = reduceLayout(layout.second);
  if(first === null) return second;
  if(second === null) return first;
  return { ...layout, first, second };
}

// Removes the dragged tab (if it comes from a panel) without reducing, so other paths stay valid
export function removeSource(layout: PanelsLayout, source: TabSource | null): PanelsLayout {
  if(!source) return layout;
  
  const tabs = getAt(layout, source.path);
  if(!Array.isArray(tabs)) return layout;
  return setAt(layout, source.path, tabs.filter((tab, id) => id !== source.index));
}

export function parseSource(source: string | undefined): TabSource | null {
  if(!source) return null;
  return JSON.parse(source) as TabSource;
}

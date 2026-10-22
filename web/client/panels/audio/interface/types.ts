import type { InteractEvent, NodeStateData } from "../../../../../audio/packets";

export type InteractHandler = (node: string, event: InteractEvent) => void;

export interface InterfaceProps {
  data: NodeStateData;
  onInteract: InteractHandler;
}

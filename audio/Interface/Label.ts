import { state } from "../utils";
import Node from "./Node";

export default class Label extends Node {
  static type = "Label";
  
  @state accessor text = "Label";
  @state accessor size = 3;
}

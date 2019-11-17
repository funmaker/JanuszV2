import { state } from "../utils";
import Node from "./Node";

export default class Label extends Node {
  static type = "Label";
  
  @state text = "Label";
  @state size = 3;
}

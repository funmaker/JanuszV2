import Node from "./Node";
import { state } from "../utils";

export default class Label extends Node {
  static type = "Label";
  
  @state text = "Label";
  @state size = 3;
}

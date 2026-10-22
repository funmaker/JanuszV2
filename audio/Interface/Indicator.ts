import { state } from "../utils";
import Node from "./Node";

export default class Indicator extends Node {
  static type = "Indicator";
  
  @state accessor width = 1;
  @state accessor height = 1;
  @state accessor color = "gray";
}

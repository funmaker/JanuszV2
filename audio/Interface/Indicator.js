import { state } from "../utils";
import Node from "./Node";

export default class Indicator extends Node {
  static type = "Indicator";
  
  @state width = 1;
  @state height = 1;
  @state color = "gray";
}

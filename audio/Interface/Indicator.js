import Node from "./Node";
import { state } from "../utils";

export default class Indicator extends Node {
  static type = "Indicator";
  
  @state width = 1;
  @state height = 1;
  @state color = "gray";
}

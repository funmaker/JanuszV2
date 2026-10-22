import { state } from "../utils";
import Input from "./Input";

export default class Button extends Input<boolean> {
  static type = "Button";
  static defaultValue = false;
  
  @state accessor toggle = false;
  @state accessor size = 2;
  @state accessor icon: string | null = null;
  
  get value() { return super.value; }
  
  set value(value: boolean) {
    if(typeof value !== "boolean") throw new TypeError("Value should be a boolean.");
    
    super.value = value;
  }
}

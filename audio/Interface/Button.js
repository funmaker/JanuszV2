import Input from "./Input";
import { state } from "../utils";

export default class Button extends Input {
  static type = "Button";
  
  @state toggle = false;
  @state size = 2;
  @state icon = null;
  
  @state(false)
  get value() { return super.value; }
  set value(value) {
    if(typeof value !== "boolean") throw new TypeError("Value should be a boolean.");
    
    super.value = value;
  }
}

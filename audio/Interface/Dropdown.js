import { state } from "../utils";
import Input from "./Input";

export default class Dropdown extends Input {
  static type = "Dropdown";
  
  @state text = null;
  @state selection = false;
  @state clearable = false;
  @state defaultText = "Dropdown";
  @state size = 4;
  
  @state([])
  get options() { return this.state.options; }
  
  set options(options) {
    if(options.every(option => option.value !== this.value)) this.value = null;
    this.state.options = options;
  }
  
  @state(null)
  get value() { return super.value; }
  
  set value(value) {
    if(value !== null && this.options.every(option => option.value !== value)) throw new TypeError(`Option ${value} not found.`);
    
    if(this.selection) {
      if(value === null) {
        this.text = null;
      } else {
        const option = this.options.find(option => option.value === value);
        this.text = option && option.text || null;
      }
    }
    
    super.value = value;
  }
}

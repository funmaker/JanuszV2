import { state } from "../utils";
import Input from "./Input";

export interface DropdownOption {
  text: string;
  value: string;
}

export default class Dropdown extends Input<string | null> {
  static type = "Dropdown";
  static defaultValue = null;
  
  @state accessor text: string | null = null;
  @state accessor selection = false;
  @state accessor clearable = false;
  @state accessor defaultText = "Dropdown";
  @state accessor size = 4;
  
  constructor(name: string, x: number | null, y: number | null, initialState?: Record<string, any>) {
    super(name, x, y, initialState);
    
    if(this.rawState.options === undefined) this.rawState.options = [];
  }
  
  get options(): DropdownOption[] { return this.state.options; }
  
  set options(options: DropdownOption[]) {
    if(options.every(option => option.value !== this.value)) this.value = null;
    this.state.options = options;
  }
  
  get value() { return super.value; }
  
  set value(value: string | null) {
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

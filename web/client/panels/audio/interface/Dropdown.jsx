import React from "react";
import { Dropdown as SemanticDropdown } from "semantic-ui-react";

export default class Dropdown extends React.Component {
  state = {
    value: null,
  };
  
  onChange = (ev, { value }) => {
    this.props.onInteract(this.props.data.uuid, { value: value || null });
  };
  
  render() {
    const { data } = this.props;
    
    return (
      <SemanticDropdown className="Dropdown" options={data.state.options} selection={data.state.selection} clearable={data.state.clearable}
                        value={data.state.value} text={data.state.text || data.state.defaultText} onChange={this.onChange}
                        style={{ width: 16 * data.state.size + "px" }} />
    );
  }
}

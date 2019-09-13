import React from "react";
import { Icon } from "semantic-ui-react";

export default class Button extends React.Component {
  onMouseDown = () => {
    if(this.props.data.state.toggle) return;
  
    this.props.onInteract(this.props.data.uuid, { value: true });
  };
  
  onMouseUp = () => {
    if(this.props.data.state.toggle) return;
  
    this.props.onInteract(this.props.data.uuid, { value: false });
  };
  
  onClick = () => {
    if(!this.props.data.state.toggle) return;
  
    this.props.onInteract(this.props.data.uuid, { value: !this.props.data.state.value });
  };
  
  render() {
    const { data } = this.props;
    
    return (
      <div className="Button">
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
             width={data.state.size * 16} height={data.state.size * 16} viewBox="0 0 256 256" version="1"
             onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp}
             onClick={this.onClick} ref={this.svgRef}>
          <path style={{fill: data.state.value ? "#b8dcf9" : "#000e53"}}
                fillRule="nonzero" stroke="#546c9c" strokeWidth="8"
                d="M 250,200 Q 250,250 200,250
                   H 56 Q 6,250 6,200
                   V 56 Q 6,6 56,6
                   H 200 Q 250,6 250,56
                   Z
                   M 200,230 Q 230,230 230,200
                   V 56 Q 230,26 200,26
                   H 56 Q 26,26 26,56
                   V 200 Q 26,230 56,230
                   Z"/>
          <image y="0" x="0" xlinkHref="/static/button.png" preserveAspectRatio="none" height="256" width="256"/>
        </svg>
        {data.state.icon && <Icon name={data.state.icon} style={{ fontSize: data.state.size * 9 + "px" }} />}
      </div>
    );
  }
}

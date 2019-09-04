import React from "react";
import _ from "lodash";

export default class Dial extends React.Component {
  svgRef = React.createRef();
  
  state = {
    value: null,
  };
  
  componentDidMount() {
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }
  
  componentWillUnmount() {
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    this.sendValue.cancel();
  }
  
  onMouseDown = ev => {
    if(ev.button === 0) {
      ev.preventDefault();
      this.svgRef.current.requestPointerLock();
    } else if(ev.button === 1) {
      ev.preventDefault();
      
      let value = parseInt(prompt(this.props.data.state.title, this.props.data.state.value));
      if(isNaN(value)) return;
  
      this.sendValue(value);
    }
  };
  
  onMouseUp = ev => {
    if(ev.button === 0) {
      document.exitPointerLock();
    }
  };
  
  onPointerLockChange = () => {
    if(document.pointerLockElement === this.svgRef.current) {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
      if(this.state.value === null) this.setState({ value: this.props.data.state.value });
    } else {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
      if(this.state.value !== null) this.setState({ value: null });
    }
  };
  
  onMouseMove = ev => {
    let { value } = this.state;
    let { min, max, logScale } = this.props.data.state;
    if(value === null) return;
    
    const exp = (2 ** logScale);
    value = Math.sign(value) * Math.abs(value) ** exp;
    min = Math.sign(min) * Math.abs(min) ** exp;
    max = Math.sign(max) * Math.abs(max) ** exp;
    
    let proc = (value - min) / (max - min);
    proc += (ev.movementX + ev.movementY * (proc - 0.5)) / 1000 / (ev.ctrlKey ? 10 : 1);
    if(proc < 0) proc = 0;
    if(proc > 1) proc = 1;
    value = min + proc * (max - min);
    value = Math.sign(value) * Math.abs(value) ** (1 / exp);
    
    this.setState({ value });
    
    if(ev.shiftKey) value = Math.floor(value);
    this.sendValue(value);
  };
  
  sendValue = _.throttle(value => {
    if(value < this.props.data.state.min) value = this.props.data.state.min;
    if(value > this.props.data.state.max) value = this.props.data.state.max;
    this.props.onInteract(this.props.data.uuid, { value });
  }, 100, { leading: false, trailing: true });
  
  render() {
    const { data } = this.props;
    let { value, min, max, logScale } = data.state;
    
    if(this.state.value !== null) value = this.state.value;
    value = Math.sign(value) * Math.abs(value) ** (2 ** logScale);
    min = Math.sign(min) * Math.abs(min) ** (2 ** logScale);
    max = Math.sign(max) * Math.abs(max) ** (2 ** logScale);
    const proc = (value - min) / (max - min);
    
    const pos = (ang, radius) => `${128 - Math.sin((0.25 + ang * 1.5) * Math.PI) * radius},${128 + Math.cos((0.25 + ang * 1.5) * Math.PI) * radius}`;
    const arc = (start, end, r1, r2) => `
      M ${pos(start, r2)}
      A ${r2},${r2} 0 ${end - start > 2/3 ? 1 : 0} 1 ${pos(end, r2)}
      L ${pos(end, r1)}
      A ${r1},${r1} 0 ${end - start > 2/3 ? 1 : 0} 0 ${pos(start, r1)}
      Z`;
    
    return (
      <div className="Dial">
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
             width="48" height="48" viewBox="0 0 256 256" version="1"
             onMouseDown={this.onMouseDown} ref={this.svgRef}>
          <path d={arc(-0.01, 1.01, 78, 98)} fill="#000e53" stroke="#546c9c" strokeWidth="8" />
          <path d={arc(0, proc, 82, 94)} fill="#b8dcf9" />
          <image y="32" x="32" xlinkHref="/static/gauge.png" preserveAspectRatio="none" height="192" width="192"/>
          <path d="m 126,126 -10,67 10,35 2,0 10,-35 -10,-67 -4,0 z" fill="#333" transform={`rotate(${45 + proc * 270} 128 128)`}/>
        </svg>
      </div>
    );
  }
}

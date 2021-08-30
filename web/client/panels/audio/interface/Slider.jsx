import React from "react";
import _ from "lodash";

export default class Slider extends React.Component {
  // eslint-disable-next-line react/sort-comp
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
      
      const value = parseInt(prompt(this.props.data.state.title, this.props.data.state.value));
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
    let { min, max, logScale, size, length, vertical } = this.props.data.state;
    if(value === null) return;
    
    const exp = (2 ** logScale);
    value = Math.sign(value) * Math.abs(value) ** exp;
    min = Math.sign(min) * Math.abs(min) ** exp;
    max = Math.sign(max) * Math.abs(max) ** exp;
    
    let proc = (value - min) / (max - min);
    proc += (vertical ? ev.movementY : ev.movementX) / 16 / size / length / (ev.ctrlKey ? 10 : 1);
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
    let { value, min, max, vertical, length, size, logScale } = data.state;
    
    if(this.state.value !== null) value = this.state.value;
    value = Math.sign(value) * Math.abs(value) ** (2 ** logScale);
    min = Math.sign(min) * Math.abs(min) ** (2 ** logScale);
    max = Math.sign(max) * Math.abs(max) ** (2 ** logScale);
    const proc = (value - min) / (max - min);
    
    const w = vertical ? 256 : 256 * length;
    const h = vertical ? 256 * length : 256;
    
    return (
      <div className="Slider">
        <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1"
             width={16 * size * (vertical ? 1 : length)}
             height={16 * size * (vertical ? length : 1)}
             viewBox={`0 0 ${w} ${h}`}
             onMouseDown={this.onMouseDown} ref={this.svgRef}>
          <rect fill="#9c9c9c" x="26" y="26" width={w - 52} height={h - 52} />
          <path fill="#000e53" fillRule="nonzero" stroke="#546c9c" strokeWidth="8"
                d={`M ${w - 6},${h - 56} Q ${w - 6},${h - 6} ${w - 56},${h - 6}
                    H 56 Q 6,${h - 6} 6,${h - 56}
                    V 56 Q 6,6 56,6
                    H ${w - 56} Q ${w - 6},6 ${w - 6},56
                    Z
                    M ${w - 56},${h - 26} Q ${w - 26},${h - 26} ${w - 26},${h - 56}
                    V 56 Q ${w - 26},26 ${w - 56},26
                    H 56 Q 26,26 26,56
                    V ${h - 56} Q 26,${h - 26} 56,${h - 26}
                    Z`} />
          <image y={vertical ? proc * 256 * (length - 1) : 0}
                 x={vertical ? 0 : proc * 256 * (length - 1)}
                 xlinkHref={vertical ? "/static/sliderv.png" : "/static/sliderh.png"}
                 preserveAspectRatio="none" height="256" width="256" />
        </svg>
      </div>
    );
  }
}

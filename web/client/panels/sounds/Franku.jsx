import React from "react";

let counter = 0;

setInterval(() => {
  if(counter > 0) {
    counter--;
    for(const callback of triggerCallbacks) {
      callback(counter);
    }
  }
}, 1000);

export const triggerCallbacks = new Set();

export function trigger() {
  counter++;
  for(const callback of triggerCallbacks) {
    callback(counter);
  }
}

export default class Franku extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      triggered: false,
      video: document.createElement("VIDEO"),
    };
    
    this.state.video.src = "/static/franku.webm";
    this.state.video.onplaying = () => this.drawRequest = requestAnimationFrame(this.draw.bind(this));
    this.state.video.onsuspend = () => cancelAnimationFrame(this.drawRequest);
    this.state.video.onended = () => this.setState({ triggered: false });
    
    this.getTriggered = this.getTriggered.bind(this);
  }
  
  componentDidMount() {
    triggerCallbacks.add(this.getTriggered);
  }
  
  componentWillUnmount() {
    triggerCallbacks.delete(this.getTriggered);
  }
  
  draw() {
    const width = this.canvas.width = this.state.video.videoWidth;
    const height = this.canvas.height = this.state.video.videoHeight;
    
    const context = this.canvas.getContext("2d");
    context.drawImage(this.state.video, 0, 0, width, height);
    const frame = context.getImageData(0, 0, width, height);
    const tolerance = 120;
    
    for(let n = 0; n < width * height * 4; n += 4) {
      const [r, g, b] = [frame.data[n], frame.data[n + 1], frame.data[n + 2]];
      const [targetRed, targetGreen, targetBlue] = [44, 255, 26];
      const [diffRed, diffGreen, diffBlue] = [Math.abs(r - targetRed), Math.abs(g - targetGreen), Math.abs(b - targetBlue)];
      const diff = diffRed + diffGreen + diffBlue;
      
      if(diff < tolerance) {
        frame.data[n + 3] = 0;
      } else if(diff < tolerance * 2) {
        frame.data[n] = r + (r - targetRed) * (2 - diff / tolerance) * 10;
        frame.data[n + 1] = g + (g - targetGreen) * (2 - diff / tolerance) * 10;
        frame.data[n + 2] = b + (b - targetBlue) * (2 - diff / tolerance) * 10;
        frame.data[n + 3] = 255 * (diff / tolerance - 1);
      }
    }
    
    context.putImageData(frame, 0, 0);
    
    this.drawRequest = requestAnimationFrame(this.draw.bind(this));
  }
  
  getTriggered(counter) {
    if(counter >= 6 && !this.state.triggered) {
      this.setState({ triggered: true });
      this.state.video.play().catch(console.error);
    }
  }
  
  render() {
    return (
      <div className="Franku">
        <canvas ref={canvas => this.canvas = canvas} width="854" height="480" hidden={!this.state.triggered} />
      </div>
    );
  }
}

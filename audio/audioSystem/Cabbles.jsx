import * as React from "react/cjs/react.development";

export default class Cabbles extends React.Component {
	
	componentDidUpdate() {
		const {devices, posx, posy} = this.props;
		const {width, height} = this.canvas.getBoundingClientRect();
		this.canvas.width = width;
		this.canvas.height = height;
		const ctx = this.canvas.getContext("2d");
		
		ctx.clearRect(0, 0, width, height);
		
	}
	
	render() {
		
		console.log(this.props.connections)
		
		return <canvas className="Cabbles" ref={canvas => this.canvas = canvas}/>;
	}
};

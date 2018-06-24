import * as React from "react/cjs/react.development";

export default class Cabbles extends React.PureComponent {
	state = {
		posx: 0,
		posy: 0,
		width: 64,
		height: 64,
	};
	
	static getDerivedStateFromProps(props) {
		if(!props.devices || Object.keys(props.devices).length <= 0) return null;
		
		let anyDevice = Object.values(props.devices)[0];
		let x1 = anyDevice.posx, y1 = anyDevice.posy, x2 = anyDevice.posx, y2 = anyDevice.posy;
		
		for(let device of Object.values(props.devices)) {
			if(device.posx - 128 < x1) x1 = device.posx - 128;
			if(device.posx + 128 > x2) x2 = device.posx + 128;
			if(device.posy - 128 < y1) y1 = device.posy - 128;
			if(device.posy + 128 > y2) y2 = device.posy + 128;
		}
		
		return {
			posx: x1,
			posy: y1,
			width: x2 - x1,
			height: y2 - y1,
		};
	}
	
	componentDidUpdate(prevProps) {
		this.canvasRender();
	}
	
	componentDidMount() {
		this.canvasRender();
	}
	
	canvasRender() {
		const {devices, connections} = this.props;
		const {posx, posy, width, height} = this.state;
		const ctx = this.canvas.getContext("2d");
		
		ctx.clearRect(0, 0, width, height);
		
		const getOffset = (dev, port_id, isOutput) => ({
			x: devices[dev].posx - posx + (isOutput ? 64 : -64),
			y: devices[dev].posy - posy - Math.max(devices[dev].inputs, devices[dev].outputs) * 16 + port_id * 32 + 24,
		});
		
		for(let con of Object.values(connections)) {
			if(devices[con.from] === undefined || devices[con.to] === undefined) console.log(devices, connections, con);
			const from = getOffset(con.from, con.output, true);
			const to = getOffset(con.to, con.input, false);
			const magic = Math.sign(from.y - to.y) * Math.sign(from.x - to.x);
			
			ctx.beginPath();
			ctx.moveTo(from.x, from.y - 7);
			ctx.bezierCurveTo(
				(from.x + to.x) / 2 + 7 * magic, from.y - 7,
				(from.x + to.x) / 2 + 7 * magic, to.y - 7,
				to.x, to.y - 7
			);
			ctx.lineTo(to.x, to.y + 7);
			ctx.bezierCurveTo(
				(from.x + to.x) / 2 - 7 * magic, to.y + 7,
				(from.x + to.x) / 2 - 7 * magic, from.y + 7,
				from.x, from.y + 7
			);
			ctx.closePath();
			ctx.fillStyle = "#42a1a1";
			ctx.fill();
			ctx.strokeStyle = "#bfbfbf";
			ctx.stroke();
		}
	}
	
	render() {
		return <canvas width={this.state.width}
		               height={this.state.height}
		               style={{
			               transform: `translate(${this.state.posx}px, ${this.state.posy}px)`,
		               }}
		               className="Cabbles"
		               ref={canvas => this.canvas = canvas}/>;
	}
};

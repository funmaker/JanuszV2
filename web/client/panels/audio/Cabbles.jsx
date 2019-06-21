import React from "react";
import BezierEasing from "bezier-easing";

const ease = BezierEasing(0.25, 0.1, 0.25, 1);
const easeDur = 0.2;
const onColor = [73, 196, 196];
const offColor = [66, 161, 161];

function mapValues(obj, fun) {
	const ret = {};
	
	for(let i in obj) {
		if(!obj.hasOwnProperty(i)) continue;
		ret[i] = fun(obj[i]);
	}
	
	return ret;
}

function interpolateColor(from, to, time) {
	const val = ease(time);
	const color = [
		from[0] + val * (to[0] - from[0]),
		from[1] + val * (to[1] - from[1]),
		from[2] + val * (to[2] - from[2]),
	];
	return `rgb(${color.join(", ")})`;
}

export default class Cabbles extends React.PureComponent {
	state = {
		posx: 0,
		posy: 0,
		width: 64,
		height: 64,
	};
	
	animations = {};
	animationReq = null;
	lastAnim = Date.now();
	
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
		this.animations = mapValues(this.props.devices, device => this.animations[device.uuid] || device.outputActivity.map(out => out ? 1 : 0));
		this.canvasRender();
		
		this.lastAnim = Date.now();
		if(this.animationReq) window.cancelAnimationFrame(this.animationReq);
		this.animationReq = window.requestAnimationFrame(this.onAnimation);
	}
	
	componentDidMount() {
		this.canvasRender();
	}
	
	onAnimation = () => {
		const deltaTime = (Date.now() - this.lastAnim) / 1000;
		this.lastAnim = Date.now();
		
		let dirty = false;
		
		for(let device of Object.values(this.props.devices)) {
			const devAnim = this.animations[device.uuid];
			
			for(let output in device.outputActivity) {
				if(!device.outputActivity.hasOwnProperty(output)) continue;
				
				if(devAnim[output] !== (device.outputActivity[output] ? 1 : 0)) {
					dirty = true;
					if(device.outputActivity[output]) {
						devAnim[output] = Math.min(devAnim[output] + (deltaTime / easeDur), 1);
					} else {
						devAnim[output] = Math.max(devAnim[output] - (deltaTime / easeDur), 0);
					}
				}
			}
		}
		
		if(dirty) {
			this.canvasRender();
			this.animationReq = window.requestAnimationFrame(this.onAnimation);
		}
	};
	
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
			ctx.fillStyle = interpolateColor(offColor, onColor, this.animations[con.from][con.output]);
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

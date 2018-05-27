import React from 'react';
import {Icon, Segment} from "semantic-ui-react";
import SplitPane from 'react-split-pane'
import {findClientModule} from "../app";

export function PanelTab({name, active, onDelete, onClick}) {
	function onDragStart(ev) {
		ev.dataTransfer.setData("januszTab", "true");
		ev.dataTransfer.setData("name", name);
	}
	
	function onDragEnd(ev) {
		if(ev.dataTransfer.dropEffect === "move") {
			onDelete();
		}
	}
	
	return <div className={`PanelTab${active ? " active" : ""}`}
	            draggable
	            onDragStart={onDragStart}
	            onDragEnd={onDragEnd}
	            onClick={onClick}>
		{name}
	</div>;
}

export default class Panels extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			activeTab: 0,
		};
		
		this.onTabsDrop = this.onTabsDrop.bind(this);
		this.onContentDrop = this.onContentDrop.bind(this);
		this.onEmptyDrop = this.onEmptyDrop.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
	}
	
	async onTabsDrop(ev) {
		if(ev.dataTransfer.getData("januszTab") === "true") {
			ev.preventDefault();
			
			this.props.onChange([...this.props.panels, ev.dataTransfer.getData("name")]);
		}
	}
	
	async onContentDrop(ev) {
		if(ev.dataTransfer.getData("januszTab") === "true") {
			let target = ev.currentTarget;
			ev.preventDefault();
			
			const {panels, onChange} = this.props;
			const rect = target.getBoundingClientRect();
			const x = (ev.clientX - rect.left) / (rect.right - rect.left);
			const y = (ev.clientY - rect.top) / (rect.bottom - rect.top);
			
			let newPanels = {};
			if(x > y && x > 1 - y) {
				newPanels.vertical = true;
				newPanels.first = panels;
				newPanels.second = [ev.dataTransfer.getData("name")];
			} else if(x < y && x < 1 - y) {
				newPanels.vertical = true;
				newPanels.first = [ev.dataTransfer.getData("name")];
				newPanels.second = panels;
			} else if(y > x && y > 1 - x) {
				newPanels.vertical = false;
				newPanels.first = panels;
				newPanels.second = [ev.dataTransfer.getData("name")];
			} else if(y < x && y < 1 - x) {
				newPanels.vertical = false;
				newPanels.first = [ev.dataTransfer.getData("name")];
				newPanels.second = panels;
			}
			onChange(newPanels);
		}
	}
	
	async onEmptyDrop(ev) {
		if(ev.dataTransfer.getData("januszTab") === "true") {
			ev.preventDefault();
			
			this.props.onChange([ev.dataTransfer.getData("name")]);
		}
	}
	
	onDragOver(ev) {
		if(ev.dataTransfer.getData("januszTab") === "true") {
			ev.preventDefault();
		}
	}
	
	shouldComponentUpdate(nextProps, nextState) {
		if(nextState === this.state && this.props.panels === nextProps.panels) {
			return false;
		}
		return true;
	}
	
	componentDidMount() {
		this.tryReduce();
	}
	
	componentDidUpdate() {
		this.tryReduce();
	}
	
	tryReduce() {
		const {panels, onChange} = this.props;
		
		if(Array.isArray(panels) && panels.length === 0) {
			onChange(null);
		} else if(panels instanceof Object && !Array.isArray(panels)) {
			if(panels.first === null) {
				onChange(panels.second);
			} else if(panels.second === null) {
				onChange(panels.first);
			}
		}
	}
	
	render() {
		const {panels} = this.props;
		
		let onChange = panels => this.props.onChange(panels); // Doesn't work correctly without it. Unexplained phenomena.
		
		if(panels === null) {
			return <Segment className="Panels empty"
			                onDragOver={this.onDragOver}
			                onDrop={this.onEmptyDrop}/>;
		} else if(Array.isArray(panels)) {
			if(panels.length === 0) return <Segment className="Panels empty"/>;
			
			let activeTab = this.state.activeTab;
			if(activeTab >= panels.length) activeTab = 0;
			let Panel = findClientModule(panels[activeTab]).Panel;
			
			return <Segment.Group className='Panels'>
				<Segment className="tabs"
				         inverted
				         onDragOver={this.onDragOver}
				         onDrop={this.onTabsDrop}>
					{panels.map((panel, id) =>
						<PanelTab name={panel}
						          key={id}
						          onDelete={() => onChange([...panels.slice(0, id), ...panels.slice(id + 1)])}
						          onClick={() => this.setState({activeTab: id})}
						          active={id === activeTab}
						/>,
					)}
				</Segment>
				<Segment className={`content ${panels[activeTab]}Panel`}
				         onDragOver={this.onDragOver}
				         onDrop={this.onContentDrop}>
					<Panel/>
				</Segment>
			</Segment.Group>
		} else {
			return <div className='Panels'>
				<SplitPane split={panels.vertical ? "vertical" : "horizontal"}
				           defaultSize={panels.size || "50%"}
				           onChange={size => onChange({...panels, size})} minSize={96} maxSize={-110}>
					<Panels panels={panels.first}
					        onChange={first => onChange({...panels, first})}/>
					<Panels panels={panels.second}
					        onChange={second => onChange({...panels, second})}/>
				</SplitPane>
			</div>;
		}
	}
}

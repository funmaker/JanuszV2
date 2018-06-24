import React from "react";
import {clientModules} from "../App";
import {Segment} from "semantic-ui-react";

function onDragOver(ev) {
	if(window.dataTransfer.getData("januszTab") === "true") {
		ev.preventDefault();
	}
}

function onDragStart(ev, name) {
	ev.dataTransfer.setData("firefox", "sucks");
	window.dataTransfer.clearData();
	window.dataTransfer.setData("januszTab", "true");
	window.dataTransfer.setData("name", name);
}

export default function Modules() {
	return (
		<Segment inverted className="Modules" onDragOver={onDragOver}>
			<div className="PanelTab disabled">
				Available Panels:
			</div>
			{clientModules.map((mod, id) => <div key={id} className="PanelTab new" draggable onDragStart={ev => onDragStart(ev, mod.name)}>{mod.name}</div>)}
		</Segment>
	);
}

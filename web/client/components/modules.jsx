import React from "react";
import {clientModules} from "../app";
import {Segment} from "semantic-ui-react";

function onDragOver(ev) {
	if(ev.dataTransfer.getData("januszTab") === "true") {
		ev.preventDefault();
	}
}

function onDragStart(ev, name) {
	ev.dataTransfer.setData("januszTab", "true");
	ev.dataTransfer.setData("name", name);
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

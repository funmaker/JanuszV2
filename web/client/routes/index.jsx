import React from 'react';
import isNode from 'detect-node';
import {fetchInitialData, getInitialData} from "../helpers/initialData";
import Logo from "../components/logo";
import Panels from "../components/panels";
import Modules from "../components/modules";

export default class Index extends React.Component {
	constructor() {
		super();
		
		this.state = {
			...getInitialData(),
			panels: null,
		};
		
		this.panelsChange = this.panelsChange.bind(this);
	}
	
	async componentDidMount() {
		this.setState({
			...(await fetchInitialData()),
		});
		
		if(!isNode && localStorage.getItem("panels")) {
			this.setState({panels: JSON.parse(localStorage.getItem("panels"))});
		}
	}
	
	panelsChange(panels) {
		this.setState({panels});
		localStorage.setItem("panels", JSON.stringify(panels));
	}
	
	render() {
		return (
			<div className="Index">
				<Logo/>
				<Panels panels={this.state.panels} onChange={this.panelsChange}/>
				<Modules/>
			</div>
		)
	}
}

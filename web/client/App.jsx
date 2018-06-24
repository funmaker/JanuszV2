import React from 'react'
import {Route, Switch, withRouter} from "react-router";
import {setInitialData} from "./helpers/initialData";
import isNode from 'detect-node';
import {hot} from "react-hot-loader";
import Index from "./routes/index";
import * as AudioClient from './panels/audio/AudioPanel';
import * as SoundsClient from './panels/sounds/SoundsPanel';
import * as DiscordClient from './panels/discord/DiscordPanel';

if(!isNode) {
	try {
		window.dataTransfer = new DataTransfer();
	} catch(e) {
		let data = {};
		window.dataTransfer = {
			setData: (name, value) => data[name] = value,
			getData: (name) => data[name],
			clearData: () => data = {} ,
		};
	}
}

export const clientModules = [
	AudioClient,
	SoundsClient,
	DiscordClient,
];

export const findClientModule = name => clientModules.find(mod => mod.name === name);

class App extends React.Component {
	constructor({initialData}) {
		super();
		
		if(isNode) {
			setInitialData(initialData);
		} else {
			setInitialData(JSON.parse(document.getElementById('initialData').textContent));
		}
	}
	
	componentDidMount() {
		this.unlisten = this.props.history.listen(() => {
			setInitialData(null);
		});
	}
	
	componentWillUnmount() {
		this.unlisten();
	}
	
	render() {
		return (
			<Switch>
				<Route path="/" exact component={Index}/>
			</Switch>
		)
	}
}

export default hot(module)(withRouter(App));

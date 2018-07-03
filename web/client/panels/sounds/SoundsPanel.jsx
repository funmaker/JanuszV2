import React from 'react';
import requestJSON from "../../../client/helpers/requestJSON";
import {Accordion, Button, Dimmer, Icon, Loader} from "semantic-ui-react";
import Franku, {trigger, triggerCallbacks} from "./Franku";

function Sounds({elements}) {
	let folders = elements.filter(sound => sound.type === "folder").sort((a, b) => a.name.localeCompare(b.name));
	let sounds = elements.filter(sound => sound.type === "sound").sort((a, b) => a.name.localeCompare(b.name));
	
	return <React.Fragment>
		{folders.length > 0 ?
			<Accordion styled fluid>
				{folders.map((sound, id) => <Sound sound={sound} key={id}/>)}
			</Accordion>
			: null}
		{sounds.length > 0 ?
			<div className="soundButtons">
				{sounds.map((sound, id) => <Sound sound={sound} key={id}/>)}
			</div>
		: null}
	</React.Fragment>;
}

class Sound extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			extended: true,
		};
		
		this.playSound = this.playSound.bind(this);
		this.playRandomSound = this.playRandomSound.bind(this);
	}
	
	async playSound() {
		await requestJSON({pathname: "/sounds/play", search: {sound: this.props.sound.path}});
		trigger();
	}
	
	async playRandomSound(ev) {
		ev.stopPropagation();
		await requestJSON({pathname: "/sounds/play", search: {sound: this.props.sound.path + "/*"}});
		trigger();
	}
	
	render() {
		const {sound} = this.props;
		
		if(sound.type === "folder") {
			return <React.Fragment>
				<Accordion.Title active={this.state.extended}
				                 onClick={() => this.setState({extended: !this.state.extended})}>
					<Icon name='dropdown'/>
					{sound.name}
					<Button className="randomButton" icon="random" onClick={this.playRandomSound} compact size="tiny" basic/>
				</Accordion.Title>
				<Accordion.Content active={this.state.extended}>
					<Sounds elements={sound.elements}/>
				</Accordion.Content>
			</React.Fragment>
		} else {
			return <Button content={sound.name.substr(0, sound.name.lastIndexOf("."))}
			               onClick={this.playSound} compact/>;
		}
	}
}

export class Panel extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			sounds: [],
			loading: true,
		};
		
		this.playRandomSound = this.playRandomSound.bind(this);
		this.stopSounds = this.stopSounds.bind(this);
		this.getTriggered = this.getTriggered.bind(this);
	}
	
	async componentDidMount() {
		const sounds = await requestJSON({pathname: "/sounds/list"});
		this.setState({
			sounds,
			loading: false,
			triggered: false,
		});
		
		triggerCallbacks.add(this.getTriggered);
	}
	
	componentWillUnmount() {
		triggerCallbacks.delete(this.getTriggered);
	}
	
	getTriggered(counter) {
		if(counter >= 3 && !this.state.triggered) {
			this.setState({triggered: true});
		} else if(counter === 0 && this.state.triggered) {
			this.setState({triggered: false});
		}
	}
	
	async playRandomSound() {
		await requestJSON({pathname: "/sounds/play", search: {sound: "*"}});
		trigger();
	}
	
	async stopSounds() {
		await requestJSON({pathname: "/sounds/stopSounds"});
	}
	
	render() {
		return <React.Fragment>
			<div className="panelScroll">
				<Sounds elements={this.state.sounds}/>
			</div>
			<Dimmer active={this.state.loading} inverted><Loader/></Dimmer>
			<Franku/>
			<Button.Group className="panelButtons">
				<Button icon="bell slash" color={this.state.triggered ? "red" : "grey"} onClick={this.stopSounds}/>
				<Button icon="random" onClick={this.playRandomSound}/>
			</Button.Group>
		</React.Fragment>;
	}
}

export const name = "Sounds";


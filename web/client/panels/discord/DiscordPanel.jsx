import React from 'react';
import {Button, Dimmer, Dropdown, Loader} from "semantic-ui-react";
import requestJSON from "../../../client/helpers/requestJSON";
import Channels from './Channels';

export class Panel extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			guilds: [],
			guild: null,
			guildData: null,
			loading: true,
		};
	}
	
	async componentDidMount() {
		const guilds = (await requestJSON({pathname: "/discord/guilds"})).sort((a, b) => b.online - a.online);
		this.setState({
			guilds,
			guild: guilds.length > 0 ? guilds[0].id : undefined,
			guildData: null,
			loading: false,
		});
	}
	
	async componentDidUpdate() {
		if(this.state.guildData === null && this.state.guild && !this.state.loading) {
			await this.onRefresh();
		}
	}
	
	replaceLocalUser(map) {
		return this.state.guildData.members.map(member => member.id === this.state.guildData.localUser ? map(member) : member);
	}
	
	onJoin = async (channel) => {
		this.setState({
			loading: true,
		});
		await requestJSON({pathname: `/discord/guilds/${this.state.guild}/${channel.id}/join`});
		this.setState({
			guildData: {
				...this.state.guildData,
				members: this.replaceLocalUser(lu => ({...lu, voiceChannel: channel.id})),
			},
			loading: false,
		});
	};
	
	onDisconnect = async () => {
		this.setState({
			loading: true,
		});
		await requestJSON({pathname: `/discord/guilds/${this.state.guild}/disconnect`});
		this.setState({
			guildData: {
				...this.state.guildData,
				members: this.replaceLocalUser(lu => ({...lu, voiceChannel: undefined})),
			},
			loading: false,
		});
	};
	
	onRefresh = async () => {
		this.setState({
			loading: true,
		});
		this.setState({
			guildData: await requestJSON({pathname: `/discord/guilds/${this.state.guild}`}),
			loading: false,
		});
	};
	
	onMute = async () => {
		this.setState({
			loading: true,
		});
		const response = await requestJSON({pathname: `/discord/guilds/${this.state.guild}/mute`});
		this.setState({
			guildData: {
				...this.state.guildData,
				selfMute: response.selfMute,
				members: this.replaceLocalUser(lu => ({...lu, mute: response.selfMute})),
			},
			loading: false,
		});
	};
	
	onDeaf = async () => {
		this.setState({
			loading: true,
		});
		const response = await requestJSON({pathname: `/discord/guilds/${this.state.guild}/deaf`});
		this.setState({
			guildData: {
				...this.state.guildData,
				selfDeaf: response.selfDeaf,
				members: this.replaceLocalUser(lu => ({...lu, deaf: response.selfDeaf})),
			},
			loading: false,
		});
	};
	
	render() {
		return <React.Fragment>
			<div className="panelScroll">
				<Dropdown selection
				          fluid
				          value={this.state.guild}
				          onChange={(ev, {value}) => this.setState({guild: value, guildData: null})}
				          options={this.state.guilds.map(guild => ({text: guild.name, value: guild.id, description: `${guild.membersOnline}/${guild.members}`}))}/>
				{this.state.guildData ?
					<Channels channels={this.state.guildData.channels} members={this.state.guildData.members} onJoin={this.onJoin}/>
				: null}
			</div>
			<Dimmer active={this.state.loading} inverted><Loader/></Dimmer>
			<Button.Group className="panelButtons">
				{this.state.guildData ?
					<React.Fragment>
						<Button icon="power" onClick={this.onDisconnect} color="grey"/>
						<Button icon={this.state.guildData.selfMute ? "microphone slash" : "microphone"}
						        color={this.state.guildData.selfMute ? "grey" : undefined}
						        onClick={this.onMute}/>
						<Button icon={this.state.guildData.selfDeaf ? "volume off" : "volume up"}
						        color={this.state.guildData.selfDeaf ? "grey" : undefined}
						        onClick={this.onDeaf}/>
					</React.Fragment>
					: null}
				<Button icon={"refresh"} onClick={this.onRefresh}/>
			</Button.Group>
		</React.Fragment>;
	}
}

export const name = "Discord";


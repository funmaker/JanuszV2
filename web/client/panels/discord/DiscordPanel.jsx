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
		
		this.onJoin = this.onJoin.bind(this);
		this.onDisconnect = this.onDisconnect.bind(this);
		this.onRefresh = this.onRefresh.bind(this);
	}
	
	async componentDidMount() {
		const guilds = (await requestJSON({pathname: "/discord/guilds"})).sort((a, b) => b.online - a.online);
		this.setState({
			guilds,
			guild: guilds.length > 0 ? guilds[0].id : undefined,
			guildData: null,
			loading: guilds.length > 0,
		});
	}
	
	async componentDidUpdate() {
		if(this.state.guildData === null && this.state.guild) {
			this.setState({
				guildData: await requestJSON({pathname: `/discord/guilds/${this.state.guild}`}),
				loading: false,
			})
		}
	}
	
	async onJoin(channel) {
		this.setState({
			loading: true,
		});
		await requestJSON({pathname: `/discord/guilds/${this.state.guild}/${channel.id}/join`});
		await new Promise(res => setTimeout(res, 500));
		this.setState({
			guildData: await requestJSON({pathname: `/discord/guilds/${this.state.guild}`}),
			loading: false,
		});
	}
	
	async onDisconnect() {
		this.setState({
			loading: true,
		});
		await requestJSON({pathname: `/discord/guilds/${this.state.guild}/disconnect`});
		await new Promise(res => setTimeout(res, 500));
		this.setState({
			guildData: await requestJSON({pathname: `/discord/guilds/${this.state.guild}`}),
			loading: false,
		});
	}
	
	async onRefresh() {
		this.setState({
			loading: true,
		});
		this.setState({
			guildData: await requestJSON({pathname: `/discord/guilds/${this.state.guild}`}),
			loading: false,
		})
	}
	
	render() {
		return <React.Fragment>
			<Dropdown selection
			          fluid
			          value={this.state.guild}
			          onChange={(ev, {value}) => this.setState({guild: value, guildData: null})}
			          options={this.state.guilds.map(guild => ({text: guild.name, value: guild.id, description: `${guild.membersOnline}/${guild.members}`}))}/>
			<Channels channels={this.state.guildData ? this.state.guildData.channels : []} onJoin={this.onJoin}/>
			<Button.Group basic fluid>
				<Button content="Refresh" onClick={this.onRefresh}/>
				<Button content="Disconnect" onClick={this.onDisconnect}/>
			</Button.Group>
			<Dimmer active={this.state.loading} inverted><Loader/></Dimmer>
		</React.Fragment>;
	}
}

export const name = "Discord";


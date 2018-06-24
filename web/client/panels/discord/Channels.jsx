import React from 'react';
import {List} from "semantic-ui-react";

const channelIcons = {
	text: "hashtag",
	voice: "volume up",
	category: "caret right",
};

class Channel extends React.Component {
	constructor(props) {
		super(props);
		
		this.state = {
			expanded: false,
		};
		
		this.onClick = this.onClick.bind(this);
	}
	
	onClick(ev) {
		ev.preventDefault();
		ev.stopPropagation();
		if(this.props.channel.type === "category") {
			this.setState({expanded: !this.state.expanded})
		} else if(this.props.channel.type === "voice") {
			this.props.onJoin(this.props.channel);
		}
	}
	
	render() {
		const {channel, onJoin} = this.props;
		
		let extraList = null;
		let icon = channelIcons[channel.type];
		
		if(channel.type === "category" && this.state.expanded) {
			extraList = <List.List>
				{channel.children.map(channel => <Channel key={channel.id} channel={channel} onJoin={onJoin}/>)}
			</List.List>;
			icon = "caret down";
		} else if(channel.type === "voice" && channel.members.length > 0) {
			extraList = <List.List>
				{channel.members.sort((a, b) => a.name.localeCompare(b.name))
					.map(member => <List.Item className="user"
					                          key={member.id}
					                          image={member.avatar}
					                          content={member.name}/>)}
			</List.List>;
		}
		
		return <List.Item onClick={this.onClick} className={channel.type}>
			<List.Icon name={icon}/>
			<List.Content>{channel.name}</List.Content>
			{extraList}
		</List.Item>;
	}
}

export default function Channels({channels, onJoin}) {
	return <List divided relaxed className="Channels" size="large">
		{channels.map(channel => <Channel key={channel.id} channel={channel} onJoin={onJoin}/>)}
	</List>;
}


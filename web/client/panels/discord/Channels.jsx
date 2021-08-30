import React from 'react';
import { Icon, Image, List } from "semantic-ui-react";

const channelIcons = {
  text: "hashtag",
  voice: "volume up",
  category: "caret right",
  other: "question",
};

class Channel extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      expanded: props.channel.type === "category" && props.members.some(m => props.channel.children.some(c => c.id === m.voiceChannel)),
    };
    
    this.onClick = this.onClick.bind(this);
  }
  
  onClick(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    if(this.props.channel.type === "category") {
      this.setState(state => ({ expanded: !state.expanded }));
    } else if(this.props.channel.type === "voice") {
      this.props.onJoin(this.props.channel);
    }
  }
  
  render() {
    const { channel, members, onJoin } = this.props;
    
    let extraList = null;
    let icon = channelIcons[channel.type];
    
    if(channel.type === "category" && this.state.expanded) {
      extraList = (
        <List.List>
          {channel.children.map(channel => <Channel key={channel.id} channel={channel} members={members} onJoin={onJoin} />)}
        </List.List>
      );
      icon = "caret down";
    } else if(channel.type === "voice") {
      const channelMembers = members.filter(m => m.voiceChannel === channel.id).sort((a, b) => a.name.localeCompare(b.name));
      if(channelMembers.length > 0) {
        extraList = (
          <List.List>
            { channelMembers.sort((a, b) => a.name.localeCompare(b.name))
                            .map(member =>
                              <List.Item className="user"
                                         key={member.id}>
                                <Image src={member.avatar} avatar />
                                <List.Content>{member.name}</List.Content>
                                <span className="icons">
                                  {member.mute ? <Icon name="microphone slash" /> : null}
                                  {member.deaf ? <Icon name="bell slash" /> : null}
                                </span>
                              </List.Item>,
                            )}
          </List.List>
        );
      }
    }
    
    return (
      <List.Item onClick={this.onClick} className={channel.type}>
        <List.Icon name={icon} />
        <List.Content>{channel.name}</List.Content>
        {extraList}
      </List.Item>
    );
  }
}

export default function Channels({ channels, members, onJoin }) {
  return (
    <List divided relaxed className="Channels" size="large">
      {channels.map(channel => <Channel key={channel.id} channel={channel} members={members} onJoin={onJoin} />)}
    </List>
  );
}


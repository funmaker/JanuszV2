import React, { useState } from 'react';
import { Avatar, Collapse, List, ListItemButton, ListItemIcon, ListItemText, styled } from "@mui/material";
import TagIcon from '@mui/icons-material/Tag';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MicOffIcon from '@mui/icons-material/MicOff';
import HeadsetOffIcon from '@mui/icons-material/HeadsetOff';
import { DiscordChannel, DiscordMember } from "../../../../types/api";

const channelIcons = {
  text: <TagIcon fontSize="small" />,
  voice: <VolumeUpIcon fontSize="small" />,
  other: <HelpOutlineIcon fontSize="small" />,
};

interface ChannelProps {
  channel: DiscordChannel;
  members: DiscordMember[];
  onJoin: (channel: DiscordChannel) => void;
  depth?: number;
}

function Channel({ channel, members, onJoin, depth = 0 }: ChannelProps) {
  const [expanded, setExpanded] = useState(() => channel.type === "category" && members.some(m => channel.children.some(c => c.id === m.voiceChannel)));
  
  if(channel.type === "category") {
    return (
      <>
        <ListItemButton dense onClick={() => setExpanded(!expanded)} sx={{ pl: 1 + depth * 2 }}>
          <ListItemIcon>{expanded ? <ArrowDropDownIcon /> : <ArrowRightIcon />}</ListItemIcon>
          <ListItemText primary={channel.name.toUpperCase()} slotProps={{ primary: { fontWeight: "bold", fontSize: "0.85em" } }} />
        </ListItemButton>
        <Collapse in={expanded} unmountOnExit>
          <List disablePadding>
            {channel.children.map(child => <Channel key={child.id} channel={child} members={members} onJoin={onJoin} depth={depth + 1} />)}
          </List>
        </Collapse>
      </>
    );
  }
  
  const channelMembers = channel.type === "voice" ? members.filter(m => m.voiceChannel === channel.id).sort((a, b) => a.name.localeCompare(b.name)) : [];
  
  return (
    <>
      <ListItemButton dense disableRipple={channel.type !== "voice"} onClick={() => channel.type === "voice" && onJoin(channel)} sx={{ pl: 1 + depth * 2, cursor: channel.type === "voice" ? "pointer" : "default" }}>
        <ListItemIcon>{channelIcons[channel.type]}</ListItemIcon>
        <ListItemText primary={channel.name} />
      </ListItemButton>
      {channelMembers.map(member => (
        <StyledMember key={member.id} sx={{ pl: 4 + depth * 2 }}>
          <Avatar src={member.avatar ?? undefined} alt={member.name} />
          <span className="name">{member.name}</span>
          {member.mute && <MicOffIcon fontSize="small" />}
          {member.deaf && <HeadsetOffIcon fontSize="small" />}
        </StyledMember>
      ),
      )}
    </>
  );
}

interface ChannelsProps {
  channels: DiscordChannel[];
  members: DiscordMember[];
  onJoin: (channel: DiscordChannel) => void;
}

export default function Channels({ channels, members, onJoin }: ChannelsProps) {
  return (
    <StyledChannels>
      {channels.map(channel => <Channel key={channel.id} channel={channel} members={members} onJoin={onJoin} />)}
    </StyledChannels>
  );
}

const StyledChannels = styled(List)`
  .MuiListItemIcon-root {
    min-width: 2em;
  }
`;

const StyledMember = styled("div")`
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding-top: 0.2em;
  padding-bottom: 0.2em;
  padding-right: 1em;
  
  .MuiAvatar-root {
    width: 20px;
    height: 20px;
  }
  
  .name {
    flex: 1;
  }
`;

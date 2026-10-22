import React, { useMemo, useState } from 'react';
import { Button, ListItemText, MenuItem, Select } from "@mui/material";
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DiscordChannel, DiscordDeafResponse, DiscordGuild, DiscordGuildResponse, DiscordMember, DiscordMuteResponse } from "../../../../types/api";
import requestJSON from "../../helpers/requestJSON";
import useRequest from "../../hooks/useRequest";
import useAsyncCallback from "../../hooks/useAsyncCallback";
import LoadingOverlay from "../../components/LoadingOverlay";
import PanelButtons from "../../components/PanelButtons";
import PanelScroll from "../../components/PanelScroll";
import Channels from './Channels';

export const name = "Discord";

export function Panel() {
  const guilds = useRequest<DiscordGuild[]>("/discord/guilds");
  const sortedGuilds = useMemo(() => [...guilds.data ?? []].sort((a, b) => b.membersOnline - a.membersOnline), [guilds.data]);
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  const guild = selectedGuild ?? sortedGuilds[0]?.id ?? null;
  const guildData = useRequest<DiscordGuildResponse>(guild && `/discord/guilds/${guild}`);
  const { setData } = guildData;
  
  const updateLocalUser = (data: DiscordGuildResponse, map: (member: DiscordMember) => DiscordMember) => ({
    ...data,
    members: data.members.map(member => member.id === data.localUser ? map(member) : member),
  });
  
  const [onJoin, joining] = useAsyncCallback(async (channel: DiscordChannel) => {
    await requestJSON({ url: `/discord/guilds/${guild}/${channel.id}/join` });
    setData(data => updateLocalUser(data, lu => ({ ...lu, voiceChannel: channel.id })));
  });
  
  const [onDisconnect, disconnecting] = useAsyncCallback(async () => {
    await requestJSON({ url: `/discord/guilds/${guild}/disconnect` });
    setData(data => updateLocalUser(data, lu => ({ ...lu, voiceChannel: undefined })));
  });
  
  const [onMute, muting] = useAsyncCallback(async () => {
    const response = await requestJSON<DiscordMuteResponse>({ url: `/discord/guilds/${guild}/mute` });
    setData(data => updateLocalUser({ ...data, selfMute: response.selfMute }, lu => ({ ...lu, mute: response.selfMute })));
  });
  
  const [onDeaf, deafening] = useAsyncCallback(async () => {
    const response = await requestJSON<DiscordDeafResponse>({ url: `/discord/guilds/${guild}/deaf` });
    setData(data => updateLocalUser({ ...data, selfDeaf: response.selfDeaf }, lu => ({ ...lu, deaf: response.selfDeaf })));
  });
  
  const loading = guilds.loading || guildData.loading || joining || disconnecting || muting || deafening;
  
  return (
    <>
      <PanelScroll>
        <Select fullWidth
                size="small"
                value={guild ?? ""}
                onChange={ev => setSelectedGuild(ev.target.value)}
                renderValue={id => sortedGuilds.find(g => g.id === id)?.name}>
          {sortedGuilds.map(guild => (
            <MenuItem key={guild.id} value={guild.id}>
              <ListItemText primary={guild.name} secondary={`${guild.membersOnline}/${guild.members} online`} />
            </MenuItem>
          ))}
        </Select>
        {guildData.data && <Channels channels={guildData.data.channels} members={guildData.data.members} onJoin={onJoin} />}
      </PanelScroll>
      <LoadingOverlay active={loading} />
      <PanelButtons>
        {guildData.data && <Button title="Disconnect" onClick={onDisconnect}><PowerSettingsNewIcon /></Button>}
        {guildData.data && (
          <Button title={guildData.data.selfMute ? "Unmute" : "Mute"} onClick={onMute}>
            {guildData.data.selfMute ? <MicOffIcon /> : <MicIcon />}
          </Button>
        )}
        {guildData.data && (
          <Button title={guildData.data.selfDeaf ? "Undeafen" : "Deafen"} onClick={onDeaf}>
            {guildData.data.selfDeaf ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </Button>
        )}
        <Button title="Refresh" onClick={guildData.refresh}><RefreshIcon /></Button>
      </PanelButtons>
    </>
  );
}

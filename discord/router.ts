import express from "express";
import { ChannelType, Guild, GuildBasedChannel, GuildMember, NonThreadGuildBasedChannel } from "discord.js";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import HTTPError from "../web/server/helpers/HTTPError";
import { DiscordChannel, DiscordDeafResponse, DiscordGuild, DiscordGuildResponse, DiscordMember, DiscordMuteResponse } from "../types/api";
import type DiscordModule from "./index";

const MEMBERS_FETCH_TIMEOUT = 5000; // Only voice channel members matter, and those come with the guild anyway

const guildMap = (guild: Guild): DiscordGuild => ({
  id: guild.id,
  name: guild.name,
  members: guild.memberCount,
  membersOnline: guild.presences.cache.filter(presence => presence.status !== "offline").size,
});

const channelSort = (a: GuildBasedChannel, b: GuildBasedChannel) => {
  const aCategory = a.type === ChannelType.GuildCategory ? 1 : 0;
  const bCategory = b.type === ChannelType.GuildCategory ? 1 : 0;
  if(aCategory !== bCategory) return aCategory - bCategory;
  
  const aPosition = "position" in a ? a.position : 0;
  const bPosition = "position" in b ? b.position : 0;
  return aPosition - bPosition;
};

const channelMap = (channel: GuildBasedChannel): DiscordChannel => {
  switch(channel.type) {
    case ChannelType.GuildText: return { id: channel.id, name: channel.name, type: "text" };
    case ChannelType.GuildVoice: return { id: channel.id, name: channel.name, type: "voice" };
    case ChannelType.GuildCategory: return {
      id: channel.id,
      name: channel.name,
      type: "category",
      children: [...channel.children.cache.values()].sort(channelSort).map(channelMap),
    };
    default: return { id: channel.id, name: channel.name, type: "other" };
  }
};

const memberMap = (member: GuildMember): DiscordMember => ({
  id: member.id,
  name: member.displayName,
  avatar: member.displayAvatarURL({ size: 32 }),
  deaf: member.voice.deaf ?? false,
  mute: member.voice.mute ?? false,
  voiceChannel: member.voice.channelId ?? undefined,
});

export default function discordRouter(discordModule: DiscordModule) {
  const router = express.Router();
  const membersFetched = new Set<string>(); // GuildMembers intent keeps the cache up to date afterwards
  
  const getClient = () => {
    const client = discordModule.client;
    if(!client?.isReady()) throw new HTTPError(503, "Discord is not connected.");
    return client;
  };
  
  const getGuild = (id: string) => {
    const guild = getClient().guilds.cache.get(id);
    if(!guild) throw new HTTPError(404, "Guild not found.");
    return guild;
  };
  
  const getSelfState = (guild: Guild) => {
    const connection = getVoiceConnection(guild.id);
    return {
      selfMute: connection?.joinConfig.selfMute ?? guild.members.me?.voice.selfMute ?? false,
      selfDeaf: connection?.joinConfig.selfDeaf ?? guild.members.me?.voice.selfDeaf ?? false,
    };
  };
  
  router.get<{ id: string; channel: string }, Empty>("/guilds/:id/:channel/join", async (req, res) => {
    const guild = getGuild(req.params.id);
    const channel = guild.channels.cache.get(req.params.channel);
    if(!channel?.isVoiceBased()) throw new HTTPError(404, "Voice channel not found.");
    
    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });
    
    res.json({});
  });
  
  router.get<{ id: string }, Empty>("/guilds/:id/disconnect", async (req, res) => {
    const guild = getGuild(req.params.id);
    getVoiceConnection(guild.id)?.destroy();
    
    res.json({});
  });
  
  router.get<{ id: string }, DiscordMuteResponse>("/guilds/:id/mute", async (req, res) => {
    const guild = getGuild(req.params.id);
    const connection = getVoiceConnection(guild.id);
    if(connection) {
      const { channelId, selfDeaf, selfMute } = connection.joinConfig;
      connection.rejoin({ channelId, selfDeaf, selfMute: !selfMute });
    }
    
    res.json({ selfMute: getSelfState(guild).selfMute });
  });
  
  router.get<{ id: string }, DiscordDeafResponse>("/guilds/:id/deaf", async (req, res) => {
    const guild = getGuild(req.params.id);
    const connection = getVoiceConnection(guild.id);
    if(connection) {
      const { channelId, selfDeaf, selfMute } = connection.joinConfig;
      connection.rejoin({ channelId, selfDeaf: !selfDeaf, selfMute });
    }
    
    res.json({ selfDeaf: getSelfState(guild).selfDeaf });
  });
  
  router.get<{ id: string }, DiscordGuildResponse>("/guilds/:id", async (req, res) => {
    const client = getClient();
    const guild = getGuild(req.params.id);
    
    const channels = await guild.channels.fetch();
    if(!membersFetched.has(guild.id)) {
      try {
        await guild.members.fetch({ time: MEMBERS_FETCH_TIMEOUT });
        membersFetched.add(guild.id);
      } catch(e) {
        discordModule.moduleClass.error("Failed to fetch members, using cache:", e);
      }
    }
    const members = guild.members.cache;
    
    res.json({
      channels: [...channels.values()].filter((channel): channel is NonThreadGuildBasedChannel => !!channel && !channel.parent).sort(channelSort).map(channelMap),
      members: [...members.values()].map(memberMap),
      localUser: client.user.id,
      ...getSelfState(guild),
    });
  });
  
  router.get<never, DiscordGuild[]>("/guilds", async (req, res) => {
    res.json([...getClient().guilds.cache.values()].map(guildMap));
  });
  
  return router;
}

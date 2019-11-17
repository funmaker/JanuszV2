import PromiseRouter from "express-promise-router";

const guildMap = guild => ({
  id: guild.id,
  name: guild.name,
  members: guild.memberCount,
  membersOnline: guild.members.reduce((acc, member) => member.presence.status !== "offline" ? acc + 1 : acc, 0),
});

const channelMap = channel => {
  if(channel.type === "text") {
    return {
      id: channel.id,
      name: channel.name,
      type: "text",
    };
  } else if(channel.type === "voice") {
    return {
      id: channel.id,
      name: channel.name,
      type: "voice",
    };
  } else if(channel.type === "category") {
    return {
      id: channel.id,
      name: channel.name,
      type: "category",
      children: channel.children ? channel.children.sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(channelMap) : [],
    };
  }
};

const memberMap = member => ({
  id: member.id,
  name: member.displayName,
  avatar: member.user.displayAvatarURL,
  deaf: member.deaf,
  mute: member.mute,
  voiceChannel: member.voiceChannel ? member.voiceChannel.id : undefined,
});

export default function discordRouter(discordModule) {
  const router = PromiseRouter();
  
  router.get("/guilds/:id/:channel/join", async (req, res) => {
    const data = {};
    
    const guild = discordModule.client.guilds.get(req.params.id);
    const channel = guild.channels.get(req.params.channel);
    await channel.join();
    
    res.json(data);
  });
  
  router.get("/guilds/:id/disconnect", async (req, res) => {
    const data = {};
    
    const guild = discordModule.client.guilds.get(req.params.id);
    if(guild.voiceConnection) {
      guild.voiceConnection.disconnect();
    }
    
    res.json(data);
  });
  
  router.get("/guilds/:id/mute", async (req, res) => {
    const data = {};
    
    const guild = discordModule.client.guilds.get(req.params.id);
    if(guild.voiceConnection) {
      data.selfMute = !guild.me.selfMute;
      await guild.voiceConnection.sendVoiceStateUpdate({ self_mute: !guild.me.selfMute, self_deaf: guild.me.selfDeaf });
    } else {
      data.selfMute = guild.me.selfMute;
    }
    
    res.json(data);
  });
  
  router.get("/guilds/:id/deaf", async (req, res) => {
    const data = {};
    
    const guild = discordModule.client.guilds.get(req.params.id);
    if(guild.voiceConnection) {
      data.selfDeaf = !guild.me.selfDeaf;
      await guild.voiceConnection.sendVoiceStateUpdate({ self_deaf: !guild.me.selfDeaf, self_mute: guild.me.selfMute });
    } else {
      data.selfDeaf = guild.me.selfDeaf;
    }
    
    res.json(data);
  });
  
  router.get("/guilds/:id", async (req, res) => {
    const data = {};
    
    const guild = discordModule.client.guilds.get(req.params.id);
    
    data.channels = guild.channels.filter(channel => !channel.parent).sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(channelMap);
    data.members = guild.members.map(memberMap);
    data.localUser = guild.me.id;
    data.selfMute = guild.me.selfMute;
    data.selfDeaf = guild.me.selfDeaf;
    
    res.json(data);
  });
  
  router.get("/guilds", async (req, res) => {
    const data = discordModule.client.guilds.map(guildMap);
    
    res.json(data);
  });
  
  return router;
}

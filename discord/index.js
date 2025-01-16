import Discord, { Intents, MessageFlags } from 'discord.js';
import chalk from "chalk";
import JanuszModule from "../core/JanuszModule";
import { janusz } from "../index";
import discordRouter from "./router";
import DiscordAudioOutput from "./DiscordAudioOutput";
import DiscordAudioInput from "./DiscordAudioInput";

export default class DiscordModule extends JanuszModule {
  static ModuleName = chalk.blue.bold("Discord");
  OutputDevice = DiscordAudioOutput(this);
  InputDevice = DiscordAudioInput(this);
  
  constructor(reloadedModule) {
    super();
    if(reloadedModule) {
      this.client = reloadedModule.client;
      this.client.off('message', reloadedModule.handleMessage);
      this.client.off('guildMemberAdd', reloadedModule.handleGuildMemberAdd);
      this.client.off('error', reloadedModule.handleError);
      this.client.off('ready', reloadedModule.handleReady);
      this.client.off('interactionCreate', reloadedModule.handleInteraction);
      reloadedModule.client = null;
    }
  }
  
  async init() {
    if(!this.client) this.client = new Discord.Client({
      intents: [Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_PRESENCES],
      partials: ['MESSAGE', 'CHANNEL'],
    });
    
    this.client.on('message', this.handleMessage);
    this.client.on('guildMemberAdd', this.handleGuildMemberAdd);
    this.client.on('error', this.handleError);
    this.client.on('ready', this.handleReady);
    this.client.on('interactionCreate', this.handleInteraction);
    
    if(this.client.isReady()) await this.handleReady();
  }
  
  async start() {
    if(!this.client.uptime) {
      await this.client.login(janusz.getConfig("discord").token);
    }
  }
  
  async stop() {
    if(this.client) await this.client.destroy();
  }
  
  getRouter() {
    return discordRouter(this);
  }
  
  getAudioDevices() {
    return [this.OutputDevice, this.InputDevice];
  }
  
  handleMessage = async message => {
    if(message.channel.id === "615660388905648303") {
      const types = [
        "ISTJ",
        "ISFJ",
        "INFJ",
        "INTJ",
        "ISTP",
        "ISFP",
        "INFP",
        "INTP",
        "ESTP",
        "ESFP",
        "ENFP",
        "ENTP",
        "ESTJ",
        "ESFJ",
        "ENFJ",
        "ENTJ",
      ];
      const msg = message.content.trim().toUpperCase();
      const type = types.find(type => msg.includes(type));
      
      if(types.includes(type)) {
        await message.member.removeRoles(message.guild.roles.filter(role => types.includes(role.name)));
        await message.member.addRole(message.guild.roles.find(role => role.name === type));
        await message.channel.send(`${message.member} dobra masz i wyperdalaj.`);
      }
    }
  };
  
  handleGuildMemberAdd = async member => {
    if(member.guild.id === "234365566608080896") {
      await new Promise(res => setTimeout(res, 10000));
      
      member.guild.channels.cache.get("615660388905648303").send(`
        ${member}, witaj na serwerze XD!
        Udaj się do kanału ${member.guild.channels.cache.get("722013401001492550")} aby dodać sobie role i uzyskać dostęp do powiązanych kanałów.
      `);
    } else if(member.guild.id === "673947535529738252") {
      await new Promise(res => setTimeout(res, 10000));
      
      member.guild.channels.cache.get("673956852345864202").send(`${member}, witaj na serwerze LGBT Polska!`);
    }
  };
  
  handleError = error => DiscordModule.error(error);
}

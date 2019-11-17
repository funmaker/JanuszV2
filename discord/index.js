import Discord from 'discord.js';
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
      reloadedModule.client = null;
    }
  }
  
  async init() {
    if(!this.client) this.client = new Discord.Client();
    
    this.client.on('message', this.handleMessage);
    this.client.on('guildMemberAdd', this.handleGuildMemberAdd);
    this.client.on('error', this.handleError);
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
      
      member.guild.channels.get("615660388905648303").send(`${member}, witaj na serwerze MBTI Polska!\nNapisz swój typ MBTI na tym kanale aby otrzymać range.`);
    }
  };
  
  handleError = error => DiscordModule.error(error);
}

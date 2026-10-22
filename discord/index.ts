import { Client, Events, GatewayIntentBits, GuildMember, Message, Partials } from 'discord.js';
import { getVoiceConnections } from "@discordjs/voice";
import chalk from "chalk";
import JanuszModule from "../core/JanuszModule";
import { janusz } from "../core/janusz";
import type Dropdown from "../audio/Interface/Dropdown";
import discordRouter from "./router";
import DiscordAudioOutput from "./DiscordAudioOutput";
import DiscordAudioInput from "./DiscordAudioInput";

const MBTI_CHANNEL = "615660388905648303";
const MBTI_TYPES = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];

export default class DiscordModule extends JanuszModule {
  static moduleName = chalk.blue.bold("Discord");
  client: Client | null = null;
  outputDeviceType = DiscordAudioOutput(this);
  inputDeviceType = DiscordAudioInput(this);
  
  constructor(reloadedModule?: DiscordModule) {
    super();
    if(reloadedModule?.client) {
      this.client = reloadedModule.client;
      this.client.off(Events.MessageCreate, reloadedModule.handleMessage);
      this.client.off(Events.GuildMemberAdd, reloadedModule.handleGuildMemberAdd);
      this.client.off(Events.Error, reloadedModule.handleError);
      reloadedModule.client = null;
    }
  }
  
  async init() {
    if(!this.client) {
      this.client = new Client({
        intents: [
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.MessageContent,
        ],
        partials: [Partials.Message, Partials.Channel],
      });
    }
    
    this.client.on(Events.MessageCreate, this.handleMessage);
    this.client.on(Events.GuildMemberAdd, this.handleGuildMemberAdd);
    this.client.on(Events.Error, this.handleError);
  }
  
  async start() {
    const config = janusz.getConfig("discord");
    if(!config) return void DiscordModule.error("No discord config, skipping...");
    
    if(this.client && !this.client.isReady()) {
      await this.client.login(config.token);
      DiscordModule.log(`Logged in as ${chalk.bold(this.client.user?.tag)}`);
    }
  }
  
  async stop() {
    if(this.client) {
      getVoiceConnections().forEach(connection => connection.destroy());
      await this.client.destroy();
    }
  }
  
  getRouter() {
    return discordRouter(this);
  }
  
  getAudioDevices() {
    return [this.outputDeviceType, this.inputDeviceType];
  }
  
  getGuildOptions() {
    if(!this.client) return [];
    return this.client.guilds.cache.map(guild => ({ text: guild.name, value: guild.id }));
  }
  
  updateGuildOptions(dropdown: Dropdown) {
    if(!this.client?.isReady()) return; // Before login the cache is empty, which would reset the saved selection
    
    const options = this.getGuildOptions();
    if(JSON.stringify(options) !== JSON.stringify(dropdown.options)) dropdown.options = options;
  }
  
  handleMessage = (message: Message) => {
    this.onMessage(message).catch(this.handleError);
  };
  
  handleGuildMemberAdd = (member: GuildMember) => {
    this.onGuildMemberAdd(member).catch(this.handleError);
  };
  
  async onMessage(message: Message) {
    if(message.channel.id === MBTI_CHANNEL && message.guild && message.member) {
      const msg = message.content.trim().toUpperCase();
      const type = MBTI_TYPES.find(type => msg.includes(type));
      const role = type && message.guild.roles.cache.find(role => role.name === type);
      
      if(role) {
        await message.member.roles.remove(message.guild.roles.cache.filter(role => MBTI_TYPES.includes(role.name)));
        await message.member.roles.add(role);
        if(message.channel.isSendable()) await message.channel.send(`${message.member.toString()} dobra masz i wyperdalaj.`);
      }
    }
  }
  
  async onGuildMemberAdd(member: GuildMember) {
    if(member.guild.id === "234365566608080896") {
      await new Promise(res => setTimeout(res, 10000));
      
      const channel = member.guild.channels.cache.get("615660388905648303");
      if(channel?.isSendable()) {
        await channel.send(`
          ${member.toString()}, witaj na serwerze XD!
          Udaj się do kanału ${member.guild.channels.cache.get("722013401001492550")?.toString()} aby dodać sobie role i uzyskać dostęp do powiązanych kanałów.
        `);
      }
    } else if(member.guild.id === "673947535529738252") {
      await new Promise(res => setTimeout(res, 10000));
      
      const channel = member.guild.channels.cache.get("673956852345864202");
      if(channel?.isSendable()) await channel.send(`${member.toString()}, witaj na serwerze LGBT Polska!`);
    }
  }
  
  handleError = (error: Error) => DiscordModule.error(error);
}

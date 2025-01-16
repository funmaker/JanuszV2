import { getVoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { OpusEncoder } from "@discordjs/opus";
import { mixDown, StereoToMonoStream } from "../audio/utils";
import AudioDevice from "../audio/AudioDevice";
import Dropdown from "../audio/Interface/Dropdown";
import Indicator from "../audio/Interface/Indicator";

export default discordModule => class DiscordAudioInput extends AudioDevice {
  static deviceName = "Discord Input";
  static deviceNameGroup = "Discord";
  
  connection = null;
  streams = new Map();
  decoder = new OpusEncoder(48000, 2);
  guildSelect = this.interface.add(new Dropdown("guildSelect", 0, 0.33, { options: this.getOptions(), size: 8, selection: true, defaultText: "Select Guild" }));
  indicator = this.interface.add(new Indicator("indicator", 3.5, 1.66, { color: "disabled" }));
  
  constructor(state) {
    super(0, 1, state);
    this.interface.width = 8;
  }
  
  onRemove() {
    this.reset();
  }
  
  reset = () => {
    if(this.connection) {
      this.connection = null;
    }
    
    this.streams.forEach(stream => stream.destroy());
    this.indicator.color = "disabled";
  }
  
  addStream = user => {
    if(this.streams.has(user)) return;
    
    const stream = this.connection.receiver.subscribe(user);
    const mono = new StereoToMonoStream();
    this.streams.set(user, mono);
    stream.on("data", packet => mono.write(this.decoder.decode(packet)));
    stream.on("end", () => this.streams.delete(user));
    stream.on("close", () => this.streams.delete(user));
  };
  
  getOptions() {
    if(!discordModule.client) return [];
    return discordModule.client.guilds.cache.map(guild => ({ text: guild.name, value: guild.id }));
  }
  
  onTick() {
    if(this.connection?.state?.status === VoiceConnectionStatus.Destroyed || this.connection?.joinConfig.guildId !== this.guildSelect.value) this.reset();
    
    if(!this.connection) {
      const guild = discordModule.client && discordModule.client.guilds.cache.get(this.guildSelect.value);
      if(!guild) return;
      
      const connection = getVoiceConnection(guild.id);
      if(!connection) return;
      
      this.connection = connection;
      this.connection.receiver.speaking.on("start", this.addStream);
    }
    
    if(this.streams.size === 0) {
      this.outputs[0] = null;
      this.indicator.color = "inputOff";
    } else {
      this.indicator.color = "inputOn";
      this.outputs[0] = mixDown(this.outputBuffers[0], [...this.streams.values()]);
    }
  }
};

import { PassThrough } from "stream";
import AudioDevice from "../audio/AudioDevice";
import { BUFFER_SIZE } from "../audio";
import Dropdown from "../audio/Interface/Dropdown";
import Indicator from "../audio/Interface/Indicator";

export default discordModule => class DiscordAudioOutput extends AudioDevice {
  static deviceName = "Discord Output";
  static deviceNameGroup = "Discord";
  
  dispatcher = null;
  dispatcherGuild = null;
  outBuffer = Buffer.alloc(BUFFER_SIZE * 4);
  guildSelect = this.interface.add(new Dropdown("guildSelect", 0, 0.33, { options: this.getOptions(), size: 8, selection: true, defaultText: "Select Guild" }));
  indicator = this.interface.add(new Indicator("indicator", 3.5, 1.66, { color: "disabled" }));
  
  constructor(state) {
    super(1, 0, state);
    this.outBuffer.fill(0);
    this.interface.width = 8;
  }
  
  onRemove() {
    if(this.dispatcher) {
      this.dispatcher.end();
      this.dispatcher = null;
    }
  }
  
  getOptions() {
    if(!discordModule.client) return [];
    return discordModule.client.guilds.map(guild => ({ text: guild.name, value: guild.id }));
  }
  
  onTick() {
    if(this.dispatcher && this.dispatcherGuild !== this.guildSelect.value) {
      this.dispatcher.end();
      return;
    }
    
    if(!this.dispatcher) {
      const guild = discordModule.client && discordModule.client.guilds.get(this.guildSelect.value);
      if(!guild || !guild.voiceConnection || guild.voiceConnection.dispatcher) return;
      
      this.dispatcher = guild.voiceConnection.playConvertedStream(new PassThrough());
      this.dispatcherGuild = this.guildSelect.value;
      this.indicator.color = "outputOn";
      this.dispatcher.on("end", () => {
        this.dispatcher = null;
        this.dispatcherGuild = null;
        this.indicator.color = "gray";
      });
      this.dispatcher.on("error", err => discordModule.constructor.error(err));
      this.dispatcher.on("debug", err => discordModule.constructor.log(err));
    }
    
    const buffer = this.getInput(0);
    
    if(!buffer) {
      if(!this.dispatcher.paused && this.dispatcher.stream.readableLength === 0) {
        this.dispatcher.pause();
        this.indicator.color = "outputOff";
      }
      return;
    }
    
    if(this.dispatcher.paused) {
      this.dispatcher.resume();
      this.indicator.color = "outputOn";
    }
    
    for(let n = 0; n < buffer.length; n += 2) {
      buffer.copy(this.outBuffer, n * 2, n, n + 2);
      buffer.copy(this.outBuffer, n * 2 + 2, n, n + 2);
    }
    
    if(buffer.length < this.outBuffer.length / 2) {
      this.outBuffer.fill(0, buffer.length * 2);
    }
    
    this.dispatcher.stream.write(Buffer.from(this.outBuffer));
  }
};

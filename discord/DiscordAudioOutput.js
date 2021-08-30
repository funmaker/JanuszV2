import { PassThrough } from "stream";
import AudioDevice from "../audio/AudioDevice";
import { BUFFER_SIZE } from "../audio";
import Dropdown from "../audio/Interface/Dropdown";
import Indicator from "../audio/Interface/Indicator";

export default discordModule => class DiscordAudioOutput extends AudioDevice {
  static deviceName = "Discord Output";
  static deviceNameGroup = "Discord";
  
  stream = null;
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
    this.reset();
  }
  
  reset = () => {
    if(this.dispatcher) {
      this.dispatcher.off("close", this.reset);
      this.dispatcher.off("error", this.onDispatcherError);
      this.dispatcher.off("debug", this.onDispatcherDebug);
      this.dispatcher = null;
    }
    
    if(this.stream) {
      this.stream.end();
      this.stream = null;
    }
    
    this.dispatcherGuild = null;
    this.indicator.color = "gray";
  }
  
  onDispatcherError = err => discordModule.constructor.error(err);
  onDispatcherDebug = log => discordModule.constructor.log(log);
  
  getOptions() {
    if(!discordModule.client) return [];
    return discordModule.client.guilds.cache.map(guild => ({ text: guild.name, value: guild.id }));
  }
  
  onTick() {
    if(this.dispatcher && this.dispatcherGuild !== this.guildSelect.value) this.reset();
    
    if(!this.dispatcher) {
      const guild = discordModule.client && discordModule.client.guilds.cache.get(this.guildSelect.value);
      if(!guild || !guild.voice || !guild.voice.connection || guild.voice.connection.dispatcher) return;
      
      this.stream = new PassThrough();
      this.dispatcher = guild.voice.connection.play(this.stream, { type: "converted" });
      this.dispatcher.on("close", this.reset);
      this.dispatcher.on("error", this.onDispatcherError);
      this.dispatcher.on("debug", this.onDispatcherDebug);
      this.dispatcherGuild = this.guildSelect.value;
    }
    
    const buffer = this.getInput(0);
    
    if(!buffer) {
      this.indicator.color = "outputOff";
      return;
    }
    
    this.indicator.color = "outputOn";
    
    for(let n = 0; n < buffer.length; n += 2) {
      buffer.copy(this.outBuffer, n * 2, n, n + 2);
      buffer.copy(this.outBuffer, n * 2 + 2, n, n + 2);
    }
    
    if(buffer.length < this.outBuffer.length / 2) {
      this.outBuffer.fill(0, buffer.length * 2);
    }
    
    this.stream.write(this.outBuffer);
  }
};

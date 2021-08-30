import { mixDown, StereoToMonoStream } from "../audio/utils";
import AudioDevice from "../audio/AudioDevice";
import Dropdown from "../audio/Interface/Dropdown";
import Indicator from "../audio/Interface/Indicator";

export default discordModule => class DiscordAudioInput extends AudioDevice {
  static deviceName = "Discord Input";
  static deviceNameGroup = "Discord";
  
  connection = null;
  connectionGuild = null;
  streams = new Set();
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
      this.connection.off("speaking", this.addStream);
      this.connection.off('disconnect', this.reset);
      this.connection = null;
      this.connectionGuild = null;
    }
    this.streams.forEach(stream => stream.destroy());
    this.indicator.color = "disabled";
  }
  
  addStream = (user, speaking) => {
    if(speaking) {
      const stream = this.connection.receiver.createStream(user, { mode: "pcm" });
      const mono = new StereoToMonoStream();
      stream.pipe(mono);
      this.streams.add(mono);
      stream.on("end", () => this.streams.delete(mono));
      stream.on("close", () => this.streams.delete(mono));
    }
  };
  
  getOptions() {
    if(!discordModule.client) return [];
    return discordModule.client.guilds.cache.map(guild => ({ text: guild.name, value: guild.id }));
  }
  
  onTick() {
    if(this.connection && this.connectionGuild !== this.guildSelect.value) this.reset();
    
    if(!this.connection) {
      const guild = discordModule.client && discordModule.client.guilds.cache.get(this.guildSelect.value);
      if(!guild || !guild.voice || !guild.voice.connection) {
        this.outputs[0] = null;
        this.indicator.color = "disabled";
        return;
      }
      
      this.connection = guild.voice.connection;
      this.connection.on("speaking", this.addStream);
      this.connection.on('disconnect', this.reset);
      this.connectionGuild = this.guildSelect.value;
      this.indicator.color = "inputOff";
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

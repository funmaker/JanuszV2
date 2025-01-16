import { PassThrough } from "stream";
import { createAudioPlayer, createAudioResource, getVoiceConnection, NoSubscriberBehavior, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
import AudioDevice from "../audio/AudioDevice";
import { BUFFER_SIZE } from "../audio";
import Dropdown from "../audio/Interface/Dropdown";
import Indicator from "../audio/Interface/Indicator";

export default discordModule => class DiscordAudioOutput extends AudioDevice {
  static deviceName = "Discord Output";
  static deviceNameGroup = "Discord";
  
  stream = null;
  resource = null;
  connection = null;
  subscription = null;
  outBuffer = Buffer.alloc(BUFFER_SIZE * 4);
  guildSelect = this.interface.add(new Dropdown("guildSelect", 0, 0.33, { options: this.getOptions(), size: 8, selection: true, defaultText: "Select Guild" }));
  indicator = this.interface.add(new Indicator("indicator", 3.5, 1.66, { color: "disabled" }));
  audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
    debug: true,
  });
  
  constructor(state) {
    super(1, 0, state);
    this.outBuffer.fill(0);
    this.interface.width = 8;
  }
  
  onRemove() {
    this.audioPlayer.stop();
    this.reset();
  }
  
  reset = () => {
    if(this.connection) {
      this.connection = null;
    }
    
    if(this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    if(this.stream) {
      this.stream.end();
      this.stream = null;
    }
    
    this.resource = null;
    this.indicator.color = "gray";
  }
  
  getOptions() {
    if(!discordModule.client) return [];
    return discordModule.client.guilds.cache.map(guild => ({ text: guild.name, value: guild.id }));
  }
  
  onTick() {
    if(this.connection?.state?.status === VoiceConnectionStatus.Destroyed || this.connection?.joinConfig.guildId !== this.guildSelect.value) this.reset();
    
    if(!this.connection) {
      const guild = discordModule.client && discordModule.client.guilds.cache.get(this.guildSelect.value);
      if(!guild) return;
      
      const connection = this.connection = getVoiceConnection(guild.id);
      if(!connection) return;
      
      connection.on('stateChange', (old_state, new_state) => {
        if(old_state.status === VoiceConnectionStatus.Ready && new_state.status === VoiceConnectionStatus.Connecting) {
          connection.configureNetworking();
        }
      });
    }
    
    if(!this.subscription) {
      this.subscription = this.connection.subscribe(this.audioPlayer);
      if(!this.subscription) return;
    }
    
    const buffer = this.getInput(0);
    
    if(!buffer) {
      this.indicator.color = "outputOff";
      return;
    }
    
    if(!this.resource || this.resource.ended) {
      if(this.stream) this.stream.end();
      
      this.stream = new PassThrough();
      this.resource = createAudioResource(this.stream, {
        inputType: StreamType.Raw,
      });
      this.audioPlayer.play(this.resource);
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

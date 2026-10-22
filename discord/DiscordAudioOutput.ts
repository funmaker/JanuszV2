import { PassThrough } from "stream";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  NoSubscriberBehavior,
  PlayerSubscription,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import AudioDevice from "../audio/AudioDevice";
import { BUFFER_SIZE } from "../audio/constants";
import Dropdown from "../audio/Interface/Dropdown";
import Indicator from "../audio/Interface/Indicator";
import type { DeviceStateData } from "../audio/packets";
import type DiscordModule from "./index";

// Our ticks deliver 100ms of audio at once, while the player consumes 20ms frames, so allow for some jitter.
const MAX_MISSED_FRAMES = 10;

export default (discordModule: DiscordModule) => class DiscordAudioOutput extends AudioDevice {
  static deviceName = "Discord Output";
  static deviceNameGroup = "Discord";
  
  stream: PassThrough | null = null;
  connection: VoiceConnection | null = null;
  subscription: PlayerSubscription | null = null;
  outBuffer = Buffer.alloc(BUFFER_SIZE * 4);
  guildSelect = this.interface.add(new Dropdown("guildSelect", 0, 0.33, { options: discordModule.getGuildOptions(), size: 8, selection: true, defaultText: "Select Guild" }));
  indicator = this.interface.add(new Indicator("indicator", 3.5, 1.66, { color: "disabled" }));
  audioPlayer = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
      maxMissedFrames: MAX_MISSED_FRAMES,
    },
  });
  
  constructor(state?: DeviceStateData) {
    super(1, 0, state);
    this.outBuffer.fill(0);
    this.interface.width = 8;
    this.audioPlayer.on("error", err => discordModule.moduleClass.error("Audio player error:", err));
  }
  
  onRemove() {
    this.audioPlayer.stop(true);
    this.reset();
  }
  
  reset() {
    this.connection = null;
    
    if(this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    
    this.endStream();
    this.indicator.color = "disabled";
  }
  
  endStream() {
    if(this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }
  
  onTick() {
    discordModule.updateGuildOptions(this.guildSelect);
    
    if(this.connection?.state.status === VoiceConnectionStatus.Destroyed || (this.connection && this.connection.joinConfig.guildId !== this.guildSelect.value)) this.reset();
    
    if(!this.connection) {
      if(!this.guildSelect.value) return;
      
      const connection = getVoiceConnection(this.guildSelect.value);
      if(!connection) return;
      
      this.connection = connection;
      this.subscription = connection.subscribe(this.audioPlayer) ?? null;
      if(!this.subscription) return;
    }
    
    const buffer = this.getInput(0);
    
    if(!buffer) {
      this.indicator.color = "outputOff";
      return;
    }
    
    if(!this.stream || this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      this.endStream();
      
      this.stream = new PassThrough();
      this.stream.write(Buffer.alloc(this.outBuffer.length)); // Pre-buffer one tick of silence to absorb timer jitter
      this.audioPlayer.play(createAudioResource(this.stream, {
        inputType: StreamType.Raw,
      }));
    }
    
    this.indicator.color = "outputOn";
    
    // Mono to stereo
    for(let n = 0; n < buffer.length; n += 2) {
      buffer.copy(this.outBuffer, n * 2, n, n + 2);
      buffer.copy(this.outBuffer, n * 2 + 2, n, n + 2);
    }
    
    if(buffer.length < this.outBuffer.length / 2) {
      this.outBuffer.fill(0, buffer.length * 2);
    }
    
    this.stream.write(Buffer.from(this.outBuffer));
  }
};

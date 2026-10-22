import { Readable } from "stream";
import { AudioReceiveStream, EndBehaviorType, getVoiceConnection, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { OpusEncoder } from "@discordjs/opus";
import { mixDown, StereoToMonoStream } from "../audio/utils";
import { SAMPLE_RATE } from "../audio/constants";
import AudioDevice from "../audio/AudioDevice";
import Dropdown from "../audio/Interface/Dropdown";
import Indicator from "../audio/Interface/Indicator";
import type { DeviceStateData } from "../audio/packets";
import type DiscordModule from "./index";

interface UserStream {
  opus: AudioReceiveStream;
  pcm: StereoToMonoStream;
}

export default (discordModule: DiscordModule) => class DiscordAudioInput extends AudioDevice {
  static deviceName = "Discord Input";
  static deviceNameGroup = "Discord";
  
  connection: VoiceConnection | null = null;
  streams = new Map<string, UserStream>();
  guildSelect = this.interface.add(new Dropdown("guildSelect", 0, 0.33, { options: discordModule.getGuildOptions(), size: 8, selection: true, defaultText: "Select Guild" }));
  indicator = this.interface.add(new Indicator("indicator", 3.5, 1.66, { color: "disabled" }));
  
  constructor(state?: DeviceStateData) {
    super(0, 1, state);
    this.interface.width = 8;
  }
  
  onRemove() {
    this.reset();
  }
  
  reset() {
    if(this.connection) {
      this.connection.receiver.speaking.off("start", this.addStream);
      this.connection = null;
    }
    
    this.streams.forEach(stream => stream.opus.destroy());
    this.streams.clear();
    this.indicator.color = "disabled";
  }
  
  addStream = (user: string) => {
    if(this.streams.has(user) || !this.connection) return;
    
    const opus = this.connection.receiver.subscribe(user, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: 500 },
    });
    const decoder = new OpusEncoder(SAMPLE_RATE, 2); // Decoders are stateful, so each user needs their own
    const pcm = new StereoToMonoStream();
    const entry = { opus, pcm };
    this.streams.set(user, entry);
    
    const remove = () => {
      if(this.streams.get(user) === entry) this.streams.delete(user);
      pcm.end();
    };
    
    opus.on("data", (packet: Buffer) => {
      try {
        pcm.write(decoder.decode(packet));
      } catch(e) {
        discordModule.moduleClass.error("Failed to decode opus packet:", e);
      }
    });
    opus.on("end", remove);
    opus.on("close", remove);
    opus.on("error", err => {
      discordModule.moduleClass.error("Audio receive error:", err);
      remove();
    });
  };
  
  onTick() {
    discordModule.updateGuildOptions(this.guildSelect);
    
    if(this.connection?.state.status === VoiceConnectionStatus.Destroyed || (this.connection && this.connection.joinConfig.guildId !== this.guildSelect.value)) this.reset();
    
    if(!this.connection) {
      if(!this.guildSelect.value) return;
      
      const connection = getVoiceConnection(this.guildSelect.value);
      if(!connection) return;
      
      this.connection = connection;
      this.connection.receiver.speaking.on("start", this.addStream);
    }
    
    if(this.streams.size === 0) {
      this.outputs[0] = null;
      this.indicator.color = "inputOff";
    } else {
      this.indicator.color = "inputOn";
      this.outputs[0] = mixDown(this.outputBuffers[0], [...this.streams.values()].map(stream => stream.pcm as Readable));
    }
  }
};

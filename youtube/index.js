import youtubedl from 'youtube-dl';
import ffmpeg from 'fluent-ffmpeg';
import chalk from "chalk";
import JanuszModule from "../core/JanuszModule";
import youtubeRouter from './router';
import YoutubeInput from "./YoutubeInput";

export default class YoutubeModule extends JanuszModule {
  static ModuleName = chalk.red.bold("YouTube");
  router = youtubeRouter(this);
  YoutubeDevice = YoutubeInput(this);
  
  getRouter() {
    return this.router;
  }
  
  getAudioDevices() {
    return [this.YoutubeDevice];
  }
  
  playVideo(url) {
    const video = youtubedl(url, ["-x"]);
    const stream = ffmpeg(video).audioChannels(1)
      .audioFrequency(48000)
      .noVideo()
      .format('s16le')
      .audioCodec('pcm_s16le')
      .on('error', err => YoutubeModule.error(err))
      .pipe()
      .on("error", err => YoutubeModule.error(err));
    
    this.YoutubeDevice.devices.forEach(device => device.playStream(stream));
    
    return new Promise((res, rej) => {
      video.on("info", res);
      video.on("error", rej);
    });
  }
  
  stopVideo() {
    this.YoutubeDevice.devices.forEach(device => device.stopStream());
  }
}

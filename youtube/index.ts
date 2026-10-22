import { execFile, spawn } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import JanuszModule from "../core/JanuszModule";
import { toPCM } from "../audio/ffmpeg";
import { YoutubePlayResponse } from "../types/api";
import HTTPError from "../web/server/helpers/HTTPError";
import youtubeRouter from './router';
import YoutubeInput from "./YoutubeInput";

const YTDLP = process.env.YTDLP_PATH || "yt-dlp";

export default class YoutubeModule extends JanuszModule {
  static moduleName = chalk.red.bold("YouTube");
  deviceType = YoutubeInput(this);
  
  getRouter() {
    return youtubeRouter(this);
  }
  
  getAudioDevices() {
    return [this.deviceType];
  }
  
  async playVideo(url: string): Promise<YoutubePlayResponse> {
    if(this.deviceType.getDevices().length === 0) throw new HTTPError(409, "Add a YouTube device in the audio manager first.");
    
    const { stdout } = await promisify(execFile)(YTDLP, ["--dump-single-json", "--no-playlist", url], { maxBuffer: 64 * 1024 * 1024 });
    const metadata = JSON.parse(stdout);
    
    const download = spawn(YTDLP, ["--format", "bestaudio/best", "--no-playlist", "--quiet", "--output", "-", url], { stdio: ["ignore", "pipe", "inherit"] });
    download.on("error", err => YoutubeModule.error(err));
    
    const stream = toPCM(download.stdout, err => YoutubeModule.error(err));
    
    this.deviceType.getDevices().forEach(device => device.playStream(stream));
    
    return {
      id: metadata.id,
      title: metadata.title,
      url: metadata.webpage_url,
      thumbnail: metadata.thumbnail,
      description: metadata.description,
    };
  }
  
  stopVideo() {
    this.deviceType.getDevices().forEach(device => device.stopStream());
  }
}

import express from "express";
import axios from "axios";
import HTTPError from "../web/server/helpers/HTTPError";
import { SoundEntry, SoundsPlayRequest, SoundsSayRequest, TTSVoice } from "../types/api";
import { TTS_URL } from "./constants";
import type SoundsModule from "./index";
import type { Sound } from "./index";

export default function soundsRouter(soundsModule: SoundsModule) {
  const router = express.Router();
  
  router.get<never, Empty>('/play', async (req, res) => {
    const { sound } = req.query as Partial<SoundsPlayRequest>;
    if(!sound) throw new HTTPError(400, "Missing 'sound' parameter");
    
    soundsModule.playPath(sound);
    
    res.json({});
  });
  
  router.get<never, SoundEntry[]>("/list", async (req, res) => {
    const soundMap = (prefix: string) => (sound: Sound): SoundEntry => {
      if(sound.type === "folder") {
        return {
          type: "folder",
          name: sound.filename,
          path: prefix + sound.filename,
          elements: sound.elements.map(soundMap(prefix + sound.filename + "/")),
        };
      } else {
        return {
          type: "sound",
          name: sound.filename,
          path: prefix + sound.filename,
        };
      }
    };
    
    res.json(soundsModule.sounds.map(soundMap("")));
  });
  
  router.get<never, Empty>('/say', async (req, res) => {
    const { text, voice, lang } = req.query as Partial<SoundsSayRequest>;
    if(!text) throw new HTTPError(400, "Missing 'text' parameter");
    
    await soundsModule.say(text, voice, lang);
    
    res.json({});
  });
  
  router.get<never, TTSVoice[]>('/voices', async (req, res) => {
    const { data } = await axios.get<TTSVoice[]>(`${TTS_URL}/list`);
    
    res.json(data);
  });
  
  router.get<never, Empty>("/stopSounds", async (req, res) => {
    soundsModule.soundsDeviceType.getDevices().forEach(device => device.stopSounds());
    soundsModule.speakingDeviceType.getDevices().forEach(device => device.stopStreams());
    
    res.json({});
  });
  
  return router;
}

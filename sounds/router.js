import PromiseRouter from "express-promise-router";
import * as axios from "axios";
import HTTPError from "../web/server/helpers/HTTPError";

export default function soundsRouter(soundsModule) {
  const router = PromiseRouter();
  
  router.get('/play', async (req, res) => {
    soundsModule.playPath(req.query.sound);
    
    res.json({});
  });
  
  router.get("/list", async (req, res) => {
    const soundMap = path => sound => {
      if(sound.type === "folder") {
        return {
          type: "folder",
          name: sound.filename,
          path: path + sound.filename,
          elements: sound.elements.map(soundMap(path + sound.filename + "/")),
        };
      } else {
        return {
          type: "sound",
          name: sound.filename,
          path: path + sound.filename,
        };
      }
    };
    
    const data = soundsModule.sounds.map(soundMap(""));
    
    res.json(data);
  });
  
  router.get('/say', async (req, res) => {
    const { text, voice, lang } = req.query;
    if(!text) throw new HTTPError(400, "Missing 'text' parameter");
    
    await soundsModule.say(text, voice, lang);
    
    res.json({});
  });
  
  router.get('/voices', async (req, res) => {
    const { data } = await axios.get("http://ivona.funmaker.moe/list");
    
    res.json(data);
  });
  
  router.get("/stopSounds", async (req, res) => {
    soundsModule.SoundsDevice.devices.forEach(device => device.stopSounds());
    soundsModule.SpeakingDevice.devices.forEach(device => device.stopStreams());
    
    res.json({});
  });
  
  return router;
}

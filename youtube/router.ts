import express from "express";
import HTTPError from "../web/server/helpers/HTTPError";
import { YoutubePlayResponse } from "../types/api";
import type YoutubeModule from "./index";

export default function youtubeRouter(youtubeModule: YoutubeModule) {
  const router = express.Router();
  
  router.get<never, YoutubePlayResponse>("/play", async (req, res) => {
    const { url } = req.query as { url?: string };
    if(!url) throw new HTTPError(400, "Missing 'url' parameter");
    
    res.json(await youtubeModule.playVideo(url));
  });
  
  router.get<never, Empty>("/stop", async (req, res) => {
    youtubeModule.stopVideo();
    
    res.json({});
  });
  
  return router;
}

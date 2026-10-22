import type { Readable } from "stream";
import { FFmpeg } from "prism-media";
import { SAMPLE_RATE } from "./constants";

// Decodes anything ffmpeg understands (a file path or a stream) into the audio system's format
export function toPCM(input: string | Readable, onError: (err: Error) => void): Readable {
  const transcoder = new FFmpeg({
    args: [
      "-hide_banner",
      "-loglevel", "error",
      ...typeof input === "string" ? ["-nostdin", "-i", input] : [],
      "-vn",
      "-ac", "1",
      "-ar", String(SAMPLE_RATE),
      "-f", "s16le",
      "-acodec", "pcm_s16le",
    ],
  });
  
  // prism-media doesn't report ffmpeg failures, the output just ends early
  const stderr: string[] = [];
  transcoder.process.stderr?.setEncoding("utf8").on("data", (chunk: string) => stderr.push(chunk));
  transcoder.process.once("close", code => {
    if(code) onError(new Error(`ffmpeg exited with code ${code}: ${stderr.join("").trim()}`));
  });
  transcoder.on("error", (err: NodeJS.ErrnoException) => {
    if(err.code !== "EPIPE") onError(err); // Input still being piped in after ffmpeg was stopped
  });
  
  if(typeof input !== "string") {
    input.once("error", err => {
      onError(err);
      transcoder.destroy();
    });
    input.pipe(transcoder);
  }
  
  return transcoder;
}


/////////////////////////
//       Commons       //
/////////////////////////

export interface ErrorResponse {
  status: number;
  message: string;
  stack?: string;
}

export interface InitialData {
  _error?: ErrorResponse;
  _colorScheme: "light" | "dark";
}


/////////////////////////
//        Pages        //
/////////////////////////

export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  success: boolean;
}


/////////////////////////
//         Web         //
/////////////////////////

export type LogsFormat = "plain" | "html" | "ansi";

export interface LogsRequest {
  format?: LogsFormat;
  start?: number;
  end?: number;
  file?: string;
}

export interface LogsResponse {
  start: number;
  end: number;
  totalSize: number;
  pageSize: number;
  logs: string[];
}

export interface LogsMessage {
  text: string;
  id: number;
}

export interface LogsFile {
  filename: string;
  created: number;
}


/////////////////////////
//       Discord       //
/////////////////////////

export interface DiscordGuild {
  id: string;
  name: string;
  members: number;
  membersOnline: number;
}

export type DiscordChannel = {
  id: string;
  name: string;
  type: "text" | "voice" | "other";
} | {
  id: string;
  name: string;
  type: "category";
  children: DiscordChannel[];
};

export interface DiscordMember {
  id: string;
  name: string;
  avatar: string | null;
  deaf: boolean;
  mute: boolean;
  voiceChannel?: string;
}

export interface DiscordGuildResponse {
  channels: DiscordChannel[];
  members: DiscordMember[];
  localUser: string;
  selfMute: boolean;
  selfDeaf: boolean;
}

export interface DiscordMuteResponse {
  selfMute: boolean;
}

export interface DiscordDeafResponse {
  selfDeaf: boolean;
}


/////////////////////////
//       Sounds        //
/////////////////////////

export type SoundEntry = {
  type: "sound";
  name: string;
  path: string;
} | {
  type: "folder";
  name: string;
  path: string;
  elements: SoundEntry[];
};

export interface SoundsPlayRequest {
  sound: string;
}

export interface SoundsSayRequest {
  text: string;
  voice?: string;
  lang?: string;
}

export interface TTSVoice {
  name: string;
  provider: string;
  language: string;
  samples?: string[];
}


/////////////////////////
//       YouTube       //
/////////////////////////

export interface YoutubePlayResponse {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  description: string;
}

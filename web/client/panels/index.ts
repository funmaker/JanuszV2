import type React from "react";
import * as AudioClient from './audio/AudioPanel';
import * as SoundsClient from './sounds/SoundsPanel';
import * as TTSClient from './tts/TTSPanel';
import * as DiscordClient from './discord/DiscordPanel';
import * as LogsClient from './logs/LogsPanel';

export interface ClientModule {
  name: string;
  Panel: React.ComponentType; // eslint-disable-line @typescript-eslint/naming-convention
}

export const clientModules: ClientModule[] = [
  SoundsClient,
  DiscordClient,
  AudioClient,
  LogsClient,
  TTSClient,
];

export const findClientModule = (name: string) => clientModules.find(mod => mod.name === name);

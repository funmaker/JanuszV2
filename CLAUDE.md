# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Janusz V2 is a multi-purpose chat bot (Discord, Mumble, TTS, soundboard, basic YouTube) with a web control panel and a node-based audio routing system that you edit in the browser. It's one TypeScript Node process bundled with webpack, and the server and the server-side-rendered React client share one codebase. Tooling and conventions follow [webapp-boilerplate](https://github.com/funmaker/webapp-boilerplate): webpack configs, ESLint config, MUI with `styled`, wouter, Express 5, the React Compiler, and function components only. The difference from the boilerplate is that the web server is a module here, not the core.

## Commands

- `npm run start`: dev mode. Webpack builds `server.ts` into `build/` in watch mode and starts it with HMR. The client is served by webpack-dev/hot-middleware inside the web module.
- `npm run build:prod` then `npm run start:prod`: production build into `dist/` (server, client, `static/`, `sounds/` (copied from `sounds/sounds`), generated `package.json`/`configs.json`), run from `dist/`.
- `npm run typecheck` (`tsc --noEmit`) and `npm run lint` / `npm run lint-fix` (ESLint 9 flat config in `eslint.config.ts`, `--max-warnings 0`).
- There is no test suite.

Dev builds run the React Compiler with `panicThreshold: "all_errors"`, so code it can't compile breaks the dev build while the prod build still succeeds. Known unsupported syntax: `||`/`?:`/`?.` inside `try` blocks, and `??=`. Move such code into plain functions outside components. Effects should follow `react-hooks` v7 rules: use `useEffectEvent` for listeners, and only set state from async callbacks or events.

Requires Node 22.12+ (because of `@discordjs/voice`; it currently also starts on Node 20), plus `ffmpeg` and `yt-dlp` on `PATH`.

## Configuration and state

Paths are relative to the working directory: the repo root in dev, `dist/` in prod.

- `configs.json` (gitignored; template in `configs.template.json`, path override with `CONFIGS_PATH`) holds per-module settings, typed by `Configs` in `core/index.ts`. Read it with `janusz.getConfig(name)`.
- `states.json` (path override with `STATES_PATH`) holds persistent runtime state, e.g. the audio graph under `audioSystem`. Use `janusz.getState<T>(name)` / `janusz.setState(name, value)`.
- Other env vars: `PORT`/`HOST` override the web config, `SOUNDS_PATH` (default `sounds/sounds` in dev, `sounds` in production), `YTDLP_PATH`.
- Uncaught exceptions write the in-memory log buffer (`core/logger.ts` captures stdout and stderr) to `logs/<timestamp>.log`.

## Architecture

### Modules and core

`server.ts` creates the modules (`web`, `audio`, `sounds`, `discord`, `mumble`, `youtube`) with `require()` and hands them to `JanuszCore` (`core/index.ts`). The core instance lives in `core/janusz.ts`; import it with `import { janusz } from "../core/janusz"`. It sits in a separate file so that reloading the core doesn't cascade into every module. Each module extends `JanuszModule` (`core/JanuszModule.ts`):

- Lifecycle: async `init()` → `start()` → `stop()`, run on all modules in parallel. A module that fails is marked `failed` and the rest keep running. `onReloadOther()` runs when another module is hot-reloaded.
- `static moduleName` is a chalk-colored string. With ANSI stripped and lowercased, it is also the module's URL prefix.
- Optional hooks, collected with `janusz.modules.flatMap(...)`:
  - `getRouter()` returns an Express router, mounted at `/<module>` behind `requireLogin` (JWT `auth` cookie, `web/server/helpers/auth.ts`).
  - `getWebsockets()` returns `{ path: (ws, req) => void }`, served at `/<module><path>` (`"/"` maps to `/<module>`). `WebModule` handles HTTP upgrades with a `ws` `WebSocketServer` and checks auth centrally. express-ws isn't used because it doesn't work with Express 5.
  - `getAudioDevices()` returns `AudioDevice` classes for the audio module. Integrations define these as factories that close over the module (`(discordModule: DiscordModule) => class extends AudioDevice {...}`), stored on the module as `*DeviceType`. To reach live instances, call `Type.getDevices()`.
- Imports between modules and devices must be `import type` wherever a value import would create a cycle (ESLint `import/no-cycle` is an error). Shared constants live in files such as `audio/constants.ts` and `sounds/constants.ts`.

### Hot reload

In dev, HMR swaps modules inside the running process (`import.meta.webpackHot.accept` in `server.ts`). The old instance is stopped, then the new one is constructed as `new Mod(oldInstance)` and runs `init` and `start`. Modules holding long-lived resources (HTTP server and WebSocketServer, Discord client, chokidar watcher, Mumble client) take them over in the constructor and null them on the old instance, so the old `stop()` leaves them alone. Changing `core/` rebuilds every module. Voice connections persist across reloads because `@discordjs/voice` keeps them in module-global state.

### Audio system (`audio/`)

- The format is fixed: 48 kHz mono s16le, with a tick every `BUFFER_SIZE` (4800) samples, i.e. 100 ms. Visual updates go out at 5 Hz.
- `AudioDevice` is the base class: its constructor takes `(inputs, outputs, state?)`, and subclasses override `onTick`/`onCreate`/`onRemove`. `getInput(i)` ticks upstream devices on demand (pull model) and mixes them. Output goes in `this.outputs[i]` (a Buffer, or `null` for silence). Extend `AudioSingletonDevice` for one-per-graph devices.
- Each device has an interface tree (`audio/Interface/*`) mirrored to the client. A node's synced fields are declared with the standard-decorator auto-accessor `@state accessor foo = default` (`audio/utils.ts`; Babel `@babel/plugin-proposal-decorators` 2023-11). Writes go through the `state` proxy and produce diff updates. Inputs with validation (`value`, `options`) use plain getters and setters plus `static defaultValue`.
- Decode anything into that format with `toPCM` (`audio/ffmpeg.ts`), which wraps `prism-media`'s `FFmpeg` stream and reports a non-zero ffmpeg exit with its stderr. Destroy the returned stream to kill ffmpeg.
- The graph is saved to `states.json` and reloaded by `deviceName`, so renaming a device orphans saved instances.
- Client sync uses the `/audio` websocket. `audio/packets.ts` holds the shared, typed protocol (`PacketType` enum, packet interfaces, state shapes). `audio/router.ts` is the server handler, and `sendAll` broadcasts.

### Discord (`discord/`)

discord.js 14 with `@discordjs/voice` 0.19 (DAVE E2EE, `aead_aes256_gcm_rtpsize`, encryption via native crypto). The Output device restarts its `AudioResource` whenever the player goes idle: the player stops itself after `maxMissedFrames` with no input, so a resource is never reused after that. Input devices create one opus decoder per speaking user. Guild member lists are fetched once per guild, with a timeout, because the request is heavily rate-limited.

### Web (`web/`)

- `web/index.ts` is the Express 5 app: static files from `static/`, webpack middleware in dev, `reactMiddleware`, module routers, core pages (`web/server/pages`), and an error handler that serves `res.react(...)` for HTML requests and JSON otherwise.
- The client is under `web/client`. `client.tsx` hydrates `App.tsx` (MUI theme, wouter routes). Panels in `web/client/panels/*` export `name` and `Panel` and are registered in `web/client/panels/index.ts`. The panel layout is a tree (`components/panelsLayout.ts`) saved in `localStorage`, rendered by `Panels` and `SplitPane` with HTML5 drag-and-drop for tabs (payloads go through `helpers/dragData.ts`). Shared hooks: `useRequest` (GET with derived loading), `useWebSocket` (auto-reconnect), `useAsyncCallback`.
- Light/dark mode uses MUI `colorSchemes` (`web/client/theme.ts`). The choice goes in the `mui-mode` cookie (`hooks/colorSchemeManager.ts`), and `reactMiddleware` passes it as `initialData._colorScheme` so SSR renders the right scheme. Take colors from `theme.palette` rather than hardcoding them. Custom tokens: extra `background.*` keys (panels, tabs, board), and `palette.audio` (device and cable colors). `secondary` (`#1b94d1`) is the accent: inputs default to `color="secondary"` and hover in it, because primary is nearly white in dark mode. The toggle sits next to logout in `ExtraTabs` (`components/Modules.tsx`).
- API response types are in `types/api.d.ts`. `DeepPartial` and other globals are in `types/globals.d.ts`.

### Not ported

`discord/negromancy.js` (untracked) and its hookup in `discord/negromancy.patch` were intentionally not ported or wired up. They are excluded from ESLint.

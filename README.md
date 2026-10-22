> ⚠️ AI Slop warning ⚠️
> AI was used for some ports of this

# Janusz V2

Multifunctional chat bot.

![Architecture Diagram](/github-data/Diagram2.png?raw=true)

## Features

- Discord support
- Mumble support
- Interactive web panel
- Node-based GUI audio system
- Text to speach
- Sound board support
- Basic YouTube support
- Modular architecture
- Hot-Reload everything!

## Requirements

- Node.js 22.12+ (required by `@discordjs/voice`)
- `ffmpeg` and `yt-dlp` on `PATH` (set `YTDLP_PATH` to override)
- `configs.json` based on `configs.template.json`

## Usage

### Run development

```bash
npm run start
```

### Build production

```bash
npm run build:prod
```

### Lint & typecheck

```bash
npm run lint
npm run typecheck
```

### Start production

```bash
npm run start:prod
```

## Credits

- Fun Maker
- Nasca Octavian Paul (Paul Stretch algorithm)
- Sébastien Piquemal (paulstretch.js)
- Olli Parviainen, Ryan Berdeen (soundtouch.js)

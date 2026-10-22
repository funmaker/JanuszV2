import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Button, MenuItem, MenuList, Paper, Popover, styled, TextField } from "@mui/material";
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ListAltIcon from '@mui/icons-material/ListAlt';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { SoundsSayRequest, TTSVoice } from "../../../../types/api";
import requestJSON from "../../helpers/requestJSON";
import useRequest from "../../hooks/useRequest";
import useAsyncCallback from "../../hooks/useAsyncCallback";
import LoadingOverlay from "../../components/LoadingOverlay";
import PanelButtons from "../../components/PanelButtons";

export const name = "TTS";

const MAX_SUGGESTIONS = 10;

interface VoiceOption {
  value: string;
  label: string;
}

const AUTO_VOICE: VoiceOption = { value: "AUTO", label: "Detect Language" };

// Voices with samples expect every line to start with a space
function padLines(text: string, caret: number) {
  let newCaret = caret;
  let offset = 0;
  
  const lines = text.split("\n").map(line => {
    const lineStart = offset;
    offset += line.length + 1;
    if(line.startsWith(" ")) return line;
    if(lineStart <= caret) newCaret++;
    return ` ${line}`;
  });
  
  return { text: lines.join("\n"), caret: newCaret };
}

function getToken(text: string, caret: number) {
  const start = Math.max(text.lastIndexOf(" ", caret - 1), text.lastIndexOf("\n", caret - 1)) + 1;
  return { start, token: text.slice(start, caret) };
}

export function Panel() {
  const { data: voices, loading } = useRequest<TTSVoice[]>("/sounds/voices");
  const [selectedVoice, setSelectedVoice] = useState(AUTO_VOICE.value);
  const [text, setText] = useState("");
  const [caret, setCaret] = useState(0);
  const [highlighted, setHighlighted] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [samplesAnchor, setSamplesAnchor] = useState<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCaret = useRef<number | null>(null);
  
  const voice = voices?.find(voice => voice.name === selectedVoice);
  const samples = voice?.samples;
  
  const voiceOptions = useMemo(() => [
    AUTO_VOICE,
    ...(voices ?? []).map(voice => ({
      value: voice.name,
      label: `[${voice.provider}] (${voice.language}) ${voice.name}`,
    })).sort((a, b) => a.label.localeCompare(b.label)),
  ], [voices]);
  
  const { start: tokenStart, token } = getToken(text, caret);
  const suggestions = samples && token.length > 0 && !dismissed
    ? samples.filter(sample => sample.startsWith(token.toLowerCase())).slice(0, MAX_SUGGESTIONS)
    : [];
  
  useLayoutEffect(() => {
    if(pendingCaret.current !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [text]);
  
  const updateText = (newText: string, newCaret: number) => {
    if(samples) ({ text: newText, caret: newCaret } = padLines(newText, newCaret));
    
    pendingCaret.current = newCaret;
    setText(newText);
    setCaret(newCaret);
    setHighlighted(0);
    setDismissed(false);
  };
  
  const acceptSuggestion = (sample: string) => {
    updateText(text.slice(0, tokenStart) + sample + text.slice(caret), tokenStart + sample.length);
    textareaRef.current?.focus();
  };
  
  const onKeyDown = (ev: React.KeyboardEvent) => {
    if(suggestions.length === 0) return;
    
    if(ev.key === "ArrowDown") setHighlighted((highlighted + 1) % suggestions.length);
    else if(ev.key === "ArrowUp") setHighlighted((highlighted + suggestions.length - 1) % suggestions.length);
    else if(ev.key === "Enter" || ev.key === "Tab") acceptSuggestion(suggestions[Math.min(highlighted, suggestions.length - 1)]);
    else if(ev.key === "Escape") setDismissed(true);
    else return;
    
    ev.preventDefault();
  };
  
  const stopSounds = () => void requestJSON({ url: "/sounds/stopSounds" }).catch(console.error);
  
  const [speak, speaking] = useAsyncCallback(async () => {
    await requestJSON<void, never>({
      url: "/sounds/say",
      search: {
        text,
        voice: selectedVoice === AUTO_VOICE.value ? undefined : selectedVoice,
      } satisfies SoundsSayRequest,
    });
  });
  
  return (
    <StyledTTSPanel>
      <textarea ref={textareaRef}
                value={text}
                spellCheck={false}
                onChange={ev => updateText(ev.target.value, ev.target.selectionStart)}
                onSelect={ev => setCaret(ev.currentTarget.selectionStart)}
                onKeyDown={onKeyDown}
                onBlur={() => setDismissed(true)} />
      {suggestions.length > 0 && (
        <Paper className="suggestions" elevation={4}>
          <MenuList dense>
            {suggestions.map((sample, id) => (
              <MenuItem key={sample}
                        selected={id === highlighted}
                        onMouseDown={ev => { ev.preventDefault(); acceptSuggestion(sample); }}>
                {sample}
              </MenuItem>
            ))}
          </MenuList>
        </Paper>
      )}
      <LoadingOverlay active={loading} />
      <PanelButtons className="buttons">
        <Button title="Stop sounds" onClick={stopSounds}><NotificationsOffIcon /></Button>
        <Autocomplete className="voiceSelect"
                      size="small"
                      disableClearable
                      options={voiceOptions}
                      value={voiceOptions.find(option => option.value === selectedVoice) ?? AUTO_VOICE}
                      isOptionEqualToValue={(option, value) => option.value === value.value}
                      onChange={(ev, option) => setSelectedVoice(option.value)}
                      slotProps={{ popper: { placement: "top-start" } }}
                      renderInput={params => <TextField {...params} variant="standard" slotProps={{ input: { ...params.InputProps, disableUnderline: true } }} />} />
        <Button title="Samples" disabled={!samples} onClick={ev => setSamplesAnchor(ev.currentTarget)}><ListAltIcon /></Button>
        <Button title="Speak" loading={speaking} onClick={speak}><VolumeUpIcon /></Button>
      </PanelButtons>
      <Popover open={!!samplesAnchor && !!samples}
               anchorEl={samplesAnchor}
               onClose={() => setSamplesAnchor(null)}
               anchorOrigin={{ vertical: "top", horizontal: "center" }}
               transformOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <StyledSamples>
          {samples?.map(sample => <li key={sample}>{sample}</li>)}
        </StyledSamples>
      </Popover>
    </StyledTTSPanel>
  );
}

const StyledTTSPanel = styled("div")`
  position: absolute;
  inset: 0;
  
  textarea {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100% - 2.5em);
    padding: 0.5em;
    resize: none;
    border: none;
    outline: none;
    font: inherit;
    color: inherit;
    background: none;
  }
  
  .suggestions {
    position: absolute;
    right: 1em;
    bottom: 3em;
    z-index: 15;
    max-height: calc(100% - 4em);
    overflow-y: auto;
  }
  
  .buttons {
    width: 100%;
    border-radius: 0;
    
    .voiceSelect {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 0.5em;
      background-color: ${props => props.theme.palette.background.panel};
    }
  }
`;

const StyledSamples = styled("ul")`
  max-height: 400px;
  overflow: hidden auto;
  padding: 0.75em 1em 0.75em 2em;
  margin: 0;
`;

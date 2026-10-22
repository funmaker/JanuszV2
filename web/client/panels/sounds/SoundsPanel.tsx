import React, { useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Button, IconButton, InputAdornment, outlinedInputClasses, styled, TextField } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import { SoundEntry } from "../../../../types/api";
import requestJSON from "../../helpers/requestJSON";
import useRequest from "../../hooks/useRequest";
import LoadingOverlay from "../../components/LoadingOverlay";
import PanelButtons from "../../components/PanelButtons";
import Franku from "./Franku";
import useFranku, { trigger } from "./frankuStore";

export const name = "Sounds";

const soundSort = (a: SoundEntry, b: SoundEntry) => (a.type.localeCompare(b.type)) * 10 + (a.name.localeCompare(b.name));

function sortSounds(elements: SoundEntry[]): SoundEntry[] {
  return elements.map(e => e.type === "folder" ? { ...e, elements: sortSounds(e.elements) } : e)
                 .sort(soundSort);
}

function filterSounds(elements: SoundEntry[], filter: string): SoundEntry[] {
  return elements.flatMap(e => {
    if(e.name.toLowerCase().includes(filter)) return [e];
    if(e.type === "folder") {
      const elements = filterSounds(e.elements, filter);
      if(elements.length) return [{ ...e, elements }];
    }
    return [];
  });
}

function findFirstSound(elements: SoundEntry[]): SoundEntry | null {
  for(const element of elements) {
    if(element.type === "sound") return element;
    const inner = findFirstSound(element.elements);
    if(inner) return inner;
  }
  return null;
}

async function playSound(path: string) {
  await requestJSON({ url: "/sounds/play", search: { sound: path } });
  trigger();
}

function Sounds({ elements }: { elements: SoundEntry[] }) {
  const folders = elements.filter(sound => sound.type === "folder");
  const sounds = elements.filter(sound => sound.type === "sound");
  
  return (
    <>
      {folders.map(folder => <Folder folder={folder} key={folder.path} />)}
      {sounds.length > 0
        && (
<div className="soundButtons">
          {sounds.map(sound => (
            <Button key={sound.path} variant="contained" color="inherit" size="small" onClick={() => void playSound(sound.path).catch(console.error)}>
              {sound.name.substring(0, sound.name.lastIndexOf(".")) || sound.name}
            </Button>
          ),
          )}
</div>
        )}
    </>
  );
}

function Folder({ folder }: { folder: SoundEntry & { type: "folder" } }) {
  const onRandom = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    playSound(folder.path + "/*").catch(console.error);
  };
  
  return (
    <Accordion defaultExpanded disableGutters variant="outlined" slotProps={{ transition: { unmountOnExit: true } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <span className="folderName">{folder.name}</span>
        <IconButton size="small" component="span" title="Random sound" onClick={onRandom}><ShuffleIcon fontSize="small" /></IconButton>
      </AccordionSummary>
      <AccordionDetails>
        <Sounds elements={folder.elements} />
      </AccordionDetails>
    </Accordion>
  );
}

export function Panel() {
  const { data, loading, refresh } = useRequest<SoundEntry[]>("/sounds/list");
  const [filter, setFilter] = useState("");
  const [focus, setFocus] = useState(false);
  const { triggered } = useFranku();
  
  const sounds = useMemo(() => sortSounds(data ?? []), [data]);
  const filteredSounds = useMemo(() => filter ? filterSounds(sounds, filter.toLowerCase()) : sounds, [sounds, filter]);
  const firstSound = filter ? findFirstSound(filteredSounds) : null;
  
  const onFilterKey = (ev: React.KeyboardEvent) => {
    if(ev.key === "Enter" && firstSound) void playSound(firstSound.path).catch(console.error);
  };
  
  const onRefresh = () => {
    setFilter("");
    refresh();
  };
  
  const stopSounds = () => void requestJSON({ url: "/sounds/stopSounds" }).catch(console.error);
  
  return (
    <StyledSoundsPanel>
      <TextField className="search"
                 placeholder="Search..."
                 size="small"
                 fullWidth
                 value={filter}
                 onChange={ev => setFilter(ev.target.value)}
                 onKeyDown={onFilterKey}
                 onFocus={() => setFocus(true)}
                 onBlur={() => setFocus(false)}
                 slotProps={{
                   input: {
                     endAdornment: firstSound && focus ? <InputAdornment position="end">[Enter]</InputAdornment> : null,
                   },
                 }} />
      <div className="soundsWrap">
        <Sounds elements={filteredSounds} />
      </div>
      <LoadingOverlay active={loading} />
      <Franku />
      <PanelButtons>
        <Button title="Stop sounds" color={triggered ? "error" : "inherit"} onClick={stopSounds}><NotificationsOffIcon /></Button>
        <Button title="Refresh" onClick={onRefresh}><RefreshIcon /></Button>
        <Button title="Random sound" onClick={() => void playSound("*").catch(console.error)}><ShuffleIcon /></Button>
      </PanelButtons>
    </StyledSoundsPanel>
  );
}

const StyledSoundsPanel = styled("div")`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .search .${outlinedInputClasses.notchedOutline} {
    border-radius: 0;
    border-width: 0 0 1px 0;
  }
  
  .search .${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline} {
    border-width: 0 0 2px 0;
  }
  
  .soundsWrap {
    flex: 1;
    overflow-y: auto;
    padding: 1em 1em 0;
    
    &::after {
      content: "";
      display: block;
      height: 3.5em;
    }
  }
  
  .MuiAccordionSummary-content {
    align-items: center;
    justify-content: space-between;
    margin: 0;
  }
  
  .MuiAccordionDetails-root {
    padding: 0.5em;
  }
  
  .soundButtons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2em;
    padding: 0.2em 0;
    
    .MuiButton-root {
      flex-grow: 1;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-transform: none;
    }
  }
`;

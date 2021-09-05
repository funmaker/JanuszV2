import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import { Button, Dimmer, Dropdown, Loader, Popup } from "semantic-ui-react";
import requestJSON from "../../helpers/requestJSON";

const AUTO_VOICE = { value: "AUTO", text: "Detect Language" };
const Item = ({ entity }) => <div>{entity}</div>;

export function Panel() {
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(AUTO_VOICE.value);
  const [text, setText] = useState("");
  const voice = voices.find(voice => voice.name === selectedVoice) || {};
  const textareaRef = useRef(null);
  const hasSamples = !!voice.samples;
  
  const voiceOptions = useMemo(() => {
    return [
      AUTO_VOICE,
      ...voices.map((voice, id) => ({
        value: voice.name,
        text: `[${voice.provider}] (${voice.language}) ${voice.name}`,
        key: id,
      })).sort((a, b) => a.text.localeCompare(b.text)),
    ];
  }, [voices]);
  
  useEffect(() => {
    let cancel;
    
    (async () => {
      setLoading(true);
      
      const voices = await requestJSON({ pathname: "/sounds/voices", cancelToken: cancelCb => cancel = cancelCb });
      setVoices(voices);
      
      setLoading(false);
    })().catch(console.error);
    
    return () => {
      if(cancel) cancel();
    };
  }, []);
  
  const onVoiceChange = useCallback((ev, { value }) => setSelectedVoice(value), []);
  
  const onTextChange = useCallback(ev => {
    const lines = ev.target.value.split("\n");
    
    if(hasSamples) {
      for(const id in lines) {
        if(!lines[id].startsWith(" ")) lines[id] = ` ${lines[id]}`;
      }
    }
    
    setText(lines.join("\n"));
  }, [hasSamples, voice]);
  
  const onCaretPositionChange = useCallback(pos => {
    if(hasSamples) {
      if(pos === 0 || text[pos - 1] === "\n") textareaRef.current.setCaretPosition(pos + 1);
    }
  }, [hasSamples, text]);
  
  const stopSounds = useCallback(async () => {
    await requestJSON({ pathname: "/sounds/stopSounds" });
  }, []);
  
  const speak = useCallback(async () => {
    await requestJSON({
      pathname: "/sounds/say",
      search: {
        text,
        voice: selectedVoice === AUTO_VOICE.value ? undefined : selectedVoice,
      },
    });
  }, [text, selectedVoice]);
  
  return (
    <>
      <ReactTextareaAutocomplete value={text}
                                 onChange={onTextChange}
                                 onCaretPositionChange={onCaretPositionChange}
                                 ref={textareaRef}
                                 minChar={1}
                                 loadingComponent={() => <Loader active />}
                                 trigger={voice.samples ? {
                                   " ": {
                                     dataProvider: text => voice.samples.filter(sample => sample.startsWith(text.toLowerCase())),
                                     component: Item,
                                     output: item => ` ${item}`,
                                   },
                                 } : {}} />
      <Dimmer active={loading} inverted><Loader /></Dimmer>
      <Button.Group className="panelButtons">
        <Button icon="bell slash" color="grey" onClick={stopSounds} />
        <Dropdown options={voiceOptions} selection upward value={selectedVoice} onChange={onVoiceChange} search />
        <Popup on="click"
               className="TTSSamplesPopup"
               trigger={<Button icon="list alternate outline" disabled={!voice.samples} />}>
          <ul>
            {voice.samples && voice.samples.map(sample => <li key={sample}>{sample}</li>)}
          </ul>
        </Popup>
        <Button icon="volume up" onClick={speak} />
      </Button.Group>
    </>
  );
}

export const name = "TTS";


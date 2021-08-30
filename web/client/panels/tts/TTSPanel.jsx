import React, { useCallback, useEffect, useState } from 'react';
import { Button, Dimmer, Dropdown, Loader, TextArea } from "semantic-ui-react";
import requestJSON from "../../helpers/requestJSON";

const AUTO_VOICE = { value: "AUTO", text: "Detect Language" };

export function Panel() {
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([AUTO_VOICE]);
  const [selectedVoice, setSelectedVoice] = useState(AUTO_VOICE.value);
  const [text, setText] = useState("");
  
  useEffect(() => {
    let cancel;
    
    (async () => {
      setLoading(true);
      
      const voices = await requestJSON({ pathname: "/sounds/voices", cancelToken: cancelCb => cancel = cancelCb });
      
      setVoices([
        AUTO_VOICE,
        ...voices.map(voice => ({
          value: voice.name,
          text: `[${voice.provider}] (${voice.language}) ${voice.name}`,
        })).sort((a, b) => a.text.localeCompare(b.text))],
      );
      
      setLoading(false);
    })().catch(console.error);
    
    return () => {
      if(cancel) cancel();
    };
  }, []);
  
  const onVoiceChange = useCallback((ev, { value }) => setSelectedVoice(value), []);
  const onTextChange = useCallback((ev, { value }) => setText(value), []);
  
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
      <TextArea value={text} onChange={onTextChange} />
      <Dimmer active={loading} inverted><Loader /></Dimmer>
      <Button.Group className="panelButtons">
        <Button icon="bell slash" color="grey" onClick={stopSounds} />
        <Dropdown options={voices} selection upward value={selectedVoice} onChange={onVoiceChange} />
        <Button icon="volume up" onClick={speak} />
      </Button.Group>
    </>
  );
}

// class Panel2 extends React.Component {
//   constructor(props) {
//     super(props);
//
//     this.state = {
//       sounds: [],
//       filteredSounds: [],
//       loading: true,
//       filter: "",
//       firstSound: null,
//     };
//   }
//
//   async componentDidMount() {
//     const sounds = soundsSort(await requestJSON({ pathname: "/sounds/list" }));
//     this.setState({
//       sounds,
//       filteredSounds: sounds,
//       loading: false,
//       triggered: false,
//     });
//
//     triggerCallbacks.add(this.getTriggered);
//   }
//
//   componentWillUnmount() {
//     triggerCallbacks.delete(this.getTriggered);
//   }
//
//   refresh = async () => {
//     this.setState({
//       loading: true,
//     });
//     const sounds = soundsSort(await requestJSON({ pathname: "/sounds/list" }));
//     this.setState({
//       sounds,
//       filteredSounds: sounds,
//       loading: false,
//       filter: "",
//     });
//   };
//
//   getTriggered = (counter) => {
//     if(counter >= 3 && !this.state.triggered) {
//       this.setState({ triggered: true });
//     } else if(counter === 0 && this.state.triggered) {
//       this.setState({ triggered: false });
//     }
//   };
//
//   playRandomSound = async () => {
//     await requestJSON({ pathname: "/sounds/play", search: { sound: "*" } });
//     trigger();
//   };
//
//   stopSounds = async () => {
//     await requestJSON({ pathname: "/sounds/stopSounds" });
//   };
//
//   onFilter = (ev, { value }) => {
//     if(value === "") {
//       this.setState(state => ({ filteredSounds: state.sounds, filter: value }));
//     } else {
//       const filter = e => {
//         if(e.name.toLowerCase().includes(value.toLowerCase())) {
//           return [e];
//         } else {
//           if(e.type === "folder") {
//             const elements = e.elements.map(filter).flat();
//
//             if(elements.length) {
//               return [{
//                 ...e,
//                 elements,
//               }];
//             }
//           }
//         }
//
//         return [];
//       };
//
//       this.setState(state => {
//         const filteredSounds = state.sounds.map(filter).flat();
//         let firstSound = null;
//         if(filteredSounds[0]) {
//           firstSound = filteredSounds[0];
//           while(firstSound.type === "folder") {
//             firstSound = firstSound.elements[0];
//           }
//         }
//
//         return {
//           filteredSounds,
//           firstSound,
//           filter: value,
//         };
//       });
//     }
//   };
//
//   onFilterKey = async ({ key }) => {
//     if(key === "Enter" && this.state.firstSound) {
//       await requestJSON({ pathname: "/sounds/play", search: { sound: this.state.firstSound.path } });
//       trigger();
//     }
//   };
//
//   render() {
//     return (
//       <React.Fragment>
//         <Input className={"search" + (this.state.firstSound && this.state.focus ? " enter" : "")}
//                placeholder="Search..." onChange={this.onFilter} value={this.state.filter}
//                onKeyPress={this.onFilterKey} onFocus={() => this.setState({ focus: true })} onBlur={() => this.setState({ focus: false })} />
//         <div className="soundsWrap">
//           <Sounds elements={this.state.filteredSounds} />
//         </div>
//         <Dimmer active={this.state.loading} inverted><Loader /></Dimmer>
//         <Franku />
//         <Button.Group className="panelButtons">
//           <Button icon="bell slash" color={this.state.triggered ? "red" : "grey"} onClick={this.stopSounds} />
//           <Button icon="refresh" onClick={this.refresh} />
//           <Button icon="random" onClick={this.playRandomSound} />
//         </Button.Group>
//       </React.Fragment>
//     );
//   }
// }

export const name = "TTS";


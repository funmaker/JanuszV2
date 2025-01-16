import React from 'react';
import { Accordion, Button, Dimmer, Icon, Input, Loader } from "semantic-ui-react";
import requestJSON from "../../helpers/requestJSON";
import Franku, { trigger, triggerCallbacks } from "./Franku";

const soundSort = (a, b) => (a.type.localeCompare(b.type)) * 10 + (a.name.localeCompare(b.name));

const soundsSort = elements => {
  elements.filter(e => e.type === "folder").forEach(f => f.elements = soundsSort(f.elements));
  
  return elements.sort(soundSort);
};

function Sounds({ elements }) {
  const folders = elements.filter(sound => sound.type === "folder");
  const sounds = elements.filter(sound => sound.type === "sound");
  
  return (
    <React.Fragment>
      {folders.length > 0 ?
        <Accordion styled fluid>
          {folders.map((sound, id) => <Sound sound={sound} key={id} />)}
        </Accordion>
        : null}
      {sounds.length > 0 ?
        <div className="soundButtons">
          {sounds.map((sound, id) => <Sound sound={sound} key={id} />)}
        </div>
      : null}
    </React.Fragment>
  );
}

class Sound extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      extended: true,
    };
    
    this.playSound = this.playSound.bind(this);
    this.playRandomSound = this.playRandomSound.bind(this);
  }
  
  playSound = async () => {
    await requestJSON({ pathname: "/sounds/play", search: { sound: this.props.sound.path } });
    trigger();
  };
  
  playRandomSound = async (ev) => {
    ev.stopPropagation();
    await requestJSON({ pathname: "/sounds/play", search: { sound: this.props.sound.path + "/*" } });
    trigger();
  };
  
  render() {
    const { sound } = this.props;
    
    if(sound.type === "folder") {
      return (
        <React.Fragment>
          <Accordion.Title active={this.state.extended}
                           onClick={() => this.setState(state => ({ extended: !state.extended }))}>
            <Icon name='dropdown' />
            {sound.name}
            <Button className="randomButton" icon="random" onClick={this.playRandomSound} compact size="tiny" basic />
          </Accordion.Title>
          <Accordion.Content active={this.state.extended}>
            <Sounds elements={sound.elements} />
          </Accordion.Content>
        </React.Fragment>
      );
    } else {
      return (
        <Button content={sound.name.substr(0, sound.name.lastIndexOf("."))}
                onClick={this.playSound} compact />
      );
    }
  }
}

export class Panel extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      sounds: [],
      filteredSounds: [],
      loading: true,
      filter: "",
      firstSound: null,
    };
  }
  
  async componentDidMount() {
    const sounds = soundsSort(await requestJSON({ pathname: "/sounds/list" }));
    this.setState({
      sounds,
      filteredSounds: sounds,
      loading: false,
      triggered: false,
    });
    
    triggerCallbacks.add(this.getTriggered);
  }
  
  componentWillUnmount() {
    triggerCallbacks.delete(this.getTriggered);
  }
  
  refresh = async () => {
    this.setState({
      loading: true,
    });
    const sounds = soundsSort(await requestJSON({ pathname: "/sounds/list" }));
    this.setState({
      sounds,
      filteredSounds: sounds,
      loading: false,
      filter: "",
    });
  };
  
  getTriggered = (counter) => {
    if(counter >= 3 && !this.state.triggered) {
      this.setState({ triggered: true });
    } else if(counter === 0 && this.state.triggered) {
      this.setState({ triggered: false });
    }
  };
  
  playRandomSound = async () => {
    await requestJSON({ pathname: "/sounds/play", search: { sound: "*" } });
    trigger();
  };
  
  stopSounds = async () => {
    await requestJSON({ pathname: "/sounds/stopSounds" });
  };
  
  onFilter = (ev, { value }) => {
    if(value === "") {
      this.setState(state => ({ filteredSounds: state.sounds, filter: value }));
    } else {
      const filter = e => {
        if(e.name.toLowerCase().includes(value.toLowerCase())) {
          return [e];
        } else {
          if(e.type === "folder") {
            const elements = e.elements.map(filter).flat();
            
            if(elements.length) {
              return [{
                ...e,
                elements,
              }];
            }
          }
        }
        
        return [];
      };
      
      this.setState(state => {
        const filteredSounds = state.sounds.map(filter).flat();
        let firstSound = null;
        if(filteredSounds[0]) {
          firstSound = filteredSounds[0];
          while(firstSound.type === "folder") {
            firstSound = firstSound.elements[0];
          }
        }
        
        return {
          filteredSounds,
          firstSound,
          filter: value,
        };
      });
    }
  };
  
  onFilterKey = async ({ key }) => {
    if(key === "Enter" && this.state.firstSound) {
      await requestJSON({ pathname: "/sounds/play", search: { sound: this.state.firstSound.path } });
      trigger();
    }
  };
  
  render() {
    return (
      <React.Fragment>
        <Input className={"search" + (this.state.firstSound && this.state.focus ? " enter" : "")}
               placeholder="Search..." onChange={this.onFilter} value={this.state.filter}
               onKeyPress={this.onFilterKey} onFocus={() => this.setState({ focus: true })} onBlur={() => this.setState({ focus: false })} />
        <div className="soundsWrap">
          <Sounds elements={this.state.filteredSounds} />
        </div>
        <Dimmer active={this.state.loading} inverted><Loader /></Dimmer>
        <Franku />
        <Button.Group className="panelButtons">
          <Button icon="bell slash" color={this.state.triggered ? "red" : "grey"} onClick={this.stopSounds} />
          <Button icon="refresh" onClick={this.refresh} />
          <Button icon="random" onClick={this.playRandomSound} />
        </Button.Group>
      </React.Fragment>
    );
  }
}

export const name = "Sounds";


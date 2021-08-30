import React from 'react';
import { Redirect, Route, Switch, withRouter } from "react-router";
import isNode from 'detect-node';
import { hot } from "react-hot-loader";
import { getInitialData, setInitialData } from "./helpers/initialData";
import IndexPage from "./routes/IndexPage";
import LoginPage from "./routes/LoginPage";
import LogoutPage from "./routes/LogoutPage";
import * as AudioClient from './panels/audio/AudioPanel';
import * as SoundsClient from './panels/sounds/SoundsPanel';
import * as TTSClient from './panels/tts/TTSPanel';
import * as DiscordClient from './panels/discord/DiscordPanel';
import * as LogsClient from './panels/logs/LogsPanel';
import ErrorPage from "./routes/ErrorPage";

if(!isNode) {
  try {
    window.dataTransfer = new DataTransfer();
  } catch(e) {
    let data = {};
    window.dataTransfer = {
      setData: (name, value) => data[name] = value,
      getData: (name) => data[name],
      clearData: () => data = {},
    };
  }
}

export const clientModules = [
  SoundsClient,
  DiscordClient,
  AudioClient,
  LogsClient,
  TTSClient,
];

export const findClientModule = name => clientModules.find(mod => mod.name === name);

class App extends React.Component {
  constructor({ initialData }) {
    super();
    
    if(isNode) {
      setInitialData(initialData);
    } else {
      setInitialData(JSON.parse(document.getElementById('initialData').textContent));
    }
  }
  
  componentDidMount() {
    this.unlisten = this.props.history.listen(() => {
      setInitialData(null);
    });
  }
  
  componentWillUnmount() {
    this.unlisten();
  }
  
  render() {
    const initialData = getInitialData();
    if(initialData && initialData.error) {
      return (
        <ErrorPage error={initialData.error} />
      );
    }
    
    return (
      <Switch>
        <Route path="/" exact component={IndexPage} />
        <Route path="/core/login" exact component={LoginPage} />
        <Route path="/core/logout" exact component={LogoutPage} />
        <Redirect to="/" />
      </Switch>
    );
  }
}

export default hot(module)(withRouter(App));

/* eslint-disable react/no-access-state-in-setstate */
import React from 'react';
import { Dimmer, Loader, Button, Dropdown } from "semantic-ui-react";
import requestJSON from "../../helpers/requestJSON";

const LogPage = ({ logs, start }) =>
  <div dangerouslySetInnerHTML={{ __html: logs.map((line, n) => `<span class="lineNumber" data-num="${start + n + 1}"></span>${line}`).join("<br />") }} />;

export class Panel extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      files: [],
      file: "*NOW*",
      logsPages: [],
      logsStart: null,
      logsEnd: null,
      logsSize: null,
      pageSize: null,
      loading: true,
    };
    
    this.scrollDiv = React.createRef();
  }
  
  async componentDidMount() {
    this.setState({
      files: (await requestJSON({ pathname: "/web/logsFiles" })).sort((a, b) => a.created - b.created),
      loading: false,
    });
  }
  
  getSnapshotBeforeUpdate() {
    const div = this.scrollDiv.current;
    return {
      scrollBottom: div.scrollHeight - div.scrollTop - div.clientHeight,
      clientHeight: div.clientHeight,
    };
  }
  
  async componentDidUpdate(prevProps, prevState, snapshot) {
    const div = this.scrollDiv.current;
    
    if(this.state.logsStart !== prevState.logsStart) {
      div.scrollTop = div.scrollHeight - snapshot.scrollBottom - div.clientHeight;
    }
    
    if(this.state.logsEnd !== prevState.logsEnd && snapshot.scrollBottom === 0) {
      div.scrollTop = div.scrollHeight - div.clientHeight;
    }
    
    if(!this.ws && this.state.file === "*NOW*" && this.state.logsSize !== null && this.state.logsEnd === this.state.logsSize) {
      this.reconnectWS();
    }
    
    await this.checkScroll();
  }
  
  componentWillUnmount() {
    this.stopWS();
  }
  
  reconnectWS() {
    this.ws = new WebSocket(`ws://${location.host}/web/logs?format=html`);
    this.ws.addEventListener("close", this.handleClose);
    this.ws.addEventListener("error", err => {
      console.error("Connection error: ", err);
      this.ws.close();
    });
    this.ws.addEventListener('message', this.handleMessage);
  }
  
  stopWS() {
    if(this.ws) {
      this.ws.removeEventListener("close", this.handleClose);
      this.ws.removeEventListener("message", this.handleMessage);
      this.ws.close();
      this.ws = null;
    }
  }
  
  handleClose = (code, reason) => {
    console.error(code, reason);
    this.ws = null;
    this.reconnectWS();
  };
  
  
  handleMessage = (msg) => {
    const log = JSON.parse(msg.data);
    
    if(this.state.logsEnd !== log.id) {
      const request = {
        format: "html",
        start: this.state.logsEnd,
        end: log.id,
      };
      (async () => {
        const { logs, start } = await requestJSON({ pathname: "/web/logs", search: request });
        const pos = this.state.logsPages.findIndex(page => page.start + page.logs.length === start) + 1;
        const logsPages = this.state.logsPages.slice();
        logsPages.splice(pos, 0, { logs, start });
        
        this.setState({
          logsPages,
        });
      })().catch(console.error);
    }
    
    this.setState({
      logsPages: [...this.state.logsPages, { logs: [log.text], start: log.id }],
      logsEnd: log.id + 1,
      logsSize: log.id + 1,
    });
  };
  
  async fetchData(behind) {
    if(this.state.loading) return;
    if(this.ws && !behind) return;
    
    this.setState({
      loading: true,
    });
    
    const request = {
      format: "html",
      start: undefined,
      end: undefined,
      file: this.state.file === "*NOW*" ? undefined : this.state.file,
    };
    
    if(this.state.logsSize !== null) {
      if(behind) {
        request.end = this.state.logsStart;
      } else {
        request.start = this.state.logsEnd;
      }
    }
    
    const { logs, start, end, totalSize, pageSize } = await requestJSON({ pathname: "/web/logs", search: request });
    const page = { logs, start };
    
    this.setState({
      logsPages: behind ? [page, ...this.state.logsPages] : [...this.state.logsPages, page],
      logsStart: this.state.logsStart !== null ? Math.min(start, this.state.logsStart) : start,
      logsEnd: this.state.logsEnd !== null ? Math.max(end, this.state.logsEnd) : end,
      logsSize: totalSize,
      pageSize,
      loading: false,
    });
  }
  
  checkScroll = async () => {
    const div = this.scrollDiv.current;
    
    if(this.state.logsSize === null) {
      return await this.fetchData();
    }
    
    if(this.state.logsStart !== 0 && div.scrollTop < 500) {
      return await this.fetchData(true);
    }
    
    if(div.scrollTop > 3000) {
      const { logsPages, logsStart } = this.state;
      return this.setState({
        logsPages: logsPages.slice(1),
        logsStart: logsStart + logsPages[1].logs.length,
      });
    }
    
    if(this.state.logsEnd !== this.state.logsSize && div.scrollHeight - div.scrollTop - div.clientHeight < 500) {
      return await this.fetchData();
    }
    
    if(div.scrollHeight - div.scrollTop - div.clientHeight > 3000) {
      const { logsPages, logsEnd } = this.state;
      
      this.stopWS();
      
      return this.setState({
        logsPages: logsPages.slice(0, -1),
        logsEnd: logsEnd - logsPages[logsPages.length - 1].logs.length,
      });
    }
  };
  
  onFileChange = (ev, { value }) => {
    this.stopWS();
    this.setState({
      file: value,
      logsPages: [],
      logsStart: null,
      logsEnd: null,
      logsSize: null,
    });
  };
  
  handleRemoveAll = async (ev) => {
    if(this.state.file !== "*NOW*") {
      this.onFileChange(ev, { value: "*NOW*" });
    }
    
    await requestJSON({ pathname: "/web/deleteLogs" });
    
    this.setState({
      files: [],
    });
  };
  
  render() {
    const filesOptions = this.state.files.map(file => ({
      value: file.filename,
      text: (new Date(file.created)).toLocaleString(),
    }));
    
    filesOptions.push({
      value: "*NOW*",
      text: "Now",
    });
    
    return (
      <React.Fragment>
        <div className="panelScroll"
             ref={this.scrollDiv}
             onScroll={this.checkScroll}>
          {this.state.logsPages.map(({ logs, start }) =>
            <LogPage key={start} start={start} logs={logs} />,
          )}
        </div>
        <Dimmer active={this.state.loading} size="huge"><Loader /></Dimmer>
        <Button.Group className="panelButtons">
          <Dropdown selection
                    button
                    upward
                    options={filesOptions}
                    onChange={this.onFileChange}
                    value={this.state.file} />
          <Button icon="trash" title="Remove all logs" onClick={this.handleRemoveAll} />
          <Button icon="arrow up"
                  title="Top"
                  color={this.state.logsStart === 0 ? "grey" : undefined}
                  onClick={() => this.setState({ logsPages: [], logsStart: 0, logsEnd: 0 })} />
          <Button icon="arrow down"
                  title="Bottom"
                  color={this.state.logsEnd === this.state.logsSize ? "grey" : undefined}
                  onClick={() => this.setState({ logsPages: [], logsStart: this.state.logsSize, logsEnd: this.state.logsSize })} />
        </Button.Group>
      </React.Fragment>
    );
  }
}

export const name = "Logs";


import React from 'react';
import { Segment } from "semantic-ui-react";
import SplitPane from 'react-split-pane';
import { findClientModule } from "../App";

export function PanelTab({ name, active, onDelete, onClick, readOnly }) {
  function onDragStart(ev) {
    ev.dataTransfer.setData("firefox", "sucks");
    window.dataTransfer.setData("januszTab", "true");
    window.dataTransfer.setData("name", name);
  }
  
  function onDragEnd(ev) {
    if(ev.dataTransfer.dropEffect === "move") {
      onDelete();
    }
  }
  
  return (
    <div className={`PanelTab${active ? " active" : ""}`}
         draggable={!readOnly}
         onDragStart={onDragStart}
         onDragEnd={onDragEnd}
         onClick={onClick} >
      {name}
    </div>
  );
}

export default class Panels extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      activeTab: 0,
    };
    
    this.onTabsDrop = this.onTabsDrop.bind(this);
    this.onContentDrop = this.onContentDrop.bind(this);
    this.onEmptyDrop = this.onEmptyDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
  }
  
  componentDidMount() {
    this.tryReduce();
  }
  
  shouldComponentUpdate(nextProps, nextState) {
    return !(nextState === this.state && this.props.panels === nextProps.panels);
  }
  
  componentDidUpdate() {
    this.tryReduce();
  }
  
  async onTabsDrop(ev) {
    if(window.dataTransfer.getData("januszTab") === "true") {
      ev.preventDefault();
      
      this.props.onChange([...this.props.panels, window.dataTransfer.getData("name")]);
    }
  }
  
  async onContentDrop(ev) {
    if(window.dataTransfer.getData("januszTab") === "true") {
      const target = ev.currentTarget;
      ev.preventDefault();
      
      const { panels, onChange } = this.props;
      const rect = target.getBoundingClientRect();
      const x = (ev.clientX - rect.left) / (rect.right - rect.left);
      const y = (ev.clientY - rect.top) / (rect.bottom - rect.top);
      
      const newPanels = {};
      if(x > y && x > 1 - y) {
        newPanels.vertical = true;
        newPanels.first = panels;
        newPanels.second = [window.dataTransfer.getData("name")];
      } else if(x < y && x < 1 - y) {
        newPanels.vertical = true;
        newPanels.first = [window.dataTransfer.getData("name")];
        newPanels.second = panels;
      } else if(y > x && y > 1 - x) {
        newPanels.vertical = false;
        newPanels.first = panels;
        newPanels.second = [window.dataTransfer.getData("name")];
      } else if(y < x && y < 1 - x) {
        newPanels.vertical = false;
        newPanels.first = [window.dataTransfer.getData("name")];
        newPanels.second = panels;
      }
      onChange(newPanels);
    }
  }
  
  async onEmptyDrop(ev) {
    if(window.dataTransfer.getData("januszTab") === "true") {
      ev.preventDefault();
      
      this.props.onChange([window.dataTransfer.getData("name")]);
    }
  }
  
  onDragOver(ev) {
    if(window.dataTransfer.getData("januszTab") === "true") {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "move";
    }
  }
  
  tryReduce() {
    const { panels, onChange } = this.props;
    
    if(Array.isArray(panels) && panels.length === 0) {
      onChange(null);
    } else if(panels instanceof Object && !Array.isArray(panels)) {
      if(panels.first === null) {
        onChange(panels.second);
      } else if(panels.second === null) {
        onChange(panels.first);
      }
    }
  }
  
  render() {
    const { panels } = this.props;
    
    const onChange = panels => this.props.onChange(panels); // Doesn't work correctly without it. Unexplained phenomena.
    
    if(panels === null) {
      return (
        <Segment className="Panels empty"
                 onDragOver={this.onDragOver}
                 onDrop={this.onEmptyDrop} />
      );
    } else if(Array.isArray(panels)) {
      if(panels.length === 0) return <Segment className="Panels empty" />;
      
      let activeTab = this.state.activeTab;
      if(activeTab >= panels.length) activeTab = 0;
      const Panel = findClientModule(panels[activeTab]).Panel;
      
      return (
        <Segment.Group className='Panels'>
          <Segment className="tabs"
                   inverted
                   onDragOver={this.onDragOver}
                   onDrop={this.onTabsDrop}>
            <div className="scrollWrap">
              {panels.map((panel, id) =>
                <PanelTab name={panel}
                          key={id}
                          onDelete={() => onChange([...panels.slice(0, id), ...panels.slice(id + 1)])}
                          onClick={() => this.setState({ activeTab: id })}
                          active={id === activeTab}
                          readOnly={this.props.readOnly} />,
              )}
            </div>
            {this.props.extraTab}
          </Segment>
          <Segment className={`content ${panels[activeTab]}Panel`}
                   onDragOver={this.onDragOver}
                   onDrop={this.onContentDrop}>
            <Panel />
          </Segment>
        </Segment.Group>
      );
    } else {
      return (
        <div className='Panels'>
          <SplitPane split={panels.vertical ? "vertical" : "horizontal"}
                     defaultSize={panels.size || "50%"}
                     onChange={size => onChange({ ...panels, size })} minSize={96} maxSize={-110}>
            <Panels panels={panels.first}
                    onChange={first => onChange({ ...panels, first })} />
            <Panels panels={panels.second}
                    onChange={second => onChange({ ...panels, second })} />
          </SplitPane>
        </div>
      );
    }
  }
}

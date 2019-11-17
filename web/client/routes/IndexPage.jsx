import React from 'react';
import isNode from 'detect-node';
import { Link } from "react-router-dom";
import { Icon } from "semantic-ui-react";
import { isMobile } from 'mobile-device-detect';
import { fetchInitialData, getInitialData } from "../helpers/initialData";
import Logo from "../components/Logo";
import Panels from "../components/Panels";
import Modules from "../components/Modules";
import { clientModules } from "../App";

export default class IndexPage extends React.Component {
  constructor() {
    super();
    
    this.state = {
      ...getInitialData(),
      panels: null,
      mobile: false,
    };
    
    this.panelsChange = this.panelsChange.bind(this);
  }
  
  async componentDidMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
    
    this.setState({
      mobile: window.innerWidth <= 800 || isMobile,
    });
    
    this.setState({
      ...(await fetchInitialData()),
    });
    
    if(!isNode && localStorage.getItem("panels")) {
      this.setState({ panels: JSON.parse(localStorage.getItem("panels")) });
    }
  }
  
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }
  
  handleWindowSizeChange = () => {
    const newMobile = window.innerWidth <= 800 || isMobile;
    if(newMobile !== this.state.mobile) this.setState({ mobile: newMobile });
  };
  
  panelsChange(panels) {
    this.setState({ panels });
    localStorage.setItem("panels", JSON.stringify(panels));
  }
  
  render() {
    return (
      <div className={"IndexPage" + (this.state.mobile ? " mobile" : "")}>
        <Logo />
        {this.state.mobile ?
          <Panels panels={clientModules.map(mod => mod.name)}
                  readOnly
                  extraTab={
                    <Link to="/core/logout" className="PanelTab button logoutButton" title="Logout">
                      <Icon name="power" size="large" />
                    </Link>
                  } />
        :
          <>
            <Panels panels={this.state.panels} onChange={this.panelsChange} />
            <Modules />
          </>
        }
      </div>
    );
  }
}

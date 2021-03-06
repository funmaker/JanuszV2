import React from 'react';
import { Header, Input, Segment } from "semantic-ui-react";
import { Redirect } from "react-router";
import { fetchInitialData, getInitialData } from "../helpers/initialData";
import Logo from "../components/Logo";
import requestJSON from "../helpers/requestJSON";

export default class LogoutPage extends React.Component {
  constructor() {
    super();
    
    this.state = {
      redirect: null,
    };
  }
  
  async componentDidMount() {
    await requestJSON({ method: "POST" });
    
    this.setState({
      redirect: "/core/login",
    });
  }
  
  render() {
    return (
      <div className="LogoutPage">
        {this.state.redirect ? <Redirect to={this.state.redirect} push /> : null}
        <Logo />
        <Segment className="loginWrapper">
          <Segment as="form" onSubmit={this.onSubmit} stacked className="form">
            <Header>Please wait...</Header>
          </Segment>
        </Segment>
      </div>
    );
  }
}

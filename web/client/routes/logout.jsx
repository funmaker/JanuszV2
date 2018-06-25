import React from 'react';
import {fetchInitialData, getInitialData} from "../helpers/initialData";
import Logo from "../components/logo";
import {Header, Input, Segment} from "semantic-ui-react";
import requestJSON from "../helpers/requestJSON";
import {Redirect} from "react-router";

export default class LogoutPage extends React.Component {
	constructor() {
		super();
		
		this.state = {
			redirect: null,
		};
	}
	
	async componentDidMount() {
		await requestJSON({method: "POST"});
		
		this.setState({
			redirect: "/core/login",
		});
	}
	
	render() {
		return (
			<div className="LoginPage">
				{this.state.redirect ? <Redirect to={this.state.redirect} /> : null}
				<Logo/>
				<Segment className="loginWrapper">
					<Segment as={"form"} onSubmit={this.onSubmit} stacked className="form">
						<Header>Please wait...</Header>
					</Segment>
				</Segment>
			</div>
		)
	}
}

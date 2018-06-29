import React from 'react';
import Logo from "../components/logo";
import {Segment} from "semantic-ui-react";
import HTTPStatus from 'http-status-codes';

export default function ErrorPage({error}) {
	console.log(error);
	
	return (
		<div className="ErrorPage">
			<Logo/>
			<Segment className="wrapper">
				<div className="error">
					<div className="code">{error.code}</div>
					<div className="type">{HTTPStatus.getStatusText(error.code)}</div>
				</div>
				<div className="description">
					<div className="message">{error.message}</div>
					<div className="stack">{error.stack}</div>
				</div>
			</Segment>
		</div>
	)
}

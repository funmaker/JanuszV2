import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter} from 'react-router-dom';
import {AppContainer} from 'react-hot-loader';
import App from "./web/client/app";
import './web/client/style/style.scss';

const initialData = JSON.parse(document.getElementById('initialData').innerHTML);

ReactDOM.hydrate(
	<AppContainer>
		<BrowserRouter>
			<App initialData={initialData}/>
		</BrowserRouter>
	</AppContainer>
	, document.getElementById('root'));
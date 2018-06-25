import requireLogin from "../../server/helpers/requireLogin";
import {janusz} from "../../../index";

export const router = require('express-promise-router')();

router.get('/core/login', (req, res) => {
	const initialData = {};
	
	res.react(initialData);
});

router.post('/core/login', (req, res) => {
	const initialData = {};
	
	if(req.body.password === janusz.getConfig("web").password) {
		req.session.authorized = true;
		initialData.success = true;
	} else {
		initialData.success = false;
	}
	
	res.json(initialData);
});

router.post('/core/logout', (req, res) => {
	const initialData = {};
	
	req.session.authorized = false;
	
	res.json(initialData);
});

router.get('/', requireLogin, (req, res) => {
	const initialData = {};
	
	res.react(initialData);
});

router.get("/test", (req, res) => res.send("kek"));

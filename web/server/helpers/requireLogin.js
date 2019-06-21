import jwt from 'jsonwebtoken';
import HTTPError from "../../server/helpers/HTTPError";
import {janusz} from "../../../index";

export function getFreshJWT() {
	return jwt.sign({lol: "kek"}, janusz.getConfig("web").secret, {expiresIn: janusz.getConfig("web").cookieLifespan});
}

export function validateReq(req) {
	try {
		jwt.verify(req.cookies.auth, janusz.getConfig("web").secret);
	} catch(e) {
		return false;
	}
	return true;
}

export default function requireLogin(req, res, next) {
	if (req.headers && req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
		return void next();
	}
	
	if(!validateReq(req)) {
		switch(req.accepts(['json', 'html'])) {
			case "json":
				return void next(new HTTPError(401));
			
			case "html":
				return void res.redirect("/core/login");
			
			default:
				return void next(new HTTPError(406));
		}
	} else {
		next();
	}
}


import HTTPError from "../../server/helpers/HTTPError";

export default function requireLogin(req, res, next) {
	if (req.headers && req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') {
		next();
		return;
	}
	
	if(!req.session.authorized) {
		switch(req.accepts(['json', 'html'])) {
			case "json":
				next(new HTTPError(401));
				return;
			
			case "html":
				res.redirect("/core/login");
				return;
			
			default:
				next(new HTTPError(406));
				return;
		}
	}
	
	next();
}


export const router = require('express-promise-router')();

router.get('/', (req, res) => {
	const initialData = {};
	
	res.react(initialData);
});

router.get("/test", (req, res) => res.send("kek"));

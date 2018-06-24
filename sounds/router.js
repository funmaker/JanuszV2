import PromiseRouter from "express-promise-router";

export default function soundsRouter(soundsModule) {
	const router = PromiseRouter();
	
	router.get('/play', async (req, res) => {
		let path = req.query.sound.split("/");
		
		let sounds = {elements: soundsModule.sounds, type: "folder"};
		for(let p of path) {
			if(sounds.type !== "folder") return res.status(404).send();
			
			if(p === "*") {
				const all = [];
				const crawl = sounds => {
					if(sounds.type === "sound") all.push(sounds);
					else sounds.elements.forEach(crawl);
				};
				crawl(sounds);
				sounds = all[Math.floor(Math.random() * all.length)];
			} else {
				sounds = sounds.elements.find(sound => sound.filename === p);
				if(!sounds) return res.status(404).send();
			}
		}
		if(!sounds) return res.status(404).send();
		
		soundsModule.SoundsDevice.devices.forEach(device => device.playSound(sounds.audioData));
		
		res.json({});
	});
	
	router.get("/list", async (req, res) => {
		const soundMap = path => sound => {
			if(sound.type === "folder") {
				return {
					type: "folder",
					name: sound.filename,
					path: path + sound.filename,
					elements: sound.elements.map(soundMap(path + sound.filename + "/")),
				};
			} else {
				return {
					type: "sound",
					name: sound.filename,
					path: path + sound.filename,
				};
			}
		};
		
		const data = soundsModule.sounds.map(soundMap(""));
		
		res.json(data);
	});
	
	router.get("/stopSounds", async (req, res) => {
		soundsModule.SoundsDevice.devices.forEach(device => device.stopSounds());
		
		res.json({});
	});
	
	return router;
}

import PromiseRouter from "express-promise-router";
import {findModule} from "../index";
import DiscordModule from "../discord";
import {Readable} from "stream";
import systemRouter from './audioSystem/systemRouter.js'

export default function audioRouter(audioModule) {
	const router = PromiseRouter();
	
	router.get('/play', async (req, res) => {
		let path = req.query.sound.split("/");
		
		if(req.query.sound === "*") {
			console.log("kek");
			
			let counter = 0;
			const stream = new Readable({
				async read(size) {
					console.log(counter);
					if(size % 2) size++;
					let buffer = Buffer.alloc(size);
					for(let i = 0; i + 1 < size; i += 2) {
						counter++;
						buffer.writeInt16LE(Math.sin(counter * Math.PI / 48000 * 60 * (1 + Math.cos(counter * Math.PI / 48000) / 4)) * 16000, i);
					}
					stream.push(buffer);
				},
			});
			
			
			for(const connection of findModule(DiscordModule).client.voiceConnections.values()) {
				connection.on('error', console.error);
				const dispatcher = connection.playConvertedStream(stream);
				dispatcher.on('error', console.error);
				console.log("playing on", connection.channel.guild.name);
			}
			
			return;
		}
		
		let sounds = {elements: audioModule.sounds, type: "folder"};
		for(let p of path) {
			if(!sounds || sounds.type !== "folder") return res.status(404).send();
			sounds = sounds.elements.find(sound => sound.filename === p);
		}
		if(!sounds) return res.status(404).send();
		
		findModule(DiscordModule).playSound(sounds);
		
		res.json({});
	});
	
	router.get("/sounds", async (req, res) => {
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
		
		const data = audioModule.sounds.map(soundMap(""));
		
		res.json(data);
	});
	
	router.use("/system", systemRouter(audioModule));
	
	return router;
}

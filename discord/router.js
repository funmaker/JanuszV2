import PromiseRouter from "express-promise-router";

export default function discordRouter(discord) {
	const router = PromiseRouter();
	
	router.get("/guilds/:id/:channel/join", async (req, res) => {
		const data = {};
		
		const guild = discord.guilds.get(req.params.id);
		const channel = guild.channels.get(req.params.channel);
		await channel.join();
		guild.sync();
		
		res.json(data);
	});
	
	router.get("/guilds/:id/disconnect", async (req, res) => {
		const data = {};
		
		const guild = discord.guilds.get(req.params.id);
		if(guild.voiceConnection) {
			guild.voiceConnection.disconnect();
		}
		
		res.json(data);
	});
	
	router.get("/guilds/:id", async (req, res) => {
		const data = {};
		
		const guild = discord.guilds.get(req.params.id);
		
		const channelMap = channel => {
			if(channel.type === "text") {
				return {
					id: channel.id,
					name: channel.name,
					type: "text",
				};
			} else if(channel.type === "voice") {
				return {
					id: channel.id,
					name: channel.name,
					type: "voice",
					members: channel.members.map(memberMap),
				};
			} else if(channel.type === "category") {
				return {
					id: channel.id,
					name: channel.name,
					type: "category",
					children: channel.children ? channel.children.sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(channelMap) : [],
				};
			}
		};
		
		const memberMap = member => ({
			id: member.id,
			name: member.displayName,
			avatar: member.user.displayAvatarURL,
		});
		
		data.channels = guild.channels.filter(channel => !channel.parent).sort((a, b) => a.calculatedPosition - b.calculatedPosition).map(channelMap);
		
		res.json(data);
	});
	
	router.get("/guilds", async (req, res) => {
		const data = discord.guilds.map(guild => ({
			id: guild.id,
			name: guild.name,
			members: guild.memberCount,
			membersOnline: guild.members.reduce((acc, member) => member.presence.status !== "offline" ? acc + 1 : acc, 0),
		}));
		
		res.json(data);
	});
	
	return router;
}

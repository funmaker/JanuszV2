import PromiseRouter from "express-promise-router";

export default function youtubeRouter(youtubeModule) {
	const router = PromiseRouter();
	
	router.get("/play", async (req, res) => {
		const {url} = req.query;
		const metadata = await youtubeModule.playVideo(url);
		
		res.json({
			success: true,
			id: metadata.id,
			title: metadata.title,
			url: metadata.url,
			thumbnail: metadata.thumbnail,
			description: metadata.description,
		})
	});
	
	router.get("/stop", async (req, res) => {
		youtubeModule.stopVideo();
	});
	
	return router;
}

import AudioSingletonDevice from "../audio/audioSystem/AudioSingletonDevice";

export default class DiscordAudioOutput extends AudioSingletonDevice {
	static deviceName = "Discord Output";
	
	constructor() {
		super(1, 0);
	}
	
}

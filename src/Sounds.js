
const sounds = {
	'tap': 'button-tap.mp3',
	'appear': 'appear.mp3',
	'gabock': 'gabock.ogg',
	'good': 'good.mp3',
	'oops': 'oops.mp3',
	'plwing': 'plwing.mp3',
	'whomp': 'whomp.ogg',
	'upper': 'upper.ogg',
	'poguck': 'poguck.ogg',
	'pock': 'pock.ogg',
	'downer': 'downer.mp3',
	'beep': 'beep.ogg',
	'barcode-read': 'barcode-read.mp3',
	'error': 'error tone chime wood block.mp3',
	'scissors': 'slide-scissors.mp3',
	'tap-hollow': 'tap-hollow.mp3',
	'tap-simple': 'tap-simple.mp3',
	'glass-done-10': 'Glass_Done10.ogg'
}

const path = '/app/resources/sounds/' // absolute path to audio files

// TODO: provide method for adding to aliases?
const aliases = {
	'barcode-scanned': 'plwing',
	'proofingLightReset': 'gabock'
}

module.exports = class Sounds {
	
	static preload(){
		_.each(sounds, sound=>{
			new Audio(path+sound);
		})
	}
	
	static play(soundName, volume=1){
		
		let sound = sounds[soundName]
		
		if( !sound )
			sound = aliases[soundName] && sounds[aliases[soundName]]

		if( sound ){
			// audio will only play if triggered by a user event
			// we reuse the audio object because once triggered by a user, it will continue to always work
			this._uiSoundAudio = this._uiSoundAudio || new Audio();
			this._uiSoundAudio.src = path+sound
			this._uiSoundAudio.volume = volume
			this._uiSoundAudio.load()
			this._uiSoundAudio.play()
		}
	}
}


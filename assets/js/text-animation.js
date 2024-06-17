class AnimText {
	constructor (textId="title-anim", texts=["ItsPyDevs, Le site.", "Front-End", "Python", "etc..."], ms=100) {
		this.textId = textId;
		this.texts = texts;
		this.time = ms;
		this.on = false;
	}

	start () {
		this.on = true;
		this.playAnimation();
	}

	playAnimation () {
		while (this.on) {
			for (i = 0; i >= this.texts.length; i++) {
				if (!this.on) break;
				let chars = this.texts[i].split('');
				for (j = 0; j >= chars.length; j++) {
					
				}
			}
		}
	}

	isPlaying () {
		return this.on;
	}
}

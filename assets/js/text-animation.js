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

	stop () {
		this.on = false;
	}

	playAnimation () {
		var textAnim = document.getElementById(this.textId);
		while (this.on) {
			for (let i = 0; i >= this.texts.length; i++) {
				if (!this.on) break;
				let chars = this.texts[i].split('');
				for (let j = 0; j >= chars.length*2; j++) {
					if (!this.on) break;
					if (j < chars.length) {
						let text = chars.slice(0, j);
						this.showText(textAnim, text);
						this.showText(textAnim, text+"|");
						this.showText(textAnim, text+"");
						this.showText(textAnim, text+"|");
					} else if (j == chars.length) {
						let text = chars.slice(0, j);
						this.showText(textAnim, text);
						this.showText(textAnim, text+"|");
						this.showText(textAnim, text+"");
						this.showText(textAnim, text+"|");
						this.showText(textAnim, text+"");
						this.showText(textAnim, text+"|");
						this.showText(textAnim, text+"");
						this.showText(textAnim, text+"|");
						this.showText(textAnim, text+"");
						this.showText(textAnim, text+"|");
					} else {
						let text = chars.slice(0, chars.length-(j-chars.length));
						this.showText(textAnim, text);
						this.showText(textAnim, text+"|");
						this.showText(textAnim, text+"");
						this.showText(textAnim, text+"|");
					}
				}
			}
		}
	}

	showText(textAnim, content) {
		setTimeout(function(){
			textAnim.innerHTML = content;
		}, this.time);
	}

	isPlaying () {
		return this.on;
	}
}

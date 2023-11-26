class Thread {
	constructor(id) {
		this.messageArray = [];
		this.id = id;
	}

	getMessages() {
		return this.messageArray;
	}

	postMessage(message) {
		this.messageArray.push(message);
	}

	toJSON() {
		return {
			id: this.id,
			messages: this.messageArray,
		};
	}
}

module.exports = Thread;

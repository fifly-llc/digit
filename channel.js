const { genRandom } = require("./utils");

class Channel {
	constructor() {
		this.messageArray = [];
		this.reports = [];

		this.locked = false;

		this.lockMessage = "Thread is 🔓 Unlocked 🔓";
	}

	isLocked() {
		return {
			locked: this.locked,
			message: this.lockMessage
		};
	}

	isKilled() {
		return this.killed;
	}

	getMessages() {
		return this.messageArray;
	}

	postMessage(message) {
		this.messageArray.push(message);
	}

	postReport(id, reason, ids) {
		this.reports.push({
			id: id,
			uid: genRandom(70, ids),
			reason: reason,
			message: this.getMessageFromId(id),
		});
	}

	getReports() {
		return this.reports;
	}

	getMessageFromId(id) {
		return this.messageArray.find((message) => message.id === id);
	}

	deleteMessageFromId(id) {
		this.messageArray = this.messageArray.filter((message) => message.id !== id);
		this.reports = this.reports.filter((report) => report.id !== id);
	}

	editMessageFromId(id, content) {
		this.messageArray = this.messageArray.map((message) => {
			if (message.id === id) {
				message.content = content;
			}
			return message;
		});
		this.reports = this.reports.filter((report) => report.id !== id);
	}

	ignoreReport(uid) {
		this.reports = this.reports.filter((report) => report.uid !== uid);
	}

	lock() {
		this.locked = !this.locked;
		if (this.locked) {
			this.lockMessage = "Thread is 🔒 Locked 🔒";
		} else {
			this.lockMessage = "Thread is 🔓 Unlocked 🔓";
		}
	}

	clear() {
		this.messageArray = [];
	}

	toJSON() {
		return {
			messages: this.messageArray,
			reports: this.reports,
			lock: {
				locked: this.locked,
				lockMessage: this.lockMessage
			}
		}
	}
}

module.exports = Channel;

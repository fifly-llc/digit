class Channel {
	constructor() {
		this.messageArray = [];
		this.messageBackup = [];
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

	getBackup() {
		return this.messageBackup;
	}

	postMessage(message) {
		this.messageArray.push(message);
		this.messageBackup.push(message);
	}

	postReport(id, reason) {
		this.reports.push({
			id: id,
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

	ignoreReport(id) {
		this.reports = this.reports.filter((report) => report.id !== id);
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
			messages: {
				messageArray: this.messageArray,
				messageBackup: this.messageBackup,
			},
			reports: this.reports,
			lock: {
				locked: this.locked,
				lockMessage: this.lockMessage
			}
		}
	}
}

module.exports = Channel;

class Channel {
    constructor() {
        this.messageArray = [];
        this.messageBackup = [];

        this.locked = false;
        this.killed = false;

        this.lockMessage = "Thread is 🔓 Unlocked 🔓";
    }

    isLocked() {
        return {
            locked: this.locked,
            message: this.lockMessage
        };
    }

    kill() {
        this.killed = true;
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

    lock() {
        this.locked = !this.locked;
        if (this.locked) {
            this.lockMessage = "Thread is 🔓 Unlocked 🔓";
        } else {
            this.lockMessage = "Thread is 🔒 Locked 🔒";
        }
    }

    clear() {
        this.messageArray = [];
    }
}

module.exports = Channel;

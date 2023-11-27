const express = require('express');
const fs = require('fs');
const Filter = require('./filter');
const Channel = require('./channel');
const Thread = require('./thread');
const { genRandom, stripHTML, stripEmojis } = require('./utils');
require('dotenv').config();

const app = express();
const port = 3000;

let channel = new Channel();
let threads = [];
let ids = [];

let json = {};

const adminAuth = 'qw12', controlAuth = 'kkk0';

dataPath = process.env.DATA_PATH;

console.log('[NOTICE] Admin Authentication is <' + adminAuth + '>.');
console.log('[NOTICE] Control Authentication is <' + controlAuth + '>.');

function updateJSON() {
	json = {
		channel: channel.toJSON(),
		threads: threads.map((thread) => {
			return thread.toJSON();
		}),
		ids: ids,
	};

	fs.writeFileSync(dataPath, JSON.stringify(json, null, 4));
}

function initJSON() {
	json = {
		channel: {
			messages: {
				messageArray: [],
				messageBackup: [],
			},
			reports: [],
			lock: {
				locked: false,
				lockMessage: "Thread is 🔓 Unlocked 🔓",
			}
		},
		threads: [],
		ids: [],
	};

	fs.writeFileSync(dataPath, JSON.stringify(json, null, 4));
}

function readJSON() {
	try {
		json = JSON.parse(fs.readFileSync(dataPath));
	} catch (e) {}
}

function filter(text) {
	const filter = new Filter();
	return filter.clean(addTags(stripHTML(text)));
}

function addTags(text) {
	return text.replace(/#([a-zA-Z0-9_]+)/g, (match, p1) => {
		return `<a href="/thread?id=${p1}" class="thread-link">#${p1}</a>`;
	});
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/api', (req, res) => {
	let body = req.body;

	switch (body.type) {
		case 'getMessages':
			res.send({ messages: channel.getMessages() });
			break;
		case 'postMessage':
			handlePostMessage(body, req, res);
			break;
		case 'botMessage':
			handleBotMessage(body, res);
			break;
		case 'systemMessage':
			handleSystemMessage(body, res);
			break;
		case 'adminMessage':
			handleAdminMessage(body, req, res);
			break;
		case 'clear':
			handleClear(body, res);
			break;
		case 'lock':
			handleLock(body, res);
			break;
		case 'checkLocked':
			res.send({ locked: channel.isLocked().locked });
			break;
		case 'getMessage':
			res.send({ message: channel.isLocked().message });
			break;
		case 'getBackup':
			handleGetBackup(body, res);
			break;
		case 'checkAdminAuthCorrect':
			res.send({ correct: adminAuth === body.auth });
			break;
		case 'checkControlAuthCorrect':
			res.send({ correct: controlAuth === body.auth });
			break;
		case 'deleteMessage':
			if (body.auth !== adminAuth) {
				res.sendStatus(401);
				return;
			}

			channel.deleteMessageFromId(body.id);
			res.sendStatus(200);
			break;
		case 'editMessage':
			if (body.auth !== adminAuth) {
				res.sendStatus(401);
				return;
			}

			channel.editMessageFromId(body.id, addTags(body.content));
			res.sendStatus(200);
			break;
		case 'getMessageFromId':
			res.send({ message: channel.getMessageFromId(body.id) });
			break;
		case 'postReport':
			channel.postReport(body.id, body.reason);
			res.sendStatus(200);
			break;
		case 'getReports':
			if (body.auth !== adminAuth) {
				res.sendStatus(401);
				return;
			}

			res.send({ reports: channel.getReports() });
			break;
		case 'getThreadMessages':
			let thread = threads.find(thread => thread.id === body.id);

			if (thread) {
				res.send({ messages: thread.getMessages() });
			} else {
				res.sendStatus(400);
			}

			break;
		case 'postThreadMessage':
			handleThreadMessage(body, req, res);
			break;
		case 'createThread':
			threads.push(new Thread(body.id));
			res.sendStatus(200);
			break;
		case 'ignoreReport':
			if (body.auth !== adminAuth) {
				res.sendStatus(401);
				return;
			}

			channel.ignoreReport(body.id);
			res.sendStatus(200);
			break;
		case 'checkThreadExists':
			res.send({ exists: threads.find(thread => thread.id === body.id) });
			break;
		default:
			res.sendStatus(400);
	}
});

app.use((err, req, res, next) => {
	if (err.status === 502) {
		return res.status(502).sendFile('502.html', { root: path.join(__dirname, 'public') });
	}
	
	next(err);
});

function generateId() {
	let id = genRandom(70);
	while (ids.includes(id)) {
		id = genRandom(70);
	}
	ids.push(id);
	return id;
}

function handlePostMessage(body, req, res) {
	if (channel.isLocked().locked) {
		res.sendStatus(403);
		return;
	}

	let sanitizedUsername = sanitizeUsername(body.message.username);

	channel.postMessage({
		username: filter(sanitizedUsername),
		timestamp: filter(body.message.timestamp),
		content: filter(body.message.content),
		id: generateId(),
		badges: []
	});

	res.sendStatus(200);
}

function handleThreadMessage(body, req, res) {
	let sanitizedUsername = sanitizeUsername(body.message.username);

	threads.find(thread => thread.id === body.id).postMessage({
		username: filter(sanitizedUsername),
		timestamp: filter(body.message.timestamp),
		content: filter(body.message.content),
		id: generateId()
	});

	res.sendStatus(200);
}

function handleBotMessage(body, res) {
	if (channel.isLocked().locked) {
		res.sendStatus(403);
		return;
	}

	let sanitizedUsername = '[BOT] ' + sanitizeUsername(body.message.username);

	channel.postMessage({
		content: body.message.content,
		username: sanitizedUsername,
		timestamp: 'BOT MESSAGE',
		id: generateId(),
		badges: [
			'verified-bot',
		]
	});

	res.sendStatus(200);
}

function handleSystemMessage(body, res) {
	let sanitizedUsername = '[SYSTEM] ' + sanitizeUsername(body.message.username);

	channel.postMessage({
		content: body.message.content,
		username: sanitizedUsername,
		timestamp: 'SYSTEM MESSAGE',
		id: generateId(),
		badges: [
			'verified-system',
			'admin',
			'important',
		]
	});

	res.sendStatus(200);
}

function handleAdminMessage(body, req, res) {
	let sanitizedUsername = sanitizeUsername(body.message.username);

	channel.postMessage({
		content: filter(body.message.content),
		username: filter(sanitizedUsername),
		timestamp: body.message.timestamp,
		id: generateId(),
		badges: [
			'verified',
			'admin',
			'important',
		]
	});

	res.sendStatus(200);
}

function handleClear(body, res) {
	if (body.auth !== adminAuth && body.auth !== controlAuth) {
		res.sendStatus(401);
		return;
	}

	channel.clear();
	res.sendStatus(200);
}

function handleLock(body, res) {
	if (body.auth !== adminAuth && body.auth !== controlAuth) {
		res.sendStatus(401);
		return;
	}

	channel.lock();

	res.sendStatus(200);
}

function handleGetBackup(body, res) {
	if (body.auth !== controlAuth) {
		res.sendStatus(401);
		return;
	}

	res.send({ messages: channel.getBackup() });
}

function sanitizeUsername(username) {
	const prefixes = ['[ADMIN]', '[BOT]', '[SYSTEM]'];
	for (const prefix of prefixes) {
		if (username.startsWith(prefix)) {
			return 'Shame on me';
		}
	}
	return stripEmojis(username);
}

app.listen(port, () => {
	console.log(`Listening on port ${port}`);

	if(!fs.existsSync(dataPath)) {
		initJSON();
	}

	readJSON();

	channel.messageArray = json.channel.messages.messageArray;
	channel.reports = json.channel.reports;
	channel.locked = json.channel.lock.locked;
	channel.lockMessage = json.channel.lock.lockMessage;
	channel.messageBackup = json.channel.messages.messageBackup;

	threads = json.threads.map(thread => {
		let newThread = new Thread(thread.id);
		newThread.messageArray = thread.messages;
		return newThread;
	});

	ids = json.ids;

	updateJSON();

	setInterval(() => {
		updateJSON();
	}, 200);
});
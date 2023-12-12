const express = require('express');
const fs = require('fs');
const Filter = require('./filter');
const Channel = require('./channel');
const Thread = require('./thread');
const { genRandom, stripHTML, stripEmojis } = require('./utils');
const config = require('./config');

const app = express();

// Initialize Channel, Threads, and IDs
let channel = new Channel();
let threads = [];
let ids = [];
let data = {};

console.log('[NOTICE] Admin Authentication is <' + config.adminAuth + '>.');

function updateJSON() {
	data = {
		channel: channel.toJSON(),
		threads: threads.map((thread) => {
			return thread.toJSON();
		}),
		ids: ids,
	};

	fs.writeFileSync(config.dataPath, JSON.stringify(data, null, 4));
}

function initJSON() {
	data = {
		channel: {
			messages: [],
			reports: [],
			lock: {
				locked: false,
				lockMessage: "Thread is 🔓 Unlocked 🔓",
			}
		},
		threads: [],
		ids: [],
	};

	fs.writeFileSync(config.dataPath, JSON.stringify(data, null, 4));
}

function readJSON() {
	try {
		data = JSON.parse(fs.readFileSync(config.dataPath));
	} catch (e) {
		console.error('Error parsing JSON:', e.message);
	}
}

function formatContent(content) {
	return filter(addTags(stripHTML(content)));
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
		case 'checkAdminAuthCorrect':
			res.send({ correct: config.adminAuth === body.auth });
			break;
		case 'deleteMessage':
			if (body.auth !== config.adminAuth) {
				res.sendStatus(401);
				return;
			}

			channel.deleteMessageFromId(body.id);
			res.sendStatus(200);
			break;
		case 'editMessage':
			if (body.auth !== config.adminAuth) {
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
			if (body.auth !== config.adminAuth) {
				res.sendStatus(401);
				return;
			}

			res.send({ reports: channel.getReports() });
			break;
		case 'getThreadMessages':
			if (threads.find(thread => thread.id === body.id)) {
				res.send({ messages: threads.find(thread => thread.id === body.id).getMessages() });
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
			if (body.auth !== config.adminAuth) {
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

	let username = filter(formatUsername(body.message.username));

	channel.postMessage({
		username,
		timestamp: filter(body.message.timestamp),
		content: formatContent(body.message.content),
		id: generateId(),
		badges: []
	});

	res.sendStatus(200);
}

function handleThreadMessage(body, req, res) {
	let username = filter(formatUsername(body.message.username));

	threads.find(thread => thread.id === body.id).postMessage({
		username,
		timestamp: filter(body.message.timestamp),
		content: formatContent(body.message.content),
		id: generateId()
	});

	res.sendStatus(200);
}

function handleBotMessage(body, res) {
	if (channel.isLocked().locked) {
		res.sendStatus(403);
		return;
	}

	let username = filter(formatUsername(body.message.username));

	channel.postMessage({
		content: formatContent(body.message.content),
		username,
		timestamp: 'BOT MESSAGE',
		id: generateId(),
		badges: [
			'verified-bot',
		]
	});

	res.sendStatus(200);
}

function handleSystemMessage(body, res) {
	let username = filter(formatUsername(body.message.username));

	channel.postMessage({
		content: formatContent(body.message.content),
		username,
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
	let username = filter(formatUsername(body.message.username));

	channel.postMessage({
		content: formatContent(body.message.content),
		username,
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
	if (body.auth !== config.adminAuth) {
		res.sendStatus(401);
		return;
	}

	channel.clear();
	res.sendStatus(200);
}

function handleLock(body, res) {
	if (body.auth !== config.adminAuth) {
		res.sendStatus(401);
		return;
	}

	channel.lock();

	res.sendStatus(200);
}

function formatUsername(username) {
	const prefixes = ['[ADMIN]', '[BOT]', '[SYSTEM]'];
	for (const prefix of prefixes) {
		if (username.startsWith(prefix)) {
			return 'Shame on me';
		}
	}
	return stripEmojis(username);
}

app.listen(config.port, () => {
	console.log(`Listening on port ${config.port}`);

	if (!fs.existsSync(config.dataPath) || fs.readFileSync(config.dataPath).length === 0) {
		initJSON();
	}

	readJSON();

	channel.messageArray = data.channel.messages;
	channel.reports = data.channel.reports;
	channel.locked = data.channel.lock.locked;
	channel.lockMessage = data.channel.lock.lockMessage;

	threads = data.threads.map(thread => {
		let newThread = new Thread(thread.id);
		newThread.messageArray = thread.messages;
		return newThread;
	});

	ids = data.ids;

	updateJSON();

	setInterval(() => {
		updateJSON();
	}, 200);
});
const express = require('express');
const fs = require('fs');
const Filter = require('./filter');
const Channel = require('./channel');

const app = express();
const port = 3000;

let channel = new Channel();

const auth = "kkk0";

console.log('[NOTICE] Authentication is <' + auth + '>.');

function filter(text) {
    const filter = new Filter();
    return filter.clean(text);
}

function blockPage() {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Access Denied</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"crossorigin="anonymous" /><style>body {font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;background-color: #f8f9fa;margin: 0;padding: 0;display: flex;flex-direction: column;align-items: center;justify-content: center;height: 100vh;}.container {text-align: center;}.icon {color: #dc3545;font-size: 5em;}h1 {color: #dc3545;margin-top: 10px;}p {color: #6c757d;margin-top: 10px;}footer {position: fixed;bottom: 0;left: 0;width: 100%;background-color: #343a40;color: #ffffff;padding: 10px;text-align: center;}</style></head><body><div class="container"><div class="icon"><i class="fas fa-times-circle"></i></div><h1>Access Denied</h1><p>You have been blocked from this site.</p></div><footer>Time: <span id="time"></span></footer><script>setInterval(() => {document.getElementById("time").innerHTML = new Date().toLocaleString();fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"checkKilled"})}).then(e=>e.json()).then(e=>{if(e.killed === false){window.location.reload()}});}, 1000);</script></body></html>`;
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function readFileAndSend(res, filePath) {
    if (channel.isKilled() && filePath !== './control/index.html') {
        res.send(blockPage());
        return;
    }

    fs.readFile(filePath, 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading file:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
}

app.get("/", (req, res) => {
    readFileAndSend(res, './index.html');
});

app.get("/app", (req, res) => {
    readFileAndSend(res, './app/index.html');
});

app.get("/app/admin", (req, res) => {
    readFileAndSend(res, './app/admin/index.html');
});

app.get("/app/manager", (req, res) => {
    readFileAndSend(res, './app/manager/index.html');
});

app.get("/control", (req, res) => {
    readFileAndSend(res, './control/index.html');
});

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
        case 'managerMessage':
            handleManagerMessage(body, req, res);
            break;
        case 'clear':
            handleClear(body, res);
            break;
        case 'lock':
            handleLock(body, res);
            break;
        case 'kill':
            handleKill(body, res);
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
        case 'checkKilled':
            res.send({ killed: channel.isKilled() });
            break;
        case 'checkAuthCorrect':
            res.send({ correct: auth === body.auth });
            break;
        default:
            res.sendStatus(400);
    }
});

function handlePostMessage(body, req, res) {
    if (channel.isLocked().locked) {
        res.sendStatus(403);
        return;
    }

    let sanitizedUsername = sanitizeUsername(body.message.username);

    channel.postMessage({
        username: filter(sanitizedUsername),
        timestamp: body.message.timestamp,
        content: filter(body.message.content),
        badges: []
    });

    res.sendStatus(200);
}

function handleBotMessage(body, res) {
    if (channel.isLocked().locked) {
        res.sendStatus(403);
        return;
    }

    let sanitizedUsername = "[BOT] " + sanitizeUsername(body.message.username);

    channel.postMessage({
        content: body.message.content,
        username: sanitizedUsername,
        timestamp: 'BOT MESSAGE',
        badges: [
            'verified-bot',
        ]
    });

    res.sendStatus(200);
}

function handleSystemMessage(body, res) {
    let sanitizedUsername = "[SYSTEM] " + sanitizeUsername(body.message.username);

    channel.postMessage({
        content: body.message.content,
        username: sanitizedUsername,
        timestamp: 'SYSTEM MESSAGE',
        badges: [
            'verified-system',
            'admin',
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
        badges: [
            'verified',
            'admin',
        ]
    });

    res.sendStatus(200);
}

function handleManagerMessage(body, req, res) {
    let sanitizedUsername = sanitizeUsername(body.message.username);

    channel.postMessage({
        content: filter(body.message.content),
        username: filter(sanitizedUsername),
        timestamp: body.message.timestamp,
        badges: [
            'verified',
            'admin',
            'manager'
        ]
    });
}

function handleClear(body, res) {
    if (body.auth !== controlAuth) {
        res.sendStatus(401);
        return;
    }

    channel.clear();
    res.sendStatus(200);
}

function handleLock(body, res) {
    if (body.auth !== controlAuth) {
        res.sendStatus(401);
        return;
    }

    channel.lock();

    res.sendStatus(200);
}

function handleKill(body, res) {
    if (body.auth !== controlAuth) {
        res.sendStatus(401);
        return;
    }
    channel.kill();
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
            return "Shame on me";
        }
    }
    return username;
}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
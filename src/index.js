const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const Filter = require('./filter');

const app = express();
const port = 3000;

let messageArray = [];
let messageBackup = [];

let locked = false;
let killed = false;

const adminAuth = "aa24";
const controlAuth = "kkk0";

let mainMessage = "Thread is 🔓 Unlocked 🔓";

console.log('[NOTICE] Authentication for Admin Portal is <' + adminAuth + '>.');
console.log('[NOTICE] Authentication for Control Panel is <' + controlAuth + '>.');

function filter(text) {
    const filter = new Filter();
    return filter.clean(text);
}

function blockPage() {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Access Denied</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"crossorigin="anonymous" /><style>body {font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;background-color: #f8f9fa;margin: 0;padding: 0;display: flex;flex-direction: column;align-items: center;justify-content: center;height: 100vh;}.container {text-align: center;}.icon {color: #dc3545;font-size: 5em;}h1 {color: #dc3545;margin-top: 10px;}p {color: #6c757d;margin-top: 10px;}footer {position: fixed;bottom: 0;left: 0;width: 100%;background-color: #343a40;color: #ffffff;padding: 10px;text-align: center;}</style></head><body><div class="container"><div class="icon"><i class="fas fa-times-circle"></i></div><h1>Access Denied</h1><p>You have been blocked from this site.</p></div><footer>Time: <span id="time"></span></footer><script>setInterval(() => {document.getElementById("time").innerHTML = new Date().toLocaleString();}, 1000);</script></body></html>`;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    if (killed) {
        res.send(blockPage());
        return;
    }

    fs.readFile('./index.html', 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading file:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
});

app.get("/app", (req, res) => {
    if (killed) {
        res.send(blockPage());
        return;
    }

    fs.readFile('./app/index.html', 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading file:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
});

app.get("/app/admin", (req, res) => {
    if (killed) {
        res.send(blockPage());
        return;
    }

    fs.readFile('./app/admin/index.html', 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading file:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
});

app.get("/control", (req, res) => {
    fs.readFile('./control/index.html', 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading file:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
});

app.post('/api', (req, res) => {
    let body = req.body;

    if (body.type === 'getMessages') {
        res.send({ messages: messageArray });
    } else if (body.type === 'postMessage') {
        if (locked) {
            res.sendStatus(403);
            return;
        }

        if (body.message.username.startsWith('[ADMIN]') || body.message.username.startsWith('[BOT]') || body.message.username.startsWith('[SYSTEM]')) {
            body.message.username = "Shame on me";
        }

        messageArray.push({ content: filter(body.message.content), username: filter(body.message.username), timestamp: body.message.timestamp + ' - ' + req.ip });
        messageBackup.push({ content: filter(body.message.content), username: filter(body.message.username), timestamp: body.message.timestamp + ' - ' + req.ip });
        res.sendStatus(200);
    } else if (body.type === 'botMessage') {
        messageArray.push({ content: body.message.content, username: '[BOT] ' + body.message.username, timestamp: 'BOT MESSAGE' });
        messageBackup.push({ content: body.message.content, username: '[BOT] ' + body.message.username, timestamp: 'BOT MESSAGE' });
        res.sendStatus(200);
    } else if (body.type === 'systemMessage') {
        messageArray.push({ content: body.message.content, username: '[SYSTEM] ' + body.message.username, timestamp: 'SYSTEM MESSAGE' });
        messageBackup.push({ content: body.message.content, username: '[SYSTEM] ' + body.message.username, timestamp: 'SYSTEM MESSAGE' });
        res.sendStatus(200);
    } else if (body.type === 'adminMessage') {
        messageArray.push({ content: filter(body.message.content), username: filter("[ADMIN] " + body.message.username), timestamp: body.message.timestamp + ' - ' + req.ip });
        messageBackup.push({ content: filter(body.message.content), username: filter("[ADMIN] " + body.message.username), timestamp: body.message.timestamp + ' - ' + req.ip });
        res.sendStatus(200);
    } else if (body.type === 'clear') {
        if (body.auth !== controlAuth) {
            res.sendStatus(401);
            return;
        }

        messageArray = [];
        res.sendStatus(200);
    } else if (body.type === 'lock') {
        if (body.auth !== controlAuth) {
            res.sendStatus(401);
            return;
        }

        if (locked) {
            mainMessage = "Thread is 🔓 Unlocked 🔓";
            locked = false;
        } else {
            mainMessage = "Thread is 🔒 Locked 🔒";
            locked = true;
        }
    } else if (body.type === 'kill') {
        if (body.auth !== controlAuth) {
            res.sendStatus(401);
            return;
        }

        if (killed) {
            killed = false;
        } else {
            killed = true;
        }
    } else if (body.type === 'checkLocked') {
        res.send({ locked: locked });
    } else if (body.type === 'getMessage') {
        res.send({ message: mainMessage });
    } else if (body.type === 'getBackup') {
        if (body.auth !== controlAuth) {
            res.sendStatus(401);
            return;
        }

        res.send({ messages: messageBackup });
    } else if (body.type === 'checkKilled') {
        res.send({ killed: killed });
    } else {
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
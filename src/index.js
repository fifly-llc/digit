const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const badWords = require('bad-words');

const app = express();
const port = 3000;

let messageArray = [];

let locked = false;

const adminAuth = "aa24";
const controlAuth = "kkk0";

let mainMessage = "Thread is 🔓 Unlocked 🔓";

console.log('[NOTICE] Authentication for Admin Portal is <' + adminAuth + '>.');
console.log('[NOTICE] Authentication for Control Panel is <' + controlAuth + '>.');

function filter(text) {
    const filter = new badWords();
    return filter.clean(text);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
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
    fs.readFile('./app/admin/index.html', 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading file:', error);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
});

app.get("/app/control", (req, res) => {
    fs.readFile('./app/control/index.html', 'utf8', (error, data) => {
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

        if (body.message.username.startsWith('[ADMIN]') || body.message.username.startsWith('[BOT]') || body.message.username.startsWith('[SYSTEM]') || body.message.username.startsWith('[CHORE]')) {
            body.message.username = "Shame on me";
        }

        messageArray.push({ content: filter(body.message.content), username: filter(body.message.username), timestamp: body.message.timestamp });
        res.sendStatus(200);
    } else if (body.type === 'botMessage') {
        messageArray.push({ content: body.message.content, username: '[BOT] ' + body.message.username, timestamp: 'BOT MESSAGE' });
        res.sendStatus(200);
    } else if (body.type === 'systemMessage') {
        messageArray.push({ content: body.message.content, username: '[SYSTEM] ' + body.message.username, timestamp: 'SYSTEM MESSAGE' });
        res.sendStatus(200);
    } else if (body.type === 'adminMessage') {
        if (body.auth !== adminAuth) {
            body.message.username = "I pretended to be an admin (" + body.message.username + ")";
        }

        messageArray.push({ content: filter(body.message.content), username: filter("[ADMIN] " + body.message.username), timestamp: body.message.timestamp });
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

        process.exit(0);
    } else if (body.type === 'checkLocked') {
        res.send({ locked: locked });
    } else if (body.type === 'getMessage') {
        res.send({ message: mainMessage });
    } else {
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
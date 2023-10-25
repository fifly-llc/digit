const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

let messageArray = [];

let adminAuth = "6619";

console.log('[NOTICE] Authentication for Admin Portal is <' + adminAuth + '>.');

function choreHandler(chore, message) {
    if (chore === 'warn') {
        messageArray.push({ content: message, username: '[CHORE] Warn Manager', timestamp: 'CHORE' });
    }

    return;
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

app.get("/portal", (req, res) => {
    fs.readFile('./portal/index.html', 'utf8', (error, data) => {
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
        if (body.message.username.startsWith('[ADMIN]') || body.message.username.startsWith('[BOT]') || body.message.username.startsWith('[SYSTEM]') || body.message.username.startsWith('[CHORE]')) {
            body.message.username = "Shame on me";       
        }

        messageArray.push({ content: body.message.content, username: body.message.username, timestamp: body.message.timestamp });
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

        messageArray.push({ content: body.message.content, username: '[ADMIN] ' + body.message.username, timestamp: body.message.timestamp });
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
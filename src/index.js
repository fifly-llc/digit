const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

let messageArray = [];

//let adminAuth = genRandom(5);
let adminAuth = "441a"; // Set this to whatever or use random generation

console.log('[NOTICE] Authentication for Admin Portal is <' + adminAuth + '>.');

/*function genRandom(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}*/

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

app.post('/api', (req, res) => {
    let body = req.body;

    if (body.type === 'getMessages') {
        res.send({ messages: messageArray });
    } else if (body.type === 'postMessage') {
        if (body.message.username.startsWith('[ADMIN]') || body.message.username.startsWith('[BOT]') || body.message.username.startsWith('[SYSTEM]')) {
            body.message.username = "I pretended to be an admin, a bot, or a system bot (" + body.message.username + ")";          
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
    } else if (body.type === 'getAdminAuth') {
        res.send({ auth: adminAuth });
    } else {
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
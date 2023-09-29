const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

let messageArray = [];
let threads = [];

function sanitize(inputString) {
    var nonFormattingTagsRegex = /<(?!\/?(a|b|i|u|em|strong|span|abbr|acronym|address|bdo|big|cite|code|del|dfn|font|kbd|ins|mark|pre|q|rp|rt|ruby|s|samp|small|strike|sub|sup|tt|var|bdi|bgsound|blink|spacer)[\s\/>])([a-zA-Z-]+)(?:\s[^>]*)?>|<\/(?!a|b|i|u|em|strong|span|abbr|acronym|address|bdo|big|cite|code|del|dfn|font|kbd|ins|mark|pre|q|rp|rt|ruby|s|samp|small|strike|sub|sup|tt|var|bdi|bgsound|blink|spacer)[\s>])/gi;
    var outputString = inputString.replace(nonFormattingTagsRegex, '');
    return outputString.replace(/\s+/g, ' ').replace('&nbsp;', '').replace('\n', '');
}

function genThreadId() {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
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

app.post('/api', (req, res) => {
    let body = req.body;

    if(body.type === 'getMessages') {
        res.send({ messages: messageArray });
    } else if (body.type === 'postMessage') {
        messageArray.push(sanitize(body.message));
        res.sendStatus(200);
    } else if (body.type === 'getThreadMessages') {
        res.send({ messages: threads[body.threadId].messages });
    } else if (body.type === 'postThreadMessage') {
        if (body.password === threads[body.threadId].password)
            res.send(find(item => item.id === body.threadId).messages);
        else
            res.sendStatus(401);
    } else if (body.type === 'createThread') {
        if (body.visability === 'private') {
            threads.push({ messages: [], visability: false, password: body.password, id: genThreadId() });
            res.sendStatus(200);
        } else {
            threads.push({ messages: [], visability: true, id: genThreadId() });
            res.sendStatus(200);
        }
    } else if (body.type === 'deleteThread') {
        threads = threads.filter(item => item.id !== body.threadId);
        res.sendStatus(200);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
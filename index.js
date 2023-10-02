const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

let messageArray = [];
let voiceChats = [];

function sanitize(inputString) {
    const allowedTags = ['a', 'b', 'i', 'u', 'em', 'strong', 'span', 'abbr', 'acronym', 'address', 'bdo', 'big', 'cite', 'code', 'del', 'dfn', 'font', 'kbd', 'ins', 'mark', 'pre', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'small', 'strike', 'sub', 'sup', 'tt', 'var', 'bdi', 'bgsound', 'blink', 'spacer'];

    const nonFormattingTagsRegex = new RegExp(`<\\/?(?!(${allowedTags.join('|')}))([a-zA-Z-]+)(?:\\s[^>]*)?>`, 'gi');
    const outputString = inputString.replace(nonFormattingTagsRegex, '');

    return outputString.replace(/\s+/g, ' ').replace('&nbsp;', '').replace('\n', '');
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

    if (body.type === 'getMessages') {
        res.send({ messages: messageArray });
    } else if (body.type === 'postMessage') {
        messageArray.push({ content: sanitize(body.message.content), username: sanitize(body.message.username), timestamp: sanitize(body.message.timestamp) });
        res.sendStatus(200);
    } else if (body.type === 'postVoice') {
        let vc = voiceChats.find(vc => vc.code === body.code);
        if (vc) {
            vc.audio = body.audio;
            res.sendStatus(200);
        }
    } else if (body.type === 'getVoice') {
        let vc = voiceChats.find(vc => vc.code === body.code);
        if (vc) {
            res.send(vc.audio);
        }
    } else {
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
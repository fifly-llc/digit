const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

let messageArray = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(fs.readFileSync('./index.html'));
});

app.get('/app', (req, res) => {
    res.send(fs.readFileSync('./app/index.html'));
});

app.post('/api', (req, res) => {
    let body = req.body;

    if(body.type === 'getMessages') {
        res.send({ messages: messageArray });
    } else if (body.type === 'postMessage') {
        console.log(body.message);
        messageArray.push(body.message);
        res.sendStatus(200);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
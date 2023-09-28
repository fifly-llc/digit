const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

let messageArray = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kinesis</title>
</head>
<body>
    <h1>Kinesis</h1>
    <p>Kinesis is an open-source messaging platform that has no restrictions.</p>
    <a href="/app">Get In</a>
</body>
</html>`);
});

app.get('/app', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kinesis App</title>
    <style>
        .send {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .send input {
            width: 300px;
            height: 30px;
            border: 1px solid black;
            border-radius: 5px;
            padding: 5px;
        }

        .send button {
            height: 30px;
            border: 1px solid black;
            border-radius: 5px;
            padding: 5px;
            margin-left: 10px;
        }

        .message {
            padding: 10px;
            border: 1px solid black;
            border-radius: 5px;
            margin: 10px;
            width: 300px;
        }
    </style>
</head>
<body>
    <div class="send">
        <input type="text" name="message" id="message">
        <button id="send">Send</button>
    </div>
    <div class="messages"></div>
</body>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const messages = document.querySelector('.messages');

        let messageArray = [];

        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',

            },
            body: JSON.stringify({
                type: 'getMessages',
            })
        }).then(res => {
            return res.json();
        }).then(data => {
            messageArray = data.messages;
        });

        messageArray.forEach(message => {
            let msg = message.content;
            messages.innerHTML = '<div class="message">' + msg + '</div' + messages.innerHTML;
        });

        document.getElementById('send').addEventListener('click', () => {
            fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'postMessage',
                    message: {
                        content: document.getElementById('message').value
                    }
                })
            });
        });
    });
</script>
</html>`);
});

app.post('/api', (req, res) => {
    let body = req.body;

    if(body.type === 'getMessages') {
        res.send({ messages: messageArray });
    } else if (body.type === 'postMessage') {
        messageArray.push(body.message);
        res.sendStatus(200);
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
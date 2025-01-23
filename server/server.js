const auth = require('json-server-auth');
const jsonServer = require('json-server');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

global.io = io;

const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 9000;

// response middleware
router.render = (req, res) => {
    const path = req.path;
    const method = req.method;

    // emit event for conversations
    if (path.includes('/conversations') && (method === 'POST' || method === 'PATCH')) {
        // emit server event
        io.emit('conversation', {
            body: res.locals.data,
        });
    }

    // emit event for messages
    if (path.includes('/messages') && method === 'POST') {
        // emit server event
        io.emit('message', {
            body: res.locals.data,
        });
    }

    return req.json(res.locals.data);
};

// Bind the router db to the app
app.db = router.db;

app.use(middlewares);

const rules = auth.rewriter({
    users: 640,
    conversations: 660,
    messages: 660,
});

app.use(rules);
app.use(auth);
app.use(router);

server.listen(port);

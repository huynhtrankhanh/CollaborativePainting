const express = require('express');
const app = express();
const PORT = 3000;

let clients = [];

// Serve static files (HTML and JS)
app.use(express.static(__dirname + '/public'));

// Middleware to parse JSON
app.use(express.json());

// Endpoint to receive paint events from clients
app.post('/paint-stream', (req, res) => {
    req.setEncoding('utf8');

    req.on('data', (chunk) => {
        try {
            const events = chunk.trim().split('\n').map(line => JSON.parse(line));
            events.forEach(event => {
                const eventData = `data: ${JSON.stringify(event)}\n\n`;
                clients.forEach(client => client.write(eventData));  // Broadcast to all connected clients
            });
        } catch (error) {
            console.error('Error parsing event data:', error);
        }
    });

    req.on('end', () => {
        res.status(200).end();
    });
});

// SSE endpoint for clients to subscribe to paint events
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Start streaming

    // Add client to clients array
    clients.push(res);

    // Remove client on disconnect
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

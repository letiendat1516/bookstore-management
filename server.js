const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/books', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'books.html'));
});

app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'orders.html'));
});

// Start JSON Server in background
const jsonServer = spawn('npx', ['json-server', '--watch', 'db.json', '--port', '3001'], {
    stdio: 'inherit'
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    jsonServer.kill('SIGTERM');
});

process.on('SIGINT', () => {
    jsonServer.kill('SIGINT');
    process.exit(0);
});

// Start Express server
app.listen(PORT, () => {
    console.log(`🚀 Bookstore Management Server running on http://localhost:${PORT}`);
    console.log(`📚 JSON Server API running on http://localhost:3001`);
    console.log(`💡 Use Ctrl+C to stop both servers`);
});
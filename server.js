const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints untuk bot trading
app.post('/api/bot/start', (req, res) => {
    // Logic untuk start bot
    res.json({ success: true, message: 'Bot started' });
});

app.post('/api/bot/stop', (req, res) => {
    // Logic untuk stop bot
    res.json({ success: true, message: 'Bot stopped' });
});

app.get('/api/positions', (req, res) => {
    // Logic untuk get positions
    res.json({ positions: [] });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const crypto = require('crypto');
const axios = require('axios');

// Binance API integration
const BINANCE_BASE_URL = 'https://fapi.binance.com';

function createSignature(queryString, secret) {
    return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

app.get('/api/account', async (req, res) => {
    try {
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = createSignature(queryString, process.env.BINANCE_SECRET_KEY);
        
        const response = await axios.get(`${BINANCE_BASE_URL}/fapi/v2/account`, {
            headers: {
                'X-MBX-APIKEY': process.env.BINANCE_API_KEY
            },
            params: {
                timestamp,
                signature
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

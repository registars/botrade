const express = require('express');
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Binance API Configuration
const BINANCE_BASE_URL = 'https://fapi.binance.com';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Helper function to create signature
function createSignature(queryString, secret) {
    return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoints for Binance trading
app.post('/api/bot/start', (req, res) => {
    // Logic to start bot
    res.json({ success: true, message: 'Bot started' });
});

app.post('/api/bot/stop', (req, res) => {
    // Logic to stop bot
    res.json({ success: true, message: 'Bot stopped' });
});

// Get account information
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

// Create new order
app.post('/api/order', async (req, res) => {
    try {
        const { symbol, side, type, quantity, price, stopPrice, reduceOnly } = req.body;
        
        const timestamp = Date.now();
        let queryString = `symbol=${symbol}&side=${side}&type=${type}&quantity=${quantity}`;
        
        if (price) queryString += `&price=${price}`;
        if (stopPrice) queryString += `&stopPrice=${stopPrice}`;
        if (reduceOnly) queryString += `&reduceOnly=${reduceOnly}`;
        queryString += `&timestamp=${timestamp}`;
        
        const signature = createSignature(queryString, process.env.BINANCE_SECRET_KEY);
        
        const response = await axios.post(`${BINANCE_BASE_URL}/fapi/v1/order`, null, {
            headers: {
                'X-MBX-APIKEY': process.env.BINANCE_API_KEY
            },
            params: {
                ...req.body,
                timestamp,
                signature
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.response?.data || error.message });
    }
});

// Get open positions
app.get('/api/positions', async (req, res) => {
    try {
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = createSignature(queryString, process.env.BINANCE_SECRET_KEY);
        
        const response = await axios.get(`${BINANCE_BASE_URL}/fapi/v2/positionRisk`, {
            headers: {
                'X-MBX-APIKEY': process.env.BINANCE_API_KEY
            },
            params: {
                timestamp,
                signature
            }
        });
        
        // Filter only positions with non-zero positionAmt
        const positions = response.data.filter(pos => parseFloat(pos.positionAmt) !== 0);
        res.json({ positions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const { symbol } = req.query;
        const timestamp = Date.now();
        let queryString = `timestamp=${timestamp}`;
        if (symbol) queryString += `&symbol=${symbol}`;
        
        const signature = createSignature(queryString, process.env.BINANCE_SECRET_KEY);
        
        const response = await axios.get(`${BINANCE_BASE_URL}/fapi/v1/allOrders`, {
            headers: {
                'X-MBX-APIKEY': process.env.BINANCE_API_KEY
            },
            params: {
                symbol,
                timestamp,
                signature
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel order
app.delete('/api/order', async (req, res) => {
    try {
        const { symbol, orderId } = req.query;
        const timestamp = Date.now();
        const queryString = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
        const signature = createSignature(queryString, process.env.BINANCE_SECRET_KEY);
        
        const response = await axios.delete(`${BINANCE_BASE_URL}/fapi/v1/order`, {
            headers: {
                'X-MBX-APIKEY': process.env.BINANCE_API_KEY
            },
            params: {
                symbol,
                orderId,
                timestamp,
                signature
            }
        });
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get exchange info
app.get('/api/exchangeInfo', async (req, res) => {
    try {
        const response = await axios.get(`${BINANCE_BASE_URL}/fapi/v1/exchangeInfo`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get price ticker
app.get('/api/ticker', async (req, res) => {
    try {
        const { symbol } = req.query;
        const response = await axios.get(`${BINANCE_BASE_URL}/fapi/v1/ticker/price`, {
            params: { symbol }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// Explicitly serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Barcode Label Generator is running' });
});

// Proxy endpoint for Shopify products
app.post('/api/shopify/products', async (req, res) => {
    try {
        const { shopUrl, accessToken } = req.body;
        
        if (!shopUrl || !accessToken) {
            return res.status(400).json({ error: 'Missing shopUrl or accessToken' });
        }

        const cleanUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const apiUrl = `https://${cleanUrl}/admin/api/2024-01/products.json?limit=250`;

        const response = await fetch(apiUrl, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: 'Shopify API error', 
                details: errorText 
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching from Shopify:', error);
        res.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Shopify Proxy Server running on http://localhost:${PORT}`);
    console.log(`📦 Ready to fetch products from Shopify`);
});

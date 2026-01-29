const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Health check endpoint - MUST come before static files
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Barcode Label Generator is running' });
});

// API endpoint for Shopify products - MUST come before static files
app.post('/api/shopify/products', async (req, res) => {
    try {
        const { shopUrl, accessToken } = req.body;
        
        if (!shopUrl || !accessToken) {
            return res.status(400).json({ error: 'Missing shopUrl or accessToken' });
        }

        const cleanUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const apiUrl = `https://${cleanUrl}/admin/api/2024-01/products.json?limit=250`;

        console.log(`Fetching products from: ${cleanUrl}`);

        const response = await fetch(apiUrl, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Shopify API error:', errorText);
            return res.status(response.status).json({ 
                error: 'Shopify API error', 
                details: errorText 
            });
        }

        const data = await response.json();
        console.log(`Successfully fetched ${data.products.length} products`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching from Shopify:', error);
        res.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
});

// Serve static files - MUST come after API routes
app.use(express.static(__dirname));

// Serve index.html at root - MUST come last
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Shopify Barcode Label Generator running on port ${PORT}`);
    console.log(`📦 Ready to fetch products from Shopify`);
    console.log(`🌐 Health check available at /health`);
});

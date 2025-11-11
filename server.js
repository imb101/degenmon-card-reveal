const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Serve static files (card images, CSS, JS)
app.use('/cards', express.static('cards'));
app.use(express.static('public'));

// Load card pack configuration from JSON file
let cardPacks = {};

function loadPackConfig() {
  try {
    const configPath = path.join(__dirname, 'card-packs.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    cardPacks = JSON.parse(configData);
    console.log('Loaded card packs:', Object.keys(cardPacks).join(', '));
  } catch (error) {
    console.error('Error loading card-packs.json:', error.message);
    console.log('Using default configuration');
    // Fallback default configuration
    cardPacks = {
      standard: {
        name: "Standard Pack",
        totalCards: 100,
        folder: "standard",
        cardBack: "card-back.jpg"
      }
    };
  }
}

// Load configuration on startup
loadPackConfig();

// Watch for configuration file changes (optional - auto-reload)
fs.watch(path.join(__dirname, 'card-packs.json'), (eventType) => {
  if (eventType === 'change') {
    console.log('Card pack configuration changed, reloading...');
    loadPackConfig();
  }
});

// API endpoint to get available packs
app.get('/api/packs', (req, res) => {
  res.json(cardPacks);
});

// API endpoint to get 5 random cards from a specific pack
app.get('/api/random-cards/:pack', (req, res) => {
  const packId = req.params.pack;
  const pack = cardPacks[packId];
  
  if (!pack) {
    return res.status(404).json({ error: 'Pack not found' });
  }
  
  const cardCount = 5;
  const selectedCards = [];
  
  // Generate 5 unique random card numbers
  while (selectedCards.length < cardCount) {
    const randomCard = Math.floor(Math.random() * pack.totalCards) + 1;
    if (!selectedCards.includes(randomCard)) {
      selectedCards.push(randomCard);
    }
  }
  
  // Return card filenames with pack folder
  const cardFiles = selectedCards.map(num => `${pack.folder}/card${num}.jpg`);
  res.json(cardFiles);
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Card reveal server running at http://localhost:${PORT}`);
  console.log(`Available packs: ${Object.keys(cardPacks).join(', ')}`);
});
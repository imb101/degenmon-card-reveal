const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files (card images, CSS, JS)
app.use('/cards', express.static('cards'));
app.use(express.static('public'));

// API endpoint to get 5 random cards
app.get('/api/random-cards', (req, res) => {
  const totalCards = 41;
  const cardCount = 5;
  const selectedCards = [];
  
  // Generate 5 unique random card numbers
  while (selectedCards.length < cardCount) {
    const randomCard = Math.floor(Math.random() * totalCards) + 1;
    if (!selectedCards.includes(randomCard)) {
      selectedCards.push(randomCard);
    }
  }
  
  // Return card filenames (assuming cards are named card1.jpg, card2.jpg, etc.)
  const cardFiles = selectedCards.map(num => `card${num}.jpg`);
  res.json(cardFiles);
});

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Card reveal server running at http://localhost:${PORT}`);
});

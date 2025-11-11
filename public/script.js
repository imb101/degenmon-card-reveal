let cards = [];
let deck = [];
let currentFilter = 'all';
let currentPack = 'standard';
let availablePacks = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadPacks();
  
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.rarity;
      renderDeckCards();
    });
  });
});

// Load available packs
async function loadPacks() {
  try {
    const response = await fetch('/api/packs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    availablePacks = await response.json();
    
    console.log('Loaded packs:', availablePacks);
    
    const select = document.getElementById('pack-select');
    select.innerHTML = '';
    
    const packKeys = Object.keys(availablePacks);
    if (packKeys.length === 0) {
      console.error('No packs available');
      select.innerHTML = '<option>No packs available</option>';
      return;
    }
    
    packKeys.forEach(packId => {
      const option = document.createElement('option');
      option.value = packId;
      option.textContent = availablePacks[packId].name;
      select.appendChild(option);
    });
    
    // Set current pack to first available
    currentPack = packKeys[0];
    
    select.addEventListener('change', (e) => {
      currentPack = e.target.value;
      loadCards();
    });
    
    // Load initial cards
    console.log('Loading initial cards from pack:', currentPack);
    loadCards();
  } catch (error) {
    console.error('Error loading packs:', error);
    alert('Error loading packs. Please ensure the server is running and card-packs.json exists.');
  }
}

// Add event listener for re-deal button
document.getElementById('redeal-btn').addEventListener('click', () => {
  const wrappers = document.querySelectorAll('.card-wrapper');
  
  if (wrappers.length > 0) {
    // Add fly-out animation to existing cards
    wrappers.forEach(wrapper => {
      wrapper.classList.add('fly-out');
    });
    
    // Wait for fly-out animation to complete, then load new cards
    setTimeout(() => {
      loadCards();
    }, 600);
  } else {
    // No cards yet, just load
    loadCards();
  }
});

// Add event listeners for deck
document.getElementById('view-deck-btn').addEventListener('click', openDeckModal);
document.getElementById('close-deck-btn').addEventListener('click', closeDeckModal);
document.getElementById('download-deck-btn').addEventListener('click', downloadDeck);

// Fetch random cards from server
async function loadCards() {
  try {
    const response = await fetch(`/api/random-cards/${currentPack}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.error('API did not return an array:', data);
      throw new Error('Invalid response format');
    }
    
    cards = data;
    renderCards();
  } catch (error) {
    console.error('Error loading cards:', error);
    alert('Error loading cards. Please check that the server is running and card packs are configured correctly.');
  }
}

// Render card elements
function renderCards() {
  const container = document.getElementById('card-container');
  container.innerHTML = '';
  
  const packInfo = availablePacks[currentPack];
  const cardBackImage = packInfo ? `/cards/${packInfo.folder}/${packInfo.cardBack}` : '/card-back.jpg';
  
  cards.forEach((cardFile, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.dataset.zoomed = 'false';
    
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.flipped = 'false';
    card.dataset.cardfile = cardFile;
    
    // Randomly assign rarity (adjust probabilities as needed)
    const rarity = getRandomRarity();
    card.dataset.rarity = rarity || 'common';
    if (rarity) {
      card.classList.add(rarity);
    }
    
    // Card back image (pack-specific)
    const backImg = document.createElement('img');
    backImg.src = cardBackImage;
    backImg.alt = 'Card Back';
    backImg.className = 'card-back';
    
    // Card front image
    const frontImg = document.createElement('img');
    frontImg.src = `/cards/${cardFile}`;
    frontImg.alt = 'Card';
    frontImg.className = 'card-front';
    
    // Add select button
    const selectBtn = document.createElement('button');
    selectBtn.className = 'card-select-btn';
    selectBtn.textContent = 'Add to Deck';
    selectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCardSelection(card, cardFile);
    });
    
    card.appendChild(backImg);
    card.appendChild(frontImg);
    card.appendChild(selectBtn);
    wrapper.appendChild(card);
    container.appendChild(wrapper);
    
    // Add click event to flip/zoom card
    wrapper.addEventListener('click', (e) => handleCardClick(wrapper, card, e));
    
    // Add mouse move effect (only when not zoomed)
    wrapper.addEventListener('mousemove', (e) => {
      if (wrapper.dataset.zoomed === 'false') {
        handleMouseMove(e);
      }
    });
    wrapper.addEventListener('mouseleave', (e) => {
      if (wrapper.dataset.zoomed === 'false') {
        handleMouseLeave(e);
      }
    });
  });
}

// Toggle card selection for deck
function toggleCardSelection(card, cardFile) {
  const isSelected = card.classList.contains('selected');
  const selectBtn = card.querySelector('.card-select-btn');
  
  if (isSelected) {
    // Remove from deck
    card.classList.remove('selected');
    selectBtn.textContent = 'Add to Deck';
    deck = deck.filter(c => c.file !== cardFile);
  } else {
    // Add to deck
    card.classList.add('selected');
    selectBtn.textContent = 'Remove';
    deck.push({
      file: cardFile,
      rarity: card.dataset.rarity
    });
  }
  
  updateDeckStats();
}

// Update deck statistics
function updateDeckStats() {
  const stats = {
    total: deck.length,
    legendary: deck.filter(c => c.rarity === 'legendary').length,
    epic: deck.filter(c => c.rarity === 'epic').length,
    rare: deck.filter(c => c.rarity === 'rare').length,
    common: deck.filter(c => c.rarity === 'common').length
  };
  
  document.getElementById('deck-total').textContent = stats.total;
  document.getElementById('deck-legendary').textContent = stats.legendary;
  document.getElementById('deck-epic').textContent = stats.epic;
  document.getElementById('deck-rare').textContent = stats.rare;
  document.getElementById('deck-common').textContent = stats.common;
}

// Open deck modal
function openDeckModal() {
  const modal = document.getElementById('deck-modal');
  modal.classList.add('active');
  renderDeckCards();
}

// Close deck modal
function closeDeckModal() {
  const modal = document.getElementById('deck-modal');
  modal.classList.remove('active');
}

// Render deck cards in modal
function renderDeckCards() {
  const container = document.getElementById('deck-cards-container');
  container.innerHTML = '';
  
  // Filter deck based on current filter
  const filteredDeck = currentFilter === 'all' 
    ? deck 
    : deck.filter(c => c.rarity === currentFilter);
  
  if (filteredDeck.length === 0) {
    const message = currentFilter === 'all' 
      ? 'Your deck is empty. Add some cards!' 
      : `No ${currentFilter} cards in your deck.`;
    container.innerHTML = `<p style="color: white; text-align: center; font-size: 1.5em; grid-column: 1/-1;">${message}</p>`;
    return;
  }
  
  filteredDeck.forEach((deckCard) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'deck-card-wrapper';
    
    const card = document.createElement('div');
    card.className = 'card';
    if (deckCard.rarity !== 'common') {
      card.classList.add(deckCard.rarity);
    }
    
    const img = document.createElement('img');
    img.src = `/cards/${deckCard.file}`;
    img.alt = 'Deck Card';
    img.style.transform = 'none';
    img.style.position = 'relative';
    
    // Add remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      const originalIndex = deck.findIndex(c => c.file === deckCard.file && c.rarity === deckCard.rarity);
      removeFromDeck(originalIndex);
    });
    
    card.appendChild(img);
    wrapper.appendChild(card);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  });
}

// Remove card from deck
function removeFromDeck(index) {
  deck.splice(index, 1);
  updateDeckStats();
  renderDeckCards();
}

// Download deck as ZIP
async function downloadDeck() {
  if (deck.length === 0) {
    alert('Your deck is empty! Add some cards first.');
    return;
  }
  
  if (typeof JSZip === 'undefined') {
    alert('JSZip library not loaded. Please refresh the page.');
    return;
  }
  
  try {
    const zip = new JSZip();
    const folder = zip.folder('my-deck');
    
    // Create a manifest file with card info
    const manifest = deck.map((card, index) => ({
      filename: `card_${index + 1}_${card.rarity}.jpg`,
      rarity: card.rarity,
      original: card.file
    }));
    
    folder.file('manifest.json', JSON.stringify(manifest, null, 2));
    
    // Download each card image
    for (let i = 0; i < deck.length; i++) {
      const card = deck[i];
      
      try {
        const response = await fetch(`/cards/${card.file}`);
        if (!response.ok) {
          console.error(`Failed to fetch card: ${card.file}`);
          continue;
        }
        
        const blob = await response.blob();
        
        // Get file extension
        const ext = card.file.split('.').pop();
        // Create filename with rarity
        const filename = `card_${i + 1}_${card.rarity}.${ext}`;
        
        folder.file(filename, blob);
      } catch (error) {
        console.error(`Error downloading card ${card.file}:`, error);
      }
    }
    
    // Generate and download ZIP
    const content = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    saveAs(content, 'my-card-deck.zip');
    alert(`Successfully downloaded ${deck.length} cards!`);
  } catch (error) {
    console.error('Error downloading deck:', error);
    alert('Error downloading deck. Please check console for details.');
  }
}

// Get random rarity based on probabilities
function getRandomRarity() {
  const rand = Math.random() * 100;
  
  if (rand < 5) {
    return 'legendary'; // 5% chance
  } else if (rand < 20) {
    return 'epic'; // 15% chance
  } else if (rand < 50) {
    return 'rare'; // 30% chance
  }
  
  return null; // 50% chance for common (no effect)
}

// Handle card click for flip and zoom
function handleCardClick(wrapper, card, e) {
  e.stopPropagation();
  
  // If card is not flipped yet, flip it
  if (card.dataset.flipped === 'false') {
    flipCard(card);
  } 
  // If card is flipped, toggle zoom
  else {
    toggleZoom(wrapper);
  }
}

// Flip card
function flipCard(card) {
  if (card.dataset.flipped === 'false') {
    card.classList.add('flipped');
    card.dataset.flipped = 'true';
  }
}

// Toggle zoom on card
function toggleZoom(wrapper) {
  const isZoomed = wrapper.dataset.zoomed === 'true';
  
  if (isZoomed) {
    // Unzoom
    wrapper.classList.remove('zoomed');
    wrapper.dataset.zoomed = 'false';
    wrapper.style.zIndex = '1'; // Reset z-index
    
    // Remove overlay
    const overlay = document.querySelector('.zoom-overlay');
    if (overlay) {
      overlay.remove();
    }
  } else {
    // Zoom in
    wrapper.classList.add('zoomed');
    wrapper.dataset.zoomed = 'true';
    
    // Create darkening overlay to block other clicks
    // Append to body so it's not affected by container styling
    const overlay = document.createElement('div');
    overlay.className = 'zoom-overlay';
    overlay.addEventListener('click', () => toggleZoom(wrapper));
    document.body.appendChild(overlay);
  }
}

// Handle mouse movement for 3D tilt effect
function handleMouseMove(e) {
  const wrapper = e.currentTarget;
  const rect = wrapper.getBoundingClientRect();
  
  // Calculate mouse position relative to card center
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // Calculate rotation angles (max 15 degrees)
  const rotateX = ((y - centerY) / centerY) * -15;
  const rotateY = ((x - centerX) / centerX) * 15;
  
  // Apply transform with zoom - using !important to override
  wrapper.style.setProperty('transform', `
    translateZ(50px)
    rotateX(${rotateX}deg)
    rotateY(${rotateY}deg)
    scale(1.15)
  `, 'important');
  wrapper.style.setProperty('z-index', '10', 'important');
}

// Reset card position when mouse leaves
function handleMouseLeave(e) {
  const wrapper = e.currentTarget;
  wrapper.style.setProperty('transform', 'translateZ(0) rotateX(0) rotateY(0) scale(1)', 'important');
  wrapper.style.setProperty('z-index', '1', 'important');
}
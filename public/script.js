let cards = [];

// Add event listener for re-deal button
document.getElementById('redeal-btn').addEventListener('click', () => {
  const wrappers = document.querySelectorAll('.card-wrapper');
  
  // Add fly-out animation to existing cards
  wrappers.forEach(wrapper => {
    wrapper.classList.add('fly-out');
  });
  
  // Wait for fly-out animation to complete, then load new cards
  setTimeout(() => {
    loadCards();
  }, 600);
});

// Fetch random cards from server
async function loadCards() {
  try {
    const response = await fetch('/api/random-cards');
    cards = await response.json();
    renderCards();
  } catch (error) {
    console.error('Error loading cards:', error);
  }
}

// Render card elements
function renderCards() {
  const container = document.getElementById('card-container');
  container.innerHTML = '';
  
  cards.forEach((cardFile, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.dataset.zoomed = 'false';
    
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.flipped = 'false';
    
    // Randomly assign rarity (adjust probabilities as needed)
    const rarity = getRandomRarity();
    if (rarity) {
      card.classList.add(rarity);
    }
    
    // Card back image
    const backImg = document.createElement('img');
    backImg.src = '/card-back-h.jpg';
    backImg.alt = 'Card Back';
    backImg.className = 'card-back';
    
    // Card front image
    const frontImg = document.createElement('img');
    frontImg.src = `/cards/${cardFile}`;
    frontImg.alt = 'Card';
    frontImg.className = 'card-front';
    
    card.appendChild(backImg);
    card.appendChild(frontImg);
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
    // Insert it BEFORE the wrapper in DOM order so wrapper renders on top
    const overlay = document.createElement('div');
    overlay.className = 'zoom-overlay';
    overlay.addEventListener('click', () => toggleZoom(wrapper));
    //wrapper.parentNode.insertBefore(overlay, wrapper);
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

// Flip card
function flipCard(card) {
  if (card.dataset.flipped === 'false') {
    card.classList.add('flipped');
    card.dataset.flipped = 'true';
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

// Initialize on page load
loadCards();

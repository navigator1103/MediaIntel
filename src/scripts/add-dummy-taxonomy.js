// Script to add dummy taxonomy scores
const fetch = require('node-fetch');

// Get current month and previous month
const currentDate = new Date();
const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

const prevDate = new Date();
prevDate.setMonth(prevDate.getMonth() - 1);
const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

// Sample country IDs - replace with actual IDs from your database
const countryIds = [1, 2, 3, 4, 5];

// Function to add a taxonomy score
async function addTaxonomyScore(countryId, month) {
  const l1Score = Math.floor(Math.random() * 100);
  const l2Score = Math.floor(Math.random() * 100);
  const l3Score = Math.floor(Math.random() * 100);
  
  const data = {
    countryId,
    month,
    l1Score,
    l2Score,
    l3Score
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/taxonomy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`Added score for country ${countryId} for ${month}`);
    } else {
      console.error(`Failed to add score for country ${countryId} for ${month}:`, result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`Error adding score for country ${countryId} for ${month}:`, error);
  }
}

// Add scores for all countries for current and previous month
async function addAllScores() {
  for (const countryId of countryIds) {
    await addTaxonomyScore(countryId, currentMonth);
    await addTaxonomyScore(countryId, prevMonth);
  }
  console.log('Finished adding dummy taxonomy scores');
}

addAllScores();

// --- IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYMENT URL ---
const BACKEND_URL = "https://cura-f2ki.onrender.com";
// ---------------------------------------------------------------

const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const locationButton = document.getElementById('locationButton');
const suggestionChipsContainer = document.getElementById('suggestionChips');

let userLocation = null;
let isWaitingForLocation = false; // State to track if we're waiting for location input

// Initial Bot Message and Suggestions
window.onload = function() {
    addBotMessage("Hello! I'm CuraBot. Please describe your symptoms or click the 📍 icon to add your location first.");
    showSuggestions(["Constant headache", "I can't sleep", "Skin rash"]);
};

function addBotMessage(text, isStatus = false) {
    const messageDiv = document.createElement('div');
    if (isStatus) {
        messageDiv.classList.add('status-message');
        messageDiv.textContent = text;
    } else {
        messageDiv.classList.add('message', 'bot-message');
        messageDiv.innerHTML = `
            <div class="avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
            <div class="message-content">${text}</div>
        `;
    }
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'user-message');
    messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function showSuggestions(suggestions) {
    suggestionChipsContainer.innerHTML = '';
    suggestions.forEach(suggestion => {
        const chip = document.createElement('button');
        chip.classList.add('chip');
        chip.textContent = suggestion;
        chip.onclick = () => {
            userInput.value = suggestion;
            sendMessage();
        };
        suggestionChipsContainer.appendChild(chip);
    });
}

function showLoadingIndicator() { /* ... (same as before) ... */ }
function removeLoadingIndicator() { /* ... (same as before) ... */ }
// Helper functions from previous snippet can be copied here if not present.

async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (userMessage === "") return;

    // --- NEW LOGIC: Check if the bot is waiting for a location ---
    if (isWaitingForLocation) {
        handleLocationInput(userMessage);
        return;
    }

    addUserMessage(userMessage);
    userInput.value = '';
    suggestionChipsContainer.innerHTML = '';

    showLoadingIndicator();

    try {
        const response = await fetch(`${BACKEND_URL}/diagnose`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: userMessage,
                location: userLocation // Send stored location
            }),
        });
        
        userLocation = null; // Reset location after it's been used

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        removeLoadingIndicator();
        addBotMessage(data.response);

    } catch (error) {
        console.error('Error fetching data:', error);
        removeLoadingIndicator();
        addBotMessage("Sorry, I'm unable to connect. Please check your internet and try again.");
    }
}

// --- NEW FUNCTION: Handle the location input from the user ---
function handleLocationInput(locationName) {
    addUserMessage(locationName); // Show what the user typed
    userLocation = locationName;
    isWaitingForLocation = false; // Reset state
    userInput.value = '';
    userInput.placeholder = "Describe your symptoms...";
    addBotMessage(`✅ Location set to ${userLocation}. How are you feeling?`, true);
}

// --- UPDATED: Location button now prompts the user ---
locationButton.addEventListener('click', () => {
    isWaitingForLocation = true;
    addBotMessage("Please type and send your city or area name.");
    userInput.placeholder = "Type your location here...";
    userInput.focus();
    suggestionChipsContainer.innerHTML = ''; // Hide suggestions while asking for location
});

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
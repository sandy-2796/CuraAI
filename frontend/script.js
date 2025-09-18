// --- IMPORTANT: REPLACE THIS WITH YOUR ACTUAL DEPLOYMENT URL ---
const BACKEND_URL = "https://cura-sgh9.onrender.com";
// ---------------------------------------------------------------

const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const locationButton = document.getElementById('locationButton');
const suggestionChipsContainer = document.getElementById('suggestionChips');

let userLocation = null;
let isWaitingForLocation = false;

// --- A simple function to format text from the backend ---
function formatResponse(text) {
    // Convert **bold** to <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert *italic* to <em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Convert bullet points (* list item) to HTML lists
    text = text.replace(/^\* (.*$)/gm, '<ul><li>$1</li></ul>')
               .replace(/<\/ul>\n<ul>/gm, ''); // Merge consecutive lists
    return text;
}

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
    const locationTag = userLocation ? `<br><small>📍 ${userLocation}</small>` : '';
    messageDiv.innerHTML = `<div class="message-content">${text}${locationTag}</div>`;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- MISSING FUNCTION DEFINITION ADDED ---
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

// --- MISSING FUNCTION DEFINITION ADDED ---
function showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'bot-message', 'loading-indicator');
    loadingDiv.id = 'loading';
    loadingDiv.innerHTML = `
        <div class="avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" fill="#00796b"></path></svg>
        </div>
        <div class="message-content">
            <div class="dot d1"></div> <div class="dot d2"></div> <div class="dot d3"></div>
        </div>
    `;
    chatWindow.appendChild(loadingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- MISSING FUNCTION DEFINITION ADDED ---
function removeLoadingIndicator() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.remove();
}

async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (userMessage === "") return;

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
                location: userLocation 
            }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        removeLoadingIndicator();
        
        const formattedText = formatResponse(data.response);
        addBotMessage(formattedText);

    } catch (error) {
        console.error('Error fetching data:', error);
        removeLoadingIndicator();
        addBotMessage("Sorry, I'm unable to connect. Please check your internet and try again.");
    }
}

function handleLocationInput(locationName) {
    addUserMessage(locationName); 
    userLocation = locationName;
    isWaitingForLocation = false; 
    userInput.value = '';
    userInput.placeholder = "Describe your symptoms...";
    addBotMessage(`✅ Location has been updated to **${userLocation}**.`, true);
}

locationButton.addEventListener('click', () => {
    isWaitingForLocation = true;
    addBotMessage("Please type and send your city or area name to update your location.");
    userInput.placeholder = "Type your location here...";
    userInput.focus();
    suggestionChipsContainer.innerHTML = ''; 
});

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
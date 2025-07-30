// Import randomWords from the separate file
import { randomWords } from './words.js';

// Get references to DOM elements
const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const randomWordButton = document.getElementById('randomWordButton');
const customWordButton = document.getElementById('customWordButton');
const customWordInputSection = document.getElementById('customWordInputSection');
const wordInput = document.getElementById('wordInput');
const startButton = document.getElementById('startButton');
const messageDisplay = document.getElementById('message');
const gameBoard = document.getElementById('game-board');
const timerDisplay = document.getElementById('timerDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const backToMenuButton = document.getElementById('backToMenuButton');
const highScoreDisplay = document.getElementById('highScoreDisplay');


let targetWord = ''; // The word entered by the user or randomly selected
let letters = []; // Array of letters from the target word (correct order)
let shuffledLetters = []; // Letters shuffled for display (fixed order for the round)
let currentClickIndex = 0; // Tracks which letter the user should click next
let gameStarted = false; // Flag to indicate if the game is active
let startTime; // To record game start time
let timerInterval; // To manage the timer
let score = 0; // Player's current score
let firstClickMade = false; // Flag to track the first click for hiding letters
let currentMode = 'menu'; // 'menu', 'custom', 'random'

const HIGH_SCORE_KEY = 'spellingChimpHighScore'; // Key for local storage

/**
 * Shuffles an array in place using the Fisher-Yates (Knuth) algorithm.
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

/**
 * Formats a message string, highlighting the target word if present.
 * @param {string} message The raw message string.
 * @param {string} wordToHighlight The word to highlight.
 * @returns {string} The HTML string with the word highlighted.
 */
function formatMessageWithHighlight(message, wordToHighlight) {
    if (!wordToHighlight || message.indexOf(wordToHighlight.toUpperCase()) === -1) {
        return message; // No word to highlight or word not found
    }
    // Use a regex to replace all occurrences of the uppercase word
    const regex = new RegExp(wordToHighlight.toUpperCase(), 'g');
    return message.replace(regex, `<span class="highlight-word">${wordToHighlight.toUpperCase()}</span>`);
}

/**
 * Displays a message to the user.
 * @param {string} msg The message to display.
 * @param {string} type (optional) Type of message for styling (e.g., 'error', 'success').
 */
function displayMessage(msg, type = '') {
    // Check if targetWord is available and if the message contains it
    let formattedMsg = msg;
    if (targetWord && msg.includes(targetWord.toUpperCase())) {
        formattedMsg = formatMessageWithHighlight(msg, targetWord);
    }
    messageDisplay.innerHTML = formattedMsg; // Use innerHTML
    messageDisplay.className = ''; // Clear previous classes
    if (type) {
        messageDisplay.classList.add(type);
    }
}

/**
 * Initializes the game board with a given array of letters.
 * This function no longer shuffles the letters itself.
 * @param {Array<string>} lettersToDisplay The array of letters to display on the board.
 */
function setupGameBoard(lettersToDisplay) {
    gameBoard.innerHTML = ''; // Clear previous board
    gameBoard.classList.remove('visible'); // Hide board initially for transition

    // Create cells for each letter from the provided array
    lettersToDisplay.forEach((letter, index) => {
        const cell = document.createElement('div');
        cell.classList.add('cell'); // All cells start with default styling
        cell.dataset.index = index; // Store original shuffled index
        cell.dataset.letter = letter; // Store the letter

        const span = document.createElement('span');
        span.textContent = letter.toUpperCase(); // Display uppercase letter
        cell.appendChild(span);
        // span's opacity is controlled by CSS .cell.hide-content span

        // Add click event listener to each cell
        cell.addEventListener('click', handleCellClick);
        gameBoard.appendChild(cell);
    });

    // Make the board visible after cells are added
    setTimeout(() => {
        gameBoard.classList.add('visible');
    }, 50); // Small delay for CSS transition
}

/**
 * Shows all letters initially. The hiding logic is now in handleCellClick.
 */
function showAndHideLetters() {
    // All cells are already visible from setupGameBoard
    displayMessage(`Study the order of "${targetWord.toUpperCase()}"! Click the first letter when ready.`);
    // The timer will start on the first correct click.
}

/**
 * Handles a click on a letter cell.
 * @param {Event} event The click event.
 */
function handleCellClick(event) {
    if (!gameStarted) return; // Only allow clicks if game is active

    const clickedCell = event.currentTarget;
    const clickedLetter = clickedCell.dataset.letter;

    // NEW: If the cell is already correct, ignore the click
    if (clickedCell.classList.contains('correct')) {
        return;
    }

    // Check if the clicked letter is the next expected letter in the target word
    if (clickedLetter.toLowerCase() === letters[currentClickIndex].toLowerCase()) {
        // Correct click
        clickedCell.classList.remove('incorrect', 'hide-content'); // Remove incorrect and hide-content
        clickedCell.classList.add('correct'); // Add correct
        // The span's opacity is now controlled by the presence/absence of 'hide-content' class

        score++;
        scoreDisplay.textContent = `Score: ${score}`;

        // If this is the very first correct click, hide all other letters
        if (!firstClickMade) {
            firstClickMade = true;
            startTime = Date.now(); // Start timer on first correct click
            startTimer();
            displayMessage('Click the remaining letters in the correct order!');

            document.querySelectorAll('.cell').forEach(cell => {
                if (!cell.classList.contains('correct')) {
                    cell.classList.add('hide-content'); // Add hide-content to hide letter and change background
                }
            });
        }

        currentClickIndex++;

        // Check if all letters have been clicked
        if (currentClickIndex === letters.length) {
            endGame(true); // Game won
        }
    } else {
        // Incorrect click - Reset the current round
        displayMessage(`Incorrect! The word was "${targetWord.toUpperCase()}". Try again!`, 'error');
        // Briefly show the incorrect cell before resetting the round
        clickedCell.classList.remove('hide-content'); // Ensure letter is visible for incorrect flash
        clickedCell.classList.add('incorrect');
        setTimeout(() => {
            endGame(false); // Game lost (due to incorrect click)
        }, 800); // Give a short moment for the red highlight to be seen
    }
}

/**
 * Starts the game timer.
 */
function startTimer() {
    clearInterval(timerInterval); // Clear any existing timer
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `Time: ${elapsedTime}s`;
    }, 1000);
}

/**
 * Ends the game, stops the timer, and displays results.
 * @param {boolean} won True if the player won, false otherwise.
 */
function endGame(won) {
    gameStarted = false;
    clearInterval(timerInterval); // Stop the timer
    startButton.disabled = false;
    startButton.textContent = 'Play Again';
    wordInput.disabled = false;

    const finalTime = Math.floor((Date.now() - startTime) / 1000);

    // Reveal all letters at the end of the game
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('hide-content'); // Remove hide-content to show letters and revert background
        cell.classList.remove('correct', 'incorrect'); // Clean up colors
    });

    if (won) {
        if (currentMode === 'random') {
            displayMessage(`Correct! You spelled "${targetWord.toUpperCase()}" in ${finalTime} seconds! Getting next word...`, 'success');
            setTimeout(startNextRandomWordRound, 1000); // Start next random word round after a short delay
        } else { // Custom word mode
            displayMessage(`Congratulations! You spelled "${targetWord.toUpperCase()}" in ${finalTime} seconds!`, 'success');
        }
    } else { // Game lost (due to incorrect click or other future reasons)
        displayMessage(`Game Over! You didn't complete the word. The word was "${targetWord.toUpperCase()}". Your score: ${score}. Try again!`, 'error');
        saveHighScore(score); // Save high score only on game over (loss)
        // For custom word, allow restart of current word. For random, go back to menu.
        if (currentMode === 'custom') {
             setTimeout(restartRound, 1000); // Restart the current custom word
        } else { // Random mode, go back to menu on loss
            setTimeout(() => showScreen('mainMenu'), 1000);
        }
    }
}

/**
 * Resets the game state completely, including clearing the word.
 * Used for initial start or 'Play Again' after a full game.
 */
function resetGame() {
    targetWord = '';
    letters = [];
    shuffledLetters = []; // Clear shuffled letters on full reset
    currentClickIndex = 0;
    gameStarted = false;
    score = 0; // Reset score on full game reset
    firstClickMade = false; // Reset the flag
    scoreDisplay.textContent = `Score: 0`;
    timerDisplay.textContent = `Time: 0s`;
    clearInterval(timerInterval);
    gameBoard.innerHTML = '';
    gameBoard.classList.remove('visible');
    displayMessage('Enter a word and click "Start Game"!');
    wordInput.value = '';
    wordInput.disabled = false;
    startButton.textContent = 'Start Game';
    startButton.disabled = false;
}

/**
 * Restarts the current round, keeping the same target word and its initial shuffled pattern.
 * Used when an incorrect letter is clicked in custom mode.
 */
function restartRound() {
    currentClickIndex = 0;
    score = 0; // Reset score for the current custom word round
    firstClickMade = false; // Reset the flag
    scoreDisplay.textContent = `Score: 0`;
    timerDisplay.textContent = `Time: 0s`;
    clearInterval(timerInterval); // Stop any running timer

    // Re-setup the game board using the *existing* shuffledLetters array
    setupGameBoard(shuffledLetters);
    // Re-enter the study phase
    showAndHideLetters();

    // Keep inputs disabled as the game is still in progress with the same word
    wordInput.disabled = true;
    startButton.disabled = true;
    startButton.textContent = 'Game in Progress...';
    gameStarted = true; // Ensure game is marked as started
}

/**
 * Starts the next round in random word mode.
 * Keeps the score, generates a new word.
 */
function startNextRandomWordRound() {
    // Keep current score, only reset round-specific variables
    currentClickIndex = 0;
    firstClickMade = false;
    timerDisplay.textContent = `Time: 0s`;
    clearInterval(timerInterval); // Stop previous timer

    // Get a new random word
    const newWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    targetWord = newWord.toLowerCase();
    letters = targetWord.split('');

    // Generate a new shuffled pattern for the new word
    shuffledLetters = [...letters];
    shuffleArray(shuffledLetters);

    // Setup board with new word's shuffled letters
    setupGameBoard(shuffledLetters);
    showAndHideLetters(); // Re-enter study phase for the new word

    gameStarted = true;
    wordInput.disabled = true;
    startButton.disabled = true;
    startButton.textContent = 'Game in Progress...';
    displayMessage(`New word: Study the order of "${targetWord.toUpperCase()}"! Click the first letter when ready.`, 'success');
}


/**
 * Shows a specific screen and hides others.
 * @param {string} screenId The ID of the screen to show ('mainMenu' or 'gameContainer').
 */
function showScreen(screenId) {
    mainMenu.classList.add('hidden');
    gameContainer.classList.add('hidden');

    if (screenId === 'mainMenu') {
        mainMenu.classList.remove('hidden');
        resetGame(); // Ensure game state is fully reset when returning to menu
        loadHighScore(); // Load and display high score when menu is shown
    } else if (screenId === 'gameContainer') {
        gameContainer.classList.remove('hidden');
    }
}

/**
 * Starts a new game with the given word.
 * @param {string} word The word to use for the game.
 */
function startNewGame(word) {
    // Full reset if starting a brand new game (e.g., from menu)
    // For random mode, score is kept across words until loss.
    if (currentMode === 'custom') {
        resetGame(); // Full reset for custom word mode
    } else { // Random mode, only reset round specific state, keep score
        currentClickIndex = 0;
        firstClickMade = false;
        timerDisplay.textContent = `Time: 0s`;
        clearInterval(timerInterval);
        gameBoard.innerHTML = ''; // Clear board for new word
        gameBoard.classList.remove('visible');
        score = 0; // Reset score for a fresh random game start
        scoreDisplay.textContent = `Score: 0`;
    }

    targetWord = word.toLowerCase();
    letters = targetWord.split('');

    // Shuffle letters ONCE when the game starts for a new word
    shuffledLetters = [...letters];
    shuffleArray(shuffledLetters);

    gameStarted = true;
    wordInput.disabled = true;
    startButton.disabled = true;
    startButton.textContent = 'Game in Progress...';

    // Pass the newly shuffled letters to setupGameBoard
    setupGameBoard(shuffledLetters);
    showAndHideLetters(); // Call without duration, hiding is now on first click
}

/**
 * Saves the current high score to local storage.
 * @param {number} currentScore The score achieved in the current game.
 */
function saveHighScore(currentScore) {
    const existingHighScore = loadHighScore();
    if (currentScore > existingHighScore) {
        localStorage.setItem(HIGH_SCORE_KEY, currentScore.toString());
        updateHighScoreDisplay(currentScore);
        displayMessage(`New High Score: ${currentScore}!`, 'success');
    }
}

/**
 * Loads the high score from local storage.
 * @returns {number} The high score, or 0 if none is saved.
 */
function loadHighScore() {
    const storedScore = localStorage.getItem(HIGH_SCORE_KEY);
    const score = storedScore ? parseInt(storedScore, 10) : 0;
    updateHighScoreDisplay(score);
    return score;
}

/**
 * Updates the high score display element.
 * @param {number} score The score to display.
 */
function updateHighScoreDisplay(score) {
    highScoreDisplay.textContent = `High Score: ${score}`;
}


// --- Event Listeners ---

// Main Menu Buttons
randomWordButton.addEventListener('click', () => {
    currentMode = 'random';
    showScreen('gameContainer');
    customWordInputSection.classList.add('hidden'); // Hide custom input for random mode
    const word = randomWords[Math.floor(Math.random() * randomWords.length)];
    startNewGame(word); // Start new game with random word
});

customWordButton.addEventListener('click', () => {
    currentMode = 'custom';
    showScreen('gameContainer');
    customWordInputSection.classList.remove('hidden'); // Show custom input for custom mode
    wordInput.value = ''; // Clear previous input
    wordInput.focus(); // Focus on the input field
    displayMessage('Enter a word and click "Start Game"!');
});

// Start Game Button (now specific to Custom Word Mode)
startButton.addEventListener('click', () => {
    const word = wordInput.value.trim();

    if (word.length < 3 || word.length > 15) {
        displayMessage('Please enter a word between 3 and 15 letters long.', 'error');
        return;
    }
    if (!/^[a-zA-Z]+$/.test(word)) {
        displayMessage('Please enter only letters (A-Z, a-z).', 'error');
        return;
    }
    startNewGame(word);
});

// Back to Main Menu Button
backToMenuButton.addEventListener('click', () => {
    showScreen('mainMenu');
});

// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    showScreen('mainMenu'); // Show the main menu first
    loadHighScore(); // Load high score when the page loads
});

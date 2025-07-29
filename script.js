// Get references to DOM elements
const wordInput = document.getElementById('wordInput');
const startButton = document.getElementById('startButton');
const messageDisplay = document.getElementById('message');
const gameBoard = document.getElementById('game-board');
const timerDisplay = document.getElementById('timerDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');

let targetWord = ''; // The word entered by the user
let letters = []; // Array of letters from the target word
let shuffledLetters = []; // Letters shuffled for display
let currentClickIndex = 0; // Tracks which letter the user should click next
let gameStarted = false; // Flag to indicate if the game is active
let startTime; // To record game start time
let timerInterval; // To manage the timer
let score = 0; // Player's score
let firstClickMade = false; // New flag to track the first click for hiding letters

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
 * Displays a message to the user.
 * @param {string} msg The message to display.
 * @param {string} type (optional) Type of message for styling (e.g., 'error', 'success').
 */
function displayMessage(msg, type = '') {
    messageDisplay.textContent = msg;
    messageDisplay.className = ''; // Clear previous classes
    if (type) {
        messageDisplay.classList.add(type);
    }
}

/**
 * Initializes the game board with shuffled letters.
 */
function setupGameBoard() {
    gameBoard.innerHTML = ''; // Clear previous board
    gameBoard.classList.remove('visible'); // Hide board initially for transition

    // Create a copy of letters to shuffle for display
    shuffledLetters = [...letters];
    shuffleArray(shuffledLetters);

    // Create cells for each letter
    shuffledLetters.forEach((letter, index) => {
        const cell = document.createElement('div');
        cell.classList.add('cell'); // Start without 'hidden' class
        cell.dataset.index = index; // Store original shuffled index
        cell.dataset.letter = letter; // Store the letter

        const span = document.createElement('span');
        span.textContent = letter.toUpperCase(); // Display uppercase letter
        cell.appendChild(span);
        span.style.display = 'block'; // Ensure letters are visible initially

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

    // Check if the clicked letter is the next expected letter in the target word
    if (clickedLetter.toLowerCase() === letters[currentClickIndex].toLowerCase()) {
        // Correct click
        clickedCell.classList.remove('hidden', 'incorrect');
        clickedCell.classList.add('correct', 'visible');
        clickedCell.querySelector('span').style.display = 'block'; // Ensure letter is visible on correct click
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
                    cell.classList.add('hidden');
                    cell.querySelector('span').style.display = 'none'; // Hide the span content
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
        clickedCell.classList.add('incorrect');
        setTimeout(() => {
            restartRound(); // Restart the round for the same word
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

    if (won) {
        displayMessage(`Congratulations! You spelled "${targetWord.toUpperCase()}" in ${finalTime} seconds!`, 'success');
    } else {
        // This 'else' block will primarily be hit if endGame is called for reasons other than incorrect click (e.g., future features)
        displayMessage(`Game Over! You didn't complete the word. The word was "${targetWord.toUpperCase()}". Try again!`, 'error');
    }
    // Reveal all letters at the end of the game
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('hidden');
        cell.classList.add('visible'); // Ensure the cell itself is visible
        cell.querySelector('span').style.display = 'block'; // Ensure the letter is visible
    });
}

/**
 * Resets the game state completely, including clearing the word.
 * Used for initial start or 'Play Again' after a full game.
 */
function resetGame() {
    targetWord = '';
    letters = [];
    shuffledLetters = [];
    currentClickIndex = 0;
    gameStarted = false;
    score = 0;
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
 * Restarts the current round, keeping the same target word.
 * Used when an incorrect letter is clicked.
 */
function restartRound() {
    currentClickIndex = 0;
    score = 0;
    firstClickMade = false; // Reset the flag
    scoreDisplay.textContent = `Score: 0`;
    timerDisplay.textContent = `Time: 0s`;
    clearInterval(timerInterval); // Stop any running timer

    // Re-setup the game board with the same word, but new shuffle
    setupGameBoard();
    // Re-enter the study phase
    showAndHideLetters();

    // Keep inputs disabled as the game is still in progress with the same word
    wordInput.disabled = true;
    startButton.disabled = true;
    startButton.textContent = 'Game in Progress...';
    gameStarted = true; // Ensure game is marked as started
}


/**
 * Event listener for the start button.
 */
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

    // Use resetGame for a fresh start (clearing the word)
    resetGame();
    targetWord = word.toLowerCase();
    letters = targetWord.split('');

    gameStarted = true;
    wordInput.disabled = true;
    startButton.disabled = true;
    startButton.textContent = 'Game in Progress...';

    setupGameBoard();
    showAndHideLetters(); // Call without duration, hiding is now on first click
});

// Initial setup on page load
resetGame();

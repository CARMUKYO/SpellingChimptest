# SpellingChimptest
This game allows you to enter a word, then it shuffles the letters and briefly shows them before hiding them. Your task is to click the letters in the correct order to spell the word.

function setupGameBoard(lettersToDisplay) {
    gameBoard.innerHTML = ''; // Clear previous board
    gameBoard.classList.remove('visible'); // Hide board initially for transition

    // Create cells for each letter from the provided array
    lettersToDisplay.forEach((letter, index) => {
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

    // Use resetGame for a fresh start (clearing the word and previous shuffle)
    resetGame();
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
});

function restartRound() {
    currentClickIndex = 0;
    score = 0;
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
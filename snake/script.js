document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const GRID_SIZE = 20;
    const CELL_SIZE = 20;
    const INITIAL_SPEED = 200; // milliseconds
    const SPEED_INCREASE = 5; // milliseconds to decrease per food eaten

    // Game elements
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');

    // Game state
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let gameInterval;
    let score = 0;
    let speed = INITIAL_SPEED;
    let gameRunning = false;

    // Initialize the game board
    function initializeBoard() {
        gameBoard.innerHTML = '';
        // Create grid cells
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.createElement('div');
            cell.style.width = `${CELL_SIZE}px`;
            cell.style.height = `${CELL_SIZE}px`;
            gameBoard.appendChild(cell);
        }
    }

    // Initialize the snake
    function initializeSnake() {
        snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
    }

    // Generate food at random position
    function generateFood() {
        // Generate random coordinates
        let foodX, foodY;
        let validPosition = false;

        while (!validPosition) {
            foodX = Math.floor(Math.random() * GRID_SIZE);
            foodY = Math.floor(Math.random() * GRID_SIZE);
            
            // Check if the position is not occupied by the snake
            validPosition = true;
            for (const segment of snake) {
                if (segment.x === foodX && segment.y === foodY) {
                    validPosition = false;
                    break;
                }
            }
        }

        food = { x: foodX, y: foodY };
    }

    // Draw the snake and food on the board
    function draw() {
        // Clear the board
        const cells = gameBoard.children;
        for (let i = 0; i < cells.length; i++) {
            cells[i].className = '';
        }

        // Draw snake
        snake.forEach((segment, index) => {
            if (segment.x >= 0 && segment.x < GRID_SIZE && segment.y >= 0 && segment.y < GRID_SIZE) {
                const cellIndex = segment.y * GRID_SIZE + segment.x;
                if (cells[cellIndex]) {
                    cells[cellIndex].classList.add('snake');
                }
            }
        });

        // Draw food
        const foodIndex = food.y * GRID_SIZE + food.x;
        if (cells[foodIndex]) {
            cells[foodIndex].classList.add('food');
        }
    }

    // Move the snake
    function moveSnake() {
        // Update direction
        direction = nextDirection;

        // Calculate new head position
        const head = { ...snake[0] };
        
        switch (direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }

        // Check for collisions
        if (checkCollision(head)) {
            gameOver();
            return;
        }

        // Add new head
        snake.unshift(head);

        // Check if snake ate food
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score += 10;
            scoreElement.textContent = score;
            
            // Generate new food
            generateFood();
            
            // Increase speed
            if (speed > 50) {
                speed -= SPEED_INCREASE;
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, speed);
            }
        } else {
            // Remove tail if no food was eaten
            snake.pop();
        }
    }

    // Check for collisions with walls or self
    function checkCollision(head) {
        // Check wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            return true;
        }

        // Check self collision (skip the last segment as it will be removed)
        for (let i = 0; i < snake.length - 1; i++) {
            if (snake[i].x === head.x && snake[i].y === head.y) {
                return true;
            }
        }

        return false;
    }

    // Game loop
    function gameLoop() {
        moveSnake();
        draw();
    }

    // Game over
    function gameOver() {
        clearInterval(gameInterval);
        gameRunning = false;
        alert(`Game Over! Your score: ${score}`);
    }

    // Start the game
    function startGame() {
        if (gameRunning) return;
        
        // Reset game state
        initializeBoard();
        initializeSnake();
        generateFood();
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        speed = INITIAL_SPEED;
        scoreElement.textContent = score;
        
        // Start game loop
        gameRunning = true;
        draw();
        gameInterval = setInterval(gameLoop, speed);
    }

    // Restart the game
    function restartGame() {
        clearInterval(gameInterval);
        startGame();
    }

    // Event listeners
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                break;
        }
    });

    // Initialize the board on load
    initializeBoard();
}); 
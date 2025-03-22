document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const game = document.getElementById('game');
    const ball = document.getElementById('ball');
    const playerPaddle = document.getElementById('player-paddle');
    const computerPaddle = document.getElementById('computer-paddle');
    const playerScoreElement = document.getElementById('player-score');
    const computerScoreElement = document.getElementById('computer-score');
    const startButton = document.getElementById('start-button');

    // Game variables
    let gameInterval;
    let ballX = 292;
    let ballY = 192;
    let ballSpeedX = 5;
    let ballSpeedY = 3;
    let playerPaddleY = 160;
    let computerPaddleY = 160;
    let playerScore = 0;
    let computerScore = 0;
    let isGameRunning = false;
    
    // Constants
    const gameWidth = 600;
    const gameHeight = 400;
    const ballSize = 15;
    const paddleHeight = 80;
    const paddleWidth = 10;
    const paddleSpeed = 8;
    const computerPaddleDifficulty = 0.75; // 0-1, higher is more difficult

    // Initialize game
    function initGame() {
        // Reset positions
        ballX = gameWidth / 2 - ballSize / 2;
        ballY = gameHeight / 2 - ballSize / 2;
        playerPaddleY = gameHeight / 2 - paddleHeight / 2;
        computerPaddleY = gameHeight / 2 - paddleHeight / 2;
        
        // Reset scores if starting a new game
        if (!isGameRunning) {
            playerScore = 0;
            computerScore = 0;
            updateScoreDisplay();
        }
        
        // Random initial direction
        ballSpeedX = Math.random() > 0.5 ? 5 : -5;
        ballSpeedY = Math.random() > 0.5 ? 3 : -3;
        
        // Update positions
        updatePositions();
    }

    // Update game elements positions
    function updatePositions() {
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
        playerPaddle.style.top = `${playerPaddleY}px`;
        computerPaddle.style.top = `${computerPaddleY}px`;
    }

    // Update score display
    function updateScoreDisplay() {
        playerScoreElement.textContent = playerScore;
        computerScoreElement.textContent = computerScore;
    }

    // Game loop
    function gameLoop() {
        // Move ball
        ballX += ballSpeedX;
        ballY += ballSpeedY;
        
        // Ball collision with top and bottom
        if (ballY <= 0 || ballY >= gameHeight - ballSize) {
            ballSpeedY = -ballSpeedY;
        }
        
        // Ball collision with paddles
        if (
            // Player paddle collision
            ballX <= paddleWidth + 10 && 
            ballY + ballSize >= playerPaddleY && 
            ballY <= playerPaddleY + paddleHeight
        ) {
            ballSpeedX = Math.abs(ballSpeedX); // Ensure ball moves right
            // Change angle based on where ball hit paddle
            const paddleCenter = playerPaddleY + paddleHeight / 2;
            const ballCenter = ballY + ballSize / 2;
            const distanceFromCenter = ballCenter - paddleCenter;
            ballSpeedY = distanceFromCenter * 0.2;
        }
        
        if (
            // Computer paddle collision
            ballX >= gameWidth - paddleWidth - 20 && 
            ballY + ballSize >= computerPaddleY && 
            ballY <= computerPaddleY + paddleHeight
        ) {
            ballSpeedX = -Math.abs(ballSpeedX); // Ensure ball moves left
            // Change angle based on where ball hit paddle
            const paddleCenter = computerPaddleY + paddleHeight / 2;
            const ballCenter = ballY + ballSize / 2;
            const distanceFromCenter = ballCenter - paddleCenter;
            ballSpeedY = distanceFromCenter * 0.2;
        }
        
        // Ball out of bounds
        if (ballX <= 0) {
            // Computer scores
            computerScore++;
            updateScoreDisplay();
            initGame();
        } else if (ballX >= gameWidth - ballSize) {
            // Player scores
            playerScore++;
            updateScoreDisplay();
            initGame();
        }
        
        // Computer AI
        const computerPaddleCenter = computerPaddleY + paddleHeight / 2;
        const ballCenterY = ballY + ballSize / 2;
        
        // Only move when ball is moving toward computer
        if (ballSpeedX > 0) {
            // Add some "AI" to make it challenging but not perfect
            if (Math.random() < computerPaddleDifficulty) {
                if (computerPaddleCenter < ballCenterY - 10) {
                    computerPaddleY += Math.min(paddleSpeed, ballCenterY - computerPaddleCenter);
                } else if (computerPaddleCenter > ballCenterY + 10) {
                    computerPaddleY -= Math.min(paddleSpeed, computerPaddleCenter - ballCenterY);
                }
            }
        }
        
        // Ensure paddles stay within game bounds
        playerPaddleY = Math.max(0, Math.min(gameHeight - paddleHeight, playerPaddleY));
        computerPaddleY = Math.max(0, Math.min(gameHeight - paddleHeight, computerPaddleY));
        
        // Update positions
        updatePositions();
    }

    // Start game
    function startGame() {
        if (!isGameRunning) {
            isGameRunning = true;
            startButton.textContent = 'Reset Game';
            initGame();
            gameInterval = setInterval(gameLoop, 16); // ~60 FPS
        } else {
            // Reset game
            clearInterval(gameInterval);
            isGameRunning = false;
            startButton.textContent = 'Start Game';
            initGame();
        }
    }

    // Player paddle control with mouse
    game.addEventListener('mousemove', (e) => {
        const rect = game.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        playerPaddleY = mouseY - paddleHeight / 2;
        
        // Keep paddle within game bounds
        playerPaddleY = Math.max(0, Math.min(gameHeight - paddleHeight, playerPaddleY));
        
        playerPaddle.style.top = `${playerPaddleY}px`;
    });

    // Player paddle control with keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            playerPaddleY -= paddleSpeed;
        } else if (e.key === 'ArrowDown') {
            playerPaddleY += paddleSpeed;
        }
        
        // Keep paddle within game bounds
        playerPaddleY = Math.max(0, Math.min(gameHeight - paddleHeight, playerPaddleY));
        
        playerPaddle.style.top = `${playerPaddleY}px`;
    });

    // Start/Reset button
    startButton.addEventListener('click', startGame);

    // Initialize paddle and ball positions
    initGame();
}); 
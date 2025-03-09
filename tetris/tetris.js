document.addEventListener('DOMContentLoaded', () => {
    // Game constants
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 30;
    const NEXT_QUEUE_SIZE = 3;
    const EMPTY_CELL = 0;
    
    // Game variables
    let board = createEmptyBoard();
    let currentPiece = null;
    let ghostPiece = null;
    let holdPiece = null;
    let hasHeldThisTurn = false;
    let nextPieces = [];
    let gameInterval = null;
    let isPaused = false;
    let isGameOver = false;
    let score = 0;
    let level = 1;
    let linesCleared = 0;
    let dropSpeed = 1000; // Initial drop speed in ms
    
    // DOM elements
    const boardElement = document.getElementById('tetris-board');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const linesElement = document.getElementById('lines');
    const holdPieceElement = document.getElementById('hold-piece');
    const nextPiecesElement = document.getElementById('next-pieces');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreElement = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    
    // Tetromino definitions
    const TETROMINOES = {
        I: {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: 'I'
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: 'O'
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'T'
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: 'S'
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: 'Z'
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'J'
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: 'L'
        }
    };
    
    // Wall kick data for SRS (Super Rotation System)
    const WALL_KICK_DATA = {
        // For J, L, S, T, Z tetrominoes
        JLSTZ: [
            [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 0->1
            [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],     // 1->0
            [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],     // 1->2
            [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], // 2->1
            [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],    // 2->3
            [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],  // 3->2
            [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],  // 3->0
            [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]     // 0->3
        ],
        // For I tetromino
        I: [
            [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],   // 0->1
            [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],   // 1->0
            [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],   // 1->2
            [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],   // 2->1
            [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],   // 2->3
            [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],   // 3->2
            [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],   // 3->0
            [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]    // 0->3
        ],
        // O tetromino doesn't need wall kicks
        O: [
            [[0, 0]], [[0, 0]], [[0, 0]], [[0, 0]],
            [[0, 0]], [[0, 0]], [[0, 0]], [[0, 0]]
        ]
    };
    
    // Initialize the game
    function init() {
        createBoard();
        generateBag();
        spawnNewPiece();
        updateGhostPiece();
        updateDisplay();
        startGame();
        
        // Event listeners
        document.addEventListener('keydown', handleKeyPress);
        restartButton.addEventListener('click', restartGame);
    }
    
    // Create an empty board data structure
    function createEmptyBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY_CELL));
    }
    
    // Create the visual board
    function createBoard() {
        boardElement.innerHTML = '';
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                boardElement.appendChild(cell);
            }
        }
    }
    
    // Generate a bag of tetrominoes using the 7-bag randomizer
    function generateBag() {
        const tetroTypes = Object.keys(TETROMINOES);
        const bag = [...tetroTypes];
        
        // Fisher-Yates shuffle
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        
        nextPieces.push(...bag);
        
        // If we need more pieces to fill the next queue
        if (nextPieces.length < NEXT_QUEUE_SIZE) {
            generateBag();
        }
    }
    
    // Spawn a new tetromino
    function spawnNewPiece() {
        if (nextPieces.length < NEXT_QUEUE_SIZE) {
            generateBag();
        }
        
        const type = nextPieces.shift();
        const tetromino = TETROMINOES[type];
        
        currentPiece = {
            type: type,
            shape: JSON.parse(JSON.stringify(tetromino.shape)),
            color: tetromino.color,
            x: Math.floor(COLS / 2) - Math.floor(tetromino.shape[0].length / 2),
            y: 0,
            rotation: 0
        };
        
        // Check if the new piece can be placed
        if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
            gameOver();
            return;
        }
        
        hasHeldThisTurn = false;
        updateNextPiecesDisplay();
    }
    
    // Update the ghost piece position
    function updateGhostPiece() {
        if (!currentPiece || isGameOver) return;
        
        ghostPiece = {
            ...currentPiece,
            shape: JSON.parse(JSON.stringify(currentPiece.shape))
        };
        
        // Drop the ghost piece as far as it can go
        while (isValidMove(ghostPiece.x, ghostPiece.y + 1, ghostPiece.shape)) {
            ghostPiece.y++;
        }
    }
    
    // Check if a move is valid
    function isValidMove(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    // Check boundaries
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return false;
                    }
                    
                    // Check collision with locked pieces
                    if (newY >= 0 && board[newY][newX] !== EMPTY_CELL) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    // Move the current piece
    function movePiece(dx, dy) {
        if (!currentPiece || isPaused || isGameOver) return false;
        
        if (isValidMove(currentPiece.x + dx, currentPiece.y + dy, currentPiece.shape)) {
            currentPiece.x += dx;
            currentPiece.y += dy;
            updateGhostPiece();
            updateDisplay();
            return true;
        }
        return false;
    }
    
    // Rotate the current piece
    function rotatePiece() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        const originalRotation = currentPiece.rotation;
        const originalShape = JSON.parse(JSON.stringify(currentPiece.shape));
        const originalX = currentPiece.x;
        const originalY = currentPiece.y;
        
        // Rotate the shape matrix
        const newShape = rotateMatrix(currentPiece.shape);
        
        // Get the appropriate wall kick data
        let kickData;
        if (currentPiece.type === 'I') {
            kickData = WALL_KICK_DATA.I;
        } else if (currentPiece.type === 'O') {
            kickData = WALL_KICK_DATA.O;
        } else {
            kickData = WALL_KICK_DATA.JLSTZ;
        }
        
        // Determine which rotation we're doing
        const rotationIndex = (currentPiece.rotation * 2) % 8;
        
        // Try each wall kick
        for (const [dx, dy] of kickData[rotationIndex]) {
            if (isValidMove(originalX + dx, originalY + dy, newShape)) {
                currentPiece.shape = newShape;
                currentPiece.x = originalX + dx;
                currentPiece.y = originalY + dy;
                currentPiece.rotation = (currentPiece.rotation + 1) % 4;
                updateGhostPiece();
                updateDisplay();
                return;
            }
        }
        
        // If no valid rotation found, keep the original position and shape
        currentPiece.shape = originalShape;
        currentPiece.rotation = originalRotation;
    }
    
    // Rotate a matrix 90 degrees clockwise
    function rotateMatrix(matrix) {
        const N = matrix.length;
        const result = Array.from({ length: N }, () => Array(N).fill(0));
        
        for (let row = 0; row < N; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                result[col][N - 1 - row] = matrix[row][col];
            }
        }
        
        return result;
    }
    
    // Hard drop the current piece
    function hardDrop() {
        if (!currentPiece || isPaused || isGameOver) return;
        
        let dropDistance = 0;
        while (movePiece(0, 1)) {
            dropDistance++;
        }
        
        // Add score for hard drop (2 points per cell dropped)
        addScore(dropDistance * 2);
        
        lockPiece();
    }
    
    // Lock the current piece in place
    function lockPiece() {
        if (!currentPiece) return;
        
        // Add the piece to the board
        for (let row = 0; row < currentPiece.shape.length; row++) {
            for (let col = 0; col < currentPiece.shape[row].length; col++) {
                if (currentPiece.shape[row][col]) {
                    const boardRow = currentPiece.y + row;
                    const boardCol = currentPiece.x + col;
                    
                    if (boardRow >= 0) {
                        board[boardRow][boardCol] = currentPiece.color;
                    }
                }
            }
        }
        
        // Check for line clears
        checkLineClears();
        
        // Spawn a new piece
        spawnNewPiece();
        updateGhostPiece();
        updateDisplay();
    }
    
    // Check for completed lines and clear them
    function checkLineClears() {
        let linesCleared = 0;
        let tSpin = checkTSpin();
        
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row].every(cell => cell !== EMPTY_CELL)) {
                // Clear the line
                board.splice(row, 1);
                board.unshift(Array(COLS).fill(EMPTY_CELL));
                linesCleared++;
                row++; // Check the same row again after shifting
            }
        }
        
        if (linesCleared > 0) {
            // Calculate score based on number of lines cleared and level
            let lineScore;
            switch (linesCleared) {
                case 1:
                    lineScore = tSpin ? 800 : 100;
                    break;
                case 2:
                    lineScore = tSpin ? 1200 : 300;
                    break;
                case 3:
                    lineScore = tSpin ? 1600 : 500;
                    break;
                case 4:
                    lineScore = 800; // Tetris
                    break;
                default:
                    lineScore = 0;
            }
            
            addScore(lineScore * level);
            updateLines(linesCleared);
        }
    }
    
    // Check if the last move was a T-spin
    function checkTSpin() {
        if (currentPiece && currentPiece.type === 'T') {
            // A T-spin is when at least 3 of the 4 corners around the T center are blocked
            const centerX = currentPiece.x + 1;
            const centerY = currentPiece.y + 1;
            
            let cornersBlocked = 0;
            
            // Check top-left corner
            if (centerX - 1 < 0 || centerY - 1 < 0 || (centerY - 1 >= 0 && centerX - 1 >= 0 && board[centerY - 1][centerX - 1] !== EMPTY_CELL)) {
                cornersBlocked++;
            }
            
            // Check top-right corner
            if (centerX + 1 >= COLS || centerY - 1 < 0 || (centerY - 1 >= 0 && centerX + 1 < COLS && board[centerY - 1][centerX + 1] !== EMPTY_CELL)) {
                cornersBlocked++;
            }
            
            // Check bottom-left corner
            if (centerX - 1 < 0 || centerY + 1 >= ROWS || (centerY + 1 < ROWS && centerX - 1 >= 0 && board[centerY + 1][centerX - 1] !== EMPTY_CELL)) {
                cornersBlocked++;
            }
            
            // Check bottom-right corner
            if (centerX + 1 >= COLS || centerY + 1 >= ROWS || (centerY + 1 < ROWS && centerX + 1 < COLS && board[centerY + 1][centerX + 1] !== EMPTY_CELL)) {
                cornersBlocked++;
            }
            
            return cornersBlocked >= 3;
        }
        
        return false;
    }
    
    // Hold the current piece
    function holdCurrentPiece() {
        if (!currentPiece || hasHeldThisTurn || isPaused || isGameOver) return;
        
        const currentType = currentPiece.type;
        
        if (holdPiece === null) {
            // If no piece is being held, get a new piece from the queue
            holdPiece = currentType;
            spawnNewPiece();
        } else {
            // Swap the current piece with the held piece
            const tempType = holdPiece;
            holdPiece = currentType;
            
            const tetromino = TETROMINOES[tempType];
            currentPiece = {
                type: tempType,
                shape: JSON.parse(JSON.stringify(tetromino.shape)),
                color: tetromino.color,
                x: Math.floor(COLS / 2) - Math.floor(tetromino.shape[0].length / 2),
                y: 0,
                rotation: 0
            };
            
            // Check if the swapped piece can be placed
            if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
                gameOver();
                return;
            }
        }
        
        hasHeldThisTurn = true;
        updateHoldPieceDisplay();
        updateGhostPiece();
        updateDisplay();
    }
    
    // Update the hold piece display
    function updateHoldPieceDisplay() {
        holdPieceElement.innerHTML = '';
        
        if (holdPiece) {
            const miniGrid = createMiniGrid(TETROMINOES[holdPiece].shape, holdPiece);
            holdPieceElement.appendChild(miniGrid);
        }
    }
    
    // Update the next pieces display
    function updateNextPiecesDisplay() {
        nextPiecesElement.innerHTML = '';
        
        for (let i = 0; i < Math.min(NEXT_QUEUE_SIZE, nextPieces.length); i++) {
            const pieceType = nextPieces[i];
            const miniGrid = createMiniGrid(TETROMINOES[pieceType].shape, pieceType);
            nextPiecesElement.appendChild(miniGrid);
        }
    }
    
    // Create a mini grid for displaying pieces
    function createMiniGrid(shape, type) {
        const container = document.createElement('div');
        container.classList.add('mini-grid');
        
        // Center the piece in a 4x4 grid
        const gridSize = 4;
        const pieceHeight = shape.length;
        const pieceWidth = shape[0].length;
        const offsetY = Math.floor((gridSize - pieceHeight) / 2);
        const offsetX = Math.floor((gridSize - pieceWidth) / 2);
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('div');
                cell.classList.add('mini-cell');
                
                const pieceRow = row - offsetY;
                const pieceCol = col - offsetX;
                
                if (
                    pieceRow >= 0 && pieceRow < pieceHeight &&
                    pieceCol >= 0 && pieceCol < pieceWidth &&
                    shape[pieceRow][pieceCol]
                ) {
                    cell.classList.add(type);
                }
                
                container.appendChild(cell);
            }
        }
        
        return container;
    }
    
    // Update the game display
    function updateDisplay() {
        // Clear the board display
        const cells = boardElement.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.className = 'cell';
        });
        
        // Draw the locked pieces
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (board[row][col] !== EMPTY_CELL) {
                    const cellIndex = row * COLS + col;
                    cells[cellIndex].classList.add('filled', board[row][col]);
                }
            }
        }
        
        // Draw the ghost piece
        if (ghostPiece) {
            for (let row = 0; row < ghostPiece.shape.length; row++) {
                for (let col = 0; col < ghostPiece.shape[row].length; col++) {
                    if (ghostPiece.shape[row][col]) {
                        const boardRow = ghostPiece.y + row;
                        const boardCol = ghostPiece.x + col;
                        
                        if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
                            const cellIndex = boardRow * COLS + boardCol;
                            // Only draw ghost if there's no active piece at this position
                            if (!cells[cellIndex].classList.contains('filled')) {
                                cells[cellIndex].classList.add('ghost');
                            }
                        }
                    }
                }
            }
        }
        
        // Draw the current piece
        if (currentPiece) {
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        const boardRow = currentPiece.y + row;
                        const boardCol = currentPiece.x + col;
                        
                        if (boardRow >= 0 && boardRow < ROWS && boardCol >= 0 && boardCol < COLS) {
                            const cellIndex = boardRow * COLS + boardCol;
                            cells[cellIndex].classList.add('filled', currentPiece.color);
                        }
                    }
                }
            }
        }
        
        // Update score display
        scoreElement.textContent = score;
        levelElement.textContent = level;
        linesElement.textContent = linesCleared;
    }
    
    // Add to the score
    function addScore(points) {
        score += points;
        updateDisplay();
    }
    
    // Update the lines cleared count
    function updateLines(lines) {
        linesCleared += lines;
        
        // Level up every 10 lines
        const newLevel = Math.floor(linesCleared / 10) + 1;
        if (newLevel > level) {
            levelUp(newLevel);
        }
        
        updateDisplay();
    }
    
    // Level up
    function levelUp(newLevel) {
        level = newLevel;
        
        // Increase speed with each level
        dropSpeed = Math.max(100, 1000 - (level - 1) * 100);
        
        // Restart the game interval with the new speed
        if (gameInterval) {
            clearInterval(gameInterval);
        }
        startGameInterval();
    }
    
    // Start the game interval
    function startGameInterval() {
        gameInterval = setInterval(() => {
            if (!isPaused && !isGameOver) {
                if (!movePiece(0, 1)) {
                    lockPiece();
                }
            }
        }, dropSpeed);
    }
    
    // Start the game
    function startGame() {
        isPaused = false;
        isGameOver = false;
        startGameInterval();
    }
    
    // Pause the game
    function togglePause() {
        if (isGameOver) return;
        
        isPaused = !isPaused;
    }
    
    // Game over
    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'flex';
    }
    
    // Restart the game
    function restartGame() {
        // Reset game variables
        board = createEmptyBoard();
        currentPiece = null;
        ghostPiece = null;
        holdPiece = null;
        hasHeldThisTurn = false;
        nextPieces = [];
        score = 0;
        level = 1;
        linesCleared = 0;
        dropSpeed = 1000;
        
        // Clear the game over screen
        gameOverScreen.style.display = 'none';
        
        // Restart the game
        generateBag();
        spawnNewPiece();
        updateGhostPiece();
        updateDisplay();
        startGame();
    }
    
    // Handle key presses
    function handleKeyPress(event) {
        if (isGameOver) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                movePiece(-1, 0);
                break;
            case 'ArrowRight':
                movePiece(1, 0);
                break;
            case 'ArrowDown':
                if (movePiece(0, 1)) {
                    // Add score for soft drop (1 point per cell)
                    addScore(1);
                }
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case ' ':
                hardDrop();
                break;
            case 'c':
            case 'C':
                holdCurrentPiece();
                break;
            case 'p':
            case 'P':
                togglePause();
                break;
        }
    }
    
    // Initialize the game
    init();
}); 
# Tetris Game

A classic Tetris game implementation using HTML, CSS, and JavaScript.

## How to Play

1. Open `index.html` in your web browser to start the game.
2. Use the arrow keys to control the falling tetrominoes:
   - Left/Right Arrow: Move the piece horizontally
   - Up Arrow: Rotate the piece clockwise
   - Down Arrow: Soft drop (move down faster)
   - Space: Hard drop (instantly drop the piece)
   - C: Hold the current piece for later use
   - P: Pause/resume the game

## Game Features

- Standard 10×20 Tetris grid
- Seven different tetrominoes (I, O, T, S, Z, J, L)
- Ghost piece showing where the current piece will land
- Hold piece functionality
- Next piece preview (shows the next 3 pieces)
- Scoring system with bonuses for:
  - Line clears (single, double, triple, tetris)
  - T-spin bonuses
  - Hard and soft drops
- Level progression (speed increases as you clear more lines)
- Super Rotation System (SRS) with wall kicks

## Game Mechanics

### Piece Generation
- Uses the "7-bag" randomizer system
- All seven tetrominoes are placed in a "bag" and drawn in random order
- Ensures each set of seven pieces contains one of each type

### Rotation System
- Implements the Super Rotation System (SRS)
- Allows "wall kicks" when a piece is rotated near an obstacle or wall
- Different wall kick data for I, O, and JLSTZ pieces

### Scoring
- Single line clear: 100 × level
- Double line clear: 300 × level
- Triple line clear: 500 × level
- Tetris (four lines): 800 × level
- T-spin bonuses:
  - T-spin single: 800 × level
  - T-spin double: 1200 × level
  - T-spin triple: 1600 × level
- Soft drop: 1 point per cell
- Hard drop: 2 points per cell

### Leveling
- Level increases for every 10 lines cleared
- Each level increases the falling speed of the tetrominoes

## Credits

Created by [Your Name] as a web development project.

Enjoy the game! 
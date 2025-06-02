import level from '../assets/levels/level1.json';

class Game {
    constructor() {
        this.isRunning = false;
        this.level = null;
        this.block = null;
        this.n = -1;
        this.m = -1;
        this.b = -1;
        this.transporters = [];
        this.grid = [];
        this.buttons = [];
        this.buttonMap = [];
        this.startPos = [];
    }

    start() {
        this.isRunning = true;
        this.score = 0;
        this.loadLevel();
        this.gameLoop();
    }

    loadLevel() {
        // Logic to load the level and initialize the block
        let layout = level.layout;
        this.n = layout.length;
        this.m = layout[0].length;
        // Now let's also get the b value
        this.b = level.b;
        const newArray = Array.from({ length : this.n + 2 * this.b }, () => Array(this.m + 2 * this.b).fill(0));
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.m; j++) {
                newArray[this.b + i][this.b + j] = layout[i][j];
            }
        }
        this.grid = newArray;
        this.n += this.b * 2;
        this.m += this.b * 2;
        // Now create a transporter array:
        let numTransporters = 0;
        let transporterIndices = [];
        let numButtons = 0;
        let bridgeIndices = []
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.m; j++) {
                if (this.grid[i][j] === 2) {
                    this.start.x = i;
                    this.start.y = j;
                }
                else if (Math.floor(this.grid[i][j] / 100) === 1) {
                    numTransporters++;
                    transporterIndices.push([i, j]);
                }
                else if (Math.floor(this.grid[i][j] / 100) === 2) {
                    numButtons++;
                }
                else if (this.grid[i][j] < 0) {
                    bridgeIndices.push([((-this.grid[i][j]) % 200), i, j, (this.grid[i][j] < -200)]);
                }
            }
        }
        this.buttons = Array(numButtons + 1).fill(false);
        this.buttonMap = Array(numButtons + 1).fill(null).map(() => []);
        for (const [k, i, j, t] of bridgeIndices) {
            this.buttonMap[k].push({ i, j, t });
        }
        this.transporters = Array(numTransporters);
        for (const [i, j] of transporterIndices) {
            let val = this.grid[i][j] % 100;
            if (val % 2) {
                this.transporters[val - 1] = { i, j };
            }
            else {
                this.transporters[val + 1] = { i, j };
            }
        }
        console.log("Grid successfully loaded");
//        this.block = new Block(this.scene, { ...this.level.start });
    }

    gameLoop() {
        if (this.isRunning) {
            this.update();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        // Logic to update game state, handle user input, and check for collisions
    }

    end() {
        this.isRunning = false;
        // Logic to handle end of game, display score, etc.
    }
}

export default Game;
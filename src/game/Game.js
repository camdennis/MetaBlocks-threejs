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
        this.start = { x: 0, y: 0 };
        this.valid = true;
        this.numButtons = 0;
        this.solutionString = "";
        this.url = "";
    }

    async begin() {
        this.isRunning = true;
        this.score = 0;
        // load level here
        this.loadLevel();
        this.gameLoop();
    }

    reset() {
        this.score = 0;
        this.buttons = Array(this.numButtons + 1).fill(false);
    }

    loadLevel() {
        // Logic to load the level and initialize the block
        let layout = this.level.layout;
        this.n = layout.length;
        this.m = layout[0].length;
        // Now let's also get the b value
        this.b = this.level.b;
        this.solutionString = this.level.solutionString;
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
        this.numButtons = 0;
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
                    this.numButtons++;
                }
                else if (this.grid[i][j] < 0) {
                    bridgeIndices.push([((-this.grid[i][j]) % 200), i, j, (this.grid[i][j] < -200)]);
                }
            }
        }
        this.buttons = Array(this.numButtons + 1).fill(false);
        this.buttonMap = Array(this.numButtons + 1).fill(null).map(() => []);
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
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    checkOOB(currPos) {
        let x = currPos[1];
        let y = currPos[0];
        // Check if the current position is out of bounds
        if (x < 0 || x >= this.n + this.b || y < 0 || y >= this.m + this. b) {
            return false;
        }
        return true;    
    }

    checkValid0(currPos) {
        let x = currPos[1];
        let y = currPos[0];
        if (this.grid[x][y] == 4 || this.grid[x][y] == 0) {
            return false;
        }
        if (this.grid[x][y] < 0) {
            // Here's where it's actually interesting.
            if (this.grid[x][y] < -200 && this.buttons[-this.grid[x][y] % 200]) {
                return false;
            }
            if (this.grid[x][y] > -200 && !this.buttons[-this.grid[x][y]]) {
                return false;
            }
        }
        return true;
    }

    checkValid12(currPos, isOne) {
        let x = currPos[1];
        let y = currPos[0];
        let firstHalf = false;
        let secondHalf = false;
        for (let i = 0; i < this.b; i++) {
            let val = this.grid[x + i * isOne][y + i * (! isOne)];
            if (val == 0) {
                continue;
            }
            if (val == 4) {
                return false;
            }
            if (val == 1 || val == 2 || val == 3 || val > 99) {
                if (i < Math.floor(this.b / 2)) {
                    firstHalf = true;
                }
                else {
                    secondHalf = true;
                }
                if (this.b % 2 && i == Math.floor(this.b / 2)) {
                    firstHalf = true;
                    secondHalf = true;
                }
            }
            else if ((val < -200 && !this.buttons[-val % 200]) || (val > -200 && this.buttons[-val])) {
                if (i < Math.floor(this.b / 2)) {
                    firstHalf = true;
                }
                else {
                    secondHalf = true;
                }
                if (this.b % 2 && i == Math.floor(this.b / 2)) {
                    firstHalf = true;
                    secondHalf = true;
                }
            }
        }
        if (! firstHalf || ! secondHalf) {
            return false;
        }
        return true;
    }

    checkValid(state, currPos) {
        let x = currPos[1];
        let y = currPos[0];
        if (! this.checkOOB(currPos)) {
            return false;
        }
        switch (state) {
            case 0:
                return this.checkValid0(currPos);
            case 1:
                return this.checkValid12(currPos, false);
            case 2:
                return this.checkValid12(currPos, true);
            default:
                break;
        }
        return true;
    }

    update(statePos) {
        // Logic to update game state, handle user input, and check for collisions
        this.valid = this.checkValid(statePos[0], statePos.slice(1));
    }

    end() {
        this.isRunning = false;
        // Logic to handle end of game, display score, etc.
    }

}

export default Game;


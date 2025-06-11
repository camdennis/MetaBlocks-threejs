// This file initializes the Three.js scene, camera, and renderer, and starts the game loop.

import * as THREE from 'three';
import Game from './game/Game';
import Block from './game/Block';
import { RoundedBoxGeometry } from 'three-stdlib';
// or if you use three/examples:
// import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
let musicOff = false;
let scene, camera, renderer, game, playerBlock, starField;
let moveCounter = 0;
let previewAnimationFrame = null;
let levelData = null;

const loader = new THREE.TextureLoader();
const textures = {
    startTexture: loader.load('assets/textures/start.png'),
    end: loader.load('assets/textures/end.png'),
    plain1: loader.load('assets/textures/plain1.png'),
    plain2: loader.load('assets/textures/plain2.png'),
    button1: loader.load('assets/textures/button1.png'),
    button2: loader.load('assets/textures/button2.png'),
    button3: loader.load('assets/textures/button3.png'),
    buttonActivated1: loader.load('assets/textures/buttonActivated1.png'),
    buttonActivated2: loader.load('assets/textures/buttonActivated2.png'),
    buttonActivated3: loader.load('assets/textures/buttonActivated3.png'),
    buttonDeactivated1: loader.load('assets/textures/buttonDeactivated1.png'),
    buttonDeactivated2: loader.load('assets/textures/buttonDeactivated2.png'),
    buttonDeactivated3: loader.load('assets/textures/buttonDeactivated3.png'),
    teleporter1: loader.load('assets/textures/teleporter1.png'),
    teleporter2: loader.load('assets/textures/teleporter2.png'),
    teleporter3: loader.load('assets/textures/teleporter3.png'),
    dead: loader.load('assets/textures/dead.png')
};

function getMaterialForCell(cellValue, parity) {
    if (cellValue === 1 && parity) {
        return new THREE.MeshBasicMaterial({ map: textures.plain1 });
    }
    else if (cellValue === 2) {
        return new THREE.MeshBasicMaterial({ map: textures.startTexture });
    }
    else if (cellValue === 3) {
        return new THREE.MeshBasicMaterial({ map: textures.end });
    }
    else if (cellValue === 1 && ! parity) {
        return new THREE.MeshBasicMaterial({ map: textures.plain2 });
    }
    else if (cellValue === 201) {
        return new THREE.MeshBasicMaterial({ map: textures.button1 });
    }
    else if (cellValue === 202) {
        return new THREE.MeshBasicMaterial({ map: textures.button2 });
    }
    else if (cellValue === 203) {
        return new THREE.MeshBasicMaterial({ map: textures.button3 });
    }
    else if (cellValue === -201) {
        if (!game.buttons[(-cellValue) % 200]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated1 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated1 });
        }
    }
    else if (cellValue === -202) {
        if (!game.buttons[(-cellValue) % 200]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated2 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated2 });
        }
    }
    else if (cellValue === -203) {
        if (!game.buttons[(-cellValue) % 200]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated3 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated3 });
        }
    }
    else if (cellValue === -1) {
        if (game.buttons[(-cellValue)]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated1 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated1 });
        }
    }
    else if (cellValue === -2) {
        if (game.buttons[(-cellValue)]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated2 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated2 });
        }
    }
    else if (cellValue === -3) {
        if (game.buttons[(-cellValue)]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated3 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated3 });
        }
    }
    else if (cellValue === 100 || cellValue === 101) {
        return new THREE.MeshBasicMaterial({ map: textures.teleporter1});
    }
    else if (cellValue === 102 || cellValue === 103) {
        return new THREE.MeshBasicMaterial({ map: textures.teleporter2});
    }
    else if (cellValue === 104 || cellValue === 105) {
        return new THREE.MeshBasicMaterial({ map: textures.teleporter3});
    }
    else if (cellValue === 4) {
        return new THREE.MeshBasicMaterial({ map: textures.dead });
    }
}

let gridTiles = [];

function renderGrid() {
    const tileSize = 1;
    // Remove old tiles
    for (let tile of gridTiles) {
        scene.remove(tile);
        tile.geometry.dispose();
        tile.material.dispose();
    }
    gridTiles = [];

    // Add new tiles
    for (let i = 0; i < game.n; i++) {
        for (let j = 0; j < game.m; j++) {
            if (game.grid[i][j] == 0) continue;
            const geometry = new RoundedBoxGeometry(tileSize, 0.3, tileSize, 4, 0.08);
            const material = getMaterialForCell(game.grid[i][j], (i + j) % 2);
            const tile = new THREE.Mesh(geometry, material);
            tile.position.set(j - game.m / 2, -0.25, i - game.n / 2);
            scene.add(tile);
            gridTiles.push(tile);
        }
    }
}

function disposeScene(scene) {
    // Recursively dispose all objects in the scene
    scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose && mat.dispose());
            } else {
                obj.material.dispose && obj.material.dispose();
            }
        }
        // If you use textures, dispose them here as well
        if (obj.texture) obj.texture.dispose();
    });
}

async function init(n, m, b, level) {
    // Dispose old scene and renderer if they exist
    if (scene) {
        disposeScene(scene);
    }
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer.dispose();
    }
    game = null;
    playerBlock = null;
    
    scene = new THREE.Scene();
    starField = addStarField();
    const centerX = game ? game.m / 2 : 0;
    const centerZ = game ? game.n / 2 : 0;
    const maxDim = Math.max(game ? game.n : n, game ? game.m : m);
    const zoomY = 8 + maxDim * 0.15; // Adjust these coefficients as needed
    const zoomZ = 4 + maxDim * 0.35;
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(centerX, zoomY, centerZ + zoomZ);
    camera.lookAt(centerX, 0, centerZ);

    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    game = new Game(scene, camera);
    game.level = levelData;
//    game.url = dropboxURL;
    await game.begin();

    window.addEventListener('resize', onWindowResize, false);
    renderGrid();
    // If your start position is in grid coordinates (i, j):
    const start = game.start || { x: Math.floor(game.m / 2), y: 0, z: Math.floor(game.n / 2) };
    // Convert grid coordinates to world coordinates:
    const blockX = start.y - game.m / 2;
    const blockY = 0.15; // slightly above the floor
    const blockZ = start.x - game.n / 2;

    playerBlock = new Block(scene, { x: blockX, y: blockY, z: blockZ }, game.n, game.m, game.b);
    playerBlock.grid = game.grid;

    setupPreviewRenderer();

    animate();
}

function createCircleTexture(size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

function addStarField() {
    const starCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < starCount; i++) {
        const r = 50 + Math.random() * 100; // distance from center
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        positions.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const circleTexture = createCircleTexture(64);
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, map: circleTexture, alphaTest: 0.5, transparent: true });
    const stars = new THREE.Points(geometry, material);
    stars.name = "starField";
    scene.add(stars);
    return stars;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (! game.valid) {
        const dissolveSound = new Audio('assets/sounds/dissolve.wav');
        dissolveSound.volume = 0.2;
        dissolveSound.play();
        playerBlock.dissolveBlock(500, () => {
            playerBlock.reset();
            game.reset();
            renderGrid();
            game.valid = true;
        });
    }

    if (starField) {
        starField.rotation.y += 0.0001;
        starField.rotation.x += 0.00001;
    }
    renderer.render(scene, camera);
}

window.addEventListener('keydown', (event) => {
    if (!playerBlock) return;
    if (playerBlock.isAnimating || playerBlock.isDissolving) return;
    let direction = null;
    const step = 1;
    switch(event.key) {
        case 'ArrowUp':
            direction = 'up';
            break;
        case 'ArrowDown':
            direction = 'down';
            break;
        case 'ArrowLeft':
            direction = 'left';
            break;
        case 'ArrowRight':
            direction = 'right';
            break;
    }
    if (direction) {
        playerBlock.move(direction, () => {
            const moveSound = new Audio('assets/sounds/move.wav');
            moveSound.play();
            let statePos = playerBlock.getStateAndPosition();
            game.update(statePos);
            moveCounter++;
//            console.log(moveCounter);
            if (game.buttons) {
                if (playerBlock.activateButton(game.buttons)) {
                    renderGrid();
                }
            }
            if (game.transporters) {
                playerBlock.transport(game.transporters);
            }
            if (playerBlock.checkWinState()) {
                showWinScreen(moveCounter, game.solutionString.length);
                moveCounter = 0;
            }
        });
    }
});

async function loadLevelAndStart(n, m, b, level) {
    console.log(n, m, b, level);
    try {
        // Adjust the path as needed
        const response = await fetch(`assets/levels/level_${level}.json`);
        if (!response.ok) throw new Error('Level file not found');
        const levels = await response.json();

        // Find all matching levels
        const matches = levels.filter(lvl => lvl.n === n && lvl.m === m && lvl.b === b);

        if (matches.length === 0) {
            // Play error sound and do not start game
            const errorSound = new Audio('assets/sounds/error.mp3');
            errorSound.volume = 0.5;
            errorSound.play();
            return false;
        }

        // Pick a random match
        const chosen = matches[Math.floor(Math.random() * matches.length)];

        // Parse layout if it's a string
        let layout = chosen.layout;
        if (typeof layout === "string") {
            layout = JSON.parse(layout);
        }
        console.log("levelNum", chosen.fileNum);
        // Set up the game object
        levelData = {
            layout: layout,
            b: chosen.b,
            solutionString: chosen.solutionString
        };

        // Now start the game as usual
        await init(n, m, b, level);

    } catch (e) {
        // Play error sound if fetch or parsing fails
        const errorSound = new Audio('assets/sounds/error.mp3');
        errorSound.volume = 0.5;
        errorSound.play();
        console.error(e);
        return false;
    }
    return true;
}

// Replace your startBtn handler with:
document.getElementById('startBtn').onclick = async () => {
    if (! await loadLevelAndStart(previewN, previewM, previewB, previewLevel)) {
        return;
    }
    if (!musicOff) {
        bgMusic.play();
    }
    document.getElementById('menu').style.display = 'none';
    previewActive = false;
    if (previewAnimationFrame) {
        cancelAnimationFrame(previewAnimationFrame);
        previewAnimationFrame = null;
    }
};
document.getElementById('menuBtn').onclick = () => {
    document.getElementById('winScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    previewActive = true;
    buildPreviewScene();
    setupPreviewRenderer();
};
document.getElementById('mainMenuBtn').onclick = function() {
    document.getElementById('menu').style.display = 'block';
    previewActive = true;
    buildPreviewScene();
    setupPreviewRenderer();
};
document.getElementById('rulesBtn').onclick = function() {
    document.getElementById('rulesModal').style.display = 'flex';
};
document.getElementById('closeRulesBtn').onclick = function() {
    document.getElementById('rulesModal').style.display = 'none';
};

let previewScene, previewCamera, previewRenderer, previewBlock;
let previewN = 5, previewM = 10, previewB = 2, previewLevel = 1;

function buildPreviewScene() {
    if (previewScene) {
        disposeScene(previewScene);
        previewBlock = null;
    }
    previewScene = new THREE.Scene();

    // Add a simple board preview
    for (let i = 0; i < previewN; i++) {
        for (let j = 0; j < previewM; j++) {
            const geometry = new THREE.BoxGeometry(1, 0.3, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x8888aa });
            const tile = new THREE.Mesh(geometry, material);
            tile.position.set(j - previewM / 2 + 0.5, -0.25, i - previewN / 2 + 0.5);
            previewScene.add(tile);
        }
    }

    // Add a block preview
    const blockGeometry = new THREE.BoxGeometry(1, previewB, 1);
    const blockMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    previewBlock = new THREE.Mesh(blockGeometry, blockMaterial);
    previewBlock.position.set(0, previewB / 2, 0);
    previewScene.add(previewBlock);

    // Optionally: Add difficulty/level indicators (e.g., text or color)
}

let previewActive = true;

function setupPreviewRenderer() {
    if (previewRenderer) previewRenderer.dispose();
    const previewCanvas = document.getElementById('previewCanvas');
    previewRenderer = new THREE.WebGLRenderer({ canvas: previewCanvas, alpha: true, antialias: true });
    previewRenderer.setClearColor(0x222233, 1);

    // Calculate the center of the preview board
    const centerX = (previewM - 1) / 2;
    const centerZ = (previewN - 1) / 2;
    const blockY = previewB / 2;

    previewCamera = new THREE.PerspectiveCamera(60, 300/200, 0.1, 1000);

    function animatePreview() {
        if (!previewActive) return;
        // Orbit around the center of the preview board
        const t = Date.now() * 0.0005;
        const radius = 6 + Math.max(previewM, previewN);
        previewCamera.position.x = centerX + radius * Math.sin(t);
        previewCamera.position.z = centerZ + radius * Math.cos(t);
        previewCamera.position.y = blockY + 3;
        previewCamera.lookAt(centerX, blockY, centerZ);
        previewRenderer.clear();
        previewRenderer.render(previewScene, previewCamera);
        requestAnimationFrame(animatePreview);
    }
    previewActive = true;
    if (previewAnimationFrame) {
        cancelAnimationFrame(previewAnimationFrame);
        previewAnimationFrame = null;
    }
    animatePreview();
}

function showWinScreen(moves, optimal) {
    const winScreen = document.getElementById('winScreen');
    const winStats = document.getElementById('winStats');
    winStats.innerHTML = `You finished in <b>${moves}</b> moves.<br>Optimal: <b>${optimal}</b> moves.`;
    winScreen.style.display = 'flex';
    previewActive = false; // Stop preview animation if needed
}

function updatePreviewFromSliders() {
    previewN = parseInt(document.getElementById('sliderN').value, 10);
    previewM = parseInt(document.getElementById('sliderM').value, 10);
    previewB = parseInt(document.getElementById('sliderB').value, 10);
    previewLevel = parseInt(document.getElementById('sliderLevel').value, 10);

    // Update labels
    document.getElementById('labelN').textContent = previewN;
    document.getElementById('labelM').textContent = previewM;
    document.getElementById('labelB').textContent = previewB;
    document.getElementById('labelLevel').textContent = previewLevel;

    // Rebuild the preview scene
    buildPreviewScene();
    setupPreviewRenderer();
}

const sliderN = document.getElementById('sliderN');
const sliderM = document.getElementById('sliderM');
const labelN = document.getElementById('labelN');
const labelM = document.getElementById('labelM');

sliderN.addEventListener('input', () => {
    let n = parseInt(sliderN.value, 10);
    let m = parseInt(sliderM.value, 10);
    if (n > m) {
        // Set columns to next possible value above rows
        let nextM = n;
        if (nextM <= parseInt(sliderM.max, 10)) {
            sliderM.value = nextM;
            labelM.textContent = nextM;
        } else {
            // If can't increment columns, decrement rows
            let prevN = m;
            sliderN.value = prevN;
            labelN.textContent = prevN;
        }
    }
    labelN.textContent = sliderN.value;
});

sliderM.addEventListener('input', () => {
    let n = parseInt(sliderN.value, 10);
    let m = parseInt(sliderM.value, 10);
    if (m < n) {
        // Set rows to next possible value below columns
        let prevN = m;
        if (prevN >= parseInt(sliderN.min, 10)) {
            sliderN.value = prevN;
            labelN.textContent = prevN;
        } else {
            // If can't decrement rows, increment columns
            let nextM = n + 5;
            sliderM.value = nextM;
            labelM.textContent = nextM;
        }
    }
    labelM.textContent = sliderM.value;
});

['sliderN', 'sliderM', 'sliderB', 'sliderLevel'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreviewFromSliders);
});

// Initialize preview on page load or menu show
buildPreviewScene();
setupPreviewRenderer();

const bgMusic = document.getElementById('bgMusic');
bgMusic.volume = 0.3; // Set volume (0.0 to 1.0)
//bgMusic.play();       // Start playing (if not autoplayed)

const musicToggleBtn = document.getElementById('musicToggleBtn');
musicToggleBtn.onclick = function() {
    if (musicToggleBtn.textContent == '🔊') {
        bgMusic.pause();
        musicToggleBtn.textContent = '🔇';
        musicOff = true;
    }
    else {
        bgMusic.play();
        musicToggleBtn.textContent = '🔊';
        musicOff = false;
    }
};
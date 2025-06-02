// This file initializes the Three.js scene, camera, and renderer, and starts the game loop.

import * as THREE from 'three';
import Game from './game/Game';
import Block from './game/Block';
import { RoundedBoxGeometry } from 'three-stdlib';
// or if you use three/examples:
// import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

let scene, camera, renderer, game, playerBlock, starField;
const loader = new THREE.TextureLoader();
const textures = {
    start: loader.load('assets/textures/start.png'),
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
        return new THREE.MeshBasicMaterial({ map: textures.start });
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
        if (!game.buttonMap[(-cellValue) % 200]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated1 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated1 });
        }
    }
    else if (cellValue === -202) {
        if (!game.buttonMap[(-cellValue) % 200]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated2 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated2 });
        }
    }
    else if (cellValue === -203) {
        if (!game.buttonMap[(-cellValue) % 200]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated3 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated3 });
        }
    }
    else if (cellValue === -1) {
        if (game.buttonMap[(-cellValue)]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated1 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated1 });
        }
    }
    else if (cellValue === -2) {
        if (game.buttonMap[(-cellValue)]) {
            return new THREE.MeshBasicMaterial({ map: textures.buttonActivated2 });
        }
        else {
            return new THREE.MeshBasicMaterial({ map: textures.buttonDeactivated2 });
        }
    }
    else if (cellValue === -3) {
        if (game.buttonMap[(-cellValue)]) {
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

function renderGrid() {
    const tileSize = 1;
    for (let i = 0; i < game.n; i++) {
        for (let j = 0; j < game.m; j++) {
            if (game.grid[i][j] == 0) {
                continue;
            }
            const geometry = new RoundedBoxGeometry(tileSize, 0.3, tileSize, 4, 0.08);
            const material = getMaterialForCell(game.grid[i][j], (i + j) % 2);
            const tile = new THREE.Mesh(geometry, material);
            tile.position.set(j - game.m / 2, -0.25, i - game.n / 2);
            scene.add(tile);
        }
    }
}

function init() {
    scene = new THREE.Scene();
    starField = addStarField();
    const centerX = game ? game.m / 2 : 0;
    const centerZ = game ? game.n / 2 : 0;
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(centerX, 10, centerZ + 5);
    camera.lookAt(centerX, 0, centerZ);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Add this line:
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    game = new Game(scene, camera);
    game.start();

    window.addEventListener('resize', onWindowResize, false);
    renderGrid();0
    // If your start position is in grid coordinates (i, j):
    const start = game.start || { x: Math.floor(game.m / 2), y: 0, z: Math.floor(game.n / 2) };
    // Convert grid coordinates to world coordinates:
    const blockX = start.y - game.m / 2;
    const blockY = 0.15; // slightly above the floor
    const blockZ = start.x - game.n / 2;

    playerBlock = new Block(scene, { x: blockX, y: blockY, z: blockZ }, game.b);
    playerBlock.createPlayerBlock();

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
    if (starField) {
        starField.rotation.y += 0.001;
        starField.rotation.x += 0.0001;
    }
    game.update();
    renderer.render(scene, camera);
}

window.addEventListener('keydown', (event) => {
    if (!playerBlock) return;
    const step = 1;
    switch(event.key) {
        case 'ArrowUp':
            playerBlock.move('up');
            break;
        case 'ArrowDown':
            playerBlock.move('down');
            break;
        case 'ArrowLeft':
            playerBlock.move('left');
            break;
        case 'ArrowRight':
            playerBlock.move('right');
            break;
    }
});

init();
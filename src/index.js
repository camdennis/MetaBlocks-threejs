// This file initializes the Three.js scene, camera, and renderer, and starts the game loop.

import * as THREE from 'three';
import Game from './game/Game';

let scene, camera, renderer, game, cube;
const loader = new THREE.TextureLoader();
const textures = {
    plain1: loader.load('assets/textures/plain1.png'),
    plain2: loader.load('assets/textures/plain2.png'),
};


function getMaterialForCell(cellValue, parity) {
    if (cellValue === 1 && parity) {
        return new THREE.MeshBasicMaterial({ map: textures.plain1 });
    }
    else if (cellValue === 1 && ! parity) {
        return new THREE.MeshBasicMaterial({ map: textures.plain2 });
    }
}

function renderGrid() {
    const tileSize = 1;
    for (let i = 0; i < game.n; i++) {
        for (let j = 0; j < game.m; j++) {
            if (game.grid[i][j] == 0) {
                continue;
            }
            const geometry = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
            const material = getMaterialForCell(game.grid[i][j], (i + j) % 2);
            const tile = new THREE.Mesh(geometry, material);
            tile.position.set(j - game.m / 2, -0.25, i - game.n / 2);
            scene.add(tile);
        }
    }
}

function init() {
    scene = new THREE.Scene();
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
    document.body.appendChild(renderer.domElement);

    game = new Game(scene, camera);
    game.start();

    window.addEventListener('resize', onWindowResize, false);
    renderGrid();
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    game.update();
    renderer.render(scene, camera);
}

init();
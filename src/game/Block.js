import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';

const tileSize = 1;
const loader = new THREE.TextureLoader();

const textures = {
    block: loader.load('assets/textures/brick.png'),
}

class Block {
    constructor(scene, position, b) {
        this.scene = scene;
        this.position = position;
        this.b = b;
        this.state = 0;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.states = Array.from({ length: 3 }, () =>
        Array.from({ length: b }, () =>
            Array.from({ length: b }, () =>
                Array(b).fill(false)
            )
        )
    );
    // Initialize the states
    for (let i = 0; i < b; i++) {
        this.states[0][i][0][0] = true;
        this.states[1][0][i][0] = true;
        this.states[2][0][0][i] = true;
    }

    // Transitions (mp)
    this.mp = [
        [ [1,0], [1,1], [2,2], [2,3] ],
        [ [0,4], [0,5], [1,6], [1,7] ],
        [ [2,8], [2,9], [0,10], [0,11] ]
    ];
        // Offsets
    this.offsets = [
        { x: 1, y: 0 },
        { x: -b, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -b },
        { x: b, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: b },
        { x: 0, y: -1 }
    ];
    }

    createPlayerBlock() {
        this.blockMeshes = [];
        let dx = 0; 
        let dy = 0; 
        let dz = 0;
        if (this.state === 0) {
            dy = 1;
        }
        else if (this.state === 1) {
            dx = 1;
        }
        else {
            dz = 1;
        }
        while (this.group.children.length) {
            this.group.remove(this.group.children[0]);
        }
        for (let i = 0; i < this.b; i++) {
            const geometry = new RoundedBoxGeometry(tileSize, tileSize, tileSize, 4, 0.05);
            const material = new THREE.MeshBasicMaterial({ map: textures.block});
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(this.position.x + i * dx, i * dy, this.position.z + i * dz);
            this.blockMeshes.push(cube);
            this.group.add(cube);
        }
    }

    animateMove(axis, angle, onComplete) {
        const duration = 2000;
        const start = performance.now();
        const initialRotation = this.group.rotation[axis];
        const targetRotation = initialRotation + angle;
        const animate = (now) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            this.group.rotation[axis] = initialRotation + (targetRotation - initialRotation) * t;
            if (t < 1) {
                requestAnimationFrame(animate);
            }
            else {
                this.group.rotation[axis] = targetRotation;
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(animate);
    }

    move(direction) {
        let nextState = [];
        let axis, angle;
        switch (direction) {
            case 'up':
                nextState = this.mp[this.state][3];
                axis = 'x'; angle = -Math.PI / 2;
                break;
            case 'down':
                nextState = this.mp[this.state][2];
                axis = 'x'; angle = Math.PI / 2;
                break;
            case 'left':
                nextState = this.mp[this.state][1];
                axis = 'z'; angle = Math.PI / 2;
                break;
            case 'right':
                nextState = this.mp[this.state][0];
                axis = 'z'; angle = -Math.PI / 2;
                break;
        }
        this.animateMove(axis, angle, () => {
            this.state = nextState[0];
            this.position.x += this.offsets[nextState[1]].x;
            this.position.z += this.offsets[nextState[1]].y;
            this.createPlayerBlock();
            this.group.rotation.set(0, 0, 0);
        });
    }
}

export default Block;
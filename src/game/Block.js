import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';

const tileSize = 1;
const loader = new THREE.TextureLoader();
const tileHeight = 0.15;
const textures = {
    block: loader.load('assets/textures/brick.png'),
};

class Block {
    constructor(scene, position, b) {
        this.scene = scene;
        this.position = { ...position }; // {x, y, z}
        this.b = b;
        this.state = 0; // 0: standing, 1: lying X, 2: lying Z

        // Set up pivot and group
        this.pivot = new THREE.Object3D();
        this.group = new THREE.Group();
        this.pivot.add(this.group);
        this.scene.add(this.pivot);
        this.isAnimating = false;

        // Transitions (mp) and offsets
        this.mp = [
            [ [1,0], [1,1], [2,2], [2,3] ],
            [ [0,4], [0,5], [1,6], [1,7] ],
            [ [2,8], [2,9], [0,10], [0,11] ]
        ];
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

        this.createPlayerBlock();
        this.updateTransforms();
    }

    // Correct pivot calculation for Bloxorz
    getPivotOffset(direction) {
        const half = tileSize / 2;
        const len = this.b * tileSize;
        let offset = { x: 0, y: 0, z: 0 };

        if (this.state === 0) { // standing
            if (direction === 'up')    offset = { x: 0, y: tileHeight-half, z: -half };
            if (direction === 'down')  offset = { x: 0, y: tileHeight-half, z: half };
            if (direction === 'left')  offset = { x: -half, y: tileHeight-half, z: 0 };
            if (direction === 'right') offset = { x: half, y: tileHeight-half, z: 0 };
        } else if (this.state === 1) { // lying X
            if (direction === 'up')    offset = { x: 0, y: tileHeight-half, z: -half };
            if (direction === 'down')  offset = { x: 0, y: tileHeight-half, z: half };
            if (direction === 'left')  offset = { x: -half, y: tileHeight-half, z: 0 };
            if (direction === 'right') offset = { x: len - half, y: tileHeight-half, z: 0 };
        } else { // lying Z
            if (direction === 'up')    offset = { x: 0, y: tileHeight-half, z: -half };
            if (direction === 'down')  offset = { x: 0, y: tileHeight-half, z: len - half };
            if (direction === 'left')  offset = { x: -half, y: tileHeight-half, z: 0 };
            if (direction === 'right') offset = { x: half, y: tileHeight-half, z: 0 };
        }
        return offset;
    }

    createPlayerBlock() {
        // Remove old cubes
        while (this.group.children.length) {
            this.group.remove(this.group.children[0]);
        }
        // Stack cubes according to state
        let dx = 0, dy = 0, dz = 0;
        if (this.state === 0) { dy = 1; }
        else if (this.state === 1) { dx = 1; }
        else { dz = 1; }
        for (let i = 0; i < this.b; i++) {
            const geometry = new RoundedBoxGeometry(tileSize, tileSize, tileSize, 4, 0.05);
            const material = new THREE.MeshBasicMaterial({ map: textures.block });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(i * dx, tileHeight + i * dy, i * dz); // y=0 for all cubes
            this.group.add(cube);
        }
    }

    updateTransforms() {
        // Always center the pivot at the block's logical position
        this.pivot.position.set(this.position.x, tileHeight, this.position.z);
        this.group.position.set(0, 0, 0);
        this.pivot.rotation.set(0, 0, 0);
        this.group.rotation.set(0, 0, 0);
    }

    animateMove(axis, angle, onComplete) {
        const duration = 100;
        const start = performance.now();
        const initialRotation = this.pivot.rotation[axis];
        const targetRotation = initialRotation + angle;
        const animate = (now) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            this.pivot.rotation[axis] = initialRotation + (targetRotation - initialRotation) * t;
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.pivot.rotation[axis] = targetRotation;
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(animate);
    }

    move(direction) {
        if (this.isAnimating) return;
        this.isAnimating = true;
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
        // Set pivot to the correct edge before animating
        const pivot = this.getPivotOffset(direction);
        this.pivot.position.set(
            this.position.x + pivot.x,
            tileHeight + pivot.y,
            this.position.z + pivot.z
        );
        this.group.position.set(-pivot.x, -pivot.y, -pivot.z);

        this.animateMove(axis, angle, () => {
            // After animation, update state and position
            this.state = nextState[0];
            this.position.x += this.offsets[nextState[1]].x;
            this.position.z += this.offsets[nextState[1]].y;
            this.createPlayerBlock();
            this.updateTransforms();
            this.isAnimating = false;
        });
    }
}

export default Block;
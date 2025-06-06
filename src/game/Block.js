import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';

const tileSize = 1;
const loader = new THREE.TextureLoader();
const tileHeight = 0.15;
const textures = {
    block: loader.load('assets/textures/block.png'),
};

function createDissolveMaterial(texture, dissolveAmount = 0.0) {
    return new THREE.ShaderMaterial({
        uniforms: {
            map: { value: texture },
            dissolve: { value: dissolveAmount },
            time: { value: 0.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D map;
            uniform float dissolve;
            uniform float time;
            varying vec2 vUv;

            // Simple noise function
            float rand(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }

            void main() {
                vec4 color = texture2D(map, vUv);
                float noise = rand(vUv + time);
                if(noise < dissolve) discard;
                gl_FragColor = color;
            }
        `,
        transparent: true
    });
}

class Block {
    constructor(scene, position, n, m, b) {
        this.scene = scene;
        this.b = b;
        this.state = 0; // 0: standing, 1: lying X, 2: lying Z
        this.n = n;
        this.m = m;
        this.startPos = { ...position };
        this.position = { ...this.startPos };
        this.startCurr = { ...position };
        this.startCurr.x += this.m / 2;
        this.startCurr.z += this.n / 2;
        this.curr = { ...this.startCurr };

        // Set up pivot and group
        this.pivot = new THREE.Object3D();
        this.group = new THREE.Group();
        this.pivot.add(this.group);
        this.scene.add(this.pivot);
        this.isAnimating = false;
        this.isDissolving = false;

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

    dissolveBlock(duration = 1000, onComplete) {
        if (this.isDissolving) return; // Prevent multiple dissolves
        this.isDissolving = true;
        for (let cube of this.group.children) {
            cube.material = createDissolveMaterial(textures.block, 0.0);
        }
        let start = performance.now();
        const animateDissolve = (now) => {
            let t = Math.min((now - start) / duration, 1);
            for (let cube of this.group.children) {
                if (cube.material.uniforms) {
                    cube.material.uniforms.dissolve.value = t;
                    cube.material.uniforms.time.value = now * 0.001;
                }
            }
            if (t < 1) {
                requestAnimationFrame(animateDissolve);
            } else {
                for (let cube of this.group.children) {
                    if (cube.material.dispose) cube.material.dispose();
                }
                this.scene.remove(this.pivot);
                this.isDissolving = false;
                if (onComplete) onComplete();
            }
        };
        requestAnimationFrame(animateDissolve);
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
        if (this.isDissolving) return;
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
            const geometry = new RoundedBoxGeometry(tileSize, tileSize, tileSize, 4, 0.3);
            const material = new THREE.MeshBasicMaterial({ map: textures.block });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(i * dx, tileHeight + i * dy, i * dz); // y=0 for all cubes
            this.group.add(cube);
        }
    }

    reset() {
        if (this.isDissolving) return;
        // Remove old cubes
        while (this.group.children.length) {
            this.group.remove(this.group.children[0]);
        }
        // Stack cubes according to state
        let dx = 0, dy = 1, dz = 0;
        for (let i = 0; i < this.b; i++) {
            const geometry = new RoundedBoxGeometry(tileSize, tileSize, tileSize, 4, 0.3);
            const material = new THREE.MeshBasicMaterial({ map: textures.block });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(i * dx, tileHeight + i * dy, i * dz); // y=0 for all cubes
            this.group.add(cube);
        }
        if (! this.scene.children.includes(this.pivot)) {
            this.scene.add(this.pivot);
        }
        this.state = 0;
        this.curr = { ...this.startCurr };
        this.position = { ...this.startPos };
        this.updateTransforms();
        // Add buttons to here
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

    activateButton(buttons) {
        if (this.state != 0 || !this.grid) return;
        let val = this.grid[this.curr.z][this.curr.x];
        if (Math.floor(val / 100) == 2) {
            const idx = val % 100;
            buttons[idx] = !buttons[idx]; // Toggle
            console.log("Button", idx, "toggled to", buttons[idx]);
            return true;
        }
        return false;
    }

    transport(transporters) {
        if (this.state != 0 || !this.grid) {
            return;
        }
        let val = this.grid[this.curr.z][this.curr.x];
        if (Math.floor(val / 100) == 1) {
            const dest = transporters[val % 100];
            if (dest) {
                console.log(this.position, this.curr, dest);
                this.curr.x = dest.j;
                this.curr.z = dest.i;
                this.position.x = dest.j - this.m / 2;
                this.position.z = dest.i - this.n / 2;
                console.log(this.position, this.curr, dest);
                this.createPlayerBlock();    // Rebuild the block at new location
                this.updateTransforms();     // Move the mesh in the scene
            }
        }
    }

    move(direction, onComplete) {
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
            this.curr.x += this.offsets[nextState[1]].x;
            this.curr.z += this.offsets[nextState[1]].y;
            this.createPlayerBlock();
            this.updateTransforms();
            this.isAnimating = false;
            if (onComplete) onComplete();
        });
    }

    checkWinState() {
        if (this.state == 0 && this.grid[this.curr.z][this.curr.x] == 3) {
            return true;
        }
        return false;
    }

    getStateAndPosition() {
        let statePos = [this.state, this.curr.x, this.curr.z];
        return statePos
    }
}

export default Block;
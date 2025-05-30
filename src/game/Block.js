class Block {
    constructor(scene, position) {
        this.scene = scene;
        this.position = position;
        this.blockMesh = this.createBlockMesh();
        this.scene.add(this.blockMesh);
    }

    createBlockMesh() {
        const geometry = new THREE.BoxGeometry(1, 0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        return new THREE.Mesh(geometry, material);
    }

    move(direction) {
        switch (direction) {
            case 'up':
                this.position.z -= 1;
                break;
            case 'down':
                this.position.z += 1;
                break;
            case 'left':
                this.position.x -= 1;
                break;
            case 'right':
                this.position.x += 1;
                break;
        }
        this.updatePosition();
    }

    updatePosition() {
        this.blockMesh.position.set(this.position.x, this.position.y, this.position.z);
    }

    checkCollision(otherObject) {
        const box1 = new THREE.Box3().setFromObject(this.blockMesh);
        const box2 = new THREE.Box3().setFromObject(otherObject);
        return box1.intersectsBox(box2);
    }

    render() {
        // Additional rendering logic can be added here if needed
    }
}

export default Block;
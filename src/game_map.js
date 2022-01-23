window.GameMap = function(size) {
    this.size = size;

    this.texture = new THREE.DataTexture( this.data, this.size, this.size, THREE.RGBAFormat );
    this.texture.needsUpdate = true;
};

GameMap.prototype.load = function() {
    for (let x=-10; x<10; x++) {
        for (let y=-10; y<10; y++) {
            VSPR['grass-1'].addSprite(x, y, Math.random()*0.01);
        }
    }
}
window.GameMap = function(size) {
    this.size = size;
    this.data = new Uint8Array( 4 * this.size * this.size );
    for (let i=0; i<this.size; i++) {
        let off = i * 4;
        this.data[off + 0] = Math.floor(Math.pow(Math.random(),2.) * 3.999);
        let x = i % this.size;
        let y = (i-x) / this.size;
        if (Math.abs(x-128) < 3 && Math.abs(y-128)<3) {
            this.data[off + 0] = 0;
        }
        this.data[off + 1] = 0;
        this.data[off + 2] = 0;
        this.data[off + 3] = 255;
    }
    this.texture = new THREE.DataTexture( this.data, this.size, this.size, THREE.RGBAFormat );
    this.texture.needsUpdate = true;
};
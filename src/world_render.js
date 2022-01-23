window.WorldRender = function(parent, map) {

    this.parent = parent;
    this.map = map;

    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH*2, GAME_HEIGHT*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, GAME_WIDTH/GAME_HEIGHT, 0.1, this.map.scale*100.);

    this.texture = this.renderTarget.texture;

    this.map.load(this);

};

WorldRender.prototype.render = function(dt, time) {

    const inst = this.parent;

    this.camera.up.set(0, 0, 1);
    this.camera.position.set(32.*this.map.scale, 32.*this.map.scale, 0.75*this.map.scale);
    this.camera.lookAt(this.camera.position.x + Math.cos(time/5), this.camera.position.y + Math.sin(time/5), 0.75*this.map.scale);

    inst.renderer.setRenderTarget(this.renderTarget);
    inst.renderer.render(this.scene, this.camera);
    inst.renderer.setRenderTarget(null);

};
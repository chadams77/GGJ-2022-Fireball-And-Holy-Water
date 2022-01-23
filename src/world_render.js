window.WorldRender = function(parent, map) {

    this.parent = parent;
    this.map = map;

    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH, GAME_HEIGHT, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, GAME_WIDTH/GAME_HEIGHT, 0.1, 100);

    this.texture = this.renderTarget.texture;

};

WorldRender.prototype.render = function(dt, time) {

    const inst = this.parent;

    this.camera.up.set(0, 0, -1);
    this.camera.position.set(0., 0., 0);
    this.camera.lookAt(Math.cos(time), Math.sin(time), 0.);

    inst.renderer.setRenderTarget(this.renderTarget);
    inst.renderer.render(this.scene, this.camera);
    inst.renderer.setRenderTarget(null);

};
window.WorldRender = function(parent, map) {

    this.parent = parent;
    this.map = map;

    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH*2, GAME_HEIGHT*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, GAME_WIDTH/GAME_HEIGHT, 0.1, this.map.scale*1001.);

    this.texture = this.renderTarget.texture;

};


WorldRender.prototype.render = function(dt, time) {

    const inst = this.parent;

    this.map.updateRender(dt, time);

    this.camera.up.set(0, 0, 1);
    this.camera.position.set(this.map.player.x, this.map.player.y, 0.75*this.map.scale);
    this.camera.lookAt(this.map.player.x + Math.cos(this.map.player.angle), this.map.player.y + Math.sin(this.map.player.angle), 0.75*this.map.scale);

    inst.renderer.setRenderTarget(this.renderTarget);
    inst.renderer.setClearColor(new THREE.Color(0.5, 0.5, 0.5), 1.0);
    inst.renderer.render(this.scene, this.camera);
    inst.renderer.setRenderTarget(null);
    inst.renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0), 1.0);

};
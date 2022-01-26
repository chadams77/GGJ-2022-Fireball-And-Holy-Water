window.WorldRender = function(parent, map) {

    this.parent = parent;
    this.map = map;

    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH*2, GAME_HEIGHT*2, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, GAME_WIDTH/GAME_HEIGHT, 0.1, this.map.scale*15.);

    this.texture = this.renderTarget.texture;

};


WorldRender.prototype.render = function(dt, time) {

    this.map.lightSystem.clearDynamic();

    const inst = this.parent;

    this.map.updateRender(dt, time);

    let camZ = (0.75+0.025*Math.abs(Math.sin(this.map.player.moveT*Math.PI*2.)))*this.map.scale;
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(this.map.player.x * this.map.scale, this.map.player.y * this.map.scale, camZ);
    this.camera.lookAt(this.map.player.x * this.map.scale + Math.cos(this.map.player.angle * Math.PI * 0.5), this.map.player.y * this.map.scale + Math.sin(this.map.player.angle * Math.PI * 0.5), camZ);
    this.camera.updateMatrix(true);
    this.camera.updateMatrixWorld(true);

    this.map.lightSystem.addDynamic(new THREE.Vector3(0.7, 0.7, 0.3), new THREE.Vector3(this.map.player.x * this.map.scale, this.map.player.y * this.map.scale, camZ), this.map.scale * 2.5);
    this.map.lightSystem.updateShadows(dt, time, Math.cos(this.map.player.angle * Math.PI * 0.5), Math.sin(this.map.player.angle * Math.PI * 0.5));

    inst.renderer.setRenderTarget(this.renderTarget);
    inst.renderer.setClearColor(new THREE.Color(0.5, 0.5, 0.5), 1.0);
    inst.renderer.render(this.scene, this.camera);
    inst.renderer.setRenderTarget(null);
    inst.renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0), 1.0);

};
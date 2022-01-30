window.WorldRender = function(parent, map) {

    this.parent = parent;
    this.map = map;

    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH*2, GAME_HEIGHT*2, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, GAME_WIDTH/GAME_HEIGHT, 0.1, this.map.scale*11.);

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

    let vpPos = new THREE.Vector2(
        (GAME_MOUSE.x / (GAME_WIDTH)) * 2 - 1,
        -(GAME_MOUSE.y / (GAME_HEIGHT)) * 2 + 1
    );
    let center = new THREE.Vector3().setFromMatrixPosition(this.camera.matrixWorld);
    let vpPos3D = new THREE.Vector3(vpPos.x, vpPos.y, 0.5).unproject(this.camera);
    let vpDir = vpPos3D.clone().sub(center).normalize();
    this.mouseAngle = Math.atan2(vpDir.y, vpDir.x);

    this.playerLookAt = this.map.rayCast(this.map.player.x, this.map.player.y, this.mouseAngle, {'rock': 3, 'pistol': 5, 'shotgun': 3, 'rifle': 10, 'fireball': 7}[this.map.player.weapon]);
    this.targetEnemey = this.playerLookAt.enemy;

    inst.renderer.setRenderTarget(this.renderTarget);
    inst.renderer.setClearColor(new THREE.Color(this.map.lightSystem.uniforms.fogColor.value.x, this.map.lightSystem.uniforms.fogColor.value.y, this.map.lightSystem.uniforms.fogColor.value.z), 1.0);
    inst.renderer.render(this.scene, this.camera);
    inst.renderer.setRenderTarget(null);
    inst.renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0), 1.0);

};
window.WorldRender = function(parent) {

    this.parent = parent;

    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH, GAME_HEIGHT, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(GAME_WIDTH / - 2, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT / - 2, 1, 1000);

};

WorldRender.prototype.render = function(dt, time) {

    const inst = this.parent;    

};
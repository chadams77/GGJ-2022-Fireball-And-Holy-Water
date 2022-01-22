window.WorldRender = function(parent) {

    this.parent = parent;

    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH, GAME_HEIGHT, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(1 / - 2, 1 / 2, 1 / 2, 1 / - 2, 1, 1000);

    this.renderShader = new THREE.ShaderMaterial({
        uniforms: {
            res: { value: new THREE.Vector2(GAME_WIDTH, GAME_HEIGHT) }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec2 res;
            varying vec2 vUv;

			void main(void) {
                gl_FragColor = vec4(0.2, 0.5 * vUv.x, 0.5 * vUv.y, 1.0);
            }
        `
    });
    this.renderGeom = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    this.renderMesh = new THREE.Mesh(this.renderGeom, this.renderShader);
    this.renderMesh.position.set(0, 0, -2);
    this.scene.add(this.renderMesh);

    this.texture = this.renderTarget.texture;

};

WorldRender.prototype.render = function(dt, time) {

    const inst = this.parent;

    inst.renderer.setRenderTarget(this.renderTarget);
    inst.renderer.render(this.scene, this.camera);
    inst.renderer.setRenderTarget(null);

};
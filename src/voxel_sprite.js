window.VoxelSprite = function(url, size, maxDraw) {
    this.url = url;
    this.size = size;
    this.loaded = false;
    this.maxDraw = maxDraw || 1;
};

VoxelSprite.prototype.load = async function(scene) {
    let res = await (await fetch(`/images/${this.url}-vox.json`)).json();
    console.log(`Loaded '${this.url}': ${res.length} Voxels.`);
    this.loaded = true;
    this.scene = scene;
    this.initMesh(res);
    return this;
};

VoxelSprite.prototype.initMesh = function(json) {
    this.positions = new Float32Array(json.length*3);
    this.colors = new Float32Array(json.length*3);
    this.normals = new Float32Array(json.length*3);
    const halfSize = this.size * 0.5;
    for (let i=0; i<json.length; i++) {
        const V = json[i];
        const off3 = i * 3;
        //const off2 = i * 2;
        //const off1 = i;
        this.positions[off3 + 0] = (V[0] - halfSize) / 255.;
        this.positions[off3 + 1] = (V[1] - halfSize) / 255.;
        this.positions[off3 + 2] = (V[2] - halfSize) / 255.;
        this.colors[off3 + 0] = V[3] / 255.;
        this.colors[off3 + 1] = V[4] / 255.;
        this.colors[off3 + 2] = V[5] / 255.;
        this.normals[off3 + 0] = ((V[6] / 255.) - 0.5) * 2.;
        this.normals[off3 + 1] = ((V[7] / 255.) - 0.5) * 2.;
        this.normals[off3 + 2] = ((V[8] / 255.) - 0.5) * 2.;
    }

    const pontSize = (1. / this.size);

    this.material = new THREE.RawShaderMaterial({

        vertexShader: `
            precision highp float;
        
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
        
            attribute vec3 position;
        
            attribute vec3 color;
            attribute vec3 normal;
            attribute vec3 inst1;
        
            varying vec3 vNormal;
            varying vec3 vColor;
        
            void main() {
                vColor = color;
                vNormal = normal;
                vec3 pos2 = position + inst1.xyz;
                vec4 mvp = modelViewMatrix * vec4(pos2, 1.0);
                gl_PointSize = ${pontSize} * (300.0 / -mvp.z);
                gl_Position = projectionMatrix * mvp;
            }
        `,
        fragmentShader: `
            precision highp float;
        
            varying vec3 vColor, vNormal;
        
            void main() {
                gl_FragColor = vec4(vColor, 1.);
            }
        `,    
        depthTest:   true,
        depthWrite:  true,
        transparent: true
    });

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(this.normals, 3));
    const inst1 = new Float32Array(4 * this.maxDraw);
    for (let i=0; i<inst1.length; i++) {
        inst1[i] = 0.;
    }
    inst1[0] = 2.;
    this.geometry.setAttribute('inst1', new THREE.InstancedBufferAttribute(inst1, 3));

    this.mesh = new THREE.Points(this.geometry, this.material);

    this.scene.add(this.mesh);
};
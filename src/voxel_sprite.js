window.VoxelSprite = function(url, size, maxDraw, scale) {
    this.url = url;
    this.size = size;
    this.loaded = false;
    this.maxDraw = maxDraw || 1;
    this.scale = scale || 1.;
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
        this.positions[off3 + 0] = (V[0] - halfSize) / this.size * this.scale;
        this.positions[off3 + 1] = (V[2] - halfSize) / this.size * this.scale;
        this.positions[off3 + 2] = -(V[1] - halfSize) / this.size * this.scale;
        this.colors[off3 + 0] = V[3] / 255.;
        this.colors[off3 + 1] = V[4] / 255.;
        this.colors[off3 + 2] = V[5] / 255.;
        this.normals[off3 + 0] = ((V[6] / 255.) - 0.5) * 2.;
        this.normals[off3 + 1] = ((V[7] / 255.) - 0.5) * 2.;
        this.normals[off3 + 2] = ((V[8] / 255.) - 0.5) * 2.;
    }

    const pontSize = (2. / this.size) * this.scale;

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
            varying vec3 vWorldPos;
        
            void main() {
                vNormal = normalize(normal);
                vNormal.xyz = vec3(-vNormal.x, vNormal.z, -vNormal.y);
                vec3 pos2 = position + inst1.xyz;
                vWorldPos = pos2;
                vColor = color;
                vec4 mvp = modelViewMatrix * vec4(pos2, 1.0);
                gl_PointSize = ${GLSL_INSERT.FLOAT(pontSize)} * (${GLSL_INSERT.FLOAT(GAME_WIDTH*2.)} / -mvp.z);
                gl_Position = projectionMatrix * mvp;
            }
        `,
        fragmentShader: `
            precision highp float;
        
            varying vec3 vColor, vNormal, vWorldPos;
        
            void main() {
                vec3 lightPos = vec3(3., -3., 2.) * vec3(${GLSL_INSERT.FLOAT(64)});
                vec3 lightDir = normalize(vWorldPos - lightPos);
                gl_FragColor = vec4(vColor * max(dot(vNormal, lightDir), 0.), 1.);
                ${FOG_SHADER(64*10., new THREE.Vector3(0.5, 0.5, 0.5))}
            }
        `,    
        depthTest:   true,
        depthWrite:  true,
        transparent: false
    });

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(this.normals, 3));
    this.inst1 = new Float32Array(4 * this.maxDraw);
    for (let i=0; i<this.inst1.length; i++) {
        this.inst1[i] = 0.;
    }
    this.geometry.setAttribute('inst1', new THREE.InstancedBufferAttribute(this.inst1, 4));
    this.geometry.instanceCount = 0;

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.needsUpdate = true;

    this.scene.add(this.mesh);

    this.clear();
};

VoxelSprite.prototype.clear = function () {
    this.geometry.instanceCount = 0;
};

VoxelSprite.prototype.addSprite = function (x, y, z) {
    let idx = this.geometry.instanceCount;
    if (idx >= this.maxDraw) {
        return;
    }
    this.geometry.instanceCount += 1;
    const off4 = idx * 4;
    this.inst1[off4+0] = x;
    this.inst1[off4+1] = y;
    this.inst1[off4+2] = z;
    this.inst1[off4+3] = 0.;
};
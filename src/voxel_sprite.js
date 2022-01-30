window.VoxelSprite = function(url, size, maxDraw, scale, fromImage, emissive) {
    this.url = url;
    this.size = size;
    this.loaded = false;
    this.maxDraw = maxDraw || 1;
    this.scale = scale || 1.;
    this.fromImage = fromImage;
    this.emissive = !!emissive || !!fromImage;
};

VoxelSprite.prototype.load = async function(scene, lightSystem) {
    let res = null;
    if (!this.fromImage) {
        res = await (await fetch(`images/${this.url}-vox.json`)).json();
        console.log(`Loaded '${this.url}': ${res.length} Voxels.`);
    }
    else {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = this.size;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, this.size, this.size);
        ctx.drawImage(this.fromImage, 0, 0);
        let data = ctx.getImageData(0, 0, this.size, this.size);
        res = [];
        for (let i=0; i<(this.size*this.size); i++) {
            let x = i%this.size;
            let y = (i-x)/this.size;
            let off = (x+y*this.size)*4;
            let r = data.data[off],
                g = data.data[off+1],
                b = data.data[off+2],
                a = data.data[off+3];
            if (a > 192) {
                let V = [];
                V.push(x, y, this.size*0.5);
                V.push(r, g, b);
                V.push(127., 127., 0.);
                res.push(V);
            }
        }
        console.log(`Sprite->Voxel '${this.url}': ${res.length} Voxels.`);
    }
    this.loaded = true;
    this.scene = scene;
    this.lightSystem = lightSystem;
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
        this.normals[off3 + 1] = ((V[8] / 255.) - 0.5) * 2.;
        this.normals[off3 + 2] = ((V[7] / 255.) - 0.5) * 2.;
    }

    const pontSize = (2. / this.size) * this.scale;

    let vertShader = (shadow) => `
        precision highp float;
            
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 modelMatrix;

        attribute vec3 position;

        attribute vec3 color;
        attribute vec3 normal;
        attribute vec4 inst1, inst2;

        varying vec3 vNormal;
        varying vec3 vColor;
        varying vec3 vWorldPos;

        ${shadow ? this.lightSystem.vertexShader : ``}

        vec2 rotate2D( vec2 p, float a ) {
            float c = cos(a);
            float s = sin(a);
            mat2 m = mat2(c,-s,s,c);
            return m * p;
        }

        #define _R_SEED vec4(1341.15151)

        float rand(vec2 co) {
            return fract(sin(dot(co.xy + _R_SEED.xy, vec2(12.9898,78.233))) * 43758.5453);
        }
        float rand(vec3 co) {
            return rand(vec2(co.x, rand(co.yz) * 43758.5453));
        }
        float rand(float co) {
            return rand(vec2(co));
        }

        void main() {
            vNormal = normalize(normal);
            vNormal.xyz = vec3(vNormal.x, vNormal.y, vNormal.z);
            vec2 nxz = rotate2D(vNormal.xy, inst1.w);
            vNormal.x = nxz.x;
            vNormal.y = nxz.y;
            vec3 iv = normalize(vec3(rand(position.x)*2.-1., rand(position.y)*2.-1., rand(position.z)));
            vec3 pos0 = position + iv * vec3(1., 1., 1.75) * vec3(inst2.x) * ${GLSL_INSERT.FLOAT(this.size*0.5)} + vec3(pow(inst2.x, 4.)) * vec3(0., 0., -5. * 64.);
            vec2 xz = rotate2D(pos0.xy, inst1.w);
            vec3 pos2 = vec3(xz.x, xz.y, pos0.z) + inst1.xyz;
            vWorldPos = pos2;
            vColor = mix(color, vec3(1., 0., 0.), inst2.x);
            vec4 mvp = modelViewMatrix * vec4(pos2, 1.0);
            gl_PointSize = ${GLSL_INSERT.FLOAT(pontSize)} * (${GLSL_INSERT.FLOAT(GAME_WIDTH*2.)} / -mvp.z);
            gl_Position = projectionMatrix * mvp;
        }
    `;

    this.material = new THREE.RawShaderMaterial({

        uniforms: {
            ...(this.lightSystem.uniforms)
        },

        vertexShader: `
            ${vertShader(true)}
        `,
        fragmentShader: `
            precision highp float;
            #include <packing>

            varying vec3 vColor, vNormal, vWorldPos;

            ${this.lightSystem.fragShader}
        
            void main() {
                ${this.emissive ? `_f_emissive = 1.;` : ``}
                gl_FragColor = computeLight(vec4(vColor, 1.), vWorldPos, vNormal);
            }
        `,    
        depthTest:   true,
        depthWrite:  true,
        transparent: false
    });

    this.smaterial = new THREE.RawShaderMaterial({

        uniforms: {
            ...(this.lightSystem.uniforms)
        },

        vertexShader: `
            ${vertShader(false)}
        `,
        fragmentShader: `
            ${this.lightSystem.shadowFragShader}
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
    this.inst2 = new Float32Array(4 * this.maxDraw);
    for (let i=0; i<this.inst1.length; i++) {
        this.inst1[i] = this.inst2[i] = 0.;
    }
    this.geometry.setAttribute('inst1', new THREE.InstancedBufferAttribute(this.inst1, 4));
    this.geometry.setAttribute('inst2', new THREE.InstancedBufferAttribute(this.inst2, 4));
    this.geometry.instanceCount = 0;

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.needsUpdate = true;

    this.smesh = new THREE.Points(this.geometry, this.smaterial);
    this.smesh.frustumCulled = false;
    this.smesh.needsUpdate = true;

    this.scene.add(this.mesh);
    this.lightSystem.shadowScene.add(this.smesh);

    this.clear();
};

VoxelSprite.prototype.clear = function () {
    this.geometry.instanceCount = 0;
};

VoxelSprite.prototype.addSprite = function (x, y, z, angle, deathT) {
    let idx = this.geometry.instanceCount;
    if (idx >= this.maxDraw) {
        return;
    }
    this.geometry.instanceCount += 1;
    const off4 = idx * 4;
    this.inst1[off4+0] = x;
    this.inst1[off4+1] = y;
    this.inst1[off4+2] = z;
    this.inst1[off4+3] = -(angle || 0) - Math.PI * 0.5;
    this.inst2[off4+0] = Math.max(0., Math.min(1., deathT||0.));
    this.geometry.getAttribute('inst1').needsUpdate = true;
    this.geometry.getAttribute('inst2').needsUpdate = true;
};
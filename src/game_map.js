window.GameMap = function(size) {
    this.size = size;
    this.scale = 64.;

    this.map = [];
    for (let i = 0; i < size; i++) {
        let row = [];
        for (let j = 0; j < size; j++) {
            row.push((Math.abs(i-32)>8 || Math.abs(j-32)>8) ? ((i+j)%3 ? 2 : 3) : ((Math.abs(i-32)>3 || Math.abs(j-32)>3) ? (Math.random() > 0.75 ? (4 + (Math.random() < 0.5 ? 1 : 0)) : Math.floor(Math.pow(Math.random()*1.1, 2.))) : 0));
        }
        this.map.push(row);
    }

    this.canPass = {
        0: true,
        2: true
    };

    this.lightSystem = new LightSystem();

};

GameMap.prototype.load = function(worldRender) {

    this.worldRender = worldRender;

    const divCount = 7;

    let tmpGeom = [];

    VSPR['tree-1'].clear();
    VSPR['tree-2'].clear();
    VSPR['tree-3'].clear();
    VSPR['tree-4'].clear();

    const makeBox = (type, x, y, low, high) => {
        high = Math.ceil(high * divCount) / divCount;
        low = Math.floor(low * divCount) / divCount;
        if (low > high) {
            low = high - 1;
        }
        let box = new THREE.BoxGeometry(1, 1, high - low, divCount, divCount, (high - low) * divCount);
        let nVerts = box.getAttribute('position').count;
        let typeArray = new Float32Array(nVerts);
        let offset = new THREE.Vector3(x, y, (low+high)*0.5);
        let posArray = box.getAttribute('position').array;
        for (let i=0; i<nVerts; i++) {
            typeArray[i] = type;
            let off3 = i * 3;
            posArray[off3 + 0] += offset.x;
            posArray[off3 + 1] += offset.y;
            posArray[off3 + 2] += offset.z;
            
        }
        box.setAttribute('type', new THREE.BufferAttribute(typeArray, 1));
        tmpGeom.push(box);
    };

    for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
            let type = this.map[x][y] || 0;
            switch (type) {
            case 5: // water
                makeBox(3, x, y, -0.4, 0.1);
                break;
            case 4: // tree
                makeBox(0, x, y, 0.0, 0.2);
                VSPR[`tree-${1 + Math.floor(Math.random()*4)}`].addSprite(x * this.scale, y * this.scale, this.scale*0.1 + 128/2, Math.random()*Math.PI*2);
                break;
            case 3: // cave-wall
                makeBox(2, x, y, 0.0, 3.5);
                break;
            case 2: // cave
                makeBox(2, x, y, 1.5, 3.5);
                makeBox(2, x, y, 0.0, 0.2);
                break;
            case 1: // rock
                makeBox(1, x, y, -0.5, 1.5);
                break;
            case 0: // grass
            default:
                makeBox(0, x, y, 0.0, 0.2);
                break;
            }
        }
    }

    tmpGeom = THREE.BufferGeometryUtils.mergeBufferGeometries(tmpGeom);

    const vertKey = (v) => `${Math.floor(v.x * divCount)},${Math.floor(v.y * divCount)},${Math.floor(v.z * divCount)}`;

    const vertMap = {};
    let posAttr = tmpGeom.getAttribute('position');
    let typeAttr = tmpGeom.getAttribute('type');

    for (let i=0; i<posAttr.count; i++) {
        let offP = i * 3;
        let pos = new THREE.Vector3(posAttr.array[offP], posAttr.array[offP+1], posAttr.array[offP+2]);
        let type = typeAttr.array[i];
        let vk = vertKey(pos);
        (vertMap[vk] = vertMap[vk] || []).push(type);
    }

    tmpGeom.deleteAttribute('type');

    let type1Arr = new Float32Array(posAttr.count * 4);
    let type2Arr = new Float32Array(posAttr.count * 4);

    for (let i=0; i<posAttr.count; i++) {
        let offP = i * 3;
        let offT = i * 4;
        let pos = new THREE.Vector3(posAttr.array[offP], posAttr.array[offP+1], posAttr.array[offP+2]);
        let vk = vertKey(pos);
        let types = vertMap[vk] || [];
        type1Arr[offT + 0] = types.filter((e) => e == 0).length;
        type1Arr[offT + 1] = types.filter((e) => e == 1).length;
        type1Arr[offT + 2] = types.filter((e) => e == 2).length;
        type1Arr[offT + 3] = types.filter((e) => e == 3).length;
        type2Arr[offT + 0] = types.filter((e) => e == 4).length;
        type2Arr[offT + 1] = types.filter((e) => e == 5).length;
        type2Arr[offT + 2] = types.filter((e) => e == 6).length;
        type2Arr[offT + 3] = types.filter((e) => e == 7).length;
    }

    tmpGeom.setAttribute('types1', new THREE.BufferAttribute(type1Arr, 4));
    tmpGeom.setAttribute('types2', new THREE.BufferAttribute(type2Arr, 4));

    let tileShader = `
        ${GLSL_NOISE}
        #define NOISEX(v) (fnoise((v*1.25)+vec3(12341.12341))*2.-1.)
        #define NOISEY(v) (fnoise((v*1.25)+vec3(2341.12341))*2.-1.)
        #define NOISEZ(v) (fnoise((v*1.25)+vec3(7341.12341))*2.-1.)
        #define NO_X(p) (NOISEX(p)*0.75+NOISEX(p*4.)*0.5)
        #define NO_Y(p) (NOISEY(p)*0.75+NOISEY(p*4.)*0.5)
        #define NO_Z(p) (NOISEZ(p)*0.75+NOISEZ(p*4.)*0.5)
        #define RNO_X(p) pow(NO_X((p)*1.5)*0.5+0.5, 2.)
        #define RNO_Y(p) pow(NO_Y((p)*1.5)*0.5+0.5, 2.)
        #define RNO_Z(p) pow(NO_Z((p)*1.5)*0.5+0.5, 2.)

        uniform float time;

        vec3 noiseOffset(vec3 p) {
            return vec3(NO_X(p), NO_Y(p), NO_Z(p));
        }
        vec3 roundNoiseOffset(vec3 p) {
            return vec3(RNO_X(p), RNO_Y(p), RNO_Z(p));
        }

        vec3 grassOffset(vec3 p) {
            return noiseOffset(p*53.7) * 0.0015;
        }
        vec3 grassColor(vec3 p) {
            return mix(
                vec3(0.05, 0.5, 0.1) * 0.2,
                vec3(0.05, 0.5, 0.1) * 0.5,
                pow(NO_Z(p*53.7) * 0.5 + 0.5, 1.5)
            );
        }

        vec3 waterOffset(vec3 p) {
            return noiseOffset(p*83.7+vec3(time/3.)) * 0.0015;
        }
        vec3 waterColor(vec3 p) {
            return mix(
                vec3(0.05, 0.1, 0.6),
                vec3(0.75, 0.75, 0.75) * 0.75,
                pow(NO_Z(p*83.7+vec3(time/3.)) * 0.5 + 0.5, 1.5)
            );
        }

        vec3 rockOffset(vec3 p) {
            return roundNoiseOffset(p*103.7) * 0.003;
        }
        vec3 rockColor(vec3 p) {
            return mix(
                vec3(0.4, 0.4, 0.4) * 0.4,
                vec3(0.1, 0.6, 0.1),
                pow(max(abs(RNO_X(p*103.7)), abs(RNO_Y(p*103.7))), 4.)
            );
        }

        vec3 caveOffset(vec3 p) {
            return roundNoiseOffset(p*103.7) * 0.003;
        }
        vec3 caveColor(vec3 p) {
            return mix(
                vec3(0.2, 0.2, 0.2) * 0.4,
                vec3(0.1, 0.4, 0.1),
                pow(max(abs(RNO_X(p*103.7)), abs(RNO_Y(p*103.7))), 3.)
            );
        }

        vec3 getOffset (vec3 p) {
            vec3 ret = vec3(0.);
            float count = 0.;
            p /= vec3(${GLSL_INSERT.FLOAT(this.scale)});
            if (vTypes1.x > 0.01) {
                count += vTypes1.x; ret += grassOffset(p) * vec3(vTypes1.x);
            }
            if (vTypes1.y > 0.01) {
                count += vTypes1.y; ret += rockOffset(p) * vec3(vTypes1.y);
            }
            if (vTypes1.z > 0.01) {
                count += vTypes1.z; ret += caveOffset(p) * vec3(vTypes1.z);
            }
            if (vTypes1.w > 0.01) {
                count += vTypes1.w; ret += waterOffset(p) * vec3(vTypes1.w);
            }
            if (count >= 0.01) {
                return ret * vec3((1. / count) * ${GLSL_INSERT.FLOAT(this.scale)});
            }
            else {
                return vec3(0.);
            }
        }

        vec3 getColor (vec3 p) {
            vec3 ret = vec3(0.);
            float count = 0.;
            p /= ${GLSL_INSERT.FLOAT(this.scale)};
            if (vTypes1.x > 0.01) {
                count += vTypes1.x; ret += grassColor(p) * vec3(vTypes1.x);
            }
            if (vTypes1.y > 0.01) {
                count += vTypes1.y; ret += rockColor(p) * vec3(vTypes1.y);
            }
            if (vTypes1.z > 0.01) {
                count += vTypes1.z; ret += caveColor(p) * vec3(vTypes1.z);
            }
            if (vTypes1.w > 0.01) {
                count += vTypes1.w; ret += waterColor(p) * vec3(vTypes1.w);
            }
            if (count >= 0.01) {
                return ret * vec3(1. / count);
            }
            else {
                return vec3(0.);
            }
        }

    `;

    //this.geometry = THREE.BufferGeometryUtils.mergeVertices(tmpGeom, 0.25/divCount);
    this.geometry = tmpGeom;
    this.material = new THREE.RawShaderMaterial({

        uniforms: {
            ...(this.lightSystem.uniforms),
            time: { value: 0. }
        },

        vertexShader: `
            precision highp float;
        
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
        
            attribute vec3 position;
            attribute vec4 types1;
            attribute vec4 types2;
            attribute vec3 normal;
            
            varying vec3 vWorld;
            varying vec4 vTypes1, vTypes2;
            varying vec3 vNormal;

            ${tileShader}
       
            void main() {
                vTypes1 = types1; vTypes2 = types2;
                vWorld = position;
                vec3 offset = getOffset(vWorld);
                vec4 mvp = modelViewMatrix * vec4(position + offset, 1.0);
                gl_Position = projectionMatrix * mvp;
                vNormal = normal;
            }
        `,
        fragmentShader: `
            precision highp float;
        
            varying vec3 vWorld, vNormal;
            varying vec4 vTypes1, vTypes2;

            ${tileShader}
            ${this.lightSystem.fragShader}
        
            void main() {
                vec3 baseClr = getColor(vWorld);
                vec3 position = getOffset(vWorld) + vWorld;
                vec3 oNormal = normalize(vNormal);
                float pScale = 0.01;
                vec3 posX = getOffset(vWorld + pScale * vec3(1., 0., 0.)) + vWorld + pScale * vec3(1., 0., 0.) * 1.5;
                vec3 posY = getOffset(vWorld + pScale * vec3(0., 1., 0.)) + vWorld + pScale * vec3(0., 1., 0.) * 1.5;
                vec3 posZ = getOffset(vWorld + pScale * vec3(0., 0., 1.)) + vWorld + pScale * vec3(0., 0., 1.) * 1.5;
                vec3 n1 = normalize(cross(posX - position, posY - position));
                vec3 n2 = normalize(cross(posX - posZ, posY - posZ));
                vec3 normal = -n1 + n2;
                if (length(normal) < 0.001) {
                    normal = oNormal;
                }
                else {
                    normal = normalize(normal);
                }
                if (dot(normal, oNormal) < 0.) {
                    normal = -normal;
                }
                gl_FragColor = computeLight(vec4(baseClr, 1.), position * vec3(${GLSL_INSERT.FLOAT(this.scale)}), normal);
            }
        `,    
        depthTest:   true,
        depthWrite:  true,
        transparent: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.scale.set(this.scale, this.scale, this.scale);
    this.mesh.position.set(0, 0, 0);
    this.mesh.updateMatrix(true);
    this.mesh.updateMatrixWorld(true);
    this.mesh.frustumCulled = false;
    this.mesh.needsUpdate = true;

    this.worldRender.scene.add(this.mesh);
 
    this.player = new Player(31, 31, 0., this);

};

GameMap.prototype.updateRender = function(dt, time) {

    this.player.update(dt, time);
    this.material.uniforms.time.value = time;

};

GameMap.prototype.doesCollide = function(x, y) {

    return !!(this.map && this.map[x] && !this.canPass[this.map[x][y]]);

};
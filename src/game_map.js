window.GameMap = function(size, level, onNextLevel, lightSystem) {
    this.size = size;
    this.scale = 64.;

    this.map = [];
    for (let i = 0; i < size; i++) {
        let row = [];
        for (let j = 0; j < size; j++) {
            row.push((i === 0 || j === 0 || i === (size-1) || j === (size-1)) ? 3 : (!level ? 0 : 2));
        }
        this.map.push(row);
    }

    if (!level) {
        this.level = 0;
        this.startX = 31;
        this.startY = 48;
        this.makeOpenArea(1, 33, 62, 62);
        this.exitX = 2;
        this.exitY = 2;
        this.makeMaze(1, 1, 62, 30,  48, 30,  this.exitX, this.exitY);
        //this.map[this.startX][this.startY-3] = 6;
        //this.exitX = this.startX;
        //this.exitY = this.startY-3;
        this.enemySet = new EnemySet(this, {'skull': 0.75, 'gdemon': 0.125}, {'skull': 3, 'gdemon': 1});
        this.itemSet = new ItemSet(this, {'pistol': 0.15, 'holywater': 0.125, 'fireball': 0.05, 'shotgun': 0.1 }, {'pistol': 2, 'shotgun': 1, 'holywater': 2, 'fireball': 1});
    }
    else if (level === 1) {
        this.level = 1;
        this.startX = 15;
        this.startY = 15;
        this.makeOpenArea(1, 1, 63, 63);
        this.exitX = 62;
        this.exitY = 62;
        this.makeMaze(32, 1, 62, 32,  32, 16,  48, 32);
        this.makeMaze(1, 32, 32, 62,  32, 48,  32, 48);
        this.enemySet = new EnemySet(this, {'skull': 0.25, 'gdemon': 0.5, 'ydemon': 0.25}, {'skull': 3, 'gdemon': 3, 'ydemon': 2});
        this.itemSet = new ItemSet(this, {'pistol': 0.25, 'shotgun': 0.175, 'rifle': 0.125, 'holywater': 0.2, 'fireball': 0.1}, {'pistol': 3, 'holywater': 2, 'fireball': 1, 'shotgun': 2, 'rifle': 1});
    }
    else if (level === 2) {
        this.level = 2;
        this.startX = 15;
        this.startY = 15;
        this.makeOpenArea(1, 1, 31, 31);
        this.enemySet = new EnemySet(this, {'skull': 0.25, 'gdemon': 0.5, 'ydemon': 0.5, 'rdemon': 0.9}, {'skull': 3, 'gdemon': 3, 'ydemon': 2, 'rdemon': 1});
        this.itemSet = new ItemSet(this, {'pistol': 0.35, 'shotgun': 0.25, 'rifle': 0.25, 'holywater': 0.3, 'fireball': 0.15}, {'pistol': 4, 'holywater': 3, 'fireball': 2, 'shotgun': 3, 'rifle': 2});
    }

    if (level !== 2) {
        for (let xo=-2; xo<=2; xo++) {
            for (let yo=-2; yo<=2; yo++) {
                let x = this.exitX + xo;
                let y = this.exitY + yo;
                if (x > 0 && y > 0 && x < (this.size-1) && y < (this.size-1)) {
                    this.map[x][y] = !this.level ? 0 : 8;
                }
            }
        }
        this.map[this.exitX][this.exitY] = 6;
    }

    this.canPass = {
        0: true,
        2: true,
        6: true,
        8: true
    };
    this.canShootThrough = {
        0: true,
        2: true,
        5: true,
        4: true,
        6: true,
        7: true,
        8: true
    };

    this.lightSystem = lightSystem;

    this.onNextLevel = onNextLevel;

    this.fodCallback = null;
    this.fodT = null;

    this.proj = new Projectiles(this);

};

GameMap.prototype.fadeOutDestroy = function(cbk) {
    this.fodCallback = cbk;
    this.fodT = 1;
}

GameMap.prototype.makeOpenArea = function(x1, y1, x2, y2) {

    for (let x=x1; x<=x2; x+=1) {
        for (let y=y1; y<=y2; y+=1) {
            if (Math.abs(this.startX - x) <= 3 && Math.abs(this.startY - y) <= 3) {
                if (this.level > 0) {
                    this.map[x][y] = 8;
                }
                continue;
            }
            if (x>(x1+2) && y>(y1+2) && x<(x2-2) && y<(y2-2)) {
                let xa = Math.floor(x/3);
                let xb = Math.floor(y/3);
                if (!(xa%3) && !(xb%3)) {
                    if (this.level === 0) {
                        this.map[x][y] = 5;
                    }
                    else {
                        this.map[x][y] = 7;
                    }
                    continue;
                }
                else if (this.level === 2) {
                    this.map[x][y] = 8;
                }
            }
            if (x%2 || y%2) {
                continue;
            }
            if (this.level === 0) {
                if (Math.random() < 0.25) {
                    this.map[x][y] = 4;
                }
                else if (Math.random() < 0.25) {
                    this.map[x][y] = 1;
                }
            }
            if (this.level > 0) {
                if (Math.random() < 0.25) {
                    this.map[x][y] = 7;
                }
                else if (Math.random() < 0.25) {
                    this.map[x][y] = 1;
                }
            }
        }
    }

};

// start & end coords must be even
GameMap.prototype.makeMaze = function(x1, y1, x2, y2, startX, startY, endX, endY) {

    for (let x=x1; x<=x2; x+=1) {
        for (let y=y1; y<=y2; y+=1) {
            if (Math.abs(this.startX - x) <= 3 && Math.abs(this.startY - y) <= 3) {
                continue;
            }
            if (this.level === 0) {
                if (Math.random() < 0.125) {
                    this.map[x][y] = 4;
                }
                else {
                    this.map[x][y] = 1;
                }
            }
            if (this.level > 0) {
                if (Math.random() < 0.125) {
                    this.map[x][y] = 7;
                }
                else {
                    this.map[x][y] = 3;
                }
            }
        }
    }

    let dirC = [[-2,0],[2,0],[0,-2],[0,2]];
    let U = {};

    let mark = (x, y) => {
        U[x+','+y] = 1;
        let history = [[x, y]];
        for (let k=0; k<dirC.length; k++) {
            let j = Math.floor(Math.random()*dirC.length);
            let t = dirC[k];
            dirC[k] = dirC[j];
            dirC[j] = t;
        }
        for (let i=0; i<dirC.length; i++) {
            let dir = dirC[i];
            let xa = x + dir[0], ya = y + dir[1];
            let xb = x + dir[0]/2, yb = y + dir[1]/2;
            if (!U[xa+','+ya] && !U[xb+','+yb] && xa >= x1 && xa <= x2 && ya >= y1 && ya <= y2) {
                U[xb+','+yb] = 1;
                mark(xa, ya);
            }
        }
    }

    mark(startX, startY);

    for (let key in U) {
        let tok = key.split(',');
        let x = parseInt(tok[0]), y = parseInt(tok[1]);
        if (this.level === 0) {
            this.map[x][y] = 0;
        }
        if (this.level === 1) {
            this.map[x][y] = Math.random() < 0.75 ? 2 : 8;
        }
    }

};

GameMap.prototype.load = function(worldRender) {

    this.worldRender = worldRender;
    this.worldRender.map = this;

    const divCount = 7;

    let tmpGeom = [];

    VSPR['tree-1'].clear();
    VSPR['tree-2'].clear();
    VSPR['tree-3'].clear();
    VSPR['tree-4'].clear();

    let boxGeomLUT = {};

    const makeBox = (type, x, y, low, high) => {
        high = Math.ceil(high * divCount) / divCount;
        low = Math.floor(low * divCount) / divCount;
        if (low > high) {
            low = high - 1;
        }
        let box = null;
        if (type === 3) {
            let key = JSON.stringify([1+2/divCount, 1+2/divCount, high - low, divCount+2, divCount+2, (high - low) * divCount]);
            if (!boxGeomLUT[key]) {
                boxGeomLUT[key] = new THREE.BoxGeometry(1+2/divCount, 1+2/divCount, high - low, divCount+2, divCount+2, (high - low) * divCount);
            }
            box = boxGeomLUT[key].clone();
        }
        else {
            let key = JSON.stringify([1, 1, high - low, divCount, divCount, (high - low) * divCount]);
            if (!boxGeomLUT[key]) {
                boxGeomLUT[key] = new THREE.BoxGeometry(1, 1, high - low, divCount, divCount, (high - low) * divCount);
            }
            box = boxGeomLUT[key].clone();
        }
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
            case 8: // cave-light
                makeBox(2, x, y, 0.0, 0.2);
                break;
            case 7: // cave-water
                makeBox(4, x, y, -4., 0.2);
                makeBox(2, x, y, 1.5, 3.5);
                makeBox(3, x, y, -0.4, 0.1);
                break;
            case 6: // exit
                makeBox(4, x, y, -4., 0.2);
                break;
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

    const vertKey = (v) => `${Math.floor(v.x * divCount * 10.)},${Math.floor(v.y * divCount * 10.)},${Math.floor(v.z * divCount * 10.)}`;

    const vertMap = {};
    let posAttr = tmpGeom.getAttribute('position');
    let typeAttr = tmpGeom.getAttribute('type');

    for (let i=0; i<posAttr.count; i++) {
        let offP = i * 3;
        let pos = new THREE.Vector3(posAttr.array[offP], posAttr.array[offP+1], posAttr.array[offP+2]);
        let type = typeAttr.array[i];
        let vk = vertKey(pos);
        if (type === 3) {
            vk += '-w';
        }
        (vertMap[vk] = vertMap[vk] || []).push(type);
    }

    let type1Arr = new Float32Array(posAttr.count * 4);
    let type2Arr = new Float32Array(posAttr.count * 4);

    for (let i=0; i<posAttr.count; i++) {
        let offP = i * 3;
        let offT = i * 4;
        let pos = new THREE.Vector3(posAttr.array[offP], posAttr.array[offP+1], posAttr.array[offP+2]);
        let vk = vertKey(pos);
        let otype = typeAttr.array[i];
        if (otype === 3) {
            vk += '-w';
        }
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

    tmpGeom.deleteAttribute('type');

    tmpGeom.setAttribute('types1', new THREE.BufferAttribute(type1Arr, 4));
    tmpGeom.setAttribute('types2', new THREE.BufferAttribute(type2Arr, 4));

    let tileShader = `
        ${GLSL_NOISE}
        #define NOISEX(v) (fnoise(mix(v*1.25,v*1.5,hellT)+vec3(12341.12341))*2.-1.)
        #define NOISEY(v) (fnoise(mix(v*1.25,v*1.5,hellT)+vec3(2341.12341))*2.-1.)
        #define NOISEZ(v) (fnoise(mix(v*1.25,v*1.5,hellT)+vec3(7341.12341))*2.-1.)
        #define NO_X(p) (NOISEX(p)*0.75+NOISEX(p*4.)*0.5)
        #define NO_Y(p) (NOISEY(p)*0.75+NOISEY(p*4.)*0.5)
        #define NO_Z(p) (NOISEZ(p)*0.75+NOISEZ(p*4.)*0.5)
        #define NO2_X(p) (NOISEX(p)*0.625+NOISEX(p*4.)*0.25+NOISEX(p*16.)*0.125)
        #define NO2_Y(p) (NOISEY(p)*0.625+NOISEY(p*4.)*0.25+NOISEY(p*16.)*0.125)
        #define NO2_Z(p) (NOISEZ(p)*0.625+NOISEZ(p*4.)*0.25+NOISEZ(p*16.)*0.125)
        #define RNO_X(p) pow(NO2_X((p)*1.5)*0.5+0.5, 2.)
        #define RNO_Y(p) pow(NO2_Y((p)*1.5)*0.5+0.5, 2.)
        #define RNO_Z(p) pow(NO2_Z((p)*1.5)*0.5+0.5, 2.)

        uniform float time;
        uniform float hellT;

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
                mix(vec3(0.05, 0.5, 0.1) * 0.1, vec3(0.2, 0.2, 0.1) * 0.1, hellT),
                mix(vec3(0.05, 0.5, 0.1) * 0.6, vec3(0.6, 0.1, 0.1) * 0.6, hellT),
                clamp(pow(RNO_Z(p*53.7) * 0.5 + 0.5, 2.0), 0., 1.)
            );
        }

        vec3 waterOffset(vec3 p) {
            return noiseOffset(p*83.7+vec3(time/3.)) * vec3(0.25, 0.25, 0.75) * 0.0015;
        }
        vec3 waterColor(vec3 p) {
            return mix(
                mix(vec3(0.05, 0.1, 0.6) * 0.5, vec3(0.75, 0.0, 0.0) * 0.5, hellT),
                mix(vec3(0.75, 0.75, 0.75), vec3(1., 1., 0.5), hellT),
                clamp(pow(NO_Z(p*83.7+vec3(time/3.)) * 0.5 + 0.5, 4.0), 0., 1.)
            );
        }

        vec3 rockOffset(vec3 p) {
            return roundNoiseOffset(p*103.7) * 0.003;
        }
        vec3 rockColor(vec3 p) {
            return mix(
                vec3(0.4, 0.4, 0.4) * 0.4,
                mix(vec3(0.1, 0.6, 0.1), vec3(0.6, 0.1, 0.1), hellT),
                clamp(pow(max(abs(RNO_X(p*103.7)), abs(RNO_Y(p*103.7))), 4.), 0., 1.)
            );
        }

        vec3 exitOffset(vec3 p) {
            vec2 xy = fract(p / vec3(${GLSL_INSERT.FLOAT(this.scale)}) + vec3(0.5)).xy - vec2(0.5);
            return roundNoiseOffset(p*103.7) * 0.003 - vec3(0., 0., pow(max(0., 1. - length(xy)), 0.2) * 8.);
        }
        vec3 exitColor(vec3 p) {
            return mix(
                vec3(0.4, 0.4, 0.4) * 0.4,
                mix(vec3(0.1, 0.6, 0.1), vec3(0.6, 0.1, 0.1), hellT),
                clamp(pow(max(abs(RNO_X(p*103.7)), abs(RNO_Y(p*103.7))), 4.), 0., 1.)
            );
        }

        vec3 caveOffset(vec3 p) {
            return roundNoiseOffset(p*103.7) * 0.003;
        }
        vec3 caveColor(vec3 p) {
            return mix(
                vec3(0.2, 0.2, 0.2) * 0.4,
                mix(vec3(0.1, 0.4, 0.1), vec3(0.8, 0.4, 0.1), hellT),
                clamp(pow(max(abs(RNO_X(p*103.7)), abs(RNO_Y(p*103.7))), 3.), 0., 1.)
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
            if (vTypes2.x > 0.01) {
                count += vTypes2.x; ret += exitOffset(p) * vec3(vTypes2.x);
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
            if (vTypes2.x > 0.01) {
                count += vTypes2.x; ret += exitColor(p) * vec3(vTypes2.x);
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

    let vertShader = (shadow) => `
        precision highp float;
          
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 modelMatrix;

        attribute vec3 position;
        attribute vec4 types1;
        attribute vec4 types2;
        attribute vec3 normal;

        ${shadow ? this.lightSystem.vertexShader : ``}

        varying vec3 vWorld, vWorldOrig;
        varying vec4 vTypes1, vTypes2;
        varying vec3 vNormal;

        ${tileShader}

        void main() {
            vTypes1 = types1; vTypes2 = types2;
            vWorldOrig = position;
            vec3 offset = getOffset(vWorldOrig);
            vWorld = vWorldOrig + offset;
            ${!shadow ? `
            if (vTypes1.w >= 0.01) {
                offset.z = -64.;
            }
            ` : ``}
            vec4 mvp = modelViewMatrix * vec4(position + offset, 1.0);
            gl_Position = projectionMatrix * mvp;
            vNormal = normal;
        }
    `;

    this.material = new THREE.RawShaderMaterial({

        uniforms: {
            ...(this.lightSystem.uniforms),
            time: { value: 0. },
            hellT: { value: 0. }
        },

        vertexShader: `
            ${vertShader(true)}
        `,
        fragmentShader: `
            precision highp float;
            #include <packing>
        
            varying vec3 vWorld, vNormal, vWorldOrig;
            varying vec4 vTypes1, vTypes2;

            ${tileShader}
            ${this.lightSystem.fragShader}
        
            void main() {
                vec3 baseClr = getColor(vWorld);
                vec3 position = vWorld;
                vec3 oNormal = normalize(vNormal);
                float pScale = 0.02;
                vec3 posX = getOffset(vWorldOrig + pScale * vec3(1., 0., 0.)) + vWorldOrig + pScale * vec3(1., 0., 0.) * 1.5;
                vec3 posY = getOffset(vWorldOrig + pScale * vec3(0., 1., 0.)) + vWorldOrig + pScale * vec3(0., 1., 0.) * 1.5;
                vec3 posZ = getOffset(vWorldOrig + pScale * vec3(0., 0., 1.)) + vWorldOrig + pScale * vec3(0., 0., 1.) * 1.5;
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

    this.smaterial = new THREE.RawShaderMaterial({

        uniforms: {
            ...(this.lightSystem.uniforms),
            time: { value: 0. },
            hellT: { value: 0. }
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

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.scale.set(this.scale, this.scale, this.scale);
    this.mesh.position.set(0, 0, 0);
    this.mesh.updateMatrix(true);
    this.mesh.updateMatrixWorld(true);
    this.mesh.frustumCulled = false;
    this.mesh.needsUpdate = true;

    this.smesh = new THREE.Mesh(this.geometry, this.smaterial);
    this.smesh.scale.set(this.scale, this.scale, this.scale);
    this.smesh.position.set(0, 0, 0);
    this.smesh.updateMatrix(true);
    this.smesh.updateMatrixWorld(true);
    this.smesh.frustumCulled = false;
    this.smesh.needsUpdate = true;

    this.worldRender.scene.add(this.mesh);
    this.lightSystem.shadowScene.add(this.smesh);
 
    this.player = new Player(this.startX, this.startY, 0., this, this.enemySet, this.itemSet);
    this.hellT = 0.;
    this.toHellT = 0.;
    sounds['sfx/music-normal.wav'].loop = true;
    sounds['sfx/music-normal.wav'].play();
    sounds['sfx/music-normal.wav'].volume = (1 - this.hellT) * 0.99 + 0.01;
    sounds['sfx/music-hell.wav'].loop = true;
    sounds['sfx/music-hell.wav'].play();
    sounds['sfx/music-hell.wav'].volume = this.hellT * 0.99 + 0.01;

};

GameMap.prototype.changeTheme = function(hellT) {
    this.toHellT = hellT;
}

GameMap.prototype.updateRender = function(dt, time) {

    if (!this.player) {
        return;
    }

    this.player.update(dt, time);
    this.material.uniforms.time.value = time;
    this.smaterial.uniforms.time.value = time;

    this.hellT += (this.toHellT - this.hellT) * dt * 4;
    sounds['sfx/music-normal.wav'].volume = (1 - this.hellT) * 0.99 + 0.01;
    sounds['sfx/music-hell.wav'].volume = this.hellT * 0.99 + 0.01;
    this.material.uniforms.hellT.value = this.hellT;
    this.smaterial.uniforms.hellT.value = this.hellT;
    this.lightSystem.setFogColor(new THREE.Vector3(this.hellT * 0.6 + (1 - this.hellT) * (!this.level ? 0.5 : 0.), (1 - this.hellT) * (!this.level ? 0.5 : 0.), (1 - this.hellT) * (!this.level ? 0.5 : 0.)));

    this.changeTheme(this.player.fireballT > 0 ? 1 : 0);
  
    this.enemySet.player = this.player;
    this.enemySet.updateRender(dt, time);
    this.itemSet.player = this.player;
    this.itemSet.updateRender(dt, time);
    this.proj.update(dt, time);

    if (this.fodCallback) {
        this.fodT -= dt;
        if (this.fodT <= 0.) {
            this.destroy();
            this.fodCallback();
            this.fodCallback = null;
            this.fodT = 0.;
            return;
        }
    }

};

GameMap.prototype.destroy = function() {

    this.map = [];
    this.player = null;
    this.worldRender.scene.remove(this.mesh);
    this.lightSystem.shadowScene.remove(this.smesh);
    this.geometry.dispose();
    this.material.dispose();
    this.smaterial.dispose();
    this.geometry = this.material = this.smaterial = this.mesh = this.smesh = undefined;
    sounds['sfx/music-normal.wav'].pause();
    sounds['sfx/music-hell.wav'].pause();

};

GameMap.prototype.rayCast = function(x, y, angle, maxDist) {

    let dx = Math.cos(angle), dy = Math.sin(angle);
    for (let k=0; k<(10*maxDist); k++)   {
        let len = k/10;
        let x2 = x + dx * len, y2 = y + dy * len;
        let enemy = null;
        let mapType = (this.map && this.map[Math.floor(x2)]) ? this.map[Math.floor(x2)][Math.floor(y2)] : undefined;
        if (!this.canShootThrough[mapType]) {
            return { dist: len, x: Math.floor(x2), y: Math.floor(y2), map: true };
        }
        else if (enemy = this.enemySet.doesCollide(x2, y2)) {
            return { dist: len, x: x2, y: y2, enemy };
        }
    }
    return { dist: maxDist };

};

GameMap.prototype.rayCastMapOnly = function(x, y, angle, maxDist) {

    let dx = Math.cos(angle), dy = Math.sin(angle);
    for (let k=0; k<(10*maxDist); k++)   {
        let len = k/10;
        let x2 = x + dx * len, y2 = y + dy * len;
        let mapType = (this.map && this.map[Math.floor(x2)]) ? this.map[Math.floor(x2)][Math.floor(y2)] : undefined;
        if (!this.canShootThrough[mapType]) {
            return true;
        }
    }
    return false;

};

GameMap.prototype.doesCollide = function(x, y) {

    return !!(this.map && this.map[x] && !this.canPass[this.map[x][y]]);

};
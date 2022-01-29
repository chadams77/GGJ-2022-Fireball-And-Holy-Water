const THREE = require('./three.js');
const webgl = require('webgl-raub');
const { Document } = require('glfw-raub');
const Image = require('image-raub');

Document.setWebgl(webgl);
const doc = new Document({title: 'SDF -> Voxel Generator', width: 512, height: 512});
global.document = global.window = doc;
const canvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, precision: 'mediump', premultipliedAlpha: true });

require('./seedrandom.js');

const fs = require('fs');
const sdf_shaders = require('./sdf_shaders').SDF_SHADERS;
const sleep = async (time) => new Promise((resolve) => (setTimeout(() => resolve(), Math.ceil(time*1000.))));

const FLOAT = exports.FLOAT = (val) => {
    let str = `${val||0.}`;
    return (str.indexOf('.') === -1) ? str + '.' : str;
};
const VEC2 = exports.VEC2 = (val) => `vec2(${FLOAT(val.x)},${FLOAT(val.y)})`;
const VEC3 = exports.VEC3 = (val) => `vec3(${FLOAT(val.x)},${FLOAT(val.y)},${FLOAT(val.z)})`;
const VEC4 = exports.VEC4 = (val) => `vec4(${FLOAT(val.x)},${FLOAT(val.y)},${FLOAT(val.z)},${FLOAT(val.w)})`;
const PAL3 = exports.PAL3 = (pal, tVar) => `mix(${exports.VEC3(pal[0])}, mix(${exports.VEC3(pal[1])}, ${exports.VEC3(pal[2])}, clamp(2. * (${tVar}) - 1., 0., 1.)), clamp(2. * (${tVar}), 0., 1.))`;
const ITERATE = exports.ITERATE = (codeCbk, count, start) => {
    let ret = ``;
    start = start || 0;
    for (let i=start; i<(count+start); i++) {
      ret = `
        ${ret}
        ${codeCbk(i)}
      `;
    }
    return ret;
};

const ReadFrameBufferData = (width, height) => {

    let gl = renderer.context;
  
    let canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);
  
    if (canRead) {
        let pixels = Buffer.allocUnsafeSlow(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
    }
  
    return null;
  
};  

const RenderSlice = async (size, shader, sliceNo) => {
  
    let width = size, height = size;
  
    let geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
  
    let camP = 1 * 0.5;
  
    let material = new THREE.ShaderMaterial({
        vertexShader: `
            varying vec2 vUv;

            void main() {

                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

            }
        `,
        fragmentShader: `
            ${shader}
        `,
        uniforms: {
            sliceNo: {
                type: 'f',
                value: sliceNo
            }
        },
        transparent: true,
        blending: THREE.NormalBlending
    });
  
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(camP, camP, 0);
    mesh.rotation.z = 0.0;
    mesh.updateMatrix();
    mesh.updateMatrixWorld();

    doc.width = doc.height = size;
  
    let scene = new THREE.Scene();
    let camera = new THREE.OrthographicCamera(-1/2, 1/2, 1/2, -1/2, 1, 75);
    camera.matrixAutoUpdate = true;
    camera.position.set(camP, camP, 40);
    camera.lookAt(new THREE.Vector3(camP, camP, 0));
    camera.updateProjectionMatrix();
    camera.updateMatrix();
    camera.updateMatrixWorld(true);
  
    scene.add(mesh);
  
    renderer.sortObjects = true;
    renderer.setClearColor( 0x000000, 0x00 );
    renderer.setPixelRatio( 1.0 ); 
    renderer.setSize(width, height, false, false);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.context.finish();

    doc.swapBuffers();

    let imageData = ReadFrameBufferData(width, height); 
   
    scene.remove(mesh);
  
    material.dispose(); geometry.dispose();
    mesh.material = mesh.geometry = null;  
  
    return imageData;
  
};

exports.GenerateVoxels = async (outFile, args) => {
    const size = args.size || 128;

    let shader = `
        uniform float sliceNo;
        varying vec2 vUv;

        vec4 _R_SEED = vec4(${FLOAT(args.seed || 1.)});
        ${sdf_shaders}
        ${args.customFns || ``}

        float getDist(vec3 p) {
            float ret = ${FLOAT(size*10.)};
            ${args.distFn || ''}
            return ret;
        }

        vec4 getColor(vec3 p) {
            vec4 ret = vec4(0.);
            if (getDist(p) > 0.) {
                return ret;
            }
            ret.a = 1.;
            ${args.colorFn || ''}
            return ret;
        }
    `;

    let colorShader = `
        ${shader}

        void main () {
            vec3 p = vec3((vUv-vec2(0.5))*vec2(${FLOAT(size)}), sliceNo-${FLOAT(size/2)});
            gl_FragColor = getColor(p);
        }
    `;

    let slices = [];
    for (let z=0; z<size; z++) {
        slices.push(
            await RenderSlice(size, colorShader, z)
        );
        await sleep(10/60);
    }

    let GET = (x, y, z) => {
        if (x<0 || y<0 || z<0 || x>=size || y>=size || z>=size) {
            return null;
        }
        let slice = slices[z];
        let off = 4 * (y * size + x);
        if (slice[off+3] > 250) {
            return [ slice[off+0], slice[off+1], slice[off+2] ];
        }
        else {
            return null;
        }
    };

    let map = {};
    let voxels = [];
    for (let x=0; x<size; x++) {
        for (let y=0; y<size; y++) {
            for (let z=0; z<size; z++) {
                let clr = GET(x,y,z);
                if (clr && (!GET(x-1,y,z) || !GET(x+1,y,z) || !GET(x,y-1,z) || !GET(x,y+1,z) || !GET(x,y,z-1) || !GET(x,y,z+1))) {
                    voxels.push(map[`${x},${y},${z}`] = [x,y,z,clr[0],clr[1],clr[2]]);
                }
            }
        }
    }

    for (let V of voxels) {
        let mdist = 2;
        let other = [];
        for (let xo=-mdist; xo<=mdist; xo++) {
            for (let yo=-mdist; yo<=mdist; yo++) {
                for (let zo=-mdist; zo<=mdist; zo++) {
                    if (xo || yo || zo) {
                        let x = V[0] + xo, y = V[1] + yo, z = V[2] + zo;
                        let Vo = map[`${x},${y},${z}`];
                        if (Vo) {
                            other.push(Vo);
                        }
                    }
                }
            }
        }
        let norm = new THREE.Vector3(0., 0., 0.);
        let cb = new THREE.Vector3(0., 0., 0.);
        let ab = new THREE.Vector3(0., 0., 0.);
        let vA = new THREE.Vector3(0., 0., 0.);
        let vB = new THREE.Vector3(V[0], V[1], V[2]);
        let vC = new THREE.Vector3(0., 0., 0.);
        for (let i=0; i<other.length; i++) {
            for (let j=0; j<other.length; j++) {
                if (i==j) {
                    continue;
                }
                vA.set(other[i][0], other[i][1], other[i][2]);
                vB.set(other[j][0], other[j][1], other[j][2]);
                cb.subVectors( vC, vB );
                let len1 = cb.lengthSq();
                ab.subVectors( vA, vB );
                let len2 = ab.lengthSq();
                cb.cross( ab );
                cb.normalize();
                if (GET(Math.floor(V[0]+cb.x*1.5), Math.floor(V[1]+cb.y*1.5), Math.floor(V[2]+cb.z*1.5))) {
                    cb.multiplyScalar(-1.);
                }
                cb.multiplyScalar(1./(len1*len2));
                norm.addVectors(norm, cb);
            }
        }
        norm.normalize();
        V.push(Math.floor((norm.x + 1.)*0.5*255.99));
        V.push(Math.floor((norm.y + 1.)*0.5*255.99));
        V.push(Math.floor((norm.z + 1.)*0.5*255.99));
    }

    fs.writeFileSync(`${outFile}-vox.json`, JSON.stringify(voxels));

    console.log(`Voxel Count: ${voxels.length}`);
};

exports.THREE = THREE;
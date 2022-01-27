window.LightSystem = function (maxLights) {
    this.maxLights = maxLights || 16;
    let lightColors = [], lightPositions = [];
    this.numLights = 0;
    for (let i=0; i<this.maxLights; i++) {
        lightColors.push(new THREE.Vector4(1., 1., 1., 0.));
        lightPositions.push(new THREE.Vector4(0., 0., 0., 0.));
    }
    this.uniforms = {
        fogColor: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
        dirLightColor: { value: new THREE.Vector3(1., 1., 1.) },
        dirLightDir: { value: new THREE.Vector3(-1., -1., -1.) },
        dynLightColors: { value: lightColors },
        dynLightPos: { value: lightPositions },
        depthTex: { value: null },
        shadowMatrix: { value: new THREE.Matrix4() }
    };
    this.vertexShader = `       
    `;
    this.fragShader = `
        uniform vec3 fogColor;
        uniform vec3 dirLightColor;
        uniform vec3 dirLightDir;
        uniform vec4 dynLightColors[${this.maxLights}];
        uniform vec4 dynLightPos[${this.maxLights}];
        uniform sampler2D depthTex;
        uniform mat4 shadowMatrix;

        vec3 getShadowCoord (vec3 pos) {
            mat4 biasMatrix;
            biasMatrix[0] = vec4(0.5, 0.0, 0.0, 0.0);
            biasMatrix[1] = vec4(0.0, 0.5, 0.0, 0.0);
            biasMatrix[2] = vec4(0.0, 0.0, 0.5, 0.0);
            biasMatrix[3] = vec4(0.5, 0.5, 0.5, 1.0);
            return ((biasMatrix * shadowMatrix) * vec4(pos, 1.)).xyz;
        }

        float readDepth( sampler2D depthSampler, vec2 coord ) {
            vec3 off = vec3(1., -1., 0.) / vec3(2048.);
            return texture2D(depthSampler, coord - off.xx).x;
        }

        vec4 computeLight(vec4 inColor, vec3 inPos, vec3 inNormal) {
            vec4 outClr = vec4(0., 0., 0., inColor.a);
            vec3 lightDir = normalize(dirLightDir);
            float diffuse = clamp(dot(inNormal, lightDir), 0., 1.) * 0.8;
            vec3 shadowCoord = getShadowCoord(inPos);
            if (shadowCoord.x > 0. && shadowCoord.y > 0. && shadowCoord.x < 1. && shadowCoord.y < 1.) {
                float sDepth = readDepth(depthTex, shadowCoord.xy);
                float tDepth = shadowCoord.z;
                if ((exp(sDepth) / exp(tDepth)) < 0.999) {
                    diffuse *= 0.15;
                }
            }
            diffuse += 0.2;
            outClr.rgb += inColor.rgb * dirLightColor * vec3(diffuse);
            for (int i=0; i<${this.maxLights}; i++) {
                if (dynLightColors[i].w > 0.5 && dynLightPos[i].w > 0.) {
                    lightDir = inPos - dynLightPos[i].xyz;
                    float distF = clamp(1. - (length(lightDir) / dynLightPos[i].w), -1., 1.);
                    if (distF > 0.) {
                        lightDir = normalize(-lightDir);
                        diffuse = clamp(dot(inNormal, lightDir), 0., 1.) * distF;
                        outClr.rgb += (inColor.rgb * dynLightColors[i].rgb * vec3(diffuse)) * 0.5 + dynLightColors[i].rgb * 0.5 * distF;
                    }
                }
            }
            float _origZ = gl_FragCoord.z / gl_FragCoord.w;
            outClr.rgb = mix(outClr.rgb, fogColor, clamp(_origZ / ${GLSL_INSERT.FLOAT(10. * 64.)}, 0., 1.));
            return clamp(outClr, vec4(0.), vec4(1.));
        }
    `;
    this.shadowFragShader = `
        void main () {
            gl_FragColor = vec4(1.);
        }
    `;
};

window.SHADOW_MAP_SIZE = 20*64;
window.SHADOW_MAP_PIXELS = 2048;

LightSystem.prototype.initShadows = function(gameRender, worldRender) {
    this.gameRender = gameRender;
    this.worldRender = worldRender;
    this.shadowScene = new THREE.Scene();
    this.shadowCamera = new THREE.OrthographicCamera(SHADOW_MAP_SIZE / - 2, SHADOW_MAP_SIZE / 2, SHADOW_MAP_SIZE / 2, SHADOW_MAP_SIZE / - 2, SHADOW_MAP_SIZE, 0.001, 12.*64);
    this.renderTarget = new THREE.WebGLRenderTarget(SHADOW_MAP_PIXELS, SHADOW_MAP_PIXELS, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, stencilBuffer: false });
    this.depthTexture = this.renderTarget.depthTexture = new THREE.DepthTexture(SHADOW_MAP_PIXELS, SHADOW_MAP_PIXELS);
    this.renderTarget.needsUpdate = true;
    //this.depthTexture.needsUpdate = true;
};

LightSystem.prototype.updateShadows = function(dt, time, dx, dy) {
    let pos = this.worldRender.camera.position.clone().add(new THREE.Vector3(-this.uniforms.dirLightDir.value.x, -this.uniforms.dirLightDir.value.y, this.uniforms.dirLightDir.value.z).normalize().multiplyScalar(5.*64.));
    let lookAt = this.worldRender.camera.position.clone();
    this.shadowCamera.up.set(0, 0, -1);
    this.shadowCamera.position.set(pos.x, pos.y, pos.z);
    this.shadowCamera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    this.shadowCamera.updateMatrix(true);
    this.shadowCamera.updateMatrixWorld(true);
    this.gameRender.renderer.setRenderTarget(this.renderTarget);
    this.gameRender.renderer.render(this.shadowScene, this.shadowCamera);
    this.gameRender.renderer.setRenderTarget(null);
    this.uniforms.depthTex.value = this.depthTexture;
    this.uniforms.shadowMatrix.value.copy(this.shadowCamera.projectionMatrix);
    this.uniforms.shadowMatrix.value.multiply(this.shadowCamera.matrixWorldInverse);
};

LightSystem.prototype.setFogColor = function(clr) {
    this.uniforms.fogColor.value.set(clr.x, clr.y, clr.z);
};

LightSystem.prototype.clearDynamic = function() {
    for (let i=0; i<this.maxLights; i++) {
        this.uniforms.dynLightColors.value[i].set(1., 1., 1., 0.);
        this.uniforms.dynLightPos.value[i].set(0., 0., 0., 0.);
    }
    this.numLights = 0;
};

LightSystem.prototype.addDynamic = function(color, position, radius) {
    if (this.numLights < this.maxLights) {
        let lno = this.numLights;
        this.numLights ++;

        this.uniforms.dynLightColors.value[lno].set(color.x, color.y, color.z, 1.);
        this.uniforms.dynLightPos.value[lno].set(position.x, position.y, position.z, radius);
    }
};

LightSystem.prototype.setDirLight = function(color, dir) {
    this.uniforms.dirLightColor.value.set(color.x, color.y, color.z);
    this.uniforms.dirLightDir.value.set(dir.x, dir.y, dir.z);
};
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
        dynLightPos: { value: lightPositions }
    };
    this.fragShader = `
        uniform vec3 fogColor;
        uniform vec3 dirLightColor;
        uniform vec3 dirLightDir;
        uniform vec4 dynLightColors[${this.maxLights}];
        uniform vec4 dynLightPos[${this.maxLights}];

        vec4 computeLight(vec4 inColor, vec3 inPos, vec3 inNormal) {
            vec4 outClr = vec4(0., 0., 0., inColor.a);
            vec3 lightDir = normalize(dirLightDir);
            float diffuse = clamp(dot(inNormal, lightDir), 0., 1.) * 0.8 + 0.2;
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
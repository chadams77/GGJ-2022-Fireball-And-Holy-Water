window.WorldRender = function(parent) {

    this.parent = parent;

    this.renderTarget = new THREE.WebGLRenderTarget(GAME_WIDTH, GAME_HEIGHT, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(1 / - 2, 1 / 2, 1 / 2, 1 / - 2, 1, 1000);

    this.renderShader = new THREE.ShaderMaterial({
        uniforms: {
            res: { value: new THREE.Vector2(GAME_WIDTH, GAME_HEIGHT) },
            time: { value: 0.0 },
            playerPos: { value: new THREE.Vector3(0., 0., Math.PI) },
            lightPos: { value: new THREE.Vector4(0., 0., -5., 20.) },
            lightColor: { value: new THREE.Vector3(1., 1., 1.) },
            fog: { value: new THREE.Vector4(.05, .05, .05, 10.) }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = vec2(uv.x, 1. - uv.y);
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            #define RM_MAX_DIST 10.
            #define RM_MAX_STEPS 100
            #define RM_MIN_DIST 0.01
            #define _R_SEED vec2(${Math.random()*1000}, ${Math.random()*1000})

            uniform vec2 res;
            uniform float time;
            uniform vec3 playerPos;
            uniform vec4 lightPos;
            uniform vec3 lightColor;
            uniform vec4 fog;
            varying vec2 vUv;

            ${SIMPLEX_SHADER}
            ${SDF_SHADERS}

            float SDF_StoneBlock (vec3 p, vec3 loc) {
                return sdBoxSigned(p, loc, vec3(0.5)) + snoise(p*13.3) * 0.01;
            }
            vec3 CLR_StoneBlock (vec3 p) {
                return mix(vec3(0.2, 0.2, 0.2), vec3(0.1, 0.4, 0.15), pow(-snoise(p*13.3)*0.5+0.5, 3.));
            }

            float sceneDist (vec3 p) {
                return min(
                    min(
                        SDF_StoneBlock(p, vec3(2., 0., 0.)),
                        SDF_StoneBlock(p, vec3(-2., 0., 0.))
                    ),
                    min(
                        SDF_StoneBlock(p, vec3(0., 6., 0.)),
                        SDF_StoneBlock(p, vec3(0., -6., 0.))
                    )
                );
            }

            vec3 sceneColor(vec3 p, float dist) {
                vec3 ret = vec3(0.);
      
                vec2 off = vec2(dist / 500., 0.);
                vec3 n = normalize(vec3(
                  sceneDist(p + off.xyy) - sceneDist(p - off.xyy),
                  sceneDist(p + off.yxy) - sceneDist(p - off.yxy),
                  sceneDist(p + off.yyx) - sceneDist(p - off.yyx)
                ));

                vec3 lightDir = normalize(lightPos.xyz - p);

                float diffuse = pow(max(dot(n, lightDir), 0.), 3.) * clamp(1. - dist / lightPos.w, 0., 1.);

                if (SDF_StoneBlock(p, vec3(2., 0., 0.)) < RM_MIN_DIST) {
                    ret = CLR_StoneBlock(p);
                }
                else if (SDF_StoneBlock(p, vec3(-2., 0., 0.)) < RM_MIN_DIST) {
                    ret = CLR_StoneBlock(p);
                }
                else if (SDF_StoneBlock(p, vec3(0., 6., 0.)) < RM_MIN_DIST) {
                    ret = CLR_StoneBlock(p);
                }
                else if (SDF_StoneBlock(p, vec3(0., -6., 0.)) < RM_MIN_DIST) {
                    ret = CLR_StoneBlock(p);
                }

                ret += ret * lightColor * diffuse;

                ret = mix(ret, fog.rgb, clamp(dist / fog.w, 0., 1.));
                
                return ret;
            }

            float rayMarch(vec3 r0, vec3 dir, float maxDist) {
              float d = 0.;
              for(int i=0; i<RM_MAX_STEPS; i++) {
                float curDist = sceneDist(r0 + dir * d);
                if (curDist < RM_MIN_DIST) {
                  return d;
                }
                d += curDist;
                if (d > maxDist) {
                  return maxDist;
                }
              }
              return d;
            }

			void main(void) {
                vec3 r0 = vec3(
                    playerPos.x,
                    playerPos.y,
                    0.
                );
                vec3 rd = vec3(
                    cos(playerPos.z + (vUv.x - 0.5) * (res.x/res.y)),
                    sin(playerPos.z + (vUv.x - 0.5) * (res.x/res.y)),
                    vUv.y - 0.5
                );
                float dist = rayMarch(r0, rd, RM_MAX_DIST);
                vec3 color = sceneColor(r0 + rd * dist, dist);
                gl_FragColor.a = 1.;
                gl_FragColor.rgb = color;
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

    this.renderShader.uniforms.time.value = time;
    this.renderShader.uniforms.playerPos.value.set(0, 0, time);

    inst.renderer.setRenderTarget(this.renderTarget);
    inst.renderer.render(this.scene, this.camera);
    inst.renderer.setRenderTarget(null);

};
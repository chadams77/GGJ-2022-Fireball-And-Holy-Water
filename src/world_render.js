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
            #define _R_SEED vec3(${Math.random()*1000}, ${Math.random()*1000}, ${Math.random()*1000})

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
                return sdBoxSigned(p, loc, vec3(0.5, 0.5, 1.5)) + snoise(p*13.3) * 0.01;
            }
            vec3 CLR_StoneBlock (vec3 p, vec3 loc) {
                return mix(vec3(0.2, 0.2, 0.2), vec3(0.1, 0.4, 0.15), pow(-snoise(p*13.3)*0.5+0.5, 3.));
            }

            float SDF_Cave1 (vec3 p, vec3 loc) {
                return opSubtraction(sdBoxSigned(p, loc, vec3(0.5, 0.5, 1.5)), sdBoxSigned(p, loc, vec3(0.7, 0.7, 0.5))) + snoise(p*13.3) * 0.02;
            }
            vec3 CLR_Cave1 (vec3 p, vec3 loc) {
                return mix(vec3(0.2, 0.2, 0.2), vec3(0.1, 0.4, 0.15), pow(-snoise(p*13.3)*0.5+0.5, 3.)) * 0.5;
            }

            float SDF_Grass (vec3 p, vec3 loc) {
                return sdBoxSigned(p, loc + vec3(0., 0., 0.5), vec3(0.5)) + snoise(p*17.3) * 0.015;
            }
            vec3 CLR_Grass (vec3 p, vec3 loc) {
                return mix(vec3(0.1, 0.4, 0.15)*0.2, vec3(0.1, 0.4, 0.15), pow(-snoise(p*17.3)*0.5+0.5, 3.));
            }

            float SDF_Tree_L3 (vec3 p, vec3 loc, float _r, float a) {
                float r0 = rand(loc.xy + vec2(_r));
                float r = a + (r0 - 0.5) * PI * 0.5;
                float rad = (rand(loc.xy + vec2(a)) * 0.7 + 0.3) * 0.35;
                vec3 loc2 = loc + normalize(vec3(cos(r) * 0.15, sin(r) * 0.15, -0.15)) * rad;
                return sdTaperedLine(loc, loc2, 0.01, 0.0025, p);
            }

            float SDF_Tree_L2 (vec3 p, vec3 loc, float _r, float a) {
                float r0 = rand(loc.xy + vec2(_r));
                float r = a + (r0 - 0.5) * PI * 1.5;
                float rad = (rand(loc.xy + vec2(a)) * 0.7 + 0.3) * 0.7;
                vec3 loc2 = loc + normalize(vec3(cos(r) * 0.15, sin(r) * 0.15, -0.05)) * rad;
                float dist = sdTaperedLine(loc, loc2, 0.025, 0.01, p);
                dist = min(dist, SDF_Tree_L3(p, loc2, rand(vec2(r0, 4.)), r));
                if (r0 > 0.25) {
                    dist = min(dist, SDF_Tree_L3(p, loc2, rand(vec2(r0, 5.)), r));
                }
                return dist;
            }

            float SDF_Tree (vec3 p, vec3 loc) {
                loc.z += 0.25;
                float r0 = rand(loc.xy);
                float r = r0 * PI * 2.;
                vec3 loc2 = loc + vec3(cos(r) * 0.025, sin(r) * 0.025, -(0.2 + 0.1 * r0)/0.5);
                float dist = sdTaperedLine(loc, loc2, 0.06, 0.025, p);
                dist = min(dist, SDF_Tree_L2(p, loc2, rand(vec2(r0, 1.)), r));
                dist = min(dist, SDF_Tree_L2(p, loc2, rand(vec2(r0, 2.)), r));
                dist = min(dist, SDF_Tree_L2(p, loc2, rand(vec2(r0, 3.)), r));
                dist = dist - (1. - worley(p*39.71, 3.7, false).x) * 0.02;
                loc.z -= 0.25;
                return min(dist, SDF_Grass(p, loc));
            }
            vec3 CLR_Tree (vec3 p, vec3 loc) {
                if (SDF_Grass(p, loc) < RM_MIN_DIST) {
                    return CLR_Grass(p, loc);
                }
                else {
                    return mix(mix(vec3(0.325, 0.207, 0.03), vec3(0.325, 0.207, 0.03)*0.3, worley(p*39.71, 3.7, false).x), vec3(0.3, 0.3, 0.3), 0.5);
                }
            }

            float sceneDist (vec3 p) {
                return min(
                    min(
                        SDF_Tree(p, vec3(2., 0., 0.)),
                        SDF_Tree(p, vec3(-2., 0., 0.))
                    ),
                    min(
                        SDF_Cave1(p, vec3(0., 2., 0.)),
                        SDF_Cave1(p, vec3(0., -2., 0.))
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

                vec3 loc;
                if (SDF_Tree(p, loc = vec3(2., 0., 0.)) < RM_MIN_DIST) {
                    ret = CLR_Tree(p, loc);
                }
                else if (SDF_Tree(p, loc = vec3(-2., 0., 0.)) < RM_MIN_DIST) {
                    ret = CLR_Tree(p, loc);
                }
                else if (SDF_Cave1(p, loc = vec3(0., 2., 0.)) < RM_MIN_DIST) {
                    ret = CLR_Cave1(p, loc);
                }
                else if (SDF_Cave1(p, loc = vec3(0., -2., 0.)) < RM_MIN_DIST) {
                    ret = CLR_Cave1(p, loc);
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
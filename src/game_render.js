window.GameRender = function(canvasId, map) {


    this.canvasID = canvasId;
    this.canvas = document.getElementById(this.canvasID);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.map = map;
    this.lightSystem = this.map.lightSystem;
   
    try {

        const testCanvas = document.createElement('canvas');
        if (!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')))) {
            throw "WebGL not found";
        }

    } catch ( e ) {

        this.webGLError = true;
        const c2d = this.canvas.getContext('2d');
        c2d.clearRect(0, 0, this.width, this.height);
        c2d.fillStyle = '#FF1111';
        c2d.textAlign = 'center';
        c2d.font = '20px Arial';
        c2d.fillText('WebGL Not Supported, Try Enabling WebGL Rendering in browser\'s settings.', this.width*0.5, this.height*0.5);
        return;
    
    }

    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.setSize( this.width, this.height );

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(1 / - 2, 1 / 2, 1 / 2, 1 / - 2, 1, 10);

    this.uiCanvas = document.createElement('canvas');
    this.uiCanvas.width = GAME_WIDTH;
    this.uiCanvas.height = GAME_HEIGHT;
    this.uiCtx = this.uiCanvas.getContext('2d');
    this.uiCtx.imageSmoothingQuality = 'high';
    this.uiTexture = new THREE.CanvasTexture(this.uiCanvas, undefined, undefined, undefined, THREE.NearestFilter, THREE.NearestFilter);

    this.worldRender = new WorldRender(this, this.map);

    this.lightSystem.initShadows(this, this.worldRender);

    this.combineShader = new THREE.ShaderMaterial({
        uniforms: {
            res: { value: new THREE.Vector2(GAME_WIDTH, GAME_HEIGHT) },
            aRes: { value: new THREE.Vector2(this.width, this.height) },
            uiTex: { value: this.uiTexture },
            gameTex: { value: this.worldRender.texture }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `          
            uniform sampler2D uiTex, gameTex;

            uniform vec2 res, aRes;

            varying vec2 vUv;

            vec4 getColor(vec2 _uv) {
                vec3 off = vec3(0.5 / res.x, 0.5 / res.y, 0.);
                vec4 game = (texture2D(gameTex, _uv) + texture2D(gameTex, _uv + off.xz) + texture2D(gameTex, _uv + off.zy) + texture2D(gameTex, _uv + off.xy)) * 0.25;
                game = texture2D( gameTex, _uv );
                vec4 ui = texture2D(uiTex, _uv);
                return vec4(game.rgb * (1. - ui.a) + ui.rgb * ui.a, 1.);
            }

            ${window.CRT_SHADER}

			void main(void) {
                float aspectA = aRes.x / aRes.y;
                float aspect = res.x / res.y;
                vec2 scale = vec2(0.8, 0.8);
                if (aspect <= aspectA) {
                    scale.x *= aspectA;
                    scale.y *= aspect;
                }
                else {
                    scale.x = (aspect / aspectA) * aspectA;
                    scale.y = (aspect / aspectA) * aspect;
                }
                vec2 uv2 = (vUv - vec2(0.5)) * scale + vec2(0.5);
                if (uv2.x < 0. || uv2.y < 0. || uv2.x >= 1. || uv2.y >= 1.) {
                    gl_FragColor.rgba = vec4(0., 0., 0., 1.);
                }
                else {
                    gl_FragColor.rgba = doCrt(uv2);
                }
            }
        `
    });
    this.combineGeom = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    this.combineMesh = new THREE.Mesh(this.combineGeom, this.combineShader);
    this.combineMesh.position.set(0, 0, -2);
    this.scene.add(this.combineMesh);

};

GameRender.prototype.render = function(dt, time) {

    if (this.width !== window.innerWidth || this.height !== window.innerHeight) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize( this.width, this.height );
    }

    if (this.webGLError) {
        return;
    }

    this.worldRender.render(dt, time);

    this.uiCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    let totalHp = 5;
    let haveHP = 5;
    let hSize = 20;

    for (let i=1; i<=totalHp; i++) {
        let percent = Math.min(Math.max(haveHP - (i-1), 0.), 1.);
        let x = 8 + (i-1) * hSize, y = 8;
        this.uiCtx.drawImage(IMG['heart-empty'], x, y, hSize, hSize);
        this.uiCtx.drawImage(IMG['heart-full'], 0, 0, Math.round(20*percent), 20, x, y, Math.round(hSize*percent), hSize);
    }

    let mkBtn = (i, icon, enabled, cooldown, count, sel) => {
        let x = GAME_WIDTH - i * 32 - 32 - 8;
        let y = GAME_HEIGHT - 32 - 8;
        this.uiCtx.drawImage(IMG['button-disabled'], x, y);
        cooldown = cooldown || 0.;
        if (enabled && cooldown <= 0.) {
            this.uiCtx.drawImage(IMG[sel ? 'button-sel' : 'button'], 0, 0, Math.round(32*(1-cooldown)), 32, x, y, Math.round(32*(1-cooldown)), 32);
        }
        if (enabled && icon) {
            if (cooldown > 0.) {
                this.uiCtx.globalAlpha = 0.25;
            }
            this.uiCtx.drawImage(IMG[icon], x, y);
            this.uiCtx.globalAlpha = 1.;
        }
        if (count) {
            this.uiCtx.font = 'bold bold bold 12px/bold Courier New';
            this.uiCtx.textAlign = 'right';
            this.uiCtx.fillStyle = enabled ? '#fff' : '#fff';
            this.uiCtx.lineWidth = 2.;
            this.uiCtx.fillText(`${count}`, x + 25, y + 34.5);
            this.uiCtx.lineWidth = 1.;
        }
    };

    mkBtn(6, 'fireball-icon', true, 0., 3);
    mkBtn(5, 'holywater-icon', true, 0., 2);
    mkBtn(3, 'rock-icon', true, 0., 0, true);
    mkBtn(2, 'pistol-icon', true, 0., 10);
    mkBtn(1, 'shotgun-icon', false, 0., 0);
    mkBtn(0, 'rifle-icon', true, 0., 3);

    this.uiCtx.font = 'normal normal normal 14px/normal Courier New';
    this.uiCtx.textAlign = 'right';
    this.uiCtx.fillStyle = '#fff';
    this.uiCtx.fillText(`${Math.round(1/dt)} fps`, GAME_WIDTH - 10, 15);

    this.uiCtx.drawImage(IMG['cursor-normal'], GAME_MOUSE.x - 16, GAME_MOUSE.y - 16);

    this.uiTexture.needsUpdate = true;

    this.combineShader.uniforms.aRes.value.set(this.width, this.height);
    
    this.renderer.render(this.scene, this.camera);

};
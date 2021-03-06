window.GAME_WIDTH = 320;
window.GAME_HEIGHT = 240;

window.FHW = function (canvasId) {

    window.VSPR = {};
    window.SFX = {};
    window.IMG = {};

    this.renderLoop = new RenderLoop(this.updateRender.bind(this));
    this.lightSystem = new LightSystem();
    this.map = new GameMap(64, 0, () => {
        let player = this.map.player;
        let inventory = player.inventory;
        this.map.fadeOutDestroy(()=>{
            this.map = new GameMap(64, 1, () => {
                let player = this.map.player;
                let inventory = player.inventory;
                this.map.fadeOutDestroy(()=>{
                    this.map = new GameMap(32, 2, () => {
                        this.map.victory = true;
                        this.map.victoryT = 0.;
                    }, this.lightSystem);
                    this.gameRender.map = this.map;
                    this.map.load(this.gameRender.worldRender);
                    this.map.player.inventory = inventory;
                    this.map.player.hp = this.map.player.maxHP = 7;
                });
            }, this.lightSystem);
            this.gameRender.map = this.map;
            this.map.load(this.gameRender.worldRender);
            this.map.player.inventory = inventory;
            this.map.player.hp = this.map.player.maxHP = 5;
        });
    }, this.lightSystem);
    this.gameRender = new GameRender(canvasId, this.map);

    if (this.gameRender.webGLError) {
        this.noLoad = true;
    }

    window.KEY_PRESSED = {};
    window.KEY_DOWN = {};
    window.MOUSE_CLICK = false;
    document.addEventListener('keyup', (e) => {
        e = e || window.event;
        KEY_PRESSED[e.keyCode] = true;
        KEY_DOWN[e.keyCode] = false;
    });
    document.addEventListener('keydown', (e) => {
        e = e || window.event;
        KEY_DOWN[e.keyCode] = true;
    });
    this.soundLoadClicked = false;
    document.addEventListener('mouseup', (e) => {
        e = e || window.event;
        MOUSE_CLICK = true;
    });
    document.addEventListener('mousedown', (e) => {
        if (this.soundLoadClicked) {
            return;
        }
        this.soundLoadClicked = true;
        sounds.load([
            "sfx/music-normal.mp3",
            "sfx/music-hell.mp3",
            "sfx/get-ammo.wav",
            "sfx/walk-1.wav",
            "sfx/walk-2.wav",
            "sfx/drink-1.wav",
            "sfx/drink-2.wav",
            "sfx/pistol.wav",
            "sfx/shotgun.wav",
            "sfx/rock.wav",
            "sfx/rifle.wav",
            "sfx/fireball.wav",
            "sfx/damage-1.wav",
            "sfx/demon-die-1.wav",
            "sfx/demon-die-2.wav",
            "sfx/demon-die-3.wav",
            "sfx/demon-die-4.wav",
            "sfx/explosion.wav"
        ]);
        sounds.whenLoaded = () => {
            SFX['get-ammo'] = new SoundEffect("sfx/get-ammo.wav");
            SFX['walk-1'] = new SoundEffect("sfx/walk-1.wav");
            SFX['walk-2'] = new SoundEffect("sfx/walk-2.wav");
            SFX['drink-1'] = new SoundEffect("sfx/drink-1.wav");
            SFX['drink-2'] = new SoundEffect("sfx/drink-2.wav");
            SFX['pistol'] = new SoundEffect("sfx/pistol.wav");
            SFX['shotgun'] = new SoundEffect("sfx/shotgun.wav");
            SFX['rock'] = new SoundEffect("sfx/rock.wav");
            SFX['rifle'] = new SoundEffect("sfx/rifle.wav");
            SFX['fireball'] = new SoundEffect("sfx/fireball.wav");
            SFX['damage'] = new SoundEffect("sfx/damage-1.wav");
            SFX['explosion'] = new SoundEffect("sfx/explosion.wav");
            SFX['demon-die-1'] = new SoundEffect("sfx/demon-die-1.wav");
            SFX['demon-die-2'] = new SoundEffect("sfx/demon-die-2.wav");
            SFX['demon-die-3'] = new SoundEffect("sfx/demon-die-3.wav");
            SFX['demon-die-4'] = new SoundEffect("sfx/demon-die-4.wav");
            this.soundsLoaded = true;
            document.body.removeChild(document.getElementById('load-button'));
            document.getElementById('c3d').style.display = 'block';
        }
    });
    document.addEventListener('mousemove', (e) => {
        e = e || window.event;
        let p = window.GAME_MOUSE = {
            x: e.pageX,
            y: e.pageY
        };
        let aspectA = window.innerWidth / window.innerHeight;;
        let aspect = GAME_WIDTH / GAME_HEIGHT;
        let scaleX = 0.8, scaleY = 0.8;
        if (aspect <= aspectA) {
            scaleX *= aspectA;
            scaleY *= aspect;
        }
        else {
            scaleX = (aspect / aspectA) * aspectA;
            scaleY = (aspect / aspectA) * aspect;
        }
        p.x /= window.innerWidth;
        p.y /= window.innerHeight;
        p.x -= 0.5;
        p.y -= 0.5;
        p.x *= scaleX;
        p.y *= scaleY;
        p.x += 0.5;
        p.y += 0.5;
        p.x *= GAME_WIDTH;
        p.y *= GAME_HEIGHT;
    })
    
}

FHW.prototype.updateRender = function(dt, time) {

    document.title = `F.H.W. v1.0 - ${Math.round(1/dt)} fps`;

    this.gameRender.render(dt, time);
    window.KEY_PRESSED = {};
    window.MOUSE_CLICK = false;

};

FHW.prototype.load = async function(then) {

    document.getElementById('load-button').style.opacity = 0.;

    if (this.noLoad) {
        return;
    }

    let load = [
        { key: 'tree-1', size: 150., maxDraw: 128, scale: 128. },
        { key: 'tree-2', size: 150., maxDraw: 128, scale: 128. },
        { key: 'tree-3', size: 150., maxDraw: 128, scale: 128. },
        { key: 'tree-4', size: 150., maxDraw: 128, scale: 128. },
        { key: 'skull-head', size: 64., maxDraw: 32, scale: 20.*(64./48.) },
        { key: 'skull-chest', size: 64., maxDraw: 32, scale: 32. },
        { key: 'skull-hands', size: 128., maxDraw: 32, scale: 48.*(128/92) },
        { key: 'skull-hands-attack', size: 164., maxDraw: 32, scale: 48.*(164/92) },
        { key: 'gdemon-head', size: 64., maxDraw: 32, scale: 24.*(64./48.) },
        { key: 'gdemon-chest', size: 64., maxDraw: 32, scale: 34. },
        { key: 'gdemon-hands', size: 128., maxDraw: 32, scale: 48.*(128/92) },
        { key: 'gdemon-hands-attack', size: 164., maxDraw: 32, scale: 48.*(164/92) },
        { key: 'ydemon-head', size: 64., maxDraw: 32, scale: 24.*(64./48.) },
        { key: 'ydemon-chest', size: 64., maxDraw: 32, scale: 34. },
        { key: 'ydemon-hands', size: 128., maxDraw: 32, scale: 48.*(128/92) },
        { key: 'ydemon-hands-attack', size: 164., maxDraw: 32, scale: 48.*(164/92) },
        { key: 'rdemon-head', size: 92., maxDraw: 32, scale: 28.*(92./48.) },
        { key: 'rdemon-chest', size: 64., maxDraw: 32, scale: 38. },
        { key: 'rdemon-hands', size: 128., maxDraw: 32, scale: 64.*(128/92) },
        { key: 'rdemon-hands-attack', size: 164., maxDraw: 32, scale: 64.*(164/92) },
        { key: 'fireball-yellow', size: 64., maxDraw: 128, scale: 16., emissive: true },
        { key: 'fireball-red', size: 64., maxDraw: 128, scale: 32., emissive: true },
        { key: 'rock', size: 32., maxDraw: 128, scale: 8. },
    ];

    for (let i=0; i<load.length; i++) {
        load[i] = (new VoxelSprite(load[i].key, load[i].size, load[i].maxDraw, load[i].scale, null, load[i].emissive)).load(this.gameRender.worldRender.scene, this.map.lightSystem);
    }
    let loaded = await Promise.all(load);
    for (let L of loaded) {
        VSPR[L.url] = L;
    }

    document.getElementById('load-button').style.opacity = 1.;

    await (new Promise((resolve, reject) => {
        let id = setInterval(() => {
            if (this.soundsLoaded) {
                window.clearInterval(id);
                resolve();
            }
        }, 10);
    }));

    let images = [
        'cursor-normal', 'cursor-crossair',
        'heart-full', 'heart-empty',
        'pistol-icon', 'rifle-icon', 'shotgun-icon', 'rock-icon', 'fireball-icon', 'holywater-icon',
        'button', 'button-sel', 'button-disabled',
        'pistol-item', 'rifle-item', 'shotgun-item', 'rock-item', 'fireball-item', 'holywater-item',
    ];
    let prl = [];
    for (let i=0; i<images.length; i++) {
        prl.push(new Promise((resolve) => {
            IMG[images[i]] = new Image();
            IMG[images[i]].src = `images/${images[i]}.png`;
            IMG[images[i]].onload = () => {
                console.log(`Loaded image 'images/${images[i]}.png'`);
                resolve();
            }
        }))
    }
    await Promise.all(prl);

    let imgToVSPR = [
        'pistol-item', 'rifle-item', 'shotgun-item', 'rock-item', 'fireball-item', 'holywater-item'
    ];

    for (let I of imgToVSPR) {
        VSPR[I] = await (new VoxelSprite(I, IMG[I].width, 32, 24., IMG[I])).load(this.gameRender.worldRender.scene, this.map.lightSystem);
    }

    this.map.load(this.gameRender.worldRender);

    then();

};

FHW.prototype.start = function() {

    if (this.noLoad) {
        return;
    }

    this.renderLoop.start();

};

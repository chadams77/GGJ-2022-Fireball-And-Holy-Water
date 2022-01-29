window.GAME_WIDTH = 320;
window.GAME_HEIGHT = 240;

window.FHW = function (canvasId) {

    window.VSPR = {};
    window.SFX = {};

    this.renderLoop = new RenderLoop(this.updateRender.bind(this));
    this.map = new GameMap(64);
    this.gameRender = new GameRender(canvasId, this.map);

    if (this.gameRender.webGLError) {
        this.noLoad = true;
    }

    window.KEY_PRESSED = {};
    window.KEY_DOWN = {};
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
    document.addEventListener('mousedown', (e) => {
        if (this.soundLoadClicked) {
            return;
        }
        this.soundLoadClicked = true;
        sounds.load([
            "sfx/music-normal.mp3",
            "sfx/music-hell.mp3",
            "sfx/get-ammo.wav"
        ]);
        sounds.whenLoaded = () => {
            SFX['get-ammo'] = new SoundEffect("sfx/get-ammo.wav", 8);
            this.soundsLoaded = true;
            document.body.removeChild(document.getElementById('load-button'));
        }
    });
    
}

FHW.prototype.updateRender = function(dt, time) {

    document.title = `F.H.W. v1.0 - ${Math.round(1/dt)} fps`;

    this.gameRender.render(dt, time);
    window.KEY_PRESSED = {};

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
    ];

    for (let i=0; i<load.length; i++) {
        load[i] = (new VoxelSprite(load[i].key, load[i].size, load[i].maxDraw, load[i].scale)).load(this.gameRender.worldRender.scene, this.map.lightSystem);
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

    this.map.load(this.gameRender.worldRender);

    then();

};

FHW.prototype.start = function() {

    if (this.noLoad) {
        return;
    }

    this.renderLoop.start();

};

window.GAME_WIDTH = 320;
window.GAME_HEIGHT = 240;

window.FHW = function (canvasId) {

    window.VSPR = {};

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
    
}

FHW.prototype.updateRender = function(dt, time) {

    document.title = `F.H.W. v1.0 - ${Math.round(1/dt)} fps`;

    this.gameRender.render(dt, time);
    window.KEY_PRESSED = {};

};

FHW.prototype.load = async function(then) {

    if (this.noLoad) {
        return;
    }

    let load = [
        { key: 'sphere', size: 48., maxDraw: 32, scale: 64. },
        { key: 'tree-1', size: 128., maxDraw: 256, scale: 128. }
    ];

    for (let i=0; i<load.length; i++) {
        load[i] = (new VoxelSprite(load[i].key, load[i].size, load[i].maxDraw, load[i].scale)).load(this.gameRender.worldRender.scene, this.map.lightSystem);
    }
    let loaded = await Promise.all(load);
    for (let L of loaded) {
        VSPR[L.url] = L;
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

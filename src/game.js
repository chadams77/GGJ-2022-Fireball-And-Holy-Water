window.GAME_WIDTH = 320;
window.GAME_HEIGHT = 240;

window.FHW = function (canvasId) {

    this.renderLoop = new RenderLoop(this.updateRender.bind(this));
    this.map = new GameMap(256);
    this.gameRender = new GameRender(canvasId, this.map);
    window.VSPR = {};

    if (this.gameRender.webGLError) {
        this.noLoad = true;
    }
    

}

FHW.prototype.updateRender = function(dt, time) {

    document.title = `F.H.W. v1.0 - ${Math.round(1/dt)} fps`;

    this.gameRender.render(dt, time);

};

FHW.prototype.load = async function(then) {

    if (this.noLoad) {
        return;
    }

    let load = [
        { key: 'sphere', size: 128, maxDraw: 1 }
    ];

    for (let i=0; i<load.length; i++) {
        load[i] = (new VoxelSprite(load[i].key, load[i].size, load[i].maxDraw)).load(this.gameRender.worldRender.scene);
    }
    let loaded = await Promise.all(load);
    for (let L of loaded) {
        VSPR[L.url] = L;
    }

    then();

};

FHW.prototype.start = function() {

    if (this.noLoad) {
        return;
    }

    this.renderLoop.start();

};

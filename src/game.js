window.GAME_WIDTH = 320;
window.GAME_HEIGHT = 240;

window.FHW = function (canvasId) {

    this.renderLoop = new RenderLoop(this.updateRender.bind(this));
    this.gameRender = new GameRender(canvasId);

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

    setTimeout(then, 10);

};

FHW.prototype.start = function() {

    if (this.noLoad) {
        return;
    }

    this.renderLoop.start();

};

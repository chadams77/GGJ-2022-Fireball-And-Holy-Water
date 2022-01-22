window.RenderLoop = function(updateRender) {

    this.updateRender = updateRender;
    this.time = 0.;
    this.dt = 0.0;

    this.tick = this.tick.bind(this);

    this.lastTs = null;
    this.lastAFReq = null;

};

RenderLoop.prototype.tick = function () {

    this.lastAFReq = requestAnimationFrame(this.tick);
    this.currentTs = new Date().getTime() / 1000;
    if (this.lastTs === null) {
        this.dt = 1/60;
        this.lastTs = this.currentTs;
    }
    else {
        let dt = Math.max(Math.min(this.currentTs - this.lastTs, 1/10), 1/300);
        this.lastTs = this.currentTs;
        this.dt = this.dt * 0.9 + dt * 0.1;
        this.time += this.dt;
    }

    this.updateRender(this.dt, this.time, this);

};

RenderLoop.prototype.stop = function () {

    if (this.lastAFReq !== null) {
        cancelAnimationFrame(this.lastAFReq);
        this.lastAFReq = null;
    }

};

RenderLoop.prototype.start = function () {

    this.stop();
    this.lastTs = null;
    this.lastAFReq = requestAnimationFrame(this.tick);

};
window.Item = function(eset, map, player, x, y, type) {

    this.map = map;
    this.eset = eset;
    this.player = player;
    this.x = x;
    this.y = y;
    this.type = type;
    this.deathT = 1.;
    this.turnT = 0.;
    this.spawnT = 60.;

    let dx = this.player.x - this.x, dy = this.player.y - this.y;
    let len = Math.sqrt(dx*dx+dy*dy);
    SFX['walk-1'].play(1 / len, 1.25);

};

Item.prototype.updateRender = function(dt, time) {

    this.deathT -= dt * 4.;
    if (this.deathT < 0.) {
        this.deathT = 0.;
    }
    
    this.spawnT -= dt;
    if (this.spawnT < 0.) {
        return false;
    }

    let float = Math.sin(1.5*time*Math.PI*0.5) * 0.05;
    let ang = Math.atan2(this.player.y - this.y, this.player.x - this.x);
    let deathT = Math.min(1, this.deathT + Math.max(1. - this.spawnT * 2, 0.));
    let scale = this.map.scale;
    VSPR[`${this.type}-item`].addSprite(this.x * scale, this.y * scale, (0.5+float) * scale, ang, deathT);

    return true;

};


///


window.ItemSet = function(map, itemProb, itemMax) {

    this.map = map;
    this.list = [];
    this.itemProb = itemProb;
    this.itemMax = itemMax;
    this.spawnCheckT = 0.;
    this.itemCount = {'pistol':0, 'shotgun': 0, 'rifle': 0, 'rock': 0, 'holywater': 0, 'fireball': 0};

};

ItemSet.prototype.doesCollide = function(x, y, ignore) {
    for (let E of this.list) {
        let dx = E.x - x, dy = E.y - y;
        let dx2 = E.toX - x, dy2 = E.toY - y;
        if (Math.sqrt(dx*dx+dy*dy) < 0.5) {
            if (ignore !== E) {
                return E;
            }
        }
        if (Math.sqrt(dx2*dx2+dy2*dy2) < 0.5) {
            if (ignore !== E) {
                return E;
            }
        }
    }
    return null;
}

ItemSet.prototype.updateRender = function(dt, time) {

    this.spawnCheckT += dt * 2;
    if (this.spawnCheckT >= 1.) {
        for (let type in this.itemProb) {
            if (this.itemCount[type] < (this.itemMax[type]||0)) {
                if (Math.random() < (1/20) && Math.random() < this.itemProb[type]) {
                    let k = 10;
                    while ((k--) > 0) {
                        let x = Math.floor(Math.random()*16-8 + this.player.x);
                        let y = Math.floor(Math.random()*16-8 + this.player.y);
                        if (!this.map.doesCollide(x, y) && (x||y) && !this.doesCollide(x, y)) {
                            this.itemCount[type] += 1;
                            this.list.push(new Item(
                                this,
                                this.map,
                                this.player,
                                x,
                                y,
                                type
                            ));
                            break;
                        }
                    }
                }
            }
        }
        this.spawnCheckT = 0.;
    }

    VSPR['pistol-item'].clear();
    VSPR['rifle-item'].clear();
    VSPR['shotgun-item'].clear();
    VSPR['rock-item'].clear();
    VSPR['fireball-item'].clear();
    VSPR['holywater-item'].clear();

    for (let i=0; i<this.list.length; i++) {
        const E = this.list[i];
        if (!E.updateRender(dt, time)) {
            this.itemCount[E.type] -= 1;
            this.list.splice(i, 1);
            i --;
            continue;
        }
    }

};
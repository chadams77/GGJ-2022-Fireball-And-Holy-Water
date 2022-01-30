window.Projectiles = function(map) {

    this.list = [];
    this.map = map;

};

Projectiles.prototype.fire = function(spr, source, target, miss, onFinish) {

    let start = {x: source.x, y: source.y};
    let end = target;
    let dx = start.x - end.x, dy = start.y - end.y;
    let len = Math.sqrt(dx*dx+dy*dy);

    let totalTime = 0.;
    if (spr === 'rock') {
        totalTime = len / 2.;
    }
    else if (spr === 'fireball-yellow') {
        totalTime = len / 3.;
    }
    else if (spr === 'fireball-red') {
        totalTime = len / 4.;
    }

    this.list.push({
        spr,
        start,
        end,
        miss,
        onFinish,
        totalTime,
        t: 0
    });

};

Projectiles.prototype.update = function(dt, time) {

    VSPR[`rock`].clear();
    VSPR[`fireball-yellow`].clear();
    VSPR[`fireball-red`].clear();

    let scale = this.map.scale;
    for (let i=0; i<this.list.length; i++) {
        const P = this.list[i];
        P.t += dt;
        if (P.t >= P.totalTime) {
            if (!P.miss && P.spr !== 'rock') {
                let dx = this.map.player.x - this.x, dy = this.map.player.y - this.y;
                let len = Math.sqrt(dx*dx+dy*dy);
                SFX['explosion'].play(4 / (len+1), P.spr === 'fireball-yellow' ? 0.9 : 0.75);
            }
            P.onFinish();
            this.list.splice(i, 1);
            i --;
            continue;
        }
        let ang = P.t * Math.sqrt(P.totalTime) * 10. * Math.PI;
        let deathT = 1. - Math.min((P.totalTime - P.t) * 4, 1.)
        let float = Math.sin(P.t / P.totalTime * Math.PI);
        let t = P.t / P.totalTime;
        if (P.miss) {
            float -= t;
        }
        let x = P.start.x * (1-t) + P.end.x * t;
        let y = P.start.y * (1-t) + P.end.y * t;
        VSPR[P.spr].addSprite(x * scale, y * scale, (0.5+float*0.5) * scale, ang, deathT);
        if (P.spr === 'fireball-yellow') {
            this.map.lightSystem.addDynamic(new THREE.Vector3(1.5, 1.5, 0.7), new THREE.Vector3(x * scale, y * scale, (0.5+float*0.5) * scale), scale * (1.5+deathT) * 0.5);
        }
        else if (P.spr === 'fireball-red') {
            this.map.lightSystem.addDynamic(new THREE.Vector3(1.5, 0.7, 0.1), new THREE.Vector3(x * scale, y * scale, (0.5+float*0.5) * scale), scale * (1.5+deathT));
        }
    }

};
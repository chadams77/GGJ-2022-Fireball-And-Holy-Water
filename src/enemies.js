window.Enemy = function(eset, map, player, x, y, type) {

    this.map = map;
    this.eset = eset;
    this.player = player;
    this.x = x;
    this.y = y;
    this.toX = x;
    this.toY = y;
    this.type = type;
    this.hp = {
        'skull': 5,
        'gdemon': 10,
        'ydemon': 20,
        'rdemon': 80,
        'boss': 125
    }[type];
    this.deathT = 1.;
    this.turnLength = {
        'skull': 2.,
        'gdemon': 1.5,
        'ydemon': 1.0,
        'rdemon': 0.5,
        'boss': 2.0
    }[type];
    this.attackRange = {
        'skull': 1,
        'gdemon': 2,
        'ydemon': 5,
        'rdemon': 8,
        'boss': 20.
    }[type];
    this.turnNo = 0;
    this.turnT = 0.;
    this.attacking = false;
    this.doneAttack = false;

    let dx = this.player.x - this.x, dy = this.player.y - this.y;
    let len = Math.sqrt(dx*dx+dy*dy);
    SFX['walk-1'].play(1 / len, 0.5);

};

Enemy.prototype.damage = function(dmg) {
    let dx = this.player.x - this.x, dy = this.player.y - this.y;
    let len = Math.sqrt(dx*dx+dy*dy);
    SFX['damage'].play(4 / len, 0.4+Math.random()*0.1);
    this.hp -= dmg;
    if (this.hp <= 0) {
        this.hp = 0;
        SFX[`demon-die-${Math.floor(1 + Math.random()*4)}`].play(1.75 / len, 0.95+Math.random()*0.1);
    }
};

Enemy.prototype.doAttack = function(target) {
    let type = this.type;
    if (type === 'ydemon' || type === 'rdemon') {
        SFX['fireball'].play(0.75);
    }

    let sdx = this.player.x - this.x, sdy = this.player.y - this.y;
    let len = Math.sqrt(sdx*sdx+sdy*sdy);
    SFX['walk-2'].play(1.5 / len, 0.9);

    if (this.map.rayCastMapOnly(this.x, this.y, Math.atan2(sdy, sdx), len)) {
        return;
    }

    let farT = Math.max(0, Math.min(len/this.attackRange, 1));

    let nearAcc = 0, farAcc = 0;
    let nearDmg = 0, farDmg = 0;
    let nearRDmg = 0, farRDmg = 0;
    switch (type) {
        case 'skull':
            nearAcc = 0.95; farAcc = 0.8;
            nearDmg = 2; farDmg = 1;
            nearRDmg = 1; farRDmg = 2;
            break;
        case 'gdemon':
            nearAcc = 0.85; farAcc = 0.75;
            nearDmg = 3; farDmg = 2;
            nearRDmg = 2; farRDmg = 1;
            break;
        case 'ydemon':
            nearAcc = 0.5; farAcc = 0.1;
            nearDmg = 4; farDmg = 4;
            nearRDmg = 2; farRDmg = 2;
            break;
        case 'rdemon':
            nearAcc = 0.5; farAcc = 0.1;
            nearDmg = 8; farDmg = 7;
            nearRDmg = 3; farRDmg = 3;
            break;
        default:
            break;
    }
    let acc = farT * farAcc + (1 - farT) * nearAcc;
    let baseDmg = farT * farDmg + (1 - farT) * nearDmg;
    let randDmg = (farT * farRDmg + (1 - farT) * nearRDmg) * Math.random();
    let dmg = Math.random() < acc ? (baseDmg + randDmg) : 0;

    dmg /= 8.;

    let onFinish = () => {
        if (dmg) {
            target.damage(dmg);
            SFX['damage'].play(1, 0.95);
        }
    };

    if (type === 'ydemon' || type === 'rdemon') {
        this.map.proj.fire(type === 'ydemon' ? 'fireball-yellow' : 'fireball-red', this, target, dmg <= 0, onFinish);
    }
    else {
        onFinish();
    }
}

Enemy.prototype.updateRender = function(dt, time) {

    if (this.hp > 0) {
        this.deathT -= dt * 4.;
        if (this.deathT < 0.) {
            this.deathT = 0.;
        }
    }
    else if (this.hp <= 0) {
        this.deathT += dt * 2.;
        if (this.deathT > 1.) {
            return false;
        }
    }

    this.turnT += dt;
    if (this.turnT > this.turnLength) {
        this.attacking = false;
        this.doneAttack = false;
        this.x = this.toX;
        this.y = this.toY;
        this.turnNo += 1;
        this.turnT = 0.;
        let dx = this.player.x - this.x;
        let dy = this.player.y - this.y;
        let dist = Math.sqrt(dx*dx+dy*dy);
        if (dist <= this.attackRange) {
            if (this.type === 'ydemon') {
                if (Math.random() < 0.75) {
                    this.attacking = true;
                    this.doneAttack = false;
                }
            }
            else if (this.type === 'rdemon') {
                if (Math.random() < 0.5) {
                    this.attacking = true;
                    this.doneAttack = false;
                }
            }
            else {
                this.attacking = true;
                this.doneAttack = false;
            }
        }
        else {
            if (Math.abs(dx) > Math.abs(dy)) {
                this.toX = this.x + (dx > 0 ? 1 : -1);
                if (this.map.doesCollide(this.toX, this.toY) || this.eset.doesCollide(this.toX, this.toY, this)) {
                    this.toX = this.x;
                }
            }
            
            if (Math.abs(dy) > Math.abs(dx) || (this.toX === this.x)) {
                this.toY = this.y + (dy > 0 ? 1 : -1);
                if (this.map.doesCollide(this.toX, this.toY) || this.eset.doesCollide(this.toX, this.toY, this)) {
                    this.toY = this.y;
                }
            }

            let pdx = this.player.x - this.toX, pdy = this.player.y - this.toY;
            let pdx2 = this.player.toX - this.toX, pdy2 = this.player.toY - this.toY;
            if (Math.sqrt(pdx*pdx+pdy*pdy) < 0.5 || Math.sqrt(pdx2*pdx2+pdy2*pdy2) < 0.5) {
                this.toX = this.x;
                this.toY = this.y;
            }
            else {
                let sdx = this.player.x - this.x, sdy = this.player.y - this.y;
                let len = Math.sqrt(sdx*sdx+sdy*sdy);
                SFX['walk-1'].play(1 / len, 0.9);
            }
        }
    }

    this.x += (this.toX - this.x) * dt * 4 / this.turnLength;
    this.y += (this.toY - this.y) * dt * 4 / this.turnLength;

    if (this.type != 'boss') {
        let sdx = this.player.x - this.x, sdy = this.player.y - this.y;
        let len = Math.sqrt(sdx*sdx+sdy*sdy);
        if (len > 15) {
            return false;
        }
    }

    let float = Math.sin(time*Math.PI*0.5) * 0.05;
    let attackT = this.attacking ? (Math.max(0., Math.pow(Math.sin((this.turnT/this.turnLength)*2*Math.PI)*0.5+0.5, 2.) - .9) / 0.1) : 0.;

    if (this.attacking && !this.doneAttack && (this.turnT/this.turnLength) > 0.1) {
        this.doAttack(this.player);
        this.doneAttack = true;
    }

    let ang = Math.atan2(this.player.y - this.y, this.player.x - this.x);
    let deathT = this.deathT;
    let scale = this.map.scale;
    VSPR[`${this.type}-head`].addSprite((this.x+Math.cos(ang)*0.25*attackT) * scale, (this.y+Math.sin(ang)*0.25*attackT) * scale, (0.9-0.15+0.2+float) * scale, ang, deathT);
    VSPR[`${this.type}-chest`].addSprite((this.x+Math.cos(ang)*0.25*attackT) * scale, (this.y+Math.sin(ang)*0.25*attackT) * scale, (0.5-0.15+0.2+float) * scale, ang, deathT);
    VSPR[`${this.type}-hands${attackT > 0.1 ? '-attack' : ''}`].addSprite((this.x+Math.cos(ang)*0.25*attackT) * scale, (this.y+Math.sin(ang)*0.25*attackT) * scale, (0.65-0.15+0.2+float) * scale, ang, deathT);

    return true;

};


///


window.EnemySet = function(map, enemyProb, enemyMax) {

    this.map = map;
    this.list = [];
    this.enemyProb = enemyProb;
    this.enemyMax = enemyMax;
    this.spawnCheckT = 0.;
    this.enemyCount = {'skull':0, 'gdemon': 0, 'ydemon': 0, 'rdemon': 0, 'boss': 0};

};

EnemySet.prototype.doesCollide = function(x, y, ignore) {
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

EnemySet.prototype.updateRender = function(dt, time) {

    this.spawnCheckT += dt * 2;
    if (this.spawnCheckT >= 1.) {
        for (let type in this.enemyProb) {
            if (this.enemyCount[type] < (this.enemyMax[type]||0)) {
                if (Math.random() < (1/10) && Math.random() < this.enemyProb[type]) {
                    let k = 10;
                    while ((k--) > 0) {
                        let x = Math.floor(Math.random()*16-8 + this.player.x);
                        let y = Math.floor(Math.random()*16-8 + this.player.y);
                        let dx = this.player.x - x, dy = this.player.y - y;
                        let len = Math.sqrt(dx*dx+dy*dy);
                        if (len > 1 && !this.map.doesCollide(x, y) && (x||y) && !this.doesCollide(x, y)) {
                            this.enemyCount[type] += 1;
                            this.list.push(new Enemy(
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

    VSPR['skull-head'].clear();
    VSPR['skull-chest'].clear();
    VSPR['skull-hands'].clear();
    VSPR['skull-hands-attack'].clear();
    VSPR['gdemon-hands'].clear();
    VSPR['gdemon-hands-attack'].clear();
    VSPR['gdemon-head'].clear();
    VSPR['gdemon-chest'].clear();
    VSPR['ydemon-hands'].clear();
    VSPR['ydemon-hands-attack'].clear();
    VSPR['ydemon-head'].clear();
    VSPR['ydemon-chest'].clear();

    for (let i=0; i<this.list.length; i++) {
        const E = this.list[i];
        if (!E.updateRender(dt, time)) {
            this.enemyCount[E.type] -= 1;
            this.list.splice(i, 1);
            i --;
            continue;
        }
    }

};
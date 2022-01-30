window.Player = function(x,y,angle,map,eset) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.toX = x;
    this.toY = y;
    this.toAngle = Math.round(angle / (Math.PI * 0.5));
    this.moving = false;
    this.map = map;
    this.moveT = 0;
    this.sx = x; this.sy = y; this.sa = angle;
    this.IAM = [
        [ 1, 0 ],
        [ 0, 1 ],
        [ -1, 0],
        [ 0, -1]
    ];
    this.inventory = { 'pistol': 5, 'holywater': 2, 'fireball': 1, 'shotgun': 0, 'rifle': 0 };
    this.eset = eset;
    this.hp = 3;
    this.maxHP = 3;
    this.weapon = 'rock';
    this.fireballT = 0.;
    this.healCooldown = 0.;
    this.weaponCooldown = 0.;
    this.weaponCooldownMax = 1.;
    this.dmgDelts = [];
};

Player.prototype.heal = function(amt) {
    if (this.dead) {
        return;
    }
    this.hp += (amt || 2.5);
    this.healCooldown = 3.;
    if (this.hp > this.maxHP) {
        this.hp = this.maxHP;
    }
};

Player.prototype.damage = function(amt) {
    if (this.dead) {
        return;
    }
    this.hp -= (amt || 0);
    if (this.hp < 0) {
        SFX[`demon-die-${Math.floor(1 + Math.random()*4)}`].play(2., 1.5+Math.random()*0.1);
        this.hp = 0;
        this.dead = true;
        this.map.deathAnim = true;
        this.map.deathAnimT = 0.;
    }
};

Player.prototype.moveForward = function() {
    if (!this.moving && !this.map.doesCollide(this.x + this.IAM[this.angle][0], this.y + this.IAM[this.angle][1]) && !this.eset.doesCollide(this.x + this.IAM[this.angle][0], this.y + this.IAM[this.angle][1])) {
        this.toX += this.IAM[this.angle][0];
        this.toY += this.IAM[this.angle][1];
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
        SFX['walk-1'].play(0.2);
    }
};

Player.prototype.moveBackward = function() {
    if (!this.moving && !this.map.doesCollide(this.x - this.IAM[this.angle][0], this.y - this.IAM[this.angle][1]) && !this.eset.doesCollide(this.x - this.IAM[this.angle][0], this.y - this.IAM[this.angle][1])) {
        this.toX -= this.IAM[this.angle][0];
        this.toY -= this.IAM[this.angle][1];
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
        SFX['walk-1'].play(0.2);
    }
};

Player.prototype.turnLeft = function() {
    if (!this.moving) {
        this.toAngle += 1;
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
    }
};

Player.prototype.turnRight = function() {
    if (!this.moving) {
        this.toAngle -= 1;
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
    }
};

Player.prototype.update = function(dt, time) {
    if (this.fireballT > 0.) {
        this.damage(dt * (this.maxHP * 0.5) / 10.);
    }
    this.fireballT -= dt;
    if (this.fireballT < 0.) {
        this.fireballT = 0.;
    }
    this.healCooldown -= dt;
    if (this.healCooldown < 0.) {
        this.healCooldown = 0.;
    }
    this.weaponCooldown -= dt;
    if (this.weaponCooldown < 0.) {
        this.weaponCooldown = 0.;
    }
    if (this.moving) {
        this.moveT += dt * 4.;
        this.x = this.sx + (this.toX-this.sx) * Math.sin(this.moveT*Math.PI*0.5,0.5);
        this.y = this.sy + (this.toY-this.sy) * Math.sin(this.moveT*Math.PI*0.5,0.5);
        this.angle = this.sa + (this.toAngle-this.sa) * Math.sin(this.moveT*Math.PI*0.5,0.5);
        if (this.moveT >= 1.) {
            this.moving = false;
            this.toAngle = this.angle = (this.toAngle+4) % 4;
            this.x = this.toX;
            this.y = this.toY;
            this.moveT = 0.;
        }
    }
    else if (!this.dead) {
        let item = this.map.itemSet.doesCollide(this.x, this.y);
        if (item && item.take()) {
            let cnt = 1;
            switch (item.type) {
                case 'pistol':
                    cnt = 10;
                    break;
                case 'shotgun':
                    cnt = 5;
                    break;
                case 'rifle':
                    cnt = 3;
                    break;
                case 'fireball':
                    cnt = 1;
                    break;
                case 'holywater':
                    cnt = 1;
                default:
                    break;
            }
            this.inventory[item.type] += cnt;
        }
        if (this.targetEnemy && MOUSE_CLICK) {
            let weapon = this.fireballT > 0. ? 'fireball' : this.weapon;
            SFX[weapon].play(0.75);
            if (weapon !== 'fireball') {
                this.inventory[this.weapon] -= 1;
            }
            let nearAcc = 0, farAcc = 0;
            let nearDmg = 0, farDmg = 0;
            let nearRDmg = 0, farRDmg = 0;
            let farT = this.targetEnemyDistT;
            switch (weapon) {
                case 'rock':
                    this.weaponCooldownMax = this.weaponCooldown = 1.5;
                    nearAcc = 0.85; farAcc = 0.5;
                    nearDmg = 1; farDmg = 0;
                    nearRDmg = 1; farRDmg = 2;
                    break;
                case 'pistol':
                    this.weaponCooldownMax = this.weaponCooldown = 1.;
                    nearAcc = 0.95; farAcc = 0.75;
                    nearDmg = 2.5; farDmg = 1.5;
                    nearRDmg = 1; farRDmg = 0;
                    break;
                case 'shotgun':
                    this.weaponCooldownMax = this.weaponCooldown = 2.;
                    nearAcc = 1.; farAcc = 0.75;
                    nearDmg = 8; farDmg = 3;
                    nearRDmg = 3; farRDmg = 0;
                    break;
                case 'rifle':
                    this.weaponCooldownMax = this.weaponCooldown = 1.5;
                    nearAcc = 1.; farAcc = 0.9;
                    nearDmg = 7; farDmg = 7;
                    nearRDmg = 1; farRDmg = 0;
                    break;
                case 'fireball':
                    this.weaponCooldownMax = this.weaponCooldown = 1.;
                    nearAcc = 1.; farAcc = 0.5;
                    nearDmg = 5; farDmg = 5;
                    nearRDmg = 3; farRDmg = 3;
                    break;
                default:
                    break;
            }
            let acc = farT * farAcc + (1 - farT) * nearAcc;
            let baseDmg = farT * farDmg + (1 - farT) * nearDmg;
            let randDmg = (farT * farRDmg + (1 - farT) * nearRDmg) * Math.random();
            let dmg = Math.random() < acc ? Math.ceil(baseDmg + randDmg) : 0;

            let targetEnemy = this.targetEnemy;
            let onFinish = () => {
                this.dmgDelts.push({
                    dmg,
                    x: GAME_MOUSE.x,
                    y: GAME_MOUSE.y,
                    t: Math.sqrt(dmg||8),
                    yt: 0.
                });
                if (dmg) {
                    targetEnemy.damage(dmg);
                }   
            };

            if (weapon === 'rock' || weapon === 'fireball') {
                this.map.proj.fire(weapon === 'rock' ? 'rock' : 'fireball-yellow', this, this.targetEnemy, dmg < 1, onFinish);
            }
            else {
                onFinish();
            }
        }
        if (this.map && this.map.map[this.x] && (this.map.map[this.x][this.y] == 6)) {
            if (this.map.onNextLevel) {
                this.map.onNextLevel();
                this.map.onNextLevel = null;
            }
        }
        if (KEY_DOWN[37] || KEY_DOWN[65]) {
            this.turnLeft();
        }
        else if (KEY_DOWN[39] || KEY_DOWN[68]) {
            this.turnRight();
        }
        else if (KEY_DOWN[38] || KEY_DOWN[87]) {
            this.moveForward();
        }
        else if (KEY_DOWN[40] || KEY_DOWN[83]) {
            this.moveBackward();
        }
    }
};
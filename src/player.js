window.Player = function(x,y,angle,map) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.toX = x;
    this.toY = y;
    this.toAngle = angle;
    this.moving = false;
    this.map = map;
    this.moveT = 0;
    this.sx = x; this.sy = y; this.sa = angle;
};

Player.prototype.moveForward = function() {
    if (!this.moving) {
        this.toX += Math.cos(this.angle) * this.map.scale;
        this.toY += Math.sin(this.angle) * this.map.scale;
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
    }
};

Player.prototype.moveBackward = function() {
    if (!this.moving) {
        this.toX -= Math.cos(this.angle) * this.map.scale;
        this.toY -= Math.sin(this.angle) * this.map.scale;
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
    }
};

Player.prototype.turnLeft = function() {
    if (!this.moving) {
        this.toAngle += Math.PI * 0.5;
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
    }
};

Player.prototype.turnRight = function() {
    if (!this.moving) {
        this.toAngle -= Math.PI * 0.5;
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
    }
};

Player.prototype.update = function(dt, time) {
    if (this.moving) {
        this.x = this.sx + (this.toX-this.sx) * Math.pow(this.moveT,0.5);
        this.y = this.sy + (this.toY-this.sy) * Math.pow(this.moveT,0.5);
        this.angle = this.sa + (this.toAngle-this.sa) * Math.pow(this.moveT,0.5);
        this.moveT += dt * 3.;
        if (this.moveT >= 1.) {
            this.moving = false;
            this.angle = this.toAngle;
            this.x = this.toX;
            this.y = this.toY;
            this.moveT = 0.;
        }
    }
    else {
        if (KEY_PRESSED[37]) {
            this.turnLeft();
        }
        else if (KEY_PRESSED[39]) {
            this.turnRight();
        }
        else if (KEY_PRESSED[38]) {
            this.moveForward();
        }
        else if (KEY_PRESSED[40]) {
            this.moveBackward();
        }
    }
};
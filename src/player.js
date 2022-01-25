window.Player = function(x,y,angle,map) {
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
};

Player.prototype.moveForward = function() {
    if (!this.moving && !this.map.doesCollide(this.x + this.IAM[this.angle][0], this.y + this.IAM[this.angle][1])) {
        this.toX += this.IAM[this.angle][0];
        this.toY += this.IAM[this.angle][1];
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
    }
};

Player.prototype.moveBackward = function() {
    if (!this.moving && !this.map.doesCollide(this.x - this.IAM[this.angle][0], this.y - this.IAM[this.angle][1])) {
        this.toX -= this.IAM[this.angle][0];
        this.toY -= this.IAM[this.angle][1];
        this.moving = true;
        this.moveT = 0;
        this.sx = this.x; this.sy = this.y; this.sa = this.angle;
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
    else {
        if (KEY_DOWN[37]) {
            this.turnLeft();
        }
        else if (KEY_DOWN[39]) {
            this.turnRight();
        }
        else if (KEY_DOWN[38]) {
            this.moveForward();
        }
        else if (KEY_DOWN[40]) {
            this.moveBackward();
        }
    }
};
window.GameRender = function(canvasId) {

    this.canvasID = canvasId;
    this.canvas = document.getElementById(this.canvasID);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
    this.renderer.setSize( this.width, this.height );
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(1 / - 2, 1 / 2, 1 / 2, 1 / - 2, 1, 1000);
    
    try {

        const testCanvas = document.createElement('canvas');
        if (!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')))) {
            throw "WebGL not found";
        }

    } catch ( e ) {

        this.webGLError = true;
        const c2d = this.canvas.getContext('2d');
        c2d.clearRect(0, 0, this.width, this.height);
        c2d.fillStyle = '#FF1111';
        c2d.textAlign = 'center';
        c2d.font = '20px Arial';
        c2d.fillText('WebGL Not Supported, Try Enabling WebGL Rendering in browser\'s settings.', this.width*0.5, this.height*0.5);
    
    }    

};

GameRender.prototype.render = function(dt, time) {

    if (this.width !== window.innerWidth || this.height !== window.innerHeight) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.renderer.setSize( this.width, this.height );
    }

    if (this.webGLError) {
        return;
    }

    this.renderer.render(this.scene, this.camera);

};
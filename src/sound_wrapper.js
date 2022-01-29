window.SoundEffect = function(key) {
    this.base = sounds[key];
};

SoundEffect.prototype.play = function(volume, rate) {
    this.base.volume = volume || 1.;
    this.base.playbackRate = rate || 1.
    this.base.loop = false;
    this.base.play();
};

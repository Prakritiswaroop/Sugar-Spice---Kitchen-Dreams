// Cute Synthesized Sound Effects using Web Audio API
class AudioSynthesizer {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API not supported", e);
            this.enabled = false;
            this.ctx = null;
        }
    }

    playClick() {
        if (!this.enabled) return;
        this.init();
        if (!this.enabled || !this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.05);
        } catch (e) {
            console.warn("Click SFX failed", e);
        }
    }

    playWhisk() {
        if (!this.enabled) return;
        this.init();
        if (!this.enabled || !this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {
            console.warn("Whisk SFX failed", e);
        }
    }

    playDing() {
        if (!this.enabled) return;
        this.init();
        if (!this.enabled || !this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(987.77, t); // B5 (happy, bright)
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1975.53, t); // B6 octaves

            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(t + 0.6);
            osc2.stop(t + 0.6);
        } catch (e) {
            console.warn("Ding SFX failed", e);
        }
    }

    playSuccess() {
        if (!this.enabled) return;
        this.init();
        if (!this.enabled || !this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major arpeggio)
            
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t + idx * 0.08);
                
                gain.gain.setValueAtTime(0.08, t + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.start(t + idx * 0.08);
                osc.stop(t + idx * 0.08 + 0.25);
            });
        } catch (e) {
            console.warn("Success SFX failed", e);
        }
    }

    playFailure() {
        if (!this.enabled) return;
        this.init();
        if (!this.enabled || !this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.linearRampToValueAtTime(110, t + 0.4);

            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0.001, t + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(t + 0.4);
        } catch (e) {
            console.warn("Failure SFX failed", e);
        }
    }

    playBurnAlert() {
        if (!this.enabled) return;
        this.init();
        if (!this.enabled || !this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.linearRampToValueAtTime(300, t + 0.15);

            gain.gain.setValueAtTime(0.08, t);
            gain.gain.linearRampToValueAtTime(0.001, t + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(t + 0.15);
        } catch (e) {
            console.warn("BurnAlert SFX failed", e);
        }
    }

    playLevelUp() {
        if (!this.enabled) return;
        this.init();
        if (!this.enabled || !this.ctx) return;

        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            const notes = [587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]; // D5 to C6 cute scale
            
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t + idx * 0.05);
                
                gain.gain.setValueAtTime(0.05, t + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.2);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.start(t + idx * 0.05);
                osc.stop(t + idx * 0.05 + 0.2);
            });
        } catch (e) {
            console.warn("LevelUp SFX failed", e);
        }
    }
}

export const sfx = new AudioSynthesizer();

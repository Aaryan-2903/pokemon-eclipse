import { Scene } from 'phaser';

type MusicMood = 'battle' | 'route' | 'city' | 'menu';
type SfxKey = 'menuMove' | 'menuConfirm' | 'hit' | 'critical' | 'miss' | 'catchThrow' | 'catchSuccess' | 'heal' | 'transition' | 'evolve';

type OscillatorTypeName = OscillatorType;

const MUSIC_PATTERNS: Record<MusicMood, number[]> = {
    battle: [220, 277, 330, 277, 247, 294],
    route: [196, 247, 294, 330, 294, 247],
    city: [262, 330, 392, 330, 294, 349],
    menu: [330, 392, 440, 392]
};

class ProceduralAudio {
    private static context: AudioContext | null = null;
    private static musicTimer: number | null = null;
    private static currentMood: MusicMood | null = null;
    private static step = 0;

    private static getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;

        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return null;

        if (!this.context) {
            this.context = new AudioContextClass();
        }

        if (this.context.state === 'suspended') {
            void this.context.resume();
        }

        return this.context;
    }

    public static playSfx(key: SfxKey) {
        const ctx = this.getContext();
        if (!ctx) return;

        const configs: Record<SfxKey, { notes: number[], duration: number, volume: number, type: OscillatorTypeName }> = {
            menuMove: { notes: [660], duration: 0.04, volume: 0.035, type: 'square' },
            menuConfirm: { notes: [523, 784], duration: 0.06, volume: 0.045, type: 'triangle' },
            hit: { notes: [130, 95], duration: 0.08, volume: 0.08, type: 'sawtooth' },
            critical: { notes: [784, 988, 1319], duration: 0.07, volume: 0.08, type: 'square' },
            miss: { notes: [220, 165], duration: 0.07, volume: 0.045, type: 'triangle' },
            catchThrow: { notes: [330, 262, 220], duration: 0.07, volume: 0.055, type: 'triangle' },
            catchSuccess: { notes: [523, 659, 784, 1047], duration: 0.08, volume: 0.07, type: 'triangle' },
            heal: { notes: [392, 523, 659, 784], duration: 0.11, volume: 0.06, type: 'sine' },
            transition: { notes: [196, 247], duration: 0.08, volume: 0.04, type: 'sine' },
            evolve: { notes: [330, 392, 494, 659, 784], duration: 0.11, volume: 0.055, type: 'triangle' }
        };

        const config = configs[key];
        config.notes.forEach((frequency, index) => {
            this.playTone(ctx, frequency, config.duration, config.volume, config.type, index * config.duration * 0.85);
        });
    }

    public static startMusic(mood: MusicMood) {
        const ctx = this.getContext();
        if (!ctx || this.currentMood === mood) return;

        this.stopMusic();
        this.currentMood = mood;
        this.step = 0;

        const playStep = () => {
            if (!this.currentMood) return;
            const pattern = MUSIC_PATTERNS[this.currentMood];
            const frequency = pattern[this.step % pattern.length];
            const harmony = frequency * (this.currentMood === 'battle' ? 0.5 : 1.5);
            const volume = this.currentMood === 'battle' ? 0.025 : 0.018;

            this.playTone(ctx, frequency, 0.16, volume, this.currentMood === 'battle' ? 'square' : 'triangle');
            this.playTone(ctx, harmony, 0.2, volume * 0.6, 'sine');
            this.step++;
        };

        playStep();
        this.musicTimer = window.setInterval(playStep, mood === 'battle' ? 210 : 360);
    }

    public static stopMusic() {
        if (this.musicTimer !== null && typeof window !== 'undefined') {
            window.clearInterval(this.musicTimer);
        }
        this.musicTimer = null;
        this.currentMood = null;
    }

    private static playTone(ctx: AudioContext, frequency: number, duration: number, volume: number, type: OscillatorTypeName, delay = 0) {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + delay;
        const end = start + duration;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(end + 0.02);
    }
}

export class GameFeel {
    private static scenesInTransition = new WeakSet<Scene>();

    public static playSfx(key: SfxKey) {
        ProceduralAudio.playSfx(key);
    }

    public static startMusic(scene: Scene, mood: MusicMood) {
        ProceduralAudio.startMusic(mood);
        scene.events.once('shutdown', () => ProceduralAudio.stopMusic());
    }

    public static startMusicForSceneKey(sceneKey: string) {
        if (sceneKey === 'BattleScene') {
            ProceduralAudio.startMusic('battle');
        } else if (sceneKey.includes('City') || sceneKey === 'OverworldScene' || sceneKey === 'InteriorScene') {
            ProceduralAudio.startMusic('city');
        } else {
            ProceduralAudio.startMusic('route');
        }
    }

    public static stopMusic() {
        ProceduralAudio.stopMusic();
    }

    public static fadeToScene(scene: Scene, sceneKey: string, data: Record<string, unknown> = {}, color: [number, number, number] = [0, 0, 0], duration = 350) {
        if (this.scenesInTransition.has(scene)) {
            console.warn(`[Transition] Ignored duplicate transition from ${scene.scene.key} to ${sceneKey}.`);
            return;
        }

        this.scenesInTransition.add(scene);
        console.log(`[Transition] Start: ${scene.scene.key} -> ${sceneKey}`, { ...data, duration });
        this.playSfx('transition');
        scene.cameras.main.fadeOut(duration, color[0], color[1], color[2]);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
            console.log(`[Transition] Complete: ${scene.scene.key} -> ${sceneKey}`);
            this.scenesInTransition.delete(scene);
            scene.scene.start(sceneKey, data);
        });
    }

    public static animateAttack(scene: Scene, attacker: Phaser.GameObjects.Image, target: Phaser.GameObjects.Image, onHit: () => void) {
        const startX = attacker.x;
        const startY = attacker.y;
        const directionX = Math.sign(target.x - attacker.x) || 1;
        const directionY = Math.sign(target.y - attacker.y) || -1;

        scene.tweens.add({
            targets: attacker,
            x: startX + directionX * 34,
            y: startY + directionY * 14,
            scaleX: attacker.scaleX * 1.08,
            scaleY: attacker.scaleY * 1.08,
            duration: 120,
            yoyo: true,
            ease: 'Sine.easeOut',
            onYoyo: onHit,
            onComplete: () => {
                attacker.setPosition(startX, startY);
            }
        });
    }

    public static hitReaction(scene: Scene, target: Phaser.GameObjects.Image, critical = false) {
        this.playSfx(critical ? 'critical' : 'hit');
        scene.cameras.main.shake(critical ? 180 : 110, critical ? 0.014 : 0.007);
        scene.tweens.add({
            targets: target,
            x: target.x + (critical ? 16 : 10),
            alpha: 0.45,
            duration: 55,
            yoyo: true,
            repeat: critical ? 3 : 2,
            ease: 'Stepped'
        });
    }

    public static faint(scene: Scene, target: Phaser.GameObjects.Image, onComplete?: () => void) {
        scene.tweens.add({
            targets: target,
            y: target.y + 46,
            alpha: 0,
            angle: target.x > scene.cameras.main.centerX ? 10 : -10,
            duration: 520,
            ease: 'Back.easeIn',
            onComplete
        });
    }

    public static damageNumber(scene: Scene, x: number, y: number, text: string, color = '#ffffff') {
        const label = scene.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: '22px',
            color,
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(500);

        scene.tweens.add({
            targets: label,
            y: y - 48,
            alpha: 0,
            scale: 1.25,
            duration: 760,
            ease: 'Power2',
            onComplete: () => label.destroy()
        });
    }

    public static effectBurst(scene: Scene, x: number, y: number, color: number, label?: string) {
        const ring = scene.add.circle(x, y, 12, color, 0.2).setStrokeStyle(3, color, 0.9).setDepth(450);
        scene.tweens.add({
            targets: ring,
            radius: 54,
            alpha: 0,
            duration: 460,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        if (label) {
            this.damageNumber(scene, x, y - 42, label, `#${color.toString(16).padStart(6, '0')}`);
        }
    }

    public static miss(scene: Scene, x: number, y: number) {
        this.playSfx('miss');
        this.damageNumber(scene, x, y, 'MISS', '#cbd5e1');
    }

    public static grassRustle(scene: Scene, x: number, y: number) {
        const blades = scene.add.container(x, y).setDepth(9);
        for (let i = 0; i < 5; i++) {
            const blade = scene.add.rectangle((i - 2) * 7, 0, 4, 18, 0x86efac, 0.9).setAngle((i - 2) * 10);
            blades.add(blade);
        }
        scene.tweens.add({
            targets: blades,
            angle: { from: -8, to: 8 },
            alpha: 0,
            duration: 320,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: () => blades.destroy()
        });
    }
}

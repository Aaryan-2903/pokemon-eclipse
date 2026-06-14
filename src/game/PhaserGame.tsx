import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from './main';
import { EventBus } from './EventBus';
import { Game, Scene } from 'phaser';

export interface IRefPhaserGame {
    game: Game | null;
    scene: Scene | null;
}

export const PhaserGame = forwardRef<IRefPhaserGame, any>(function PhaserGame(props, ref) {
    const game = useRef<Game | null>(null);

    useLayoutEffect(() => {
        if (game.current === null) {
            console.log('Mounting Phaser canvas to DOM...');
            game.current = StartGame("game-container");
            
            if (!game.current) return;

            if (typeof ref === 'function') {
                ref({ game: game.current, scene: null });
            } else if (ref) {
                ref.current = { game: game.current, scene: null };
            }
        }

        return () => {
            if (game.current) {
                console.log('Destroying Phaser game instance...');
                game.current.destroy(true);
                game.current = null;
            }
        }
    }, [ref]);

    useEffect(() => {
        const handleSceneReady = (currentScene: Scene) => {
            if (typeof ref === 'function') {
                ref({ game: game.current, scene: currentScene });
            } else if (ref) {
                ref.current = { game: game.current, scene: currentScene };
            }
        };

        EventBus.on('current-scene-ready', handleSceneReady);

        return () => {
            EventBus.removeListener('current-scene-ready', handleSceneReady);
        }
    }, [ref]);

    return <div id="game-container"></div>;
});
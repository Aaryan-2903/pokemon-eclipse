import React, { useRef } from 'react';
import { PhaserGame, IRefPhaserGame } from '../game/PhaserGame';

const AdventurePage: React.FC = () => {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 w-full overflow-hidden pt-16">
            <h1 className="text-4xl text-white font-bold mb-6 tracking-widest uppercase">Adventure Mode</h1>
            <div className="border-4 border-gray-700 rounded-lg shadow-xl shadow-blue-900/20 overflow-hidden bg-black flex justify-center items-center">
                {/* Phaser canvas mounts here */}
                <PhaserGame ref={phaserRef} />
            </div>
            <p className="text-gray-400 mt-6 tracking-wide">Use W, A, S, D to explore the Eclipse Region.</p>
        </div>
    );
};

export default AdventurePage;

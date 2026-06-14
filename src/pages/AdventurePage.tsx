import React, { useRef, useState, useEffect } from 'react';
import { PhaserGame, IRefPhaserGame } from '../game/PhaserGame';

const AdventurePage: React.FC = () => {
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = async () => {
        const elem = wrapperRef.current as any;
        if (!document.fullscreenElement) {
            if (elem?.requestFullscreen) await elem.requestFullscreen();
            else if (elem?.webkitRequestFullscreen) await elem.webkitRequestFullscreen(); // Safari
        } else {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen(); // Safari
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-night w-full overflow-hidden pt-8 pb-8">
            <div className="w-full flex justify-between items-center max-w-[95vw] md:max-w-[90vw] mb-4">
                <h1 className="text-2xl md:text-4xl text-white font-bold tracking-widest uppercase">Adventure Mode</h1>
                <p className="text-slate-400 hidden md:block tracking-wide">Use W, A, S, D to move • E to interact</p>
            </div>
            
            <div 
                ref={wrapperRef}
                className={`relative w-full max-w-[95vw] md:max-w-[90vw] aspect-[4/3] max-h-[80vh] overflow-hidden bg-black flex justify-center items-center transition-all ${isFullscreen ? 'border-0 rounded-none' : 'border-4 border-white/10 rounded-lg shadow-glow'}`}
            >
                <button onClick={toggleFullscreen} className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-lg border border-white/20 backdrop-blur transition-colors" title="Toggle Fullscreen">
                    {isFullscreen ? (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /></svg>) : (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>)}
                </button>
                
                {/* Phaser canvas mounts here */}
                <PhaserGame ref={phaserRef} />
            </div>
        </div>
    );
};

export default AdventurePage;

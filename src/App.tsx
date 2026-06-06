import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { gsap } from 'gsap';
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Pokedex from './pages/Pokedex.tsx';
import TeamBuilder from './pages/TeamBuilder.tsx';
import About from './pages/About.tsx';

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState<Location>(location);
  const routeRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);
  const displayLocationRef = useRef<Location>(location);
  const transitionTimeline = useRef<gsap.core.Timeline | null>(null);
  const queuedLocation = useRef<Location | null>(null);

  useLayoutEffect(() => {
    const routeElement = routeRef.current;
    const scrimElement = scrimRef.current;
    if (!routeElement) return;

    gsap.set(routeElement, { opacity: 1, x: 0, y: 0, filter: 'none', clearProps: 'transform' });
    gsap.set(scrimElement, { autoAlpha: 0, opacity: 0 });
  }, []);

  useEffect(() => {
    displayLocationRef.current = displayLocation;
  }, [displayLocation]);

  useEffect(() => {
    if (
      location.pathname === displayLocationRef.current.pathname &&
      location.search === displayLocationRef.current.search
    ) {
      return;
    }

    const routeElement = routeRef.current;
    const scrimElement = scrimRef.current;

    if (!routeElement || !scrimElement) {
      setDisplayLocation(location);
      return;
    }

    queuedLocation.current = location;
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const exitDistance = isMobile ? -10 : -18;

    transitionTimeline.current?.kill();
    gsap.killTweensOf([routeElement, scrimElement]);
    gsap.set(routeElement, { opacity: 1, filter: 'none' });
    gsap.set(scrimElement, { autoAlpha: 0, opacity: 0 });

    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.set(routeElement, { opacity: 1, x: 0, y: 0, filter: 'none', clearProps: 'transform,filter,opacity' });
        gsap.set(scrimElement, { autoAlpha: 0, opacity: 0, clearProps: 'opacity,visibility' });
        transitionTimeline.current = null;
      },
    });
    transitionTimeline.current = timeline;

    timeline
      .set(scrimElement, { autoAlpha: 1 })
      .to(scrimElement, { opacity: 0.16, duration: 0.08, ease: 'power2.out' }, 0)
      .to(
        routeElement,
        {
          x: exitDistance,
          y: isMobile ? 2 : 4,
          opacity: 0.65,
          filter: 'blur(3px)',
          duration: 0.1,
          ease: 'power2.out',
        },
        0
      )
      .add(() => {
        if (queuedLocation.current) {
          setDisplayLocation(queuedLocation.current);
          queuedLocation.current = null;
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 0.1)
      .to(scrimElement, { opacity: 0, duration: 0.14, ease: 'power2.out' }, 0.1);

    return () => {
      timeline.kill();
      transitionTimeline.current = null;
      gsap.set(routeElement, { opacity: 1, x: 0, y: 0, filter: 'none', clearProps: 'transform,filter,opacity' });
      gsap.set(scrimElement, { autoAlpha: 0, opacity: 0, clearProps: 'opacity,visibility' });
    };
  }, [location]);

  useLayoutEffect(() => {
    const routeElement = routeRef.current;
    if (!routeElement) return;

    if (!hasMountedRef.current) {
      gsap.set(routeElement, { opacity: 1, x: 0, y: 0, filter: 'none', clearProps: 'transform' });
      hasMountedRef.current = true;
      return;
    }

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const enterDistance = isMobile ? 10 : 18;

    gsap.fromTo(
      routeElement,
      {
        x: enterDistance,
        y: isMobile ? 2 : 4,
        opacity: 0.9,
        filter: 'blur(3px)',
      },
      {
        x: 0,
        y: 0,
        opacity: 1,
        filter: 'none',
        duration: 0.18,
        ease: 'power2.out',
        clearProps: 'transform,filter,opacity',
      }
    );
  }, [displayLocation]);

  return (
    <>
      <div ref={routeRef} className="min-h-screen w-full max-w-full overflow-x-hidden will-change-transform">
        <Routes location={displayLocation}>
          <Route path="/" element={<Home />} />
          <Route path="/pokedex" element={<Pokedex />} />
          <Route path="/team-builder" element={<TeamBuilder />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
      <div
        ref={scrimRef}
        className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_center,_rgba(243,36,36,0.18),transparent_30%),rgba(0,0,0,0.82)] opacity-0"
        aria-hidden="true"
      />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-night text-white">
      <Navbar />
      <main className="w-full max-w-full overflow-x-hidden">
        <AnimatedRoutes />
      </main>
    </div>
  );
}

export default App;

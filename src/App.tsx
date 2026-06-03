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

    gsap.set(routeElement, { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' });
    gsap.set(scrimElement, { autoAlpha: 0 });
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
    const exitDistance = isMobile ? -18 : -34;

    transitionTimeline.current?.kill();
    gsap.killTweensOf([routeElement, scrimElement]);
    gsap.set(scrimElement, { autoAlpha: 0, opacity: 0 });

    const timeline = gsap.timeline({
      onComplete: () => {
        gsap.set(scrimElement, { autoAlpha: 0 });
        transitionTimeline.current = null;
      },
    });
    transitionTimeline.current = timeline;

    timeline
      .set(scrimElement, { autoAlpha: 1 })
      .to(scrimElement, { opacity: 0.38, duration: 0.18, ease: 'power2.out' }, 0)
      .to(
        routeElement,
        {
          x: exitDistance,
          y: isMobile ? 6 : 10,
          opacity: 0,
          filter: 'blur(8px)',
          duration: 0.26,
          ease: 'power3.inOut',
        },
        0
      )
      .add(() => {
        if (queuedLocation.current) {
          setDisplayLocation(queuedLocation.current);
          queuedLocation.current = null;
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 0.26)
      .to(scrimElement, { opacity: 0, duration: 0.34, ease: 'power2.out' }, 0.26);

    return () => {
      timeline.kill();
      transitionTimeline.current = null;
      gsap.set(scrimElement, { autoAlpha: 0 });
    };
  }, [location]);

  useLayoutEffect(() => {
    const routeElement = routeRef.current;
    if (!routeElement) return;

    if (!hasMountedRef.current) {
      gsap.set(routeElement, { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' });
      hasMountedRef.current = true;
      return;
    }

    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    const enterDistance = isMobile ? 20 : 38;

    gsap.fromTo(
      routeElement,
      {
        x: enterDistance,
        y: isMobile ? 6 : 10,
        opacity: 0,
        filter: 'blur(8px)',
      },
      {
        x: 0,
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.34,
        ease: 'expo.out',
        clearProps: 'transform,filter,opacity',
      }
    );
  }, [displayLocation]);

  return (
    <>
      <div ref={routeRef} className="min-h-screen will-change-transform">
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
    <div className="min-h-screen bg-night text-white">
      <Navbar />
      <main className="overflow-x-hidden">
        <AnimatedRoutes />
      </main>
    </div>
  );
}

export default App;

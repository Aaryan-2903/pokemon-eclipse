function About() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-glow sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] xl:gap-16">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.24em] text-poke">About this demo</p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">A playful, polished Pokémon landing experience.</h1>
            <p className="max-w-2xl text-slate-300">
              This site uses React, Vite, Tailwind, and Three.js to bring a responsive dark theme to life. The Poké Ball hero uses React Three Fiber and Drei for a smooth 3D presentation.
            </p>
          </div>
          <div className="space-y-5 rounded-[2rem] border border-white/10 bg-night/90 p-6">
            {[
              {
                heading: 'React + Vite',
                body: 'Fast frontend tooling with modern React routing and component-driven layout.',
              },
              {
                heading: 'Three.js & Drei',
                body: '3D canvas rendering with reusable helpers and lighting for a polished theme.',
              },
              {
                heading: 'GSAP Animations',
                body: 'Smoother fade-in and entrance motion across the hero and page sections.',
              },
            ].map((item) => (
              <div key={item.heading}>
                <h2 className="text-xl font-semibold text-white">{item.heading}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;

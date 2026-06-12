const techStack = [
  'React',
  'TypeScript',
  'TailwindCSS',
  'GSAP',
  'React Three Fiber',
  'PokéAPI',
  'Phaser.js',
  'Firebase (Coming Soon)',
];

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/Aaryan-2903',
    label: 'View projects',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a10 10 0 0 0-3.16 19.48c.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1.01.07 1.54 1.02 1.54 1.02.9 1.54 2.37 1.1 2.95.84.09-.65.35-1.1.64-1.35-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.9-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/aryan-mandal-94b66b278',
    label: 'Connect professionally',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4.98 3.5A2.5 2.5 0 0 0 2.5 6v12a2.5 2.5 0 0 0 2.48 2.5h14.05A2.5 2.5 0 0 0 21.5 18V6a2.5 2.5 0 0 0-2.47-2.5H4.98Z" />
        <path d="M7.5 9.5v9M7.5 8.5h.02M10.5 18.5v-5.5a1.75 1.75 0 0 1 3.5 0v5.5M10.5 9.5h3.5" />
      </svg>
    ),
  },
  {
    name: 'X',
    href: 'https://x.com/aryanmandal2907',
    label: 'Follow updates',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M23 2.5 14.5 10l8.5 7.5-5.5.5L10 11.5l-5.5 6.5L1 16.5 6.5 11 1 5.5l3.5-.5L9.5 10l5.5-7.5L23 2.5Z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/7.aary4n',
    label: 'Explore visuals',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <path d="M16.5 7.5h.01M12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
      </svg>
    ),
  },
  {
    name: 'Email',
    href: 'mailto:alonexcyrax@gmail.com',
    label: 'Send a message',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3.5 6.5h17a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z" />
        <path d="m4.5 6.5 7.5 6 7.5-6" />
      </svg>
    ),
  },
];

function About() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <div
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_0_80px_rgba(243,36,36,0.12)] backdrop-blur-xl sm:p-8"
      >
        {/* subtle glow */}
        <div className="absolute -left-16 -top-24 subtle-eclipse-glow" aria-hidden />
        <div className="space-y-10 relative z-10">
          <div className="animate-item rounded-[2rem] border border-white/10 bg-night/95 p-6 shadow-[0_0_48px_rgba(243,36,36,0.1)]">
            <p className="text-sm uppercase tracking-[0.24em] text-poke">Pokemon Eclipse Hero Section</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Pokemon Eclipse</h1>
            <p className="mt-4 max-w-3xl text-slate-300 sm:text-lg">
              A flagship browser-based Pokémon experience built with React, TypeScript, TailwindCSS, GSAP, React Three Fiber,
              and PokéAPI.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.24em] text-poke">Flagship project</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">Pokemon Eclipse</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Built with React, TypeScript, TailwindCSS, GSAP, React Three Fiber, and PokéAPI.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(243,36,36,0.12)] backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.24em] text-poke">Vision</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">Future playbook</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Expanding Pokemon Eclipse into a complete browser-based adventure experience while learning modern
                  software development.
                </p>
              </div>
            </div>
          </div>

          <div className="animate-item rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_0_48px_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-poke">About Pokemon Eclipse</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Project overview</h2>
            <p className="mt-5 max-w-3xl text-slate-300 leading-7">
              Pokemon Eclipse is my flagship project, built using React, TypeScript, TailwindCSS, GSAP, React Three Fiber,
              and PokéAPI. My goal is to continue expanding it into a complete browser-based Pokémon adventure experience while
              learning modern software development.
            </p>
          </div>

          <div className="animate-item rounded-[2rem] border border-white/10 bg-night/95 p-6 shadow-[0_0_48px_rgba(243,36,36,0.12)]">
            <p className="text-sm uppercase tracking-[0.24em] text-poke">Features</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Key experiences</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur-xl">
                <h3 className="text-xl font-semibold text-white">Interactive 3D Design</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  A polished dark/red aesthetic with smooth motion and engaging visuals.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur-xl">
                <h3 className="text-xl font-semibold text-white">Responsive Gameplay</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Browser-first features like a Pokédex and team builder designed for desktop and mobile experiences.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur-xl">
                <h3 className="text-xl font-semibold text-white">Modern Web Tech</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Built with React, TypeScript, TailwindCSS, GSAP, and React Three Fiber for speed and polish.
                </p>
              </div>
            </div>
          </div>

          <div className="animate-item rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_0_48px_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-poke">Roadmap</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">What&apos;s coming next</h2>
            <div className="mt-6 space-y-4 text-slate-300">
              <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <span className="font-semibold">Completed</span>
                <span className="text-green-300">Pokédex, Team Builder</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <span className="font-semibold">In Progress</span>
                <span className="text-yellow-300">Adventure Mode</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <span className="font-semibold">Planned</span>
                <span className="text-slate-300">Cloud Saves, Multiplayer</span>
              </div>
            </div>
          </div>

          <div className="animate-item rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-[0_0_48px_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.24em] text-poke">Tech Stack</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Built with modern tools</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center rounded-3xl border border-white/10 bg-night/95 px-4 py-3 text-sm text-slate-100 shadow-[0_0_24px_rgba(255,255,255,0.04)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-item rounded-[2rem] border border-white/10 bg-night/95 p-6 shadow-[0_0_48px_rgba(243,36,36,0.12)]">
            <p className="text-sm uppercase tracking-[0.24em] text-poke">Developer Profile</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Aaryan Mandal</h2>
            <p className="mt-4 max-w-3xl text-slate-300 leading-7">
              Engineering student and aspiring full-stack developer passionate about web development, gaming,
              interactive experiences, and Pokémon-inspired projects.
            </p>
            <div className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-poke">Profile card</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">Aaryan Mandal</h3>
                  </div>
                  <span className="inline-flex rounded-full bg-poke/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-poke">
                    Full-stack
                  </span>
                </div>

                <div className="mt-8 space-y-4 text-slate-300">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Location</p>
                    <p className="mt-2 text-sm text-white">India</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Focus</p>
                    <p className="mt-2 text-sm text-white">Web experiences, animation, and gameplay systems</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Quote</p>
                    <p className="mt-2 text-sm text-white">"Build playful, polished experiences with modern tools."</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_0_40px_rgba(255,255,255,0.04)] backdrop-blur-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm uppercase tracking-[0.24em] text-poke">Connect With Me</p>
                    <h3 className="text-2xl font-semibold text-white">Modern social cards</h3>
                    <p className="text-sm text-slate-400">Open links in a new tab with subtle hover glow.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-poke/40 hover:bg-white/10 hover:shadow-[0_0_32px_rgba(243,36,36,0.14)] active:scale-[0.98]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-poke/10 text-poke transition duration-300 group-hover:bg-poke/15">
                            {social.icon}
                          </span>
                          <span className="text-xs uppercase tracking-[0.24em] text-slate-400">{social.name}</span>
                        </div>
                        <div className="mt-5">
                          <p className="text-lg font-semibold text-white">{social.name}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">{social.label}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;

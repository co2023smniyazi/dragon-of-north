import {motion} from 'framer-motion';

const SESSION_NODES = [
    {id: 'n1', x: 18, y: 26, size: 16, delay: 0},
    {id: 'n2', x: 46, y: 18, size: 20, delay: 0.4},
    {id: 'n3', x: 72, y: 28, size: 14, delay: 0.8},
    {id: 'n4', x: 82, y: 56, size: 18, delay: 1.1},
    {id: 'n5', x: 56, y: 72, size: 22, delay: 0.7},
    {id: 'n6', x: 30, y: 66, size: 14, delay: 1.3},
    {id: 'n7', x: 14, y: 50, size: 10, delay: 1.6},
];

const CONNECTIONS = [
    ['n1', 'n2'],
    ['n2', 'n3'],
    ['n3', 'n4'],
    ['n4', 'n5'],
    ['n5', 'n6'],
    ['n6', 'n7'],
    ['n7', 'n1'],
    ['n2', 'n5'],
    ['n3', 'n6'],
];

const nodeMap = Object.fromEntries(SESSION_NODES.map((node) => [node.id, node]));

const HeroSection = () => {
    return (
        <section className="hero relative isolate overflow-hidden px-6 pb-20 pt-28 sm:px-10 lg:px-16 lg:pb-28 lg:pt-36">
            <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse 900px 600px at 60% 20%, rgba(107, 87, 255, 0.055) 0%, transparent 65%)'
                }}
            />


            <div className="pointer-events-none absolute right-6 top-24 hidden md:block">
                <svg viewBox="0 0 220 220" className="h-48 w-48 opacity-90" aria-hidden>
                    <defs>
                        <radialGradient id="starCore" cx="50%" cy="50%" r="55%">
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="55%" stopColor="#f97316" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.25" />
                        </radialGradient>
                        <linearGradient id="dragonStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                    </defs>
                    <polygon
                        points="110,16 132,72 192,72 144,108 162,168 110,132 58,168 76,108 28,72 88,72"
                        fill="url(#starCore)"
                        opacity="0.9"
                    />
                    <path
                        d="M58 118c16-20 36-26 54-24 17 2 30 11 45 9m-54 1c14 4 21 13 28 22m-27-22c-6 8-10 18-11 30m25-54c11-2 22 4 28 14"
                        fill="none"
                        stroke="url(#dragonStroke)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    <circle cx="155" cy="101" r="3" fill="#fef08a" />
                </svg>
            </div>



            <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
                viewBox="0 0 1200 600"
                preserveAspectRatio="none"
            >
                <path
                    d="M1020 490c-55-58-118-83-188-75-72 9-128 49-196 44-68-5-112-57-184-84-69-26-143-20-208 18-63 37-124 100-236 97"
                    stroke="url(#dragonGlow)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="dragonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                        <stop offset="40%" stopColor="#22d3ee" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
                <motion.div
                    initial={{opacity: 0, y: 24}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.7, ease: 'easeOut'}}
                    className="space-y-8"
                >
                    <div className="hero-eyebrow">
                        Session Security Platform
                    </div>

                    <h1>
                        Control Every Session. See Every Device. Trust Nothing.
                    </h1>

                    <p className="hero-subtitle">
                        Dragon of North is a session-aware authentication system that allows developers to monitor devices,
                        revoke sessions, and maintain complete control over account security.
                    </p>

                    <div className="hero-actions">
                        <motion.a
                            href="#session-game"
                            whileHover={{y: -2}}
                            whileTap={{scale: 0.98}}
                            className="btn-hero"
                        >
                            Get Started
                        </motion.a>
                        <motion.a
                            href="https://dragon-api.duckdns.org/swagger-ui/index.html#/"
                            target="_blank"
                            rel="noreferrer"
                            whileHover={{y: -2}}
                            whileTap={{scale: 0.98}}
                            className="btn-hero-ghost"
                        >
                            API Documentation
                        </motion.a>
                    </div>
                </motion.div>

                <motion.div
                    initial={{opacity: 0, y: 24}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.8, delay: 0.15, ease: 'easeOut'}}
                    className="relative mx-auto w-full max-w-xl"
                >
                    <div className="card relative overflow-hidden p-6">
                        <div className="relative aspect-[4/3] w-full rounded-2xl p-4" style={{
                            background: 'var(--don-bg-surface)',
                            border: '1px solid var(--don-border-default)'
                        }}>
                            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                                {CONNECTIONS.map(([from, to], index) => {
                                    const start = nodeMap[from as keyof typeof nodeMap];
                                    const end = nodeMap[to as keyof typeof nodeMap];
                                    return (
                                        <motion.line
                                            key={`${from}-${to}`}
                                            x1={start.x}
                                            y1={start.y}
                                            x2={end.x}
                                            y2={end.y}
                                            stroke="var(--don-accent-border)"
                                            strokeWidth="0.5"
                                            initial={{opacity: 0.25}}
                                            animate={{opacity: [0.25, 0.65, 0.25]}}
                                            transition={{
                                                duration: 4,
                                                delay: index * 0.15,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    );
                                })}
                            </svg>

                            {SESSION_NODES.map((node) => (
                                <motion.div
                                    key={node.id}
                                    className="absolute rounded-full"
                                    style={{
                                        width: `${node.size}px`,
                                        height: `${node.size}px`,
                                        left: `calc(${node.x}% - ${node.size / 2}px)`,
                                        top: `calc(${node.y}% - ${node.size / 2}px)`,
                                        background: 'var(--don-accent)',
                                        border: '1px solid var(--don-accent-border)',
                                    }}
                                    animate={{
                                        y: [0, -10, 0],
                                        x: [0, 5, 0],
                                        opacity: [0.7, 1, 0.7],
                                    }}
                                    transition={{
                                        duration: 6,
                                        delay: node.delay,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

        </section>
    );
};

export default HeroSection;

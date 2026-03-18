import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import {motion} from 'framer-motion';
import {AlertCircle, CheckCircle, ChevronRight, Eye, Lock, Shield, Smartphone, Zap} from 'react-feather';

const containerVariants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {staggerChildren: 0.08, delayChildren: 0.12},
    },
};

const itemVariants = {
    hidden: {opacity: 0, y: 14},
    visible: {opacity: 1, y: 0, transition: {duration: 0.35}},
};

const slideInLeft = {
    hidden: {opacity: 0, x: -30},
    visible: {opacity: 1, x: 0, transition: {duration: 0.4}},
};

const slideInRight = {
    hidden: {opacity: 0, x: 30},
    visible: {opacity: 1, x: 0, transition: {duration: 0.4}},
};

const STEPS = [
    {
        id: 'login',
        title: 'Secure Login',
        description: 'Policies and validation run before any token is created.',
        details: 'Credentials are verified and security checks are applied before issuing session material.',
    },
    {
        id: 'access-token',
        title: 'Access Token Issued',
        description: 'A short-lived JWT is issued for API access.',
        details: 'The token is intentionally minimal and expires quickly to reduce risk exposure.',
    },
    {
        id: 'expiry',
        title: 'Token Expires',
        description: 'Short expiry keeps leaked credentials low-impact.',
        details: 'Tokens expire in minutes so compromised access windows stay small and manageable.',
    },
    {
        id: 'refresh',
        title: 'Refresh Token Rotates',
        description: 'Every refresh invalidates the previous token.',
        details: 'Rotation blocks replay attacks by replacing refresh material on every successful exchange.',
    },
    {
        id: 'session',
        title: 'Session Tracked',
        description: 'Each device session can be observed and revoked.',
        details: 'Session metadata remains visible so teams can investigate and terminate suspicious activity fast.',
    },
];

const FEATURES = [
    {
        icon: Zap,
        title: 'Short-lived Tokens',
        description: 'Reduce attack surface with automatic expiration.',
        cta: 'Learn more',
        to: '/features',
    },
    {
        icon: Lock,
        title: 'Refresh Token Rotation',
        description: 'Every refresh creates a new token and invalidates the old one.',
        cta: 'View flow',
        to: '/identifier-flow',
    },
    {
        icon: Eye,
        title: 'Session Visibility',
        description: 'Track active sessions across every connected device.',
        cta: 'Explore sessions',
        to: '/sessions',
    },
    {
        icon: AlertCircle,
        title: 'Instant Revocation',
        description: 'Terminate compromised sessions immediately.',
        cta: 'Learn more',
        to: '/features',
    },
    {
        icon: Smartphone,
        title: 'Device Awareness',
        description: 'Manage sessions per device with clear audit context.',
        cta: 'Explore sessions',
        to: '/sessions',
    },
    {
        icon: Shield,
        title: 'Policy Control',
        description: 'Apply session and expiry controls for stricter environments.',
        cta: 'View docs',
        to: '/architecture',
    },
];

const USE_CASES = [
    'Enterprise security posture',
    'Multi-device session control',
    'Real-time suspicious session response',
    'Compliance and audit visibility',
    'Fast incident response',
    'Developer-friendly session APIs',
];

// ═════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═════════════════════════════════════════════════════════════════════════════

function HeroSection() {
    return (
        <section className="relative overflow-hidden py-20 md:py-28 lg:py-32 bg-white dark:bg-[#020617]">
            {/* Light mode background - subtle gradient */}
            <div
                className="pointer-events-none absolute inset-0 dark:hidden"
                style={{
                    background: 'radial-gradient(circle at 20% 20%, rgba(139,92,246,0.06), transparent 40%), radial-gradient(circle at 80% 30%, rgba(99,102,241,0.04), transparent 40%)',
                }}
            />

            {/* Dark mode background - subtle layered gradients */}
            <div
                className="pointer-events-none absolute inset-0 hidden dark:block"
                style={{
                    background: 'radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.08), transparent 40%), radial-gradient(circle at 80% 30%, rgba(99, 102, 241, 0.06), transparent 40%), #020617',
                }}
            />

            {/* Floating gradient shapes - light mode */}
            <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-violet-200 to-transparent blur-3xl opacity-20 dark:hidden" />
            <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-200 to-transparent blur-3xl opacity-15 dark:hidden" />

            {/* Floating gradient shapes - dark mode */}
            <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-violet-500 to-transparent blur-3xl opacity-5 hidden dark:block" />
            <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-purple-500 to-transparent blur-3xl opacity-5 hidden dark:block" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center space-y-8">
                    <motion.span
                        variants={itemVariants}
                        className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300"
                    >
                        Authentication Platform
                    </motion.span>

                    <motion.h1
                        variants={itemVariants}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight"
                    >
                        Control Sessions.
                        <br />
                        Not Just Logins.
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="mx-auto max-w-3xl text-base md:text-lg text-slate-600 dark:text-slate-300"
                    >
                        Short-lived tokens, refresh rotation, and full session visibility for modern systems.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-4">
                        <Link
                            to="/sessions"
                            className="relative overflow-hidden rounded-lg bg-violet-600 px-6 sm:px-8 py-3 font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl hover:shadow-violet-500/30 dark:hover:shadow-violet-500/20 active:scale-95"
                        >
                            <span className="relative z-10">Explore Sessions</span>
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 transition-opacity duration-300 hover:opacity-100"/>
                        </Link>
                        <Link
                            to="/architecture"
                            className="group relative overflow-hidden rounded-lg border border-slate-300 px-6 sm:px-8 py-3 font-medium text-slate-900 transition-all duration-300 ease-out hover:border-violet-400 hover:scale-102 dark:border-slate-700 dark:text-slate-100 dark:hover:border-violet-500/40"
                        >
                            <span className="relative z-10 flex items-center gap-1">
                                View Flow <ChevronRight
                                className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"/>
                            </span>
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
                        </Link>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        variants={itemVariants}
                        className="pt-6 flex flex-wrap items-center justify-center gap-6 border-t border-slate-200 dark:border-slate-800 mt-10"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">JWT Tokens</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Spring Boot</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Real-time Tracking</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TRUST / PROOF SECTION
// ═════════════════════════════════════════════════════════════════════════════

function TrustSection() {
    return (
        <section className="bg-slate-50 py-20 md:py-28 lg:py-32 dark:bg-slate-950/40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="mb-14 text-center"
                >
                    <motion.h2
                        variants={itemVariants}
                        className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100"
                    >
                        Built for Real-World Security
                    </motion.h2>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="grid grid-cols-1 gap-6 md:grid-cols-3"
                >
                    {[
                        {icon: Zap, title: 'Short-lived Tokens', text: 'Reduce risk exposure by limiting token lifetime.'},
                        {icon: Lock, title: 'Session Control', text: 'Track and revoke device sessions instantly.'},
                        {icon: AlertCircle, title: 'Instant Revocation', text: 'Respond to threats in milliseconds.'},
                    ].map((card) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.title}
                                variants={itemVariants}
                                className="group relative rounded-xl border border-slate-200 bg-white p-6 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-sm dark:hover:shadow-lg dark:hover:shadow-violet-500/10"
                            >
                                {/* Gradient glow border */}
                                <div
                                    className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 blur"/>

                                <div className="relative z-10">
                                    <div
                                        className="mb-4 inline-flex rounded-lg bg-violet-100 p-3 text-violet-700 transition-all duration-300 ease-out dark:bg-violet-500/20 dark:text-violet-300 group-hover:scale-110 group-hover:rotate-6">
                                        <Icon className="h-6 w-6"/>
                                    </div>
                                    <h3 className="mb-3 text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">{card.title}</h3>
                                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">{card.text}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// HOW IT WORKS SECTION
// ═════════════════════════════════════════════════════════════════════════════

function HowItWorksSection({activeStep, onStepChange}) {
    const activeStepData = useMemo(() => STEPS.find((step) => step.id === activeStep) ?? STEPS[0], [activeStep]);

    return (
        <section className="py-20 md:py-28 lg:py-32 bg-white dark:bg-[#020617]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="mb-12"
                >
                    <motion.h2
                        variants={itemVariants}
                        className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100"
                    >
                        How It Works
                    </motion.h2>
                    <motion.p variants={itemVariants} className="mt-4 text-slate-600 dark:text-slate-300">
                        Click each step to explore the authentication flow in detail.
                    </motion.p>
                </motion.div>

                {/* Step buttons */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-5"
                >
                    {STEPS.map((step, index) => (
                        <motion.button
                            key={step.id}
                            type="button"
                            variants={itemVariants}
                            onClick={() => onStepChange(step.id)}
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                            className={`rounded-xl border p-4 text-left transition-all duration-300 ease-out ${
                                activeStep === step.id
                                    ? 'border-violet-400 bg-violet-50 shadow-md dark:border-violet-500/40 dark:bg-violet-500/10 dark:shadow-lg dark:shadow-violet-500/10'
                                    : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-md hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/30 dark:hover:bg-slate-800 dark:hover:shadow-md dark:hover:shadow-violet-500/10'
                            }`}
                        >
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Step {index + 1}</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
                            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{step.description}</p>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Step details */}
                <motion.div
                    key={activeStep}
                    initial={{opacity: 0, y: 8}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.2}}
                    className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-transparent p-6 sm:p-8 dark:border-violet-500/30 dark:from-violet-500/10 dark:to-transparent transition-all duration-300"
                >
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">{activeStepData.title}</h3>
                    <p className="text-slate-700 dark:text-slate-300 mb-6">{activeStepData.details}</p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        <Link
                            to="/features"
                            className="relative overflow-hidden rounded-lg bg-violet-600 px-4 sm:px-5 py-2 text-sm font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-md active:scale-95 dark:hover:shadow-md dark:hover:shadow-violet-500/20"
                        >
                            <span className="relative z-10">Learn more</span>
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 transition-opacity duration-300 hover:opacity-100"/>
                        </Link>
                        <Link
                            to="/identifier-flow"
                            className="group relative overflow-hidden rounded-lg border border-slate-300 px-4 sm:px-5 py-2 text-sm font-medium text-slate-900 transition-all duration-300 ease-out hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:shadow-md dark:hover:shadow-violet-500/10"
                        >
                            <span className="relative z-10">View flow</span>
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
                        </Link>
                        <Link
                            to="/sessions"
                            className="group relative overflow-hidden rounded-lg border border-slate-300 px-4 sm:px-5 py-2 text-sm font-medium text-slate-900 transition-all duration-300 ease-out hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:shadow-md dark:hover:shadow-violet-500/10"
                        >
                            <span className="relative z-10">Explore sessions</span>
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// FEATURES GRID SECTION
// ═════════════════════════════════════════════════════════════════════════════

function FeatureSection() {
    return (
        <section className="bg-slate-50 py-20 md:py-28 lg:py-32 dark:bg-slate-950/40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="mb-14"
                >
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100">
                        Core Features
                    </h2>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                variants={itemVariants}
                                whileHover={{y: -4}}
                                className="group relative rounded-xl border border-slate-200 bg-white p-6 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/60 dark:hover:shadow-lg dark:hover:shadow-violet-500/10"
                            >
                                {/* Gradient glow border */}
                                <div
                                    className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 blur-sm"/>

                                <div className="relative z-10">
                                    <div
                                        className="mb-4 inline-flex rounded-lg bg-violet-100 p-3 text-violet-700 transition-all duration-300 ease-out dark:bg-violet-500/20 dark:text-violet-300 group-hover:scale-110 group-hover:rotate-3">
                                        <Icon className="h-6 w-6"/>
                                    </div>
                                    <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                                    <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                                    <Link
                                        to={feature.to}
                                        className="inline-flex items-center text-sm font-medium text-violet-700 transition-all duration-300 ease-out dark:text-violet-300 dark:hover:text-violet-200 group-hover:text-violet-600 group-hover:translate-x-1"
                                    >
                                        {feature.cta} <ChevronRight
                                        className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"/>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPARISON SECTION
// ═════════════════════════════════════════════════════════════════════════════

function ComparisonSection() {
    return (
        <section className="py-20 md:py-28 lg:py-32 bg-white dark:bg-[#020617]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="mb-14 text-center text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100">
                    Why Traditional Auth Fails
                </h2>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
                    {/* Left column - Risks */}
                    <motion.div
                        variants={slideInLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{once: true}}
                        className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-transparent p-6 sm:p-8 dark:border-red-500/30 dark:from-red-500/10 dark:to-transparent transition-all duration-300 ease-out"
                    >
                        <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Common Risks</h3>
                        {['Long-lived tokens', 'No session tracking', 'Weak revocation', 'Replay exposure'].map((item) => (
                            <motion.div
                                key={item}
                                className="group mb-3 flex items-start gap-3 rounded-lg p-2 transition-all duration-300 ease-out hover:bg-red-100/40 dark:hover:bg-red-500/10 cursor-pointer"
                                whileHover={{x: 4}}
                            >
                                <AlertCircle
                                    className="mt-1 h-5 w-5 flex-shrink-0 text-red-600 transition-transform duration-300 dark:text-red-400 group-hover:scale-110"/>
                                <p className="text-slate-700 transition-colors duration-300 dark:text-slate-300">{item}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Right column - Solution */}
                    <motion.div
                        variants={slideInRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{once: true}}
                        className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent p-6 sm:p-8 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-transparent transition-all duration-300 ease-out"
                    >
                        <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Improved Solution</h3>
                        {[
                            {text: 'Short-lived tokens'},
                            {text: 'Rotation-based refresh'},
                            {text: 'Full session control'},
                            {text: 'Instant revocation'},
                        ].map((item) => (
                            <motion.div
                                key={item.text}
                                className="group mb-3 flex items-center gap-3 rounded-lg p-2 transition-all duration-300 ease-out hover:bg-emerald-100/40 dark:hover:bg-emerald-500/10 cursor-pointer"
                                whileHover={{x: 4}}
                            >
                                <CheckCircle
                                    className="h-5 w-5 flex-shrink-0 text-emerald-600 transition-transform duration-300 dark:text-emerald-400 group-hover:scale-110"/>
                                <p className="text-slate-700 transition-colors duration-300 dark:text-slate-300">{item.text}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// USE CASES SECTION
// ═════════════════════════════════════════════════════════════════════════════

function UseCasesSection() {
    return (
        <section className="bg-slate-50 py-20 md:py-28 lg:py-32 dark:bg-slate-950/40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2 className="mb-14 text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100">
                    Use Cases
                </h2>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{once: true}}
                    className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    {USE_CASES.map((useCase) => (
                        <motion.div
                            key={useCase}
                            variants={itemVariants}
                            whileHover={{y: -2}}
                            className="group relative rounded-xl border border-slate-200 bg-white p-6 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:shadow-md dark:hover:shadow-violet-500/10"
                        >
                            {/* Subtle background shift */}
                            <div
                                className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-b from-violet-500/5 to-transparent"/>
                            <p className="relative z-10 font-medium text-slate-800 transition-colors duration-300 dark:text-slate-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">{useCase}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// FINAL CTA SECTION
// ═════════════════════════════════════════════════════════════════════════════

function FinalCtaSection() {
    return (
        <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
            {/* Light mode background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-violet-700 dark:hidden" />

            {/* Dark mode background */}
            <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-violet-600/20 via-purple-600/20 to-indigo-600/20" />

            {/* Overlay for dark mode */}
            <div className="absolute inset-0 hidden dark:block bg-[#020617]" />

            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                <h2 className="mb-4 text-4xl md:text-5xl lg:text-6xl font-bold text-white dark:text-slate-100">
                    Start Building Secure Systems
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-violet-100 dark:text-slate-300">
                    Session control, token rotation, and real-time visibility in one comprehensive flow.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
                    <Link
                        to="/sessions"
                        className="relative overflow-hidden rounded-lg bg-white px-6 sm:px-8 py-3 font-medium text-violet-700 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg text-center active:scale-95 dark:bg-slate-900 dark:text-violet-300 dark:hover:shadow-lg dark:hover:shadow-violet-500/20"
                    >
                        <span className="relative z-10">Get Started</span>
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-white/5 to-violet-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100"/>
                    </Link>
                    <Link
                        to="/features"
                        className="group relative overflow-hidden rounded-lg border border-white px-6 sm:px-8 py-3 font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg dark:border-slate-700 dark:text-slate-100 dark:hover:shadow-lg dark:hover:shadow-slate-900/50"
                    >
                        <span className="relative z-10 flex items-center gap-1">
                            Explore Docs <ChevronRight
                            className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"/>
                        </span>
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT DEMO SECTION
// ═════════════════════════════════════════════════════════════════════════════

function ProductDemoSection() {
    const mockSessions = [
        {device: 'MacBook Pro', location: 'San Francisco, CA', status: 'active', time: '2 minutes ago'},
        {device: 'iPhone 15', location: 'San Francisco, CA', status: 'active', time: '1 hour ago'},
        {device: 'Windows Desktop', location: 'New York, NY', status: 'inactive', time: '3 days ago'},
    ];

    return (
        <section className="py-20 md:py-28 lg:py-32 bg-slate-50 dark:bg-slate-950/40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                    {/* Left side - Text */}
                    <motion.div
                        initial={{opacity: 0, x: -30}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.5}}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-slate-100">
                            Real-time Session Visibility
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300">
                            Monitor every active session across all devices in real-time. See who's logged in, where
                            they're accessing from, and revoke access instantly.
                        </p>
                        <ul className="space-y-4">
                            {['Device identification', 'Geographic tracking', 'Activity monitoring', 'Instant revocation'].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400"/>
                                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Link
                                to="/sessions"
                                className="relative overflow-hidden rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30 text-center active:scale-95 dark:hover:shadow-violet-500/20"
                            >
                                <span className="relative z-10">View Live Demo</span>
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 transition-opacity duration-300 hover:opacity-100"/>
                            </Link>
                            <Link
                                to="/architecture"
                                className="group relative overflow-hidden rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-900 transition-all duration-300 ease-out hover:scale-105 hover:shadow-md dark:border-slate-700 dark:text-slate-100 dark:hover:shadow-md dark:hover:shadow-violet-500/10"
                            >
                                <span className="relative z-10">Learn Architecture</span>
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right side - Mock session table */}
                    <motion.div
                        initial={{opacity: 0, x: 30}}
                        whileInView={{opacity: 1, x: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.5}}
                        className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
                    >
                        <div className="mb-4">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Active Sessions</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">3 devices</p>
                        </div>
                        <div className="space-y-3">
                            {mockSessions.map((session, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{scale: 1.02}}
                                    className="group flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-all duration-300 ease-out dark:border-slate-700 dark:bg-slate-800/50 hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 cursor-pointer"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900 transition-colors duration-300 dark:text-slate-100 group-hover:text-violet-700 dark:group-hover:text-violet-300">{session.device}</p>
                                        <p className="text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">{session.location}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-150 ${session.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}/>
                                        <span
                                            className={`text-xs font-medium transition-all duration-300 ${session.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                            {session.status}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <motion.button
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                            className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-all duration-300 ease-out hover:border-red-300 hover:bg-red-50/50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                            Revoke All Sessions
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// FEATURE SPOTLIGHT SECTION
// ═════════════════════════════════════════════════════════════════════════════

function FeatureSpotlightSection() {
    return (
        <section className="py-20 md:py-28 lg:py-32 bg-white dark:bg-[#020617]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.5}}
                    className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-8 md:p-12 dark:border-violet-500/30 dark:from-violet-500/10 dark:to-purple-500/10"
                >
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
                        {/* Left side */}
                        <div className="space-y-6">
                            <div>
                                <div className="inline-flex rounded-lg bg-violet-100 p-3 mb-4 dark:bg-violet-500/20">
                                    <Eye className="h-6 w-6 text-violet-700 dark:text-violet-300"/>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
                                    Session Tracking Made Simple
                                </h2>
                            </div>
                            <p className="text-lg text-slate-700 dark:text-slate-300">
                                Get complete visibility into every authenticated session. Track device information,
                                location, activity status, and take instant action when needed.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">100%</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Session Visibility</p>
                                </div>
                                <div
                                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-900/30">
                                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">1ms</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Revocation Time</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Link
                                    to="/identifier-flow"
                                    className="relative overflow-hidden rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-violet-500/30 text-center active:scale-95 dark:hover:shadow-violet-500/20"
                                >
                                    <span className="relative z-10">View Flow</span>
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 opacity-0 transition-opacity duration-300 hover:opacity-100"/>
                                </Link>
                                <Link
                                    to="/features"
                                    className="group relative overflow-hidden rounded-lg border border-violet-300 px-6 py-3 font-medium text-violet-700 transition-all duration-300 ease-out hover:scale-105 dark:border-violet-500/30 dark:text-violet-300 dark:hover:border-violet-500/50"
                                >
                                    <span className="relative z-10">Learn More</span>
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
                                </Link>
                            </div>
                        </div>

                        {/* Right side - Visual */}
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            whileInView={{opacity: 1, scale: 1}}
                            viewport={{once: true}}
                            transition={{duration: 0.5, delay: 0.2}}
                            className="relative h-80 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800/50 overflow-hidden"
                        >
                            {/* Animated background elements */}
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 dark:from-violet-500/10 dark:to-purple-500/10"/>

                            {/* Mock session graph */}
                            <div className="relative h-full flex flex-col justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">ACTIVE
                                        SESSIONS</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">12</p>
                                </div>
                                <div className="space-y-3">
                                    {[{width: 'w-4/5', label: 'Web'}, {
                                        width: 'w-3/5',
                                        label: 'Mobile'
                                    }, {width: 'w-2/5', label: 'API'}].map((bar, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between mb-1">
                                                <span
                                                    className="text-xs text-slate-600 dark:text-slate-400">{bar.label}</span>
                                                <span
                                                    className="text-xs text-slate-600 dark:text-slate-400">{5 - i} sessions</span>
                                            </div>
                                            <div
                                                className="h-2 bg-slate-200 rounded-full dark:bg-slate-700 overflow-hidden">
                                                <motion.div
                                                    initial={{width: 0}}
                                                    whileInView={{width: bar.width}}
                                                    viewport={{once: true}}
                                                    transition={{duration: 0.8, delay: i * 0.1}}
                                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// FOOTER SECTION
// ═════════════════════════════════════════════════════════════════════════════

function FooterSection() {
    return (
        <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            {/* Gradient line at top */}
            <div className="h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600"/>

            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
                    {/* Brand */}
                    <div className="col-span-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Dragon of North</h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Enterprise authentication with session control.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Product</h4>
                        <ul className="mt-4 space-y-3">
                            <li><Link to="/features"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Features</Link>
                            </li>
                            <li><Link to="/architecture"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Architecture</Link>
                            </li>
                            <li><Link to="/security-demo"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Security</Link>
                            </li>
                            <li><Link to="/identifier-flow"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Flow</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Developers */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Developers</h4>
                        <ul className="mt-4 space-y-3">
                            <li><Link to="/features"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Docs</Link>
                            </li>
                            <li><a href="https://github.com"
                                   className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">GitHub</a>
                            </li>
                            <li><Link to="/deployment"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">API</Link>
                            </li>
                            <li><Link to="/privacy"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">SDK</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Legal</h4>
                        <ul className="mt-4 space-y-3">
                            <li><Link to="/privacy"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Privacy</Link>
                            </li>
                            <li><Link to="/terms"
                                      className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Terms</Link>
                            </li>
                            <li><a href="#"
                                   className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Status</a>
                            </li>
                            <li><a href="#"
                                   className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:translate-x-1 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Contact</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            © 2026 Dragon of North. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <a href="#"
                               className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:scale-110 dark:text-slate-400 dark:hover:text-violet-300 inline-block">Twitter</a>
                            <a href="#"
                               className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:scale-110 dark:text-slate-400 dark:hover:text-violet-300 inline-block">LinkedIn</a>
                            <a href="#"
                               className="text-sm text-slate-600 transition-all duration-300 ease-out hover:text-violet-600 hover:scale-110 dark:text-slate-400 dark:hover:text-violet-300 inline-block">GitHub</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function PremiumLandingPage() {
    const [activeStep, setActiveStep] = useState('login');

    return (
        <div className="min-h-screen bg-white text-slate-900 dark:bg-[#020617] dark:text-slate-100">
            <HeroSection />
            <TrustSection />
            <HowItWorksSection activeStep={activeStep} onStepChange={setActiveStep} />
            <FeatureSection />
            <ComparisonSection />
            <ProductDemoSection/>
            <FeatureSpotlightSection/>
            <UseCasesSection />
            <FinalCtaSection />
            <FooterSection/>
        </div>
    );
}


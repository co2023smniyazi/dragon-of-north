import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
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
                            className="rounded-lg bg-violet-600 px-6 sm:px-8 py-3 font-medium text-white transition hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20 dark:hover:shadow-violet-500/10"
                        >
                            Explore Sessions
                        </Link>
                        <Link
                            to="/architecture"
                            className="rounded-lg border border-slate-300 px-6 sm:px-8 py-3 font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            View Flow <ChevronRight className="ml-1 inline h-4 w-4" />
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
                                className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-sm transition hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-slate-800/50"
                            >
                                <div className="mb-4 inline-flex rounded-lg bg-violet-100 p-3 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-3 text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">{card.title}</h3>
                                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">{card.text}</p>
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
                            className={`rounded-xl border p-4 text-left transition ${
                                activeStep === step.id
                                    ? 'border-violet-400 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10'
                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
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
                    className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-transparent p-6 sm:p-8 dark:border-violet-500/30 dark:from-violet-500/10 dark:to-transparent"
                >
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">{activeStepData.title}</h3>
                    <p className="text-slate-700 dark:text-slate-300 mb-6">{activeStepData.details}</p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        <Link
                            to="/features"
                            className="rounded-lg bg-violet-600 px-4 sm:px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
                        >
                            Learn more
                        </Link>
                        <Link
                            to="/identifier-flow"
                            className="rounded-lg border border-slate-300 px-4 sm:px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            View flow
                        </Link>
                        <Link
                            to="/sessions"
                            className="rounded-lg border border-slate-300 px-4 sm:px-5 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                            Explore sessions
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
                                className="group rounded-xl border border-slate-200 bg-white p-6 sm:p-8 transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60 dark:hover:shadow-lg dark:hover:shadow-violet-500/10"
                            >
                                <div className="mb-4 inline-flex rounded-lg bg-violet-100 p-3 text-violet-700 transition group-hover:scale-110 dark:bg-violet-500/20 dark:text-violet-300">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                                <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                                <Link
                                    to={feature.to}
                                    className="inline-flex items-center text-sm font-medium text-violet-700 transition hover:text-violet-600 dark:text-violet-300 dark:hover:text-violet-200"
                                >
                                    {feature.cta} <ChevronRight className="ml-1 h-4 w-4" />
                                </Link>
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
                        className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-transparent p-6 sm:p-8 dark:border-red-500/30 dark:from-red-500/10 dark:to-transparent"
                    >
                        <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Common Risks</h3>
                        {['Long-lived tokens', 'No session tracking', 'Weak revocation', 'Replay exposure'].map((item) => (
                            <div key={item} className="mb-3 flex items-start gap-3">
                                <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                <p className="text-slate-700 dark:text-slate-300">{item}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* Right column - Solution */}
                    <motion.div
                        variants={slideInRight}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{once: true}}
                        className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-transparent p-6 sm:p-8 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-transparent"
                    >
                        <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Improved Solution</h3>
                        {[
                            {text: 'Short-lived tokens'},
                            {text: 'Rotation-based refresh'},
                            {text: 'Full session control'},
                            {text: 'Instant revocation'},
                        ].map((item) => (
                            <div key={item.text} className="mb-3 flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <p className="text-slate-700 dark:text-slate-300">{item.text}</p>
                            </div>
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
                            className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
                        >
                            <p className="font-medium text-slate-800 dark:text-slate-200">{useCase}</p>
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
                        className="rounded-lg bg-white px-6 sm:px-8 py-3 font-medium text-violet-700 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-violet-300 dark:hover:bg-slate-800"
                    >
                        Get Started
                    </Link>
                    <Link
                        to="/features"
                        className="rounded-lg border border-white px-6 sm:px-8 py-3 font-medium text-white transition hover:bg-white/10 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                        Explore Docs <ChevronRight className="ml-1 inline h-4 w-4" />
                    </Link>
                </div>
            </div>
        </section>
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
            <UseCasesSection />
            <FinalCtaSection />
        </div>
    );
}


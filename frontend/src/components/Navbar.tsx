import {AnimatePresence, motion} from 'framer-motion';
import {Menu, Monitor, Moon, Sun, X} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useTheme} from '../context/ThemeContext';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_SEQUENCE: ThemeMode[] = ['light', 'dark', 'system'];

const themeIcon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} as const;

const themeLabel = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
} as const;

const Navbar = () => {
    const {theme, setTheme} = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    const ThemeIcon = themeIcon[theme];

    const cycleTheme = () => {
        const currentIndex = THEME_SEQUENCE.indexOf(theme);
        const nextTheme = THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];
        setTheme(nextTheme);
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <button
                type="button"
                onClick={() => navigate('/')}
                className="navbar-brand"
            >
                <span className="navbar-brand-glyph">▣</span>
                <span>Dragon of North</span>
            </button>

            <div className="navbar-actions hidden md:flex">
                <button
                    type="button"
                    onClick={cycleTheme}
                    className="btn-subtle inline-flex items-center gap-2"
                    aria-label="Cycle theme"
                >
                    <ThemeIcon size={16}/>
                    <span>{themeLabel[theme]}</span>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="btn-primary"
                >
                    Login / Signup
                </button>
            </div>

            <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="btn-subtle md:hidden inline-flex h-10 w-10 items-center justify-center p-0"
                aria-label="Toggle mobile menu"
            >
                {isMobileMenuOpen ? <X size={18}/> : <Menu size={18}/>}
            </button>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                        transition={{duration: 0.15, ease: 'easeInOut'}}
                        className="absolute left-0 right-0 top-[60px] overflow-hidden px-4 pb-4 pt-2 md:hidden"
                        style={{
                            background: 'var(--don-bg-surface)',
                            borderTop: '1px solid var(--don-border-subtle)'
                        }}
                    >
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={cycleTheme}
                                className="flex items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-150"
                                style={{
                                    color: 'var(--don-text-secondary)',
                                    borderRadius: 'var(--r-md)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--don-bg-hover)';
                                    e.currentTarget.style.color = 'var(--don-text-primary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--don-text-secondary)';
                                }}
                            >
                                <ThemeIcon size={16} />
                                Theme: {themeLabel[theme]}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    navigate('/login');
                                }}
                                className="btn-primary text-left"
                            >
                                Login / Signup
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;

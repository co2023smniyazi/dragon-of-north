import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {API_CONFIG} from '../config';
import {apiService} from '../services/apiService';
import {useToast} from '../hooks/useToast';
import ValidationError from '../components/Validation/ValidationError';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';
import {getDeviceId} from '../utils/device';
import {useAuth} from '../context/authUtils';

const LoginPage = () => {
    const navigate = useNavigate();
    const {toast} = useToast();
    const {login, isAuthenticated, isLoading} = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkResult, setCheckResult] = useState(null);
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/dashboard', {replace: true});
        }
    }, [isAuthenticated, isLoading, navigate]);

    const providers = useMemo(() => checkResult?.providers || [], [checkResult]);
    const supportsLocal = providers.includes('LOCAL');
    const supportsGoogle = providers.includes('GOOGLE');

    const checkEmail = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            toast.error('Please enter your email.');
            return;
        }

        setLoading(true);
        setPasswordError('');
        const result = await apiService.post(API_CONFIG.ENDPOINTS.IDENTIFIER_STATUS, {
            identifier: trimmedEmail,
            identifier_type: 'EMAIL',
        });
        setLoading(false);

        if (apiService.isErrorResponse(result)) {
            toast.error(result.message || 'Unable to check this email.');
            return;
        }

        if (result?.api_response_status !== 'success') {
            toast.error('Unable to check this email.');
            return;
        }

        setCheckResult(result.data);
    };

    const handleLocalLogin = async (event) => {
        event.preventDefault();
        setPasswordError('');

        setLoading(true);
        const result = await apiService.post(API_CONFIG.ENDPOINTS.LOGIN, {
            identifier: email.trim().toLowerCase(),
            password,
            device_id: getDeviceId(),
        });
        setLoading(false);

        if (apiService.isErrorResponse(result)) {
            const message = result.backendMessage || result.message || 'Login failed.';
            if (message.includes('Account registered via Google')) {
                setCheckResult(prev => ({...(prev || {}), exists: true, providers: ['GOOGLE']}));
            }
            setPasswordError(message);
            return;
        }

        login({identifier: email.trim().toLowerCase()});
        navigate('/dashboard');
    };

    const handleGoogleSuccess = () => {
        login({identifier: email.trim().toLowerCase()});
        navigate('/dashboard');
    };

    const handleGoogleError = (message) => {
        toast.error(message || 'Google login failed.');
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl text-white">
                <h1 className="text-2xl font-bold">Sign in</h1>
                <p className="mt-2 text-sm text-slate-400">Use your email to continue.</p>

                <div className="mt-6 space-y-3">
                    <label className="text-sm text-slate-300">Email</label>
                    <input
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                    />
                    <button
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold disabled:opacity-60"
                        type="button"
                        disabled={loading}
                        onClick={checkEmail}
                    >
                        {loading ? 'Checking...' : 'Continue'}
                    </button>
                </div>

                {checkResult && (
                    <div className="mt-6 space-y-4">
                        {!checkResult.exists && (
                            <>
                                <p className="text-sm text-slate-300">No account found. Create one.</p>
                                <button className="w-full rounded-lg border border-slate-700 py-2" onClick={() => navigate('/signup', {state: {identifier: email.trim().toLowerCase(), identifierType: 'EMAIL'}})}>
                                    Sign up with email
                                </button>
                                <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} disabled={loading}/>
                            </>
                        )}

                        {checkResult.exists && supportsLocal && (
                            <form onSubmit={handleLocalLogin} className="space-y-3">
                                <label className="text-sm text-slate-300 block">Password</label>
                                <input
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                />
                                <ValidationError errors={passwordError ? [passwordError] : []}/>
                                <button className="w-full rounded-lg bg-blue-600 py-3 font-semibold disabled:opacity-60" disabled={loading || !password}>
                                    {loading ? 'Logging in...' : 'Login with password'}
                                </button>
                            </form>
                        )}

                        {checkResult.exists && supportsGoogle && (
                            <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} disabled={loading}/>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;

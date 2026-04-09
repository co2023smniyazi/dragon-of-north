import {useCallback, useEffect, useRef, useState} from 'react';
import {API_CONFIG} from '../../config';
import {apiService} from '../../services/apiService';
import {getDeviceId} from '../../utils/device';

const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const GoogleLoginButton = ({onSuccess, onError, onStart, disabled = false, autoPrompt = false, mode = 'login', expectedIdentifier = '', isRedirecting = false}) => {
    const buttonRef = useRef(null);
    const initializedRef = useRef(false);
    const expectedIdentifierRef = useRef(expectedIdentifier);
    const hasClientId = Boolean(API_CONFIG.GOOGLE_CLIENT_ID);
    const [isInitializing, setIsInitializing] = useState(hasClientId);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        expectedIdentifierRef.current = expectedIdentifier;
    }, [expectedIdentifier]);

    // Custom single-button UI: invoke onStart on click (no nested iframe button)

    const decodeJWT = (token) => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            return JSON.parse(atob(parts[1]));
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return null;
        }
    };

    const handleGoogleCredential = useCallback(async ({credential}) => {
        if (!credential) {
            onError?.('Google did not return an ID token.');
            return;
        }

        // Extract email from ID token
        const decodedToken = decodeJWT(credential);
        const emailFromToken = decodedToken?.email;

        // Backend endpoint depends on flow mode:
        // signup -> POST /api/v1/auth/oauth/google/signup, login -> POST /api/v1/auth/oauth/google
        const endpoint = mode === 'signup' ? API_CONFIG.ENDPOINTS.OAUTH_GOOGLE_SIGNUP : API_CONFIG.ENDPOINTS.OAUTH_GOOGLE;
        const payload = {
            // Backend payload contract for OAuth exchange.
            id_token: credential,
            // idToken: credential,
            device_id: getDeviceId(),
        };

        const normalizedExpectedIdentifier = expectedIdentifierRef.current?.trim().toLowerCase();
        if (normalizedExpectedIdentifier) {
            payload.expected_identifier = normalizedExpectedIdentifier;
            // payload.expectedIdentifier = normalizedExpectedIdentifier;
        }

        const result = await apiService.post(endpoint, payload);

        // Frontend expects standard ApiResponse with api_response_status === 'success'.
        if (apiService.isErrorResponse(result) || result?.api_response_status !== 'success') {
            const fallbackMessage = mode === 'signup'
                ? 'Google signup failed. Please try again.'
                : 'Google sign-in failed. Please try again.';
            onError?.(result?.message || fallbackMessage);
            return;
        }

        // Pass both the backend response and the email from a token
        onSuccess?.({
            ...result?.data,
            email: emailFromToken,
            identifier: emailFromToken
        });
    }, [mode, onError, onSuccess]);

    useEffect(() => {
        const clientId = API_CONFIG.GOOGLE_CLIENT_ID;
        if (!clientId) {
            onError?.('Google login is not configured. Missing client ID.');
            setTimeout(() => {
                setIsInitializing(false);
                setIsReady(false);
            }, 0);
            return;
        }

        const initializeGoogle = () => {
            if (initializedRef.current || !window.google?.accounts?.id) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredential,
            });

            initializedRef.current = true;
            setTimeout(() => {
                setIsInitializing(false);
                setIsReady(true);
            }, 0);
        };

        if (window.google?.accounts?.id) {
            initializeGoogle();
            return;
        }

        const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`);
        const script = existingScript || document.createElement('script');
        if (!existingScript) {
            script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        script.addEventListener('load', initializeGoogle);
        script.addEventListener('error', () => {
            setTimeout(() => {
                setIsInitializing(false);
                setIsReady(false);
            }, 0);
            onError?.('Unable to load Google Identity Services. Please try again later.');
        });

        return () => {
            script.removeEventListener('load', initializeGoogle);
        };
    }, [handleGoogleCredential, onError]);

    const handleButtonClick = () => {
        if (disabled || isRedirecting || !window.google?.accounts?.id) return;
        onStart?.();
        // Trigger the Google Identity prompt. This keeps the UI as ONE clean button.
        window.google.accounts.id.prompt();
    };

    useEffect(() => {
        if (!autoPrompt || !isReady || !window.google?.accounts?.id) return;
        window.google.accounts.id.prompt();

        return () => {
            window.google?.accounts?.id?.cancel();
        };
    }, [autoPrompt, isReady]);

    return (
        <div className="auth-oauth-wrap" aria-busy={isInitializing}>
            <button
                ref={buttonRef}
                type="button"
                onClick={handleButtonClick}
                disabled={disabled || isRedirecting || !hasClientId}
                className={`auth-google-btn mt-4 ${disabled || isRedirecting ? 'opacity-60 cursor-not-allowed' : ''}`.trim()}
            >
                <svg
                    className="auth-google-icon"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.25 3.62l6.88-6.88C35.92 2.46 30.44 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.02 6.23C12.47 13.3 17.77 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.64-.15-3.22-.42-4.75H24v9h12.96c-.56 2.98-2.24 5.5-4.76 7.2l7.28 5.66c4.26-3.93 6.7-9.72 6.7-16.11z"/>
                    <path fill="#FBBC05" d="M10.58 28.22c-.48-1.45-.76-2.99-.76-4.57s.27-3.12.76-4.57l-8.02-6.23C.92 16.46 0 20.12 0 23.65s.92 7.19 2.56 10.22l8.02-5.65z"/>
                    <path fill="#34A853" d="M24 47.3c6.44 0 11.84-2.13 15.78-5.78l-7.28-5.66c-2.02 1.36-4.6 2.16-8.5 2.16-6.23 0-11.53-3.8-13.42-9.2l-8.02 5.65C6.51 42.02 14.62 47.3 24 47.3z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                <span className="auth-google-text">
                    Continue with Google
                </span>
            </button>
            {isInitializing && <p className="auth-oauth-caption">Loading Google sign-in...</p>}
            {isRedirecting && <p className="auth-oauth-caption font-medium">Redirecting to Google...</p>}
        </div>
    );
};

export default GoogleLoginButton;

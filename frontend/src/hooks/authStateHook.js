import {useState} from 'react';

/**
 * Auth state constants and hook
 * Handles loading, success, error states
 */

export const AUTH_STATE = {
    IDLE: 'IDLE',
    LOADING: 'LOADING',
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
};

export function useAuthState() {
    const [state, setState] = useState(AUTH_STATE.IDLE);
    const [message, setMessage] = useState('');

    const setIdle = () => {
        setState(AUTH_STATE.IDLE);
        setMessage('');
    };

    const setLoading = (msg = 'Authenticating...') => {
        setState(AUTH_STATE.LOADING);
        setMessage(msg);
    };

    const setSuccess = (msg = 'Success!') => {
        setState(AUTH_STATE.SUCCESS);
        setMessage(msg);
    };

    const setError = (msg = 'Could not complete action. Please try again.') => {
        setState(AUTH_STATE.ERROR);
        setMessage(msg);
    };

    const reset = () => {
        setState(AUTH_STATE.IDLE);
        setMessage('');
    };

    return {
        state,
        message,
        setIdle,
        setLoading,
        setSuccess,
        setError,
        reset,
        isLoading: state === AUTH_STATE.LOADING,
        isSuccess: state === AUTH_STATE.SUCCESS,
        isError: state === AUTH_STATE.ERROR,
    };
}


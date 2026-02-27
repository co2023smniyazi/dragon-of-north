import React, {createContext, useCallback, useMemo, useState} from 'react';

export const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({children}) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((toast) => {
        const id = ++toastId;
        const nextToast = {
            id,
            variant: toast.variant || 'info',
            duration: toast.duration ?? 4000,
            title: toast.title,
            message: toast.message,
        };

        setToasts(prev => [...prev, nextToast]);

        if (nextToast.duration > 0) {
            window.setTimeout(() => removeToast(id), nextToast.duration);
        }

        return id;
    }, [removeToast]);

    const value = useMemo(() => ({toasts, addToast, removeToast}), [toasts, addToast, removeToast]);

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

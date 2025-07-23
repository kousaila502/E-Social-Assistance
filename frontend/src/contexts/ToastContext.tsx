import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastProps } from '../components/shared/Toast';

interface ToastContextType {
    showToast: (toast: Omit<ToastProps, 'id' | 'onDismiss'>) => void;
    showError: (title: string, message: string, details?: string[]) => void;
    showSuccess: (title: string, message: string) => void;
    showWarning: (title: string, message: string) => void;
    showInfo: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

    const showToast = (toast: Omit<ToastProps, 'id' | 'onDismiss'>) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { ...toast, id, onDismiss: removeToast }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const showError = (title: string, message: string, details?: string[]) => {
        showToast({ type: 'error', title, message, details });
    };

    const showSuccess = (title: string, message: string) => {
        showToast({ type: 'success', title, message });
    };

    const showWarning = (title: string, message: string) => {
        showToast({ type: 'warning', title, message });
    };

    const showInfo = (title: string, message: string) => {
        showToast({ type: 'info', title, message });
    };

    return (
        <ToastContext.Provider value={{ showToast, showError, showSuccess, showWarning, showInfo }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
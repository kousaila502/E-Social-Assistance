import React, { useEffect, useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    details?: string[];
    duration?: number;
    onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    details = [],
    duration = 5000,
    onDismiss
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(id);
        }, 300);
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
            case 'error':
                return <XCircleIcon className="h-6 w-6 text-red-400" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
            case 'info':
                return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <div
            className={`
        max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border-l-4
        transform transition-all duration-300 ease-in-out
        ${getColors()}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {getIcon()}
                    </div>
                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                            {title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            {message}
                        </p>
                        {details.length > 0 && (
                            <div className="mt-2">
                                <ul className="text-xs text-gray-600 space-y-1">
                                    {details.slice(0, 3).map((detail, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="mr-1">•</span>
                                            <span>{detail}</span>
                                        </li>
                                    ))}
                                    {details.length > 3 && (
                                        <li className="text-gray-500 italic">
                                            +{details.length - 3} more error{details.length - 3 !== 1 ? 's' : ''}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleDismiss}
                            className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Toast;
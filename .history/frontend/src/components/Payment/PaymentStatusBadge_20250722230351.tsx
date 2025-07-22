import React from 'react';
import {
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    StopIcon,
    ArrowPathIcon,
    PauseIcon,
    PlayIcon
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckCircleIconSolid,
    ClockIcon as ClockIconSolid,
    XCircleIcon as XCircleIconSolid,
    ExclamationTriangleIcon as ExclamationTriangleIconSolid,
    StopIcon as StopIconSolid,
    ArrowPathIcon as ArrowPathIconSolid,
    PauseIcon as PauseIconSolid
} from '@heroicons/react/24/solid';

import paymentService from '../../services/paymentService';

interface PaymentStatusBadgeProps {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'on_hold';
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'solid' | 'outline' | 'minimal';
    showIcon?: boolean;
    className?: string;
    animated?: boolean; // For processing status
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
    status,
    size = 'md',
    variant = 'default',
    showIcon = true,
    className = '',
    animated = true
}) => {
    // Status configuration
    const statusConfig = {
        pending: {
            label: 'Pending',
            color: 'yellow',
            icon: ExclamationTriangleIcon,
            iconSolid: ExclamationTriangleIconSolid,
            description: 'Payment is waiting to be processed'
        },
        processing: {
            label: 'Processing',
            color: 'blue',
            icon: ClockIcon,
            iconSolid: ClockIconSolid,
            description: 'Payment is currently being processed'
        },
        completed: {
            label: 'Completed',
            color: 'green',
            icon: CheckCircleIcon,
            iconSolid: CheckCircleIconSolid,
            description: 'Payment has been successfully completed'
        },
        failed: {
            label: 'Failed',
            color: 'red',
            icon: XCircleIcon,
            iconSolid: XCircleIconSolid,
            description: 'Payment processing failed'
        },
        cancelled: {
            label: 'Cancelled',
            color: 'gray',
            icon: StopIcon,
            iconSolid: StopIconSolid,
            description: 'Payment has been cancelled'
        },
        refunded: {
            label: 'Refunded',
            color: 'purple',
            icon: ArrowPathIcon,
            iconSolid: ArrowPathIconSolid,
            description: 'Payment has been refunded'
        },
        on_hold: {
            label: 'On Hold',
            color: 'orange',
            icon: PauseIcon,
            iconSolid: PauseIconSolid,
            description: 'Payment is on hold pending review'
        }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const color = paymentService.getStatusColor(status);

    // Size classes
    const sizeClasses = {
        sm: {
            container: 'px-2 py-1 text-xs',
            icon: 'h-3 w-3',
            text: 'text-xs font-medium'
        },
        md: {
            container: 'px-3 py-1 text-sm',
            icon: 'h-4 w-4',
            text: 'text-sm font-medium'
        },
        lg: {
            container: 'px-4 py-2 text-base',
            icon: 'h-5 w-5',
            text: 'text-base font-semibold'
        }
    };

    // Variant styles
    const variantClasses = {
        default: {
            container: `bg-${color}-100 text-${color}-800 border border-${color}-200`,
            icon: `text-${color}-600`
        },
        solid: {
            container: `bg-${color}-600 text-white border border-${color}-600`,
            icon: 'text-white'
        },
        outline: {
            container: `bg-transparent text-${color}-700 border-2 border-${color}-300`,
            icon: `text-${color}-600`
        },
        minimal: {
            container: `bg-transparent text-${color}-700 border-none`,
            icon: `text-${color}-600`
        }
    };

    const sizeClass = sizeClasses[size];
    const variantClass = variantClasses[variant];
    
    // Icon component
    const IconComponent = variant === 'solid' ? config.iconSolid : config.icon;

    // Animation for processing status
    const animationClass = animated && status === 'processing' ? 'animate-pulse' : '';

    return (
        <span
            className={`
                inline-flex items-center rounded-full
                ${sizeClass.container}
                ${variantClass.container}
                ${animationClass}
                ${className}
            `}
            title={config.description}
        >
            {showIcon && (
                <IconComponent 
                    className={`
                        ${sizeClass.icon} 
                        ${variantClass.icon}
                        ${size !== 'sm' ? 'mr-1.5' : 'mr-1'}
                    `} 
                />
            )}
            <span className={sizeClass.text}>
                {config.label}
            </span>
        </span>
    );
};

// Extended version with additional props
interface PaymentStatusBadgeExtendedProps extends PaymentStatusBadgeProps {
    withTooltip?: boolean;
    clickable?: boolean;
    onClick?: () => void;
    customLabel?: string;
}

export const PaymentStatusBadgeExtended: React.FC<PaymentStatusBadgeExtendedProps> = ({
    withTooltip = false,
    clickable = false,
    onClick,
    customLabel,
    ...props
}) => {
    const statusConfig = {
        pending: { description: 'Payment is waiting to be processed' },
        processing: { description: 'Payment is currently being processed' },
        completed: { description: 'Payment has been successfully completed' },
        failed: { description: 'Payment processing failed' },
        cancelled: { description: 'Payment has been cancelled' },
        refunded: { description: 'Payment has been refunded' },
        on_hold: { description: 'Payment is on hold pending review' }
    };

    const config = statusConfig[props.status] || statusConfig.pending;

    const badgeElement = (
        <PaymentStatusBadge 
            {...props} 
            className={`
                ${props.className} 
                ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
            `}
        />
    );

    if (clickable && onClick) {
        return (
            <button onClick={onClick} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full">
                {badgeElement}
            </button>
        );
    }

    return badgeElement;
};

// Compact status indicator (just icon + color)
interface PaymentStatusDotProps {
    status: PaymentStatusBadgeProps['status'];
    size?: 'sm' | 'md' | 'lg';
    withPulse?: boolean;
    className?: string;
}

export const PaymentStatusDot: React.FC<PaymentStatusDotProps> = ({
    status,
    size = 'md',
    withPulse = false,
    className = ''
}) => {
    const color = paymentService.getStatusColor(status);
    
    const sizeClasses = {
        sm: 'h-2 w-2',
        md: 'h-3 w-3',
        lg: 'h-4 w-4'
    };

    const pulseClass = withPulse && status === 'processing' ? 'animate-pulse' : '';

    return (
        <span
            className={`
                inline-block rounded-full
                bg-${color}-400
                ${sizeClasses[size]}
                ${pulseClass}
                ${className}
            `}
            title={`Status: ${status.replace('_', ' ')}`}
        />
    );
};

// Status with count (for summary views)
interface PaymentStatusCountProps {
    status: PaymentStatusBadgeProps['status'];
    count: number;
    total?: number;
    showPercentage?: boolean;
    size?: 'sm' | 'md' | 'lg';
    layout?: 'horizontal' | 'vertical';
    className?: string;
}

export const PaymentStatusCount: React.FC<PaymentStatusCountProps> = ({
    status,
    count,
    total,
    showPercentage = false,
    size = 'md',
    layout = 'horizontal',
    className = ''
}) => {
    const color = paymentService.getStatusColor(status);
    const percentage = total && total > 0 ? Math.round((count / total) * 100) : 0;

    const sizeClasses = {
        sm: { text: 'text-sm', count: 'text-lg font-semibold', percentage: 'text-xs' },
        md: { text: 'text-base', count: 'text-xl font-bold', percentage: 'text-sm' },
        lg: { text: 'text-lg', count: 'text-2xl font-bold', percentage: 'text-base' }
    };

    const sizeClass = sizeClasses[size];

    if (layout === 'vertical') {
        return (
            <div className={`text-center ${className}`}>
                <div className={`${sizeClass.count} text-${color}-600`}>
                    {count.toLocaleString()}
                </div>
                <PaymentStatusBadge 
                    status={status} 
                    size={size === 'lg' ? 'md' : 'sm'} 
                    variant="minimal" 
                />
                {showPercentage && total && (
                    <div className={`${sizeClass.percentage} text-gray-500 mt-1`}>
                        {percentage}%
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <PaymentStatusBadge 
                status={status} 
                size={size} 
                variant="default" 
            />
            <div className="flex items-baseline space-x-2">
                <span className={`${sizeClass.count} text-gray-900`}>
                    {count.toLocaleString()}
                </span>
                {showPercentage && total && (
                    <span className={`${sizeClass.percentage} text-gray-500`}>
                        ({percentage}%)
                    </span>
                )}
            </div>
        </div>
    );
};

export default PaymentStatusBadge;
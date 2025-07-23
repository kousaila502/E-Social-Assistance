// src/components/ServicePortal/WelcomeHero.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  HeartIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface WelcomeHeroProps {
  className?: string;
  showStats?: boolean;
  showQuickActions?: boolean;
  showUserStatus?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryActionText?: string;
  secondaryActionText?: string;
  customMessage?: string;
}

interface UserStats {
  totalRequests?: number;
  approvedRequests?: number;
  totalAmountReceived?: number;
  lastActivity?: string;
}

const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  className = '',
  showStats = false,
  showQuickActions = true,
  showUserStatus = true,
  variant = 'default',
  onPrimaryAction,
  onSecondaryAction,
  primaryActionText = 'Apply for Assistance',
  secondaryActionText = 'View My Applications',
  customMessage
}) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Update time every minute for dynamic greetings
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Mock user stats - in real app, this would come from props or API
  useEffect(() => {
    if (user && showStats) {
      setUserStats({
        totalRequests: user.statistics?.totalRequests || 0,
        approvedRequests: user.statistics?.approvedRequests || 0,
        totalAmountReceived: user.statistics?.totalAmountReceived || 0,
        lastActivity: user.statistics?.lastActivity
      });
    }
  }, [user, showStats]);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    const name = user?.name ? user.name.split(' ')[0] : 'Friend';
    
    if (hour < 6) return { greeting: 'Good early morning', name, icon: '🌙', color: 'from-indigo-600 to-purple-600' };
    if (hour < 12) return { greeting: 'Good morning', name, icon: '☀️', color: 'from-yellow-500 to-orange-500' };
    if (hour < 17) return { greeting: 'Good afternoon', name, icon: '🌤️', color: 'from-blue-500 to-cyan-500' };
    if (hour < 21) return { greeting: 'Good evening', name, icon: '🌅', color: 'from-orange-500 to-red-500' };
    return { greeting: 'Good night', name, icon: '🌙', color: 'from-purple-600 to-indigo-600' };
  };

  const getEligibilityStatus = () => {
    if (!user?.eligibility) return null;
    
    const { status, score } = user.eligibility;
    
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircleIcon,
          text: `Verified (Score: ${score || 'N/A'})`,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return {
          icon: ClockIcon,
          text: 'Under Review',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'rejected':
        return {
          icon: ExclamationTriangleIcon,
          text: 'Needs Update',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: InformationCircleIcon,
          text: 'Pending Assessment',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
    }
  };

  const getMotivationalMessage = () => {
    if (customMessage) return customMessage;
    
    const messages = [
      "We're here to support you on your journey to better opportunities.",
      "Every step forward is progress. We're here to help you take the next one.",
      "Your dreams matter. Let us help you turn them into reality.",
      "Together, we can build a brighter future for you and your family.",
      "Support is just an application away. We believe in you."
    ];
    
    // Use user ID or current date to ensure consistent message for same user
    const messageIndex = user?._id 
      ? parseInt(user._id.slice(-1), 16) % messages.length 
      : currentTime.getDate() % messages.length;
    
    return messages[messageIndex];
  };

  const { greeting, name, icon, color } = getTimeBasedGreeting();
  const eligibilityStatus = getEligibilityStatus();
  const motivationalMessage = getMotivationalMessage();

  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      // Default action - navigate to application
      window.location.href = '/apply';
    }
  };

  const handleSecondaryAction = () => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      // Default action - navigate to user's applications
      window.location.href = '/my-applications';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <span className="mr-2">{icon}</span>
              {greeting}, {name}!
            </h2>
            <p className="text-white/90 text-sm mt-1">{motivationalMessage}</p>
          </div>
          {showUserStatus && eligibilityStatus && (
            <div className={`${eligibilityStatus.bgColor} ${eligibilityStatus.borderColor} border px-3 py-1 rounded-full flex items-center`}>
              <eligibilityStatus.icon className={`h-4 w-4 ${eligibilityStatus.color} mr-1`} />
              <span className={`text-xs font-medium ${eligibilityStatus.color}`}>
                {eligibilityStatus.text}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        {/* Background with gradient and pattern */}
        <div className={`bg-gradient-to-br ${color} relative`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative p-8 text-white">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-3">{icon}</span>
                  <SparklesIcon className="h-6 w-6 text-white/80" />
                </div>
                <h1 className="text-3xl font-bold leading-tight mb-2">
                  {greeting}, {name}!
                </h1>
                <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
                  {motivationalMessage}
                </p>
              </div>
              
              {showUserStatus && eligibilityStatus && (
                <div className={`${eligibilityStatus.bgColor} ${eligibilityStatus.borderColor} border px-4 py-2 rounded-full flex items-center backdrop-blur-sm`}>
                  <eligibilityStatus.icon className={`h-5 w-5 ${eligibilityStatus.color} mr-2`} />
                  <span className={`font-medium ${eligibilityStatus.color}`}>
                    {eligibilityStatus.text}
                  </span>
                </div>
              )}
            </div>

            {/* Stats Section */}
            {showStats && userStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-6 w-6 text-white/80 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">{userStats.totalRequests}</div>
                      <div className="text-sm text-white/80">Total Applications</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-white/80 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">{userStats.approvedRequests}</div>
                      <div className="text-sm text-white/80">Approved</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex items-center">
                    <HeartIcon className="h-6 w-6 text-white/80 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        ${userStats.totalAmountReceived?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-white/80">Total Received</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {showQuickActions && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handlePrimaryAction}
                  className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
                >
                  {primaryActionText}
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
                
                <button
                  onClick={handleSecondaryAction}
                  className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 border border-white/30 flex items-center justify-center"
                >
                  {secondaryActionText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-gradient-to-r ${color} rounded-xl p-8 text-white relative overflow-hidden ${className}`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{icon}</span>
            <div>
              <h1 className="text-2xl font-bold">
                {greeting}, {name}!
              </h1>
              <p className="text-white/90 mt-1">
                {motivationalMessage}
              </p>
            </div>
          </div>
          
          <SparklesIcon className="h-8 w-8 text-white/80" />
        </div>

        {/* User Status */}
        {showUserStatus && eligibilityStatus && (
          <div className="mb-6">
            <div className={`${eligibilityStatus.bgColor} ${eligibilityStatus.borderColor} border inline-flex items-center px-4 py-2 rounded-full`}>
              <eligibilityStatus.icon className={`h-5 w-5 ${eligibilityStatus.color} mr-2`} />
              <span className={`font-medium ${eligibilityStatus.color}`}>
                Eligibility Status: {eligibilityStatus.text}
              </span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {showStats && userStats && (
          <div className="flex items-center space-x-6 mb-6 text-sm">
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-white/80" />
              <span>{userStats.totalRequests} applications</span>
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-white/80" />
              <span>{userStats.approvedRequests} approved</span>
            </div>
            {userStats.totalAmountReceived && userStats.totalAmountReceived > 0 && (
              <div className="flex items-center">
                <HeartIcon className="h-5 w-5 mr-2 text-white/80" />
                <span>${userStats.totalAmountReceived.toLocaleString()} received</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showQuickActions && (
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handlePrimaryAction}
              className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              {primaryActionText}
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
            
            <button
              onClick={handleSecondaryAction}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 border border-white/30"
            >
              {secondaryActionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeHero;
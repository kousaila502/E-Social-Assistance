// src/components/ServicePortal/QuickHelpWidget.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface QuickHelpWidgetProps {
  className?: string;
  isFloating?: boolean;
  showContactInfo?: boolean;
  showFAQ?: boolean;
  showLiveChat?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'application' | 'payment' | 'eligibility' | 'documents';
}

const QuickHelpWidget: React.FC<QuickHelpWidgetProps> = ({
  className = '',
  isFloating = false,
  showContactInfo = true,
  showFAQ = true,
  showLiveChat = true,
  position = 'bottom-right'
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(!isFloating);
  const [activeSection, setActiveSection] = useState<'help' | 'faq' | 'contact' | null>('help');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true); // Mock online status

  // Mock FAQ data - in real app, this could come from API
  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How long does it take to process my application?',
      answer: 'Processing times vary by service type. Emergency assistance is typically processed within 1-2 business days, while other services may take 3-10 business days. You\'ll receive updates throughout the process.',
      category: 'application'
    },
    {
      id: '2',
      question: 'What documents do I need to apply?',
      answer: 'Required documents vary by service, but typically include: valid ID, proof of income, proof of residence, and any service-specific documents. The application form will show exactly what you need.',
      category: 'documents'
    },
    {
      id: '3',
      question: 'How do I check my eligibility?',
      answer: 'Your eligibility is automatically calculated based on your profile information. You can view your current eligibility status and score in your profile. Update your information to improve your eligibility.',
      category: 'eligibility'
    },
    {
      id: '4',
      question: 'When will I receive payment?',
      answer: 'Once your application is approved, payments are typically processed within 2-5 business days. You\'ll receive a notification when payment is initiated and when it\'s completed.',
      category: 'payment'
    },
    {
      id: '5',
      question: 'Can I apply for multiple services?',
      answer: 'Yes, you can apply for multiple services, but each application is reviewed separately. Some services have limits on concurrent applications, which will be clearly indicated.',
      category: 'general'
    }
  ];

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const contactOptions = [
    {
      type: 'phone',
      label: 'Call Support',
      value: '+213-XXX-XXXX',
      icon: PhoneIcon,
      color: 'bg-green-600 hover:bg-green-700',
      available: '8 AM - 6 PM, Mon-Fri',
      action: () => window.open('tel:+213XXXXXXX')
    },
    {
      type: 'chat',
      label: isOnline ? 'Live Chat' : 'Leave Message',
      value: isOnline ? 'Available now' : 'We\'ll respond soon',
      icon: ChatBubbleLeftRightIcon,
      color: isOnline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700',
      available: isOnline ? 'Online now' : 'Offline',
      action: () => {
        // In real app, this would open chat widget or navigate to chat page
        console.log('Opening chat...');
      }
    },
    {
      type: 'docs',
      label: 'Help Center',
      value: 'Browse articles',
      icon: DocumentTextIcon,
      color: 'bg-purple-600 hover:bg-purple-700',
      available: 'Always available',
      action: () => window.open('/help-center', '_blank')
    }
  ];

  // Simulate online status check
  useEffect(() => {
    const checkOnlineStatus = () => {
      // Mock: randomly set online/offline for demo
      const currentHour = new Date().getHours();
      setIsOnline(currentHour >= 8 && currentHour < 18); // Online during business hours
    };

    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const getCategoryIcon = (category: FAQItem['category']) => {
    switch (category) {
      case 'application': return ClockIcon;
      case 'payment': return CheckCircleIcon;
      case 'documents': return DocumentTextIcon;
      case 'eligibility': return QuestionMarkCircleIcon;
      default: return ExclamationTriangleIcon;
    }
  };

  const getCategoryColor = (category: FAQItem['category']) => {
    switch (category) {
      case 'application': return 'text-blue-600';
      case 'payment': return 'text-green-600';
      case 'documents': return 'text-purple-600';
      case 'eligibility': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const renderHelpSection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <QuestionMarkCircleIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          Hi {user?.name ? user.name.split(' ')[0] : 'there'}! How can we help?
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose an option below or browse our FAQ
        </p>
      </div>

      {showLiveChat && (
        <div className="grid gap-3">
          {contactOptions.map((option) => (
            <button
              key={option.type}
              onClick={option.action}
              className={`${option.color} text-white p-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center">
                <option.icon className="h-6 w-6 mr-3" />
                <div className="text-left flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs opacity-90">{option.available}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showFAQ && (
        <button
          onClick={() => setActiveSection('faq')}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-lg transition-colors duration-200 flex items-center"
        >
          <DocumentTextIcon className="h-5 w-5 mr-3" />
          <span className="font-medium">Browse FAQ</span>
          <ChevronDownIcon className="h-4 w-4 ml-auto" />
        </button>
      )}
    </div>
  );

  const renderFAQSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Frequently Asked Questions
        </h3>
        <button
          onClick={() => setActiveSection('help')}
          className="text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {faqItems.map((faq) => {
          const IconComponent = getCategoryIcon(faq.category);
          const isExpanded = expandedFAQ === faq.id;

          return (
            <div key={faq.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => handleFAQToggle(faq.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start">
                  <IconComponent className={`h-5 w-5 mr-3 mt-0.5 ${getCategoryColor(faq.category)}`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {faq.question}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="h-4 w-4 text-gray-500 ml-2" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-500 ml-2" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="pl-8 text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-3">
          Didn't find what you're looking for?
        </p>
        <button
          onClick={() => setActiveSection('contact')}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Contact Support →
        </button>
      </div>
    </div>
  );

  const renderContactSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Contact Support
        </h3>
        <button
          onClick={() => setActiveSection('help')}
          className="text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        {contactOptions.map((option) => (
          <div key={option.type} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <option.icon className="h-5 w-5 text-gray-600 mr-3" />
              <span className="font-medium text-gray-900">{option.label}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{option.value}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{option.available}</span>
              <button
                onClick={option.action}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {option.type === 'phone' ? 'Call Now' : option.type === 'chat' ? 'Start Chat' : 'Browse'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Office Hours</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
          <p>Saturday: 9:00 AM - 2:00 PM</p>
          <p>Sunday: Closed</p>
          <p className="text-xs text-blue-600 mt-2">
            Emergency assistance available 24/7
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'faq': return renderFAQSection();
      case 'contact': return renderContactSection();
      default: return renderHelpSection();
    }
  };

  if (isFloating) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        {!isExpanded ? (
          // Collapsed floating button
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
            aria-label="Get Help"
          >
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </button>
        ) : (
          // Expanded floating widget
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 max-h-96 overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Quick Help</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-blue-200 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline widget (not floating)
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {renderContent()}
    </div>
  );
};

export default QuickHelpWidget;
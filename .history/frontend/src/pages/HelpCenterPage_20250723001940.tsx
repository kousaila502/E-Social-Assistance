// src/pages/HelpCenterPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeartIcon,
  AcademicCapIcon,
  HomeIcon,
  PlayIcon,
  BookOpenIcon,
  LightBulbIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'getting-started' | 'application-process' | 'eligibility' | 'documents' | 'payments' | 'account' | 'technical';
  tags: string[];
  helpful: number;
  views: number;
  lastUpdated: string;
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  faqCount: number;
  articles: number;
}

interface ContactMethod {
  type: 'phone' | 'chat' | 'email' | 'office';
  title: string;
  description: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  availability: string;
  isAvailable: boolean;
  action: string;
}

const HelpCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FAQItem[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Mock FAQ data - in real app, this would come from API
  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I apply for assistance?',
      answer: 'You can apply for assistance by visiting our Services page and selecting the type of help you need. The application process is guided and takes about 10-15 minutes to complete. You\'ll need to provide basic information about yourself and upload any required documents.',
      category: 'getting-started',
      tags: ['application', 'getting started', 'services'],
      helpful: 245,
      views: 1250,
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      question: 'What documents do I need to apply?',
      answer: 'Required documents vary by service type, but typically include: valid government-issued ID, proof of income (pay stubs, benefit statements), proof of residence (utility bill, lease agreement), and any service-specific documents. The application form will show exactly what you need for your specific request.',
      category: 'documents',
      tags: ['documents', 'requirements', 'ID', 'proof'],
      helpful: 189,
      views: 892,
      lastUpdated: '2024-01-20'
    },
    {
      id: '3',
      question: 'How long does it take to get approved?',
      answer: 'Processing times vary by service type and urgency level. Emergency assistance is typically reviewed within 24-48 hours. Standard applications take 3-10 business days. You\'ll receive email notifications at each step of the process.',
      category: 'application-process',
      tags: ['processing time', 'approval', 'timeline'],
      helpful: 167,
      views: 743,
      lastUpdated: '2024-01-18'
    },
    {
      id: '4',
      question: 'How do I check my eligibility score?',
      answer: 'Your eligibility score is automatically calculated based on the information in your profile. You can view it by going to your Profile page. The score is updated whenever you modify your personal, economic, or family information. A higher score may qualify you for more services.',
      category: 'eligibility',
      tags: ['eligibility', 'score', 'qualification', 'profile'],
      helpful: 134,
      views: 567,
      lastUpdated: '2024-01-22'
    },
    {
      id: '5',
      question: 'When and how will I receive payment?',
      answer: 'Once your application is approved, payments are processed within 2-5 business days. You\'ll receive payment via bank transfer to the account information provided in your profile. You\'ll get email notifications when payment is initiated and completed.',
      category: 'payments',
      tags: ['payment', 'bank transfer', 'timeline', 'money'],
      helpful: 201,
      views: 934,
      lastUpdated: '2024-01-19'
    },
    {
      id: '6',
      question: 'Can I apply for multiple services at once?',
      answer: 'Yes, you can apply for multiple services, but each application is reviewed separately. Some services have restrictions on concurrent applications, which will be clearly indicated. We recommend applying for your most urgent need first.',
      category: 'application-process',
      tags: ['multiple applications', 'services', 'concurrent'],
      helpful: 98,
      views: 456,
      lastUpdated: '2024-01-16'
    },
    {
      id: '7',
      question: 'I forgot my password. How do I reset it?',
      answer: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive a secure link to reset your password. Make sure to check your spam folder if you don\'t see the email within a few minutes.',
      category: 'account',
      tags: ['password', 'reset', 'login', 'account'],
      helpful: 76,
      views: 312,
      lastUpdated: '2024-01-21'
    },
    {
      id: '8',
      question: 'What if my application is rejected?',
      answer: 'If your application is not approved, you\'ll receive a detailed explanation of the decision. You can appeal the decision within 30 days by contacting our support team. You\'re also free to apply for other services or reapply after addressing the issues mentioned in the rejection.',
      category: 'application-process',
      tags: ['rejection', 'appeal', 'denied', 'reapply'],
      helpful: 112,
      views: 387,
      lastUpdated: '2024-01-17'
    }
  ];

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn the basics of using our services',
      icon: SparklesIcon,
      color: 'bg-blue-500',
      faqCount: 8,
      articles: 12
    },
    {
      id: 'application-process',
      title: 'Application Process',
      description: 'How to apply and track your applications',
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      faqCount: 12,
      articles: 15
    },
    {
      id: 'eligibility',
      title: 'Eligibility & Requirements',
      description: 'Understand qualification criteria',
      icon: ShieldCheckIcon,
      color: 'bg-purple-500',
      faqCount: 6,
      articles: 8
    },
    {
      id: 'documents',
      title: 'Documents & Verification',
      description: 'Required documents and verification process',
      icon: BookOpenIcon,
      color: 'bg-orange-500',
      faqCount: 9,
      articles: 11
    },
    {
      id: 'payments',
      title: 'Payments & Disbursements',
      description: 'Payment process and timelines',
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      faqCount: 7,
      articles: 9
    },
    {
      id: 'account',
      title: 'Account Management',
      description: 'Managing your profile and settings',
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
      faqCount: 5,
      articles: 7
    },
    {
      id: 'technical',
      title: 'Technical Support',
      description: 'Technical issues and troubleshooting',
      icon: LightBulbIcon,
      color: 'bg-red-500',
      faqCount: 4,
      articles: 6
    }
  ];

  const contactMethods: ContactMethod[] = [
    {
      type: 'phone',
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      value: '+213-XXX-XXXX',
      icon: PhoneIcon,
      color: 'bg-green-600',
      availability: 'Mon-Fri, 8 AM - 6 PM',
      isAvailable: isBusinessHours(),
      action: 'Call Now'
    },
    {
      type: 'chat',
      title: 'Live Chat',
      description: 'Get instant help with our chat support',
      value: 'Start chatting now',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-blue-600',
      availability: 'Mon-Fri, 8 AM - 8 PM',
      isAvailable: isChatAvailable(),
      action: 'Start Chat'
    },
    {
      type: 'email',
      title: 'Email Support',
      description: 'Send us your questions via email',
      value: 'support@social-assistance.dz',
      icon: InformationCircleIcon,
      color: 'bg-purple-600',
      availability: 'Response within 24 hours',
      isAvailable: true,
      action: 'Send Email'
    },
    {
      type: 'office',
      title: 'Visit Our Office',
      description: 'Meet with us in person',
      value: 'Oran, Algeria',
      icon: HomeIcon,
      color: 'bg-orange-600',
      availability: 'Mon-Fri, 9 AM - 4 PM',
      isAvailable: isOfficeOpen(),
      action: 'Get Directions'
    }
  ];

  function isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
  }

  function isChatAvailable(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return day >= 1 && day <= 5 && hour >= 8 && hour < 20;
  }

  function isOfficeOpen(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 16;
  }

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      setLoading(true);
      const timer = setTimeout(() => {
        const filtered = faqData.filter(faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setSearchResults(filtered);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Update URL params when search/category changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    setSearchParams(params);
  }, [searchQuery, selectedCategory, setSearchParams]);

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    setExpandedFAQ(null);
  };

  const handleContactAction = (method: ContactMethod) => {
    switch (method.type) {
      case 'phone':
        window.open(`tel:${method.value}`);
        break;
      case 'chat':
        // Open chat widget or navigate to chat page
        console.log('Opening chat...');
        break;
      case 'email':
        window.open(`mailto:${method.value}`);
        break;
      case 'office':
        // Open maps or directions
        window.open('https://maps.google.com');
        break;
    }
  };

  const getDisplayedFAQs = () => {
    if (searchQuery.trim()) return searchResults;
    if (selectedCategory) {
      return faqData.filter(faq => faq.category === selectedCategory);
    }
    return faqData.slice(0, 8); // Show top 8 by default
  };

  const renderSearchSection = () => (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        How can we help you?
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        Find answers to common questions, browse our guides, or get in touch with our support team.
      </p>
      
      <div className="max-w-2xl mx-auto relative">
        <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {searchQuery && (
        <p className="text-sm text-gray-500 mt-3">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found for "{searchQuery}"
        </p>
      )}
    </div>
  );

  const renderPopularTopics = () => {
    if (searchQuery || selectedCategory) return null;
    
    const popularQuestions = faqData
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
    
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularQuestions.map((faq) => (
            <button
              key={faq.id}
              onClick={() => handleFAQToggle(faq.id)}
              className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start">
                <QuestionMarkCircleIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm line-clamp-2">
                    {faq.question}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <span>{faq.views} views</span>
                    <span className="mx-2">•</span>
                    <span>{faq.helpful} helpful</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCategories = () => {
    if (searchQuery) return null;
    
    const displayedCategories = showAllCategories ? helpCategories : helpCategories.slice(0, 6);
    
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory('')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All Categories
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCategories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`text-left p-6 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                  isSelected
                    ? 'bg-blue-50 border-2 border-blue-300 shadow-lg'
                    : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start">
                  <div className={`${category.color} p-3 rounded-lg mr-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{category.faqCount} FAQs</span>
                      <span className="mx-2">•</span>
                      <span>{category.articles} Articles</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {!showAllCategories && helpCategories.length > 6 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowAllCategories(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Categories →
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFAQs = () => {
    const displayedFAQs = getDisplayedFAQs();
    
    if (displayedFAQs.length === 0) {
      return (
        <div className="text-center py-12">
          <QuestionMarkCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No results found' : 'No FAQs available'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms or browse our categories below.'
              : 'Check back soon for frequently asked questions.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Search
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory
              ? helpCategories.find(cat => cat.id === selectedCategory)?.title
              : searchQuery
              ? 'Search Results'
              : 'Frequently Asked Questions'
            }
          </h2>
          <span className="text-sm text-gray-500">
            {displayedFAQs.length} question{displayedFAQs.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="space-y-4">
          {displayedFAQs.map((faq) => (
            <div key={faq.id} className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => handleFAQToggle(faq.id)}
                className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span>{faq.views} views</span>
                      <span>{faq.helpful} found helpful</span>
                      <span className="capitalize">{faq.category.replace('-', ' ')}</span>
                    </div>
                  </div>
                  {expandedFAQ === faq.id ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  )}
                </div>
              </button>
              
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-6">
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                    {faq.answer}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Was this helpful?</span>
                      <div className="flex items-center space-x-2">
                        <button className="text-green-600 hover:text-green-700">
                          👍 Yes
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          👎 No
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {faq.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContactSection = () => (
    <div className="bg-gray-50 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Can't find what you're looking for? Our support team is here to help you every step of the way.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contactMethods.map((method) => {
          const IconComponent = method.icon;
          
          return (
            <div key={method.type} className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-start">
                <div className={`${method.color} p-3 rounded-lg mr-4`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="font-semibold text-gray-900">{method.title}</h3>
                    {method.isAvailable && (
                      <span className="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">{method.value}</p>
                    <p className="text-xs text-gray-500">{method.availability}</p>
                    <button
                      onClick={() => handleContactAction(method)}
                      disabled={!method.isAvailable}
                      className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 ${
                        method.isAvailable
                          ? `${method.color} text-white hover:opacity-90`
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {method.action}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
          <div className="flex items-center text-blue-800">
            <ClockIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              Emergency assistance is available 24/7 by calling our hotline
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search Section */}
          {renderSearchSection()}
          
          {/* Popular Topics */}
          {renderPopularTopics()}
          
          {/* Categories */}
          {renderCategories()}
          
          {/* FAQs */}
          {renderFAQs()}
          
          {/* Contact Section */}
          {renderContactSection()}
        </div>
      </div>
    </MainLayout>
  );
};

export default HelpCenterPage;
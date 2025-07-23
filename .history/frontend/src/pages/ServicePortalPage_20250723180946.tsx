// src/pages/ServicePortalPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';
import ServiceCategoryCard from '../components/ServicePortal/ServiceCategoryCard';
import requestService from '../services/requestService';
import announcementService, { Announcement } from '../services/announcementService';
import {
    HomeIcon,
    HeartIcon,
    AcademicCapIcon,
    CurrencyDollarIcon,
    ShoppingBagIcon,
    ExclamationTriangleIcon,
    ChatBubbleLeftRightIcon,
    QuestionMarkCircleIcon,
    ClipboardDocumentListIcon,
    SparklesIcon,
    UserIcon,
    ShieldCheckIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline';
import AnnouncementCard from '../components/Announcements/AnnouncementCard';

const ServicePortalPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate(); // Add this hook
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Only fetch announcements for regular users - no admin stats needed
                const announcementData = await announcementService.getByStatus('published', { limit: 3 });

                // Sort announcements by createdAt in the frontend since backend doesn't support sorting
                const sortedAnnouncements = (announcementData.announcements || [])
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3);

                setAnnouncements(sortedAnnouncements);
                // Remove dashboard stats - users don't need them
                setDashboardStats(null);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Don't break the page if announcements fail
                setAnnouncements([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Service categories mapped to your backend categories with real program logic
    const serviceCategories = [
        {
            id: 'housing',
            title: 'Housing Support',
            description: 'Get help with rent, utilities, or finding a safe place to live',
            icon: HomeIcon,
            color: 'blue' as const,
            category: 'housing_support' as const,
            programType: 'Content' as const,
            programId: 'housing_content_program', // You'll replace with actual IDs
            isPopular: true,
            examples: ['Rent assistance', 'Utility bills', 'Emergency housing'],
            maxAmount: 2000,
            avgProcessingDays: 5
        },
        {
            id: 'healthcare',
            title: 'Healthcare Assistance',
            description: 'Support with medical bills, medications, and health services',
            icon: HeartIcon,
            color: 'red' as const,
            category: 'medical_assistance' as const,
            programType: 'Content' as const,
            programId: 'healthcare_content_program',
            isPopular: true,
            examples: ['Medical bills', 'Prescription costs', 'Dental care'],
            maxAmount: 1500,
            avgProcessingDays: 3
        },
        {
            id: 'education',
            title: 'Education & Training',
            description: 'Help with school fees, books, and skill development programs',
            icon: AcademicCapIcon,
            color: 'purple' as const,
            category: 'educational_support' as const,
            programType: 'Content' as const,
            programId: 'education_content_program',
            examples: ['School fees', 'Books & supplies', 'Training courses'],
            maxAmount: 1000,
            avgProcessingDays: 7
        },
        {
            id: 'emergency',
            title: 'Emergency Help',
            description: 'Urgent assistance for unexpected situations and crises',
            icon: ExclamationTriangleIcon,
            color: 'yellow' as const,
            category: 'emergency_assistance' as const,
            programType: 'Content' as const,
            programId: 'emergency_content_program',
            isPopular: true,
            examples: ['Crisis support', 'Disaster relief', 'Urgent needs'],
            maxAmount: 3000,
            avgProcessingDays: 1
        },
        {
            id: 'food',
            title: 'Food Assistance',
            description: 'Food vouchers, meal programs, and nutrition support',
            icon: ShoppingBagIcon,
            color: 'orange' as const,
            category: 'food_assistance' as const,
            programType: 'Content' as const,
            programId: 'food_content_program',
            examples: ['Food vouchers', 'Meal programs', 'Nutrition support'],
            maxAmount: 500,
            avgProcessingDays: 2
        },
        {
            id: 'employment',
            title: 'Employment Support',
            description: 'Job training, unemployment benefits, and career assistance',
            icon: CurrencyDollarIcon,
            color: 'green' as const,
            category: 'employment_support' as const,
            programType: 'Content' as const,
            programId: 'employment_content_program',
            examples: ['Job training', 'Unemployment aid', 'Career counseling'],
            maxAmount: 1200,
            avgProcessingDays: 10
        },
        {
            id: 'elderly',
            title: 'Elderly Care',
            description: 'Support services for seniors and elderly community members',
            icon: UserIcon,
            color: 'indigo' as const,
            category: 'elderly_care' as const,
            programType: 'Content' as const,
            programId: 'elderly_content_program',
            examples: ['Senior services', 'Home care', 'Medical support'],
            maxAmount: 800,
            avgProcessingDays: 4
        },
        {
            id: 'disability',
            title: 'Disability Support',
            description: 'Assistance for individuals with disabilities and special needs',
            icon: ShieldCheckIcon,
            color: 'teal' as const,
            category: 'disability_support' as const,
            programType: 'Content' as const,
            programId: 'disability_content_program',
            examples: ['Mobility aids', 'Special equipment', 'Care services'],
            maxAmount: 2500,
            avgProcessingDays: 6
        }
    ];

    const quickActions = [
        {
            title: 'Check My Applications',
            description: 'See the status of your requests',
            icon: ClipboardDocumentListIcon,
            link: '/my-applications',
            color: 'bg-indigo-600 hover:bg-indigo-700',
            count: 0 // Remove admin stats reference
        },
        {
            title: 'Browse Opportunities',
            description: 'View available programs and events',
            icon: MegaphoneIcon,
            link: '/help',
            color: 'bg-purple-600 hover:bg-purple-700',
            count: announcements?.length || 0
        },
        {
            title: 'Get Help',
            description: 'Chat with our support team',
            icon: ChatBubbleLeftRightIcon,
            link: '/help',
            color: 'bg-teal-600 hover:bg-teal-700'
        }
    ];

    if (loading) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your services...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Welcome Section */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center items-center mb-4">
                            <SparklesIcon className="h-8 w-8 text-blue-600 mr-3" />
                            <h1 className="text-4xl font-bold text-gray-900">
                                {getGreeting()}, {user?.name || 'Friend'}!
                            </h1>
                        </div>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            We're here to help you access the support you need.
                            Choose a service below to get started, or check on your existing applications.
                        </p>

                        {/* User Status Indicator */}
                        {user?.eligibility && (
                            <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
                                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                                <span className="text-sm font-medium">
                                    Eligibility Status: {user.eligibility.status === 'verified' ? 'Verified' : 'Under Review'}
                                    {user.eligibility.score && ` (Score: ${user.eligibility.score})`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Latest Opportunities */}
                    {announcements && announcements.length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-gray-900">Latest Opportunities</h2>
                                <button
                                    className="text-blue-600 hover:text-blue-700 font-medium text-lg transition-colors duration-200"
                                    onClick={() => navigate('/announcements')}
                                >
                                    View All →
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {announcements.slice(0, 3).map((announcement) => (
                                    <AnnouncementCard
                                        key={announcement._id}
                                        announcement={announcement}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {quickActions.map((action) => (
                            <button
                                key={action.title}
                                className={`${action.color} text-white rounded-xl p-6 text-left transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl`}
                                onClick={() => navigate(action.link)} // Use navigate instead
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <action.icon className="h-8 w-8 mr-4" />
                                        <div>
                                            <h3 className="text-lg font-semibold">{action.title}</h3>
                                            <p className="text-sm opacity-90">{action.description}</p>
                                        </div>
                                    </div>
                                    {action.count !== undefined && action.count > 0 && (
                                        <div className="bg-white bg-opacity-20 text-white text-sm font-bold px-3 py-1 rounded-full">
                                            {action.count}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Service Categories */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                            How can we help you today?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {serviceCategories.map((service) => (
                                <ServiceCategoryCard
                                    key={service.id}
                                    id={service.id}
                                    title={service.title}
                                    description={service.description}
                                    icon={service.icon}
                                    color={service.color}
                                    category={service.category}
                                    programType={service.programType}
                                    programId={service.programId}
                                    isPopular={service.isPopular}
                                    examples={service.examples}
                                    maxAmount={service.maxAmount}
                                    avgProcessingDays={service.avgProcessingDays}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                        <QuestionMarkCircleIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                            Need help or have questions?
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                            Our support team is here to guide you through the process.
                            You can also check our frequently asked questions for quick answers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                                onClick={() => navigate('/help')} // Use navigate instead
                            >
                                Get Help Now
                            </button>
                            <button
                                className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                                onClick={() => navigate('/help')} // Use navigate instead (FAQ will be part of help center)
                            >
                                View FAQ
                            </button>
                        </div>
                    </div>

                    {/* Trust & Security Footer */}
                    <div className="text-center mt-12">
                        <div className="flex items-center justify-center mb-4">
                            <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
                            <span className="text-green-600 font-medium">Your data is secure and protected</span>
                        </div>
                        <p className="text-gray-500">
                            We use advanced security measures to protect your personal information.
                            Our support team is here to help you every step of the way.
                        </p>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
};

export default ServicePortalPage;
// src/components/RequestManagement/StatusTimeline.tsx
import React from 'react';
import { Demande } from '../../config/apiConfig';
import { REQUEST_STATUS_CONFIG } from '../../utils/constants';
import {
  DocumentTextIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  PaperClipIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  BanknotesIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'assignment' | 'comment' | 'document_upload' | 'document_verification' | 'payment' | 'system';
  title: string;
  description: string;
  timestamp: string;
  actor: {
    name: string;
    role: string;
  };
  status?: string;
  metadata?: {
    previousStatus?: string;
    newStatus?: string;
    amount?: number;
    documentName?: string;
    assigneeName?: string;
    commentType?: 'internal' | 'external';
    paymentMethod?: string;
  };
}

interface StatusTimelineProps {
  request: Demande;
  events?: TimelineEvent[];
  showDetailed?: boolean;
  maxEvents?: number;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({
  request,
  events = [],
  showDetailed = true,
  maxEvents
}) => {
  // Generate timeline events from request data and provided events
  const generateTimelineEvents = (): TimelineEvent[] => {
    const allEvents: TimelineEvent[] = [];

    // Add creation event
    allEvents.push({
      id: 'created',
      type: 'status_change',
      title: 'Request Submitted',
      description: `${request.applicant.name} submitted a new assistance request`,
      timestamp: request.createdAt,
      actor: {
        name: request.applicant.name,
        role: 'user'
      },
      status: 'submitted',
      metadata: {
        newStatus: 'submitted'
      }
    });

    // Add assignment event if assigned
    if (request.assignedTo) {
      allEvents.push({
        id: 'assigned',
        type: 'assignment',
        title: 'Case Worker Assigned',
        description: `Request assigned to ${request.assignedTo.name}`,
        timestamp: request.updatedAt, // In real app, this would be actual assignment timestamp
        actor: {
          name: 'System',
          role: 'system'
        },
        metadata: {
          assigneeName: request.assignedTo.name
        }
      });
    }

    // Add current status event if not draft or submitted
    if (request.status !== 'draft' && request.status !== 'submitted') {
      const statusConfig = REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG];
      allEvents.push({
        id: 'current_status',
        type: 'status_change',
        title: `Request ${statusConfig?.label || request.status}`,
        description: getStatusDescription(request.status, request),
        timestamp: request.updatedAt,
        actor: {
          name: request.assignedTo?.name || 'System',
          role: request.assignedTo?.role || 'system'
        },
        status: request.status,
        metadata: {
          newStatus: request.status,
          ...(request.approvedAmount && { amount: request.approvedAmount })
        }
      });
    }

    // Add payment events if paid
    if (request.paidAmount && request.paidAmount > 0) {
      allEvents.push({
        id: 'payment',
        type: 'payment',
        title: 'Payment Processed',
        description: `Payment of ${formatCurrency(request.paidAmount)} has been processed`,
        timestamp: request.updatedAt, // In real app, this would be payment timestamp
        actor: {
          name: 'Finance Department',
          role: 'finance_manager'
        },
        metadata: {
          amount: request.paidAmount,
          paymentMethod: 'bank_transfer'
        }
      });
    }

    // Merge with provided events and sort by timestamp
    const mergedEvents = [...allEvents, ...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Limit events if maxEvents is specified
    return maxEvents ? mergedEvents.slice(-maxEvents) : mergedEvents;
  };

  const getStatusDescription = (status: string, request: Demande): string => {
    switch (status) {
      case 'under_review':
        return 'Request is being reviewed by the case worker';
      case 'pending_docs':
        return 'Additional documentation has been requested';
      case 'approved':
        return `Request approved for ${request.approvedAmount ? formatCurrency(request.approvedAmount) : 'specified amount'}`;
      case 'rejected':
        return 'Request has been rejected after review';
      case 'partially_paid':
        return 'Partial payment has been processed';
      case 'paid':
        return 'Full payment has been completed';
      case 'cancelled':
        return 'Request was cancelled by the applicant';
      default:
        return `Request status updated to ${status}`;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getEventIcon = (event: TimelineEvent) => {
    const iconClass = "h-6 w-6 text-white";
    
    switch (event.type) {
      case 'status_change':
        switch (event.status) {
          case 'submitted':
            return <DocumentTextIcon className={iconClass} />;
          case 'under_review':
            return <ClockIcon className={iconClass} />;
          case 'approved':
            return <CheckCircleIcon className={iconClass} />;
          case 'rejected':
            return <XCircleIcon className={iconClass} />;
          case 'pending_docs':
            return <PaperClipIcon className={iconClass} />;
          default:
            return <ArrowPathIcon className={iconClass} />;
        }
      case 'assignment':
        return <UserIcon className={iconClass} />;
      case 'comment':
        return <ChatBubbleLeftRightIcon className={iconClass} />;
      case 'document_upload':
        return <PaperClipIcon className={iconClass} />;
      case 'document_verification':
        return <DocumentCheckIcon className={iconClass} />;
      case 'payment':
        return <BanknotesIcon className={iconClass} />;
      case 'system':
        return <ExclamationTriangleIcon className={iconClass} />;
      default:
        return <ClockIcon className={iconClass} />;
    }
  };

  const getEventColor = (event: TimelineEvent): string => {
    switch (event.type) {
      case 'status_change':
        switch (event.status) {
          case 'submitted':
            return 'bg-blue-500';
          case 'under_review':
            return 'bg-yellow-500';
          case 'approved':
            return 'bg-green-500';
          case 'rejected':
            return 'bg-red-500';
          case 'pending_docs':
            return 'bg-orange-500';
          default:
            return 'bg-gray-500';
        }
      case 'assignment':
        return 'bg-purple-500';
      case 'comment':
        return 'bg-indigo-500';
      case 'document_upload':
        return 'bg-cyan-500';
      case 'document_verification':
        return 'bg-teal-500';
      case 'payment':
        return 'bg-emerald-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getRoleDisplayName = (role: string): string => {
    const roleNames: Record<string, string> = {
      'admin': 'Administrator',
      'case_worker': 'Case Worker',
      'finance_manager': 'Finance Manager',
      'user': 'Applicant',
      'system': 'System'
    };
    return roleNames[role] || role;
  };

  const timelineEvents = generateTimelineEvents();

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No timeline events available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Request Timeline</h3>
        <div className="text-sm text-gray-500">
          {timelineEvents.length} event{timelineEvents.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Current Status Summary */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG]?.color === 'green' ? 'bg-green-500' :
              REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG]?.color === 'red' ? 'bg-red-500' :
              REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG]?.color === 'yellow' ? 'bg-yellow-500' :
              REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG]?.color === 'blue' ? 'bg-blue-500' :
              'bg-gray-500'
            }`} />
            <div>
              <p className="font-medium text-gray-900">
                Current Status: {REQUEST_STATUS_CONFIG[request.status as keyof typeof REQUEST_STATUS_CONFIG]?.label || request.status}
              </p>
              <p className="text-sm text-gray-600">
                Last updated {formatDate(request.updatedAt)}
              </p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {Math.floor((Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
            <div className="text-xs text-gray-500">since submission</div>
          </div>
        </div>
      </div>

      {/* Timeline Events */}
      <div className="flow-root">
        <ul className="-mb-8">
          {timelineEvents.map((event, eventIdx) => (
            <li key={event.id}>
              <div className="relative pb-8">
                {/* Connecting Line */}
                {eventIdx !== timelineEvents.length - 1 && (
                  <span
                    className="absolute top-8 left-6 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex space-x-4">
                  {/* Event Icon */}
                  <div>
                    <span className={`h-12 w-12 rounded-full flex items-center justify-center ring-8 ring-white ${getEventColor(event)}`}>
                      {getEventIcon(event)}
                    </span>
                  </div>
                  
                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        
                        {/* Event Metadata */}
                        {showDetailed && event.metadata && (
                          <div className="mt-2 space-y-1">
                            {event.metadata.amount && (
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                                <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                                {formatCurrency(event.metadata.amount)}
                              </div>
                            )}
                            
                            {event.metadata.documentName && (
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                <PaperClipIcon className="h-3 w-3 mr-1" />
                                {event.metadata.documentName}
                              </div>
                            )}
                            
                            {event.metadata.assigneeName && (
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                <UserIcon className="h-3 w-3 mr-1" />
                                {event.metadata.assigneeName}
                              </div>
                            )}
                            
                            {event.metadata.paymentMethod && (
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mr-2">
                                <BanknotesIcon className="h-3 w-3 mr-1" />
                                {event.metadata.paymentMethod.replace('_', ' ')}
                              </div>
                            )}
                            
                            {event.metadata.commentType && (
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                event.metadata.commentType === 'internal' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                                {event.metadata.commentType} comment
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-sm text-gray-900">{formatDate(event.timestamp)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          by {event.actor.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {getRoleDisplayName(event.actor.role)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline Footer */}
      {maxEvents && timelineEvents.length >= maxEvents && (
        <div className="text-center pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View complete timeline →
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusTimeline;
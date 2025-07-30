# E-Social-Assistance 🏛️

**Enterprise-Grade Social Assistance Management System**

A comprehensive digital platform for managing social welfare programs, assistance requests, budget allocation, and payment processing. Built with modern web technologies to streamline social services administration and improve beneficiary experience.

## 🌟 Overview

E-Social-Assistance is a full-stack web application designed to digitize and optimize social welfare operations. The system provides role-based access control, automated workflows, and comprehensive analytics to help organizations efficiently manage social assistance programs.

### Key Features

- **🔐 Multi-Role Authentication System** - Admin, Case Worker, Finance Manager, and Applicant roles
- **📋 Request Management Workflow** - Complete lifecycle from submission to payment
- **💰 Budget Pool Management** - Allocation tracking and financial oversight
- **💳 Payment Processing** - Secure payment workflows with multiple methods
- **📊 Analytics Dashboard** - Real-time insights and performance metrics
- **📢 Announcement System** - Program notifications and public communications
- **🔔 Notification Center** - Real-time updates and status tracking
- **📱 Responsive Design** - Mobile-friendly interface with modern UI/UX

## 🛠️ Technology Stack

### Backend (Express.js)
- **Framework**: Express.js with TypeScript-style architecture
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with HTTP-only cookies (cross-origin ready)
- **Security**: Helmet, CORS, Rate Limiting, MongoDB Sanitization
- **Documentation**: Swagger/OpenAPI 3.0
- **File Upload**: Multer with validation
- **Email**: Nodemailer integration
- **Deployment**: Render (Production), Local development support

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: React Context + Custom Hooks
- **Routing**: React Router v6
- **Forms**: React Hook Form with validation
- **HTTP Client**: Axios with interceptors
- **Icons**: Heroicons
- **Deployment**: Vercel (Production)

## 🌐 Live Application

### Production URLs
- **Frontend**: [https://enterprise-social-platform.vercel.app](https://enterprise-social-platform.vercel.app)
- **Backend API**: [https://enterprise-social-platform.onrender.com](https://enterprise-social-platform.onrender.com)
- **API Documentation**: [https://enterprise-social-platform.onrender.com/api-docs](https://enterprise-social-platform.onrender.com/api-docs)

### Demo Access
- **Admin Dashboard**: [https://enterprise-social-platform.vercel.app/admin/dashboard](https://enterprise-social-platform.vercel.app/admin/dashboard)
- **User Portal**: [https://enterprise-social-platform.vercel.app](https://enterprise-social-platform.vercel.app)

## 🏗️ Project Structure

```
E-Social-Assistance/
├── server/                          # Backend API (Node.js/Express)
│   ├── controllers/                 # Request handlers
│   │   ├── authController.js        # Authentication logic
│   │   ├── demandeController.js     # Request management
│   │   ├── userController.js        # User management
│   │   ├── budgetPoolController.js  # Budget management
│   │   └── paymentController.js     # Payment processing
│   ├── models/                      # MongoDB schemas
│   │   ├── user.js                  # User model
│   │   ├── demande.js              # Request model
│   │   ├── budgetPool.js           # Budget pool model
│   │   └── payment.js              # Payment model
│   ├── routers/                     # API routes
│   ├── middleware/                  # Security & validation
│   │   ├── authentication.js       # JWT middleware
│   │   ├── security.js             # CORS, rate limiting
│   │   └── error-handler.js        # Error handling
│   ├── utils/                       # Helper functions
│   │   ├── jwt.js                  # JWT utilities
│   │   └── sendEmail.js            # Email utilities
│   ├── swagger.yaml                # API documentation
│   └── app.js                      # Main application file
├── frontend/                        # React application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── RequestManagement/   # Request components
│   │   │   ├── UserManagement/      # User components
│   │   │   ├── BudgetManagement/    # Budget components
│   │   │   └── Common/              # Shared components
│   │   ├── pages/                   # Route components
│   │   │   ├── Dashboard/           # Dashboard pages
│   │   │   ├── Admin/               # Admin pages
│   │   │   └── Auth/                # Authentication pages
│   │   ├── services/                # API integration
│   │   │   └── requestService.ts    # API service layer
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts          # Authentication hook
│   │   │   └── useRequest.ts       # Request management hook
│   │   ├── config/                  # Configuration
│   │   │   └── apiConfig.ts        # API configuration
│   │   ├── utils/                   # Utilities & constants
│   │   │   ├── constants.ts        # App constants
│   │   │   └── errorHandler.ts     # Error handling
│   │   └── App.tsx                 # Main app component
│   ├── public/                     # Static assets
│   ├── package.json               # Dependencies
│   └── vite.config.ts             # Vite configuration
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB 5.0+
- Git

### Local Development Setup

#### Backend Setup

1. **Clone and navigate to server directory:**
```bash
git clone https://github.com/kousaila502/enterprise-social-platform.git
cd enterprise-social-platform/server
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment configuration:**
```bash
# Create .env file
cp .env.example .env

# Required environment variables:
MONGO_URL=mongodb://localhost:27017/social-assistance
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ORIGIN=http://localhost:5173
```

4. **Start the server:**
```bash
npm start
```

Server runs on `http://localhost:8080`

#### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment configuration:**
```bash
# Create .env file with:
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

4. **Start development server:**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### Production Deployment

#### Backend (Render)
1. **Connect GitHub repository** to Render
2. **Set environment variables**:
   - `MONGO_URL`: MongoDB Atlas connection string
   - `JWT_SECRET`: Secure JWT secret (32+ characters)
   - `NODE_ENV`: production
   - `ORIGIN`: https://enterprise-social-platform.vercel.app
3. **Deploy**: Automatic deployment on push to main branch

#### Frontend (Vercel)
1. **Connect GitHub repository** to Vercel
2. **Configure build settings**:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Set environment variable**:
   - `VITE_API_BASE_URL`: https://enterprise-social-platform.onrender.com/api/v1
4. **Deploy**: Automatic deployment on push to main branch

## 📋 Core Modules

### 1. User Management System
- **Multi-role Architecture**: 
  - 👑 **Admin**: Full system access and configuration
  - 👨‍💼 **Case Worker**: Request review and eligibility assessment
  - 💰 **Finance Manager**: Payment processing and budget management
  - 👤 **User/Applicant**: Request submission and profile management

- **Profile Management**: 
  - Personal information (National ID, age validation 15+)
  - Economic status tracking
  - Eligibility scoring system
  - Document management

- **Authentication Features**:
  - JWT-based authentication with HTTP-only cookies
  - Email verification system
  - Password reset functionality
  - Cross-origin authentication support

### 2. Request Management (Demandes)
- **Request Categories**: 
  - 🚨 **Emergency Assistance**: Critical financial support
  - 🏥 **Medical Assistance**: Healthcare-related support  
  - 🎓 **Educational Support**: School fees and materials
  - 🏠 **Housing Support**: Rent and housing assistance
  - 🍽️ **Food Assistance**: Nutritional support programs
  - 💼 **Employment Support**: Job training and placement
  - 👴 **Elderly Care**: Senior citizen support
  - ♿ **Disability Support**: Accessibility and care assistance

- **Workflow Management**:
  ```
  📝 Draft → 📤 Submitted → 🔍 Under Review → 📋 Pending Docs
     ↓              ↓              ↓              ↓
  ✅ Approved → 💳 Partially Paid → 💰 Paid
     ↓
  ❌ Rejected / 🚫 Cancelled / ⏰ Expired
  ```

- **Smart Status Updates**: 
  - Role-based status transitions
  - Approval/rejection workflows with detailed forms
  - Document verification tracking
  - Automated notifications

### 3. Budget Pool Management
- **Pool Categories**: Program-specific budget allocation
- **Real-time Tracking**: 
  - Total budget vs. allocated amounts
  - Utilization rates and remaining funds
  - Spending trends and projections
- **Allocation Rules**: 
  - Automated allocation based on categories
  - Manual override capabilities
  - Approval thresholds and workflows
- **Financial Reporting**: 
  - Comprehensive budget reports
  - Audit trails and transaction logs

### 4. Payment Processing System
- **Payment Methods**: 
  - 🏦 Bank Transfer
  - 💰 Cash Distribution
  - 📱 Mobile Payment (CCP, Barid Bank)
  - 📝 Check Payments

- **Payment Workflow**:
  ```
  🔄 Pending → ⚡ Processing → ✅ Completed
     ↓              ↓              ↓
  ❌ Failed → 🔄 Retry → 🚫 Cancelled
  ```

- **Advanced Features**:
  - Batch payment processing
  - Payment reconciliation
  - Fraud detection alerts
  - Comprehensive audit trails

### 5. Analytics & Reporting Dashboard
- **System Overview Metrics**:
  - Total users, active requests, processed payments
  - Budget utilization across categories
  - Geographic distribution (Wilaya-based)
  - Performance KPIs and trends

- **Advanced Analytics**:
  - 📈 12-month trend analysis
  - 🎯 Success rate tracking
  - ⏱️ Average processing times
  - 📊 Category-wise distribution
  - 🗺️ Geographic insights for Algeria

## 🔒 Security & Compliance

### Authentication & Authorization
- **JWT Security**: HTTP-only cookies with cross-origin support
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **Session Management**: Secure token refresh mechanisms
- **Password Security**: Strong password requirements and hashing

### Data Protection
- **Input Validation**: Joi schema validation for all inputs
- **MongoDB Sanitization**: Protection against NoSQL injection
- **XSS Protection**: Content Security Policy headers
- **CORS Configuration**: Secure cross-origin resource sharing
- **Rate Limiting**: API endpoint protection against abuse

### File Security
- **Secure Upload**: File type validation and size limits
- **Document Verification**: Staff verification workflow
- **Storage Security**: Secure file storage and access control

### Audit & Compliance
- **Comprehensive Logging**: All user actions and system events
- **Audit Trails**: Complete request and payment history
- **Data Privacy**: GDPR-compliant data handling
- **Backup Strategy**: Regular database backups

## 📊 API Documentation

### Base URLs
```
Development: http://localhost:8080/api/v1
Production:  https://enterprise-social-platform.onrender.com/api/v1
```

### Authentication Endpoints
```http
POST /auth/register          # User registration
POST /auth/login            # User login
POST /auth/logout           # User logout
GET  /auth/me               # Get current user
POST /auth/verify-email     # Email verification
POST /auth/forgot-password  # Password reset request
POST /auth/reset-password   # Password reset confirmation
```

### Core API Endpoints
```http
# User Management
GET    /users                    # List users (admin/case_worker)
POST   /users                    # Create user (admin)
GET    /users/profile            # Current user profile
PATCH  /users/profile            # Update profile
GET    /users/dashboard-stats    # User statistics

# Request Management (Demandes)
GET    /demandes                 # List requests (with filters)
POST   /demandes                 # Submit new request
GET    /demandes/:id             # Get request details
PATCH  /demandes/:id             # Update request
POST   /demandes/:id/submit      # Submit draft request
PATCH  /demandes/:id/review      # Review request (approve/reject)
PATCH  /demandes/:id/assign      # Assign to case worker
PATCH  /demandes/:id/cancel      # Cancel request
POST   /demandes/:id/documents   # Upload documents
POST   /demandes/:id/comments    # Add comment
GET    /demandes/dashboard-stats # Request statistics

# Budget Pool Management
GET    /budget-pools             # List budget pools
POST   /budget-pools             # Create budget pool
GET    /budget-pools/:id         # Get pool details
PATCH  /budget-pools/:id         # Update pool
POST   /budget-pools/:id/allocate# Allocate funds
GET    /budget-pools/dashboard-stats # Budget statistics

# Payment Processing
GET    /payments                 # List payments
POST   /payments                 # Create payment
PATCH  /payments/:id/process     # Process payment
PATCH  /payments/:id/cancel      # Cancel payment
GET    /payments/dashboard-stats # Payment statistics

# System Health
GET    /health                   # System health check
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalCount": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "value": "",
      "location": "body"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🎯 User Roles & Detailed Permissions

### 👑 Administrator
**Full System Access**
- User management (create, update, delete, restore)
- System configuration and settings
- All analytics and comprehensive reports
- Budget pool creation and management
- Payment processing oversight
- Announcement and content management

### 👨‍💼 Case Worker
**Request Processing & Management**
- Request review and status updates
- User eligibility assessment and scoring
- Document verification and validation
- Workflow management and assignment
- Client communication and case notes
- Category-specific analytics access

### 💰 Finance Manager
**Financial Operations**
- Payment processing and approval
- Budget pool allocation and monitoring
- Financial reporting and reconciliation
- Payment method configuration
- Audit trail access and review
- Financial analytics and insights

### 👤 User/Applicant
**Self-Service Portal**
- Request submission and management
- Profile and document management
- Real-time status tracking
- Payment history access
- Notification preferences
- Support communication

## 🔧 Development Guide

### Available Scripts

**Backend (Server):**
```bash
npm start              # Start server with nodemon (development)
npm run prod           # Production mode with PM2
npm run test           # Run test suite
npm run lint           # ESLint code checking
```

**Frontend:**
```bash
npm run dev            # Development server with hot reload
npm run build          # Production build optimization
npm run preview        # Preview production build locally
npm run lint           # ESLint and type checking
npm run type-check     # TypeScript type checking only
```

### Code Quality Standards
- **TypeScript**: Strict type checking for frontend
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Joi Validation**: Backend input validation
- **Git Hooks**: Pre-commit quality checks
- **Testing**: Unit and integration tests

### Development Workflow
1. **Feature Branch**: Create from `main` branch
2. **Development**: Implement with tests
3. **Code Review**: Submit pull request
4. **Quality Checks**: Automated testing and linting
5. **Deployment**: Automatic deployment on merge

## 📈 Performance & Scalability

### Backend Optimizations
- **Database Indexing**: Optimized MongoDB queries with proper indexes
- **Caching Strategy**: Redis implementation for frequent queries
- **Rate Limiting**: API protection with configurable limits
- **Compression**: Gzip compression for API responses
- **Connection Pooling**: Efficient database connection management

### Frontend Optimizations
- **Code Splitting**: Lazy loading for route-based components
- **Asset Optimization**: Vite's built-in optimization
- **State Management**: Efficient React Context usage
- **Bundle Analysis**: Regular bundle size monitoring
- **CDN Integration**: Static asset delivery optimization

### Monitoring & Analytics
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Response time tracking
- **User Analytics**: Usage pattern analysis
- **Health Checks**: Automated system monitoring

## 🌍 Localization & Regional Features

### Internationalization Ready
- **Multi-language Support**: Arabic, French, English
- **RTL Support**: Right-to-left layout compatibility
- **Cultural Adaptation**: Algerian cultural considerations
- **Date/Time**: Local timezone and calendar support

### Algerian-Specific Features
- **Wilaya Integration**: All 58 Algerian provinces
- **National ID Validation**: Algerian national ID format
- **Phone Number Validation**: Local (+213) and mobile formats
- **Currency**: Algerian Dinar (DZD) with proper formatting
- **Banking Integration**: Local payment methods (CCP, Barid Bank)

## 🚢 Deployment & DevOps

### Production Infrastructure
- **Frontend**: Vercel (Global CDN, Edge Functions)
- **Backend**: Render (Auto-scaling, Health Monitoring)
- **Database**: MongoDB Atlas (Replica Sets, Backup)
- **File Storage**: Secure cloud storage with CDN
- **Email Service**: Production SMTP configuration

### Environment Configuration

**Production Environment Variables (Backend):**
```bash
NODE_ENV=production
MONGO_URL=mongodb+srv://...
JWT_SECRET=secure-production-secret-32-chars
ORIGIN=https://enterprise-social-platform.vercel.app
EMAIL_HOST=smtp.production-service.com
EMAIL_PORT=587
EMAIL_USER=production@email.com
EMAIL_PASS=secure_app_password
```

**Production Environment Variables (Frontend):**
```bash
VITE_API_BASE_URL=https://enterprise-social-platform.onrender.com/api/v1
```

### Deployment Checklist
- ✅ **Environment Variables**: All production values configured
- ✅ **Database**: MongoDB Atlas cluster configured with security
- ✅ **Authentication**: Cross-origin cookie configuration
- ✅ **CORS**: Production domains whitelisted
- ✅ **SSL/HTTPS**: Automatic HTTPS for all endpoints
- ✅ **Monitoring**: Health checks and error tracking enabled
- ✅ **Backup**: Automated database backup strategy
- ✅ **Documentation**: API documentation accessible

### Continuous Integration/Deployment
- **GitHub Integration**: Automatic deployments on push
- **Build Optimization**: Production-ready builds
- **Health Monitoring**: Automatic failure detection
- **Rollback Strategy**: Quick rollback capabilities

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests**: Controller and utility function testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Model validation and queries
- **Security Tests**: Authentication and authorization

### Frontend Testing
- **Component Tests**: React component testing
- **Integration Tests**: User flow testing
- **E2E Tests**: Complete workflow validation
- **Accessibility Tests**: WCAG compliance verification

## 📚 Additional Resources

### Documentation Links
- **API Documentation**: [Swagger UI](https://enterprise-social-platform.onrender.com/api-docs)
- **Component Library**: In-source documentation
- **Database Schema**: Model definitions in `/server/models/`
- **Deployment Guide**: This README's deployment section

### Learning Resources
- **React Documentation**: [reactjs.org](https://reactjs.org)
- **Express.js Guide**: [expressjs.com](https://expressjs.com)
- **MongoDB Manual**: [docs.mongodb.com](https://docs.mongodb.com)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Process
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Implement** your changes with tests
4. **Commit** with descriptive messages (`git commit -m 'Add amazing feature'`)
5. **Push** to your branch (`git push origin feature/amazing-feature`)
6. **Submit** a Pull Request with detailed description

### Contribution Guidelines
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass
- Follow security best practices
- Maintain backward compatibility

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Report security issues privately

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Algerian Ministry of Social Affairs**: Domain expertise and requirements guidance
- **Open Source Community**: Amazing libraries and frameworks that made this possible
- **MongoDB**: Excellent database platform and documentation
- **Vercel & Render**: Reliable hosting platforms with great developer experience
- **React & Express Communities**: Continuous innovation and support

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/kousaila502/enterprise-social-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kousaila502/enterprise-social-platform/discussions)
- **Email**: support@enterprise-social-platform.com
- **Documentation**: [Live API Docs](https://enterprise-social-platform.onrender.com/api-docs)

---

**E-Social-Assistance** - Empowering social welfare through technology 🌟

*Built with ❤️ for the Algerian social assistance ecosystem*
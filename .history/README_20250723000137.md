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
- **Authentication**: JWT with HTTP-only cookies
- **Security**: Helmet, CORS, Rate Limiting, MongoDB Sanitization
- **Documentation**: Swagger/OpenAPI 3.0
- **File Upload**: Multer with validation
- **Email**: Nodemailer integration
- **Logging**: Winston for comprehensive logging

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand + React Query
- **Routing**: React Router v7
- **Forms**: React Hook Form + Yup validation
- **Charts**: Custom SVG + Recharts
- **Icons**: Heroicons + Lucide React
- **Build Tool**: Vite

## 🏗️ Project Structure

```
E-Social-Assistance/
├── server/                          # Backend API
│   ├── controllers/                 # Request handlers
│   ├── models/                      # MongoDB schemas
│   ├── routers/                     # API routes
│   ├── middleware/                  # Security & validation
│   ├── utils/                       # Helper functions
│   └── swagger.yaml                 # API documentation
├── frontend/                        # React application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Route components
│   │   ├── services/                # API integration
│   │   ├── contexts/                # React contexts
│   │   ├── hooks/                   # Custom hooks
│   │   └── utils/                   # Utilities & constants
│   └── public/                      # Static assets
└── README.md                        # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB 5.0+
- Git

### Backend Setup

1. **Clone and navigate to server directory:**
```bash
git clone <repository-url>
cd E-Social-Assistance/server
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
```

4. **Start the server:**
```bash
npm start
```

Server runs on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## 📋 Core Modules

### 1. User Management
- **Multi-role system**: Admin, Case Worker, Finance Manager, Applicant
- **Profile management**: Personal info, economic status, eligibility scoring
- **Account verification**: Email verification and status management

### 2. Request Management
- **Request Categories**: 
  - Financial Assistance
  - Medical Assistance  
  - Educational Support
  - Housing Support
  - Food Assistance
  - Employment Support
  - Elderly Care
  - Disability Support

- **Workflow States**:
  - Submission → Initial Review → Document Verification
  - Eligibility Assessment → Amount Determination
  - Supervisor Approval → Budget Allocation → Payment Processing

### 3. Budget Pool Management
- **Pool Creation**: Category-based budget allocation
- **Utilization Tracking**: Real-time spending and remaining budgets
- **Allocation Rules**: Automated and manual allocation strategies
- **Reporting**: Comprehensive financial reporting

### 4. Payment System
- **Payment Methods**: Bank transfer, Cash, Mobile payment, Check
- **Status Tracking**: Pending, Processing, Completed, Failed, Cancelled
- **Batch Processing**: Multiple payment processing capabilities
- **Audit Trail**: Complete payment history and reconciliation

### 5. Analytics Dashboard
- **System Overview**: Users, requests, payments, budget metrics
- **Trend Analysis**: 12-month historical data visualization
- **Performance Metrics**: Processing times, success rates, utilization
- **Geographic Insights**: Wilaya-based distribution analysis

## 🔒 Security Features

- **Authentication**: JWT-based with secure HTTP-only cookies
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: MongoDB sanitization, XSS protection
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Joi schema validation
- **File Security**: Secure file upload with type validation
- **Audit Logging**: Comprehensive action tracking

## 📊 API Documentation

### Base URL
```
Development: http://localhost:8080/api/v1
Production: https://api.socialassistance.com/api/v1
```

### Authentication
```http
POST /auth/login
POST /auth/register
POST /auth/logout
POST /auth/verify-email
```

### Main Endpoints
```http
# Users
GET    /users                    # List users (admin/case_worker)
POST   /users                    # Create user
GET    /users/profile            # Current user profile
PATCH  /users/profile            # Update profile

# Requests (Demandes)
GET    /demandes                 # List requests
POST   /demandes                 # Submit request
GET    /demandes/:id             # Get request details
PATCH  /demandes/:id/status      # Update request status

# Payments
GET    /payments                 # List payments
POST   /payments                 # Create payment
PATCH  /payments/:id/process     # Process payment

# Budget Pools
GET    /budget-pools             # List budget pools
POST   /budget-pools             # Create budget pool
GET    /budget-pools/stats       # Budget statistics

# Analytics
GET    /analytics/dashboard      # Dashboard data
GET    /analytics/trends         # Trend analysis
```

### Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## 🎯 User Roles & Permissions

### Admin
- Full system access
- User management
- System configuration
- All analytics and reports

### Case Worker
- Request review and processing
- User eligibility assessment
- Document verification
- Workflow management

### Finance Manager
- Payment processing
- Budget pool management
- Financial reporting
- Payment reconciliation

### Applicant
- Request submission
- Profile management
- Status tracking
- Document upload

## 🔧 Development

### Available Scripts

**Backend:**
```bash
npm start              # Start server with nodemon
npm run prod           # Production mode
```

**Frontend:**
```bash
npm run dev            # Development server
npm run build          # Production build
npm run preview        # Preview production build
npm run lint           # ESLint
```

### Code Quality
- **ESLint**: Code linting and formatting
- **TypeScript**: Type safety for frontend
- **Joi**: Backend validation schemas
- **Git Hooks**: Pre-commit quality checks

## 📈 Performance & Scalability

- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Strategic data caching implementation
- **Pagination**: Efficient data loading
- **File Upload**: Chunked upload for large files
- **Rate Limiting**: API protection and performance
- **Compression**: Response compression for faster loading

## 🌍 Internationalization

- **Multi-language Support**: Ready for Arabic/French localization
- **RTL Support**: Right-to-left layout compatibility
- **Algerian Localization**: Wilaya-based geographic features
- **Currency**: Algerian Dinar (DZD) formatting

## 🚢 Deployment

### Production Checklist

1. **Environment Variables**: Set production values
2. **Database**: Configure MongoDB cluster
3. **Security**: Enable all security features
4. **SSL**: Configure HTTPS certificates
5. **Monitoring**: Set up logging and monitoring
6. **Backup**: Configure database backups

### Docker Deployment (Optional)

```dockerfile
# Example Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

## 📚 Documentation

- **API Docs**: Available at `/api-docs` (Swagger UI)
- **Database Schema**: See `models/` directory
- **Frontend Components**: Component documentation in source
- **Workflow Diagrams**: Available in project wiki

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain test coverage
- Update documentation
- Follow commit message conventions
- Ensure security compliance

## 📞 Support

- **Technical Issues**: Create GitHub issue
- **Feature Requests**: Discussion in GitHub Discussions
- **Security Vulnerabilities**: Email security@socialassistance.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Algerian Social Services**: Domain expertise and requirements
- **Open Source Community**: Libraries and frameworks used
- **Development Team**: Contributors and maintainers

---

**Built with ❤️ for social impact and community welfare**

*For detailed API documentation, visit `/api-docs` when running the server.*
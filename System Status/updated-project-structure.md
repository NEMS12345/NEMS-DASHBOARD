# NEMS Dashboard Project Structure

## Directory Overview

```
nems-dashboard/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   ├── bills/      # Bill analysis endpoints
│   │   │   ├── energy/     # Energy data endpoints
│   │   │   ├── ml/         # ML model endpoints
│   │   │   └── industries/ # Industry-specific endpoints
│   │   ├── dashboard/      # Dashboard pages
│   │   │   ├── [industry]/ # Industry-specific views
│   │   │   ├── analysis/   # Analysis pages
│   │   │   └── settings/   # Configuration pages
│   │   ├── auth/          # Authentication pages
│   │   └── admin/         # Admin interface
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── industries/    # Industry-specific components
│   │   │   ├── manufacturing/  # Manufacturing components
│   │   │   ├── medical/       # Medical practice components
│   │   │   ├── bakery/        # Bakery components
│   │   │   └── warehouse/     # Warehouse components
│   │   ├── charts/        # Chart components
│   │   │   ├── cost/         # Cost visualization
│   │   │   ├── usage/        # Usage visualization
│   │   │   ├── demand/       # Demand visualization
│   │   │   └── prediction/   # ML prediction viz
│   │   ├── ml/            # ML-related components
│   │   │   ├── training/     # Model training interface
│   │   │   ├── monitoring/   # Model monitoring
│   │   │   └── predictions/  # Prediction display
│   │   └── shared/        # Shared components
│   ├── lib/               # Core libraries
│   │   ├── ml/           # ML infrastructure
│   │   │   ├── models/       # ML models
│   │   │   ├── training/     # Training utilities
│   │   │   ├── inference/    # Inference engines
│   │   │   └── validation/   # Validation tools
│   │   ├── data/         # Data processing
│   │   │   ├── ingestion/    # Data ingestion
│   │   │   ├── validation/   # Data validation
│   │   │   ├── transform/    # Data transformation
│   │   │   └── export/       # Data export
│   │   ├── industries/   # Industry-specific logic
│   │   │   ├── manufacturing/
│   │   │   ├── medical/
│   │   │   ├── bakery/
│   │   │   └── warehouse/
│   │   ├── claude/       # Claude AI integration
│   │   ├── supabase/     # Database integration
│   │   └── utils/        # Utilities
│   ├── types/            # TypeScript types
│   │   ├── ml/          # ML types
│   │   ├── industries/  # Industry types
│   │   ├── data/        # Data types
│   │   └── api/         # API types
│   └── config/          # Configuration
├── ml/                  # ML training scripts
│   ├── training/        # Training pipelines
│   ├── evaluation/      # Model evaluation
│   └── deployment/      # Model deployment
├── tests/               # Test suite
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   ├── e2e/           # End-to-end tests
│   └── performance/   # Performance tests
└── config files        # Configuration files
```

## Key Components

### 1. Industry-Specific Modules
- Separate components and logic for each industry
- Custom data processing pipelines
- Industry-specific ML models
- Specialized visualizations
- Custom metrics and KPIs

### 2. ML Infrastructure
- Model training pipelines
- Inference engines
- Performance monitoring
- Model validation
- Data preprocessing

### 3. Data Processing
- Multi-format ingestion
- Validation rules
- Transformation logic
- Export capabilities
- Quality assurance

### 4. Security Implementation
- Authentication flow
- Authorization rules
- Audit logging
- Security monitoring
- Data encryption

## Recent Updates

### 1. Added ML Infrastructure
- Training pipeline setup
- Model management system
- Inference optimization
- Performance monitoring
- Validation framework

### 2. Enhanced Industry Support
- Industry-specific components
- Custom processing pipelines
- Specialized visualizations
- Targeted analysis tools
- Industry benchmarks

### 3. Improved Data Handling
- Enhanced ingestion pipeline
- Validation framework
- Transform optimization
- Export system
- Quality checks

### 4. Security Enhancements
- MFA implementation
- RBAC system
- Audit logging
- Security monitoring
- Encryption updates

## Dependencies

### Core Dependencies
- Next.js 15.1.4
- React 18.2.0
- TypeScript 5.2.0
- Supabase Client
- TanStack Query

### ML Dependencies
- TensorFlow.js
- Scikit-learn
- Pandas
- NumPy
- Claude AI SDK

### Development Tools
- ESLint
- Prettier
- Vitest
- Cypress
- Playwright

### Monitoring Tools
- Sentry
- LogRocket
- Datadog
- AppSignal
- Grafana
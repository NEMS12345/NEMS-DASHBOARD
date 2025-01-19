# NEMS Dashboard Project Structure

## Directory Overview

```
nems-dashboard/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes for bills, energy, tests
│   │   │   ├── bills/      # Bill analysis endpoints
│   │   │   ├── energy/     # Energy data endpoints
│   │   │   └── test/       # Test endpoints
│   │   ├── dashboard/      # Dashboard pages and components
│   │   ├── login/          # Authentication pages
│   │   └── test/           # Test pages
│   ├── components/         # React components
│   │   ├── auth/           # Authentication components
│   │   ├── charts/         # Chart components
│   │   │   ├── CostBreakdownChart.tsx    # Cost distribution visualization
│   │   │   ├── CostTrendChart.tsx        # Cost trends over time
│   │   │   ├── DemandChart.tsx           # Demand visualization
│   │   │   ├── EnergyUsageChart.tsx      # Energy usage charts
│   │   │   ├── TimeDistributionChart.tsx  # Time-based analysis
│   │   │   └── TimeOfUseCostHeatmap.tsx  # Usage cost patterns
│   │   ├── dashboard/      # Dashboard-specific components
│   │   │   ├── CostAnalysis.tsx          # Cost analysis view
│   │   │   ├── DashboardHeader.tsx       # Dashboard header
│   │   │   ├── DashboardShell.tsx        # Main layout wrapper
│   │   │   ├── DemandProfile.tsx         # Demand analysis
│   │   │   ├── MetricCards.tsx           # Key metrics display
│   │   │   ├── NEMSDashboard.tsx         # Main dashboard
│   │   │   ├── Sustainability.tsx        # Sustainability metrics
│   │   │   └── UsageAnalysis.tsx         # Usage analysis
│   │   ├── shared/         # Shared/reusable components
│   │   │   ├── DateRangePicker.tsx       # Date selection
│   │   │   ├── ExportButton.tsx          # Data export
│   │   │   └── LocationSelector.tsx       # Location picker
│   │   └── ui/             # UI component library
│   │       ├── alert.tsx                 # Alert component
│   │       ├── button.tsx                # Button component
│   │       ├── card.tsx                  # Card component
│   │       ├── input.tsx                 # Input component
│   │       └── label.tsx                 # Label component
│   ├── lib/                # Utility libraries
│   │   ├── claude/         # Claude AI integration
│   │   │   ├── analysis.ts               # Analysis utilities
│   │   │   ├── billAnalyzer.ts          # Bill analysis logic
│   │   │   ├── client.ts                # Claude client
│   │   │   └── prompts.ts               # AI prompts
│   │   ├── cost/          # Cost analysis
│   │   │   └── costAnalyzer.ts          # Cost analysis logic
│   │   ├── demand/        # Demand analysis
│   │   │   └── demandAnalyzer.ts        # Demand analysis logic
│   │   ├── hooks/         # Custom React hooks
│   │   │   ├── useCostAnalysis.ts       # Cost analysis hook
│   │   │   ├── useDemandProfile.ts      # Demand analysis hook
│   │   │   ├── useEnergyData.ts         # Energy data hook
│   │   │   ├── useRealtimeUpdates.ts    # Real-time updates
│   │   │   └── useSustainability.ts     # Sustainability hook
│   │   ├── supabase/      # Supabase integration
│   │   │   ├── client.ts                # Supabase client
│   │   │   ├── queries.ts               # Database queries
│   │   │   └── migrations/              # Database migrations
│   │   ├── sustainability/ # Sustainability analysis
│   │   │   └── sustainabilityAnalyzer.ts # Sustainability logic
│   │   └── utils/         # Utility functions
│   │       ├── calculations.ts          # Math utilities
│   │       ├── date.ts                  # Date handling
│   │       ├── export.ts                # Export utilities
│   │       └── formatting.ts            # Data formatting
│   ├── types/             # TypeScript type definitions
│   │   ├── analysis.ts                  # Analysis types
│   │   ├── auth.ts                      # Auth types
│   │   ├── components.ts                # Component types
│   │   ├── cost-analysis.ts            # Cost analysis types
│   │   ├── database.ts                 # Database types
│   │   └── energy.ts                   # Energy data types
│   └── middleware.ts      # Auth middleware
├── public/               # Static assets
└── config files         # Configuration files
    ├── .gitignore       # Git ignore patterns
    ├── .prettierrc      # Code formatting
    ├── eslint.config.mjs # ESLint config
    ├── next.config.js   # Next.js config
    ├── package.json     # Dependencies
    ├── postcss.config.mjs # PostCSS config
    ├── tailwind.config.ts # Tailwind config
    ├── tsconfig.json    # TypeScript config
    └── vitest.config.ts # Vitest config
```

## Key Directories

### 1. App Directory (`src/app/`)
- Next.js 15.1.4 App Router implementation
- API routes for various services
- Authentication pages
- Dashboard pages
- Test sections
- Global layout and styling

### 2. Components (`src/components/`)
- Organized by feature and responsibility
- Authentication components
- Chart components for data visualization
- Dashboard-specific components
- Shared/reusable components
- UI component library

### 3. Library (`src/lib/`)
- Claude AI integration
- Cost analysis utilities
- Demand analysis logic
- Custom React hooks
- Supabase integration
- Sustainability analysis
- Utility functions

### 4. Types (`src/types/`)
- TypeScript type definitions
- Component prop types
- Database types
- Analysis types
- Auth types

## Recent Updates

1. **Enhanced Cost Analysis**
   - Added CostBreakdownChart component
   - Implemented TimeOfUseCostHeatmap
   - Added cost analysis database schema
   - Created useCostAnalysis hook
   - Added cost trend visualization

2. **Improved Demand Analysis**
   - Added DemandChart component
   - Implemented DemandProfile
   - Created useDemandProfile hook
   - Added real-time demand tracking

3. **Sustainability Features**
   - Added Sustainability component
   - Implemented sustainability analyzer
   - Created useSustainability hook
   - Added carbon footprint tracking

4. **Infrastructure**
   - Updated Next.js to version 15.1.4
   - Enhanced database migrations
   - Improved query optimization
   - Added new test configurations

## Dependencies

### Production Dependencies
- Next.js 15.1.4
- React 18.2.0
- Supabase Client
- TanStack React Query
- Tremor & Recharts
- Anthropic Claude AI SDK
- Lucide React

### Development Dependencies
- TypeScript
- ESLint
- Prettier
- Vitest
- Testing Libraries
- Tailwind CSS
- PostCSS
- Husky

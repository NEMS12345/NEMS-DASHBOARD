# NEMS Dashboard Project Structure

## Directory Overview

```
nems-dashboard/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   └── test/           # Test pages
│   ├── components/         # React components
│   │   ├── charts/         # Chart components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   └── shared/         # Shared/reusable components
│   ├── lib/                # Utility libraries
│   │   ├── claude/         # Claude AI integration
│   │   ├── hooks/          # Custom React hooks
│   │   ├── supabase/       # Supabase client & queries
│   │   └── utils/          # Utility functions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── config files           # Various configuration files
```

## Key Directories

### 1. App Directory (`src/app/`)
- Uses Next.js 13+ App Router
- API routes for backend functionality
- Separate dashboard and test sections
- Global layout and styling

### 2. Components (`src/components/`)
- Organized by feature and responsibility
- Reusable shared components
- Chart-specific components
- Dashboard-specific components

### 3. Library (`src/lib/`)
- Integration with external services
- Custom React hooks
- Database client and queries
- Utility functions

### 4. Types (`src/types/`)
- TypeScript interfaces
- Database type definitions
- Component props types

## Configuration Files

- `.gitignore`: Git ignore patterns
- `.prettierrc`: Code formatting rules
- `eslint.config.mjs`: ESLint configuration
- `next.config.js`: Next.js configuration
- `package.json`: Dependencies and scripts
- `postcss.config.mjs`: PostCSS configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `vitest.config.ts`: Vitest test configuration

## Recent Changes

1. **Infrastructure Updates**
   - Upgraded to Next.js 15.1.4
   - Added Vitest for testing
   - Implemented Husky for git hooks

2. **Feature Development**
   - Added real-time updates functionality
   - Implemented energy usage charts
   - Added location selector component

3. **Code Quality**
   - Added TypeScript strict mode
   - Implemented ESLint configuration
   - Added Prettier formatting

4. **Testing**
   - Set up Vitest testing framework
   - Added testing utilities
   - Prepared test environment

## Project Dependencies

### Production Dependencies
- Next.js 15.1.4
- React 18.2.0
- Supabase client
- TanStack React Query
- Tremor & Recharts for visualization
- Anthropic Claude AI SDK

### Development Dependencies
- TypeScript
- ESLint
- Prettier
- Vitest
- Testing libraries
- Tailwind CSS

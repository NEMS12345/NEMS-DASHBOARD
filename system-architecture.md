# NEMS Dashboard System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        Next["Next.js App Router"]
        RC["React Components"]
        RQ["React Query"]
        style Next fill:#e1f5fe
        style RC fill:#e1f5fe
        style RQ fill:#e1f5fe
    end

    subgraph "Data Layer"
        SB["Supabase"]
        DB[("Database")]
        RT["Realtime Updates"]
        style SB fill:#e8f5e9
        style DB fill:#e8f5e9
        style RT fill:#e8f5e9
    end

    subgraph "Integration Layer"
        Claude["Anthropic Claude AI"]
        Sentry["Sentry Error Tracking"]
        style Claude fill:#fce4ec
        style Sentry fill:#fce4ec
    end

    subgraph "UI Components"
        Tremor["Tremor Components"]
        Charts["Recharts"]
        style Tremor fill:#fff3e0
        style Charts fill:#fff3e0
    end

    Next --> RC
    RC --> RQ
    RQ --> SB
    SB --> DB
    RT --> RQ
    Claude --> Next
    Next --> Sentry
    RC --> Tremor
    RC --> Charts
```

## Key Components

1. **Frontend Layer**
   - Next.js 15.1.4 with App Router
   - React 18.2.0
   - TanStack React Query for data fetching
   - TypeScript for type safety

2. **Data Layer**
   - Supabase for database and authentication
   - Real-time updates subscription
   - Structured data models for locations and energy data

3. **Integration Layer**
   - Anthropic Claude AI integration
   - Sentry for error tracking and monitoring

4. **UI Components**
   - Tremor for dashboard components
   - Recharts for data visualization
   - TailwindCSS for styling

## Data Flow

1. User interactions trigger React Query data fetches
2. Supabase handles data persistence and real-time updates
3. Claude AI processes bill analysis
4. Tremor/Recharts render visualizations
5. Sentry monitors for errors and performance issues

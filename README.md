# House Finder - Multi-Source Property Search Engine

A high-performance, TDD-driven house search engine built with Nx monorepo architecture, designed to aggregate property listings from multiple sources (APIs and web scraping) into a unified domain model.

## 🏗️ Architecture Overview

### Tech Stack
- **Monorepo**: Nx Workspace with pnpm
- **Language**: TypeScript (Strict mode)
- **Backend**: NestJS 11+
- **Frontend**: Angular 21+ with Signals
- **Cloud**: Firebase Functions Gen 2, Cloud Tasks, Firestore
- **Extraction**: Playwright for scraping, Axios for API clients
- **Validation**: Zod schemas
- **Testing**: Jest with 100% TDD approach

### Library Structure

```
house-finder/
├── packages/
│   ├── domain/                 # Core domain models (Zod schemas)
│   ├── api-interfaces/         # Shared DTOs for NestJS/Angular
│   └── extraction-engine/      # Scraper & API client implementations
├── apps/
│   ├── backend/               # NestJS API (to be created)
│   └── frontend/              # Angular dashboard (to be created)
```

## 📦 Core Libraries

### @house-finder/domain

Contains the **UnifiedHouseModel** - the central schema that all data sources map to.

**Key Features:**
- Comprehensive property data model with 40+ fields
- Support for multiple property types (House, Apartment, Condo, Townhouse, etc.)
- Location data with geocoding (lat/lng)
- Energy ratings (A+ through H)
- Image galleries, amenities, and contact information
- Metadata tracking for extraction provenance

**Example Usage:**
```typescript
import { createHouseModel, PropertyType, ListingStatus } from '@house-finder/domain';

const house = createHouseModel({
  id: 'zillow-12345',
  source: 'zillow-api',
  url: 'https://www.zillow.com/homedetails/12345',
  title: 'Beautiful Family Home',
  price: 450000,
  currency: 'USD',
  propertyType: PropertyType.HOUSE,
  status: ListingStatus.ACTIVE,
  location: {
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
  },
});
```

### @house-finder/extraction-engine

Implements the **Strategy Pattern** for pluggable data providers.

**Base Interfaces:**
- `DataProvider` - Core interface for all extractors
- `BaseScraper` - Abstract class for web scrapers
- `BaseApiClient` - Abstract class for API integrations

**Provider Implementations:**
- `ZillowApiClient` - Example API client with full error handling
- ImmoscoutScraper - (Planned) Playwright-based web scraper

**Key Features:**
- Unified extraction interface across all sources
- Standardized error handling with typed error codes
- Automatic retry logic and rate limiting support
- Health checks and configuration validation
- Metadata tracking (duration, API calls used, etc.)

**Example Provider Implementation:**
```typescript
export class ZillowApiClient extends BaseApiClient {
  readonly name = 'zillow-api';

  async extract(params?: SearchParams): Promise<ExtractionResult> {
    // 1. Fetch data from API
    const response = await this.axiosInstance.get('/search', { params });

    // 2. Transform to UnifiedHouseModel
    const houses = response.data.results.map(this.transformToUnifiedModel);

    // 3. Return standardized result
    return this.createSuccessResult(houses, { apiCallsUsed: 1 });
  }
}
```

## 🎯 Design Patterns

### Strategy Pattern (Data Providers)
Each data source (API or scraper) implements the `DataProvider` interface, allowing:
- Runtime provider selection
- Easy addition of new sources
- Consistent error handling
- Uniform testing approach

### Factory Pattern (Domain Models)
The `createHouseModel` helper ensures all models are validated against the Zod schema.

### Repository Pattern (Planned)
Firestore will act as the unified data store, with repositories handling CRUD operations.

## 🧪 Testing Strategy

### Test-Driven Development (TDD)
All code follows the Red-Green-Refactor cycle:

1. **Red**: Write failing test first
2. **Green**: Implement minimal code to pass
3. **Refactor**: Clean up while keeping tests green

**Current Test Coverage:**
- ✅ Domain model validation (11 tests)
- ✅ Strategy pattern interfaces (10 tests)
- 🚧 API client integration (17 tests passing)
- 📋 Scraper implementation (planned)
- 📋 Data transformer service (planned)
- 📋 Orchestrator service (planned)

## 🔄 Recursive Background Polling (Planned)

### Firebase Cloud Tasks Architecture

```
┌──────────────────┐
│ Firestore Trigger│
│ New Search Req   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Orchestrator     │
│ Service          │
└────────┬─────────┘
         │
         ├──────────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼
    ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐
    │API    │  │Scraper│  │Scraper│  │...    │
    │Client │  │Task 1 │  │Task N │  │       │
    └───┬───┘  └───┬───┘  └───┬───┘  └───────┘
        │          │          │
        └──────────┴──────────┴──────────┐
                                         ▼
                                  ┌─────────────┐
                                  │ Extract &   │
                                  │ Transform   │
                                  └──────┬──────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │ Save to     │
                                  │ Firestore   │
                                  └──────┬──────┘
                                         │
                    If search.status === 'active'
                                         │
                                         └──► Re-enqueue ──┐
                                                           │
                                        Stop: User clicks "Stop" button
                                        Updates Firestore → Loop terminates
```

**Flow:**
1. User creates search with filters
2. Orchestrator schedules tasks for each provider
3. Each provider extracts and normalizes data
4. Results written to Firestore (triggers real-time UI update)
5. If search still active, re-enqueue next cycle
6. Stop condition: User clicks "Stop" → updates Firestore → loop terminates

## 🚀 Planned Features

### Phase 2: Backend (NestJS)
- [ ] NestJS application with modular architecture
- [ ] DataTransformerService for advanced normalization
- [ ] OrchestratorService for Cloud Task management
- [ ] Firebase Functions Gen 2 deployment configuration
- [ ] Retry logic and circuit breakers

### Phase 3: Frontend (Angular + Signals)
- [ ] Angular 21 application with standalone components
- [ ] Real-time dashboard using Signals + Firestore
- [ ] Advanced filter UI (price, location, property type)
- [ ] Start/Stop controls for background polling
- [ ] Property comparison views

### Phase 4: Production Readiness
- [ ] User-agent rotation for scrapers
- [ ] Proxy support for rate limit avoidance
- [ ] Comprehensive error tracking
- [ ] Performance monitoring
- [ ] Cost optimization (Firebase quotas)

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm 8+

### Installation
```bash
# Install dependencies
pnpm install

# Run all tests
pnpm nx test domain
pnpm nx test extraction-engine

# Build all libraries
pnpm nx build domain
pnpm nx build extraction-engine

# Lint
pnpm nx lint domain
```

### Project Structure
```bash
# View project graph
pnpm nx graph

# Show specific project
pnpm nx show project @house-finder/domain
```

## 🎓 Key Learnings & Best Practices

### 1. **Type Safety First**
- Strict TypeScript configuration (`strict: true`)
- Zod schemas for runtime validation
- No `any` types allowed (enforced by ESLint)

### 2. **Clean Code Principles**
- Single Responsibility: Each provider handles one source
- Open/Closed: Easy to extend with new providers
- Dependency Inversion: Depend on interfaces, not implementations

### 3. **SOLID Architecture**
- Separation of concerns (domain, extraction, presentation)
- Interface-driven design
- Composition over inheritance

### 4. **Testing Excellence**
- Write tests before implementation
- Test behavior, not implementation
- Use fixtures for scraper tests
- Mock external dependencies (nock for HTTP)

## 🔧 CLI Commands Reference

### Workspace Setup
```bash
# Initialize Nx workspace with TypeScript
npx create-nx-workspace@latest house-finder --preset=ts --pm=pnpm

# Generate new library
pnpm nx generate @nx/js:library <name> --directory=packages/<name> --unitTestRunner=jest

# Generate NestJS app
pnpm nx generate @nx/nest:application backend

# Generate Angular app
pnpm nx generate @nx/angular:application frontend --standalone
```

### Development
```bash
# Run tests in watch mode
pnpm nx test <project> --watch

# Run tests with coverage
pnpm nx test <project> --coverage

# Build specific project
pnpm nx build <project>

# Build all projects
pnpm nx run-many --target=build --all

# Type-check all projects
pnpm nx run-many --target=typecheck --all
```

### Firebase (Planned)
```bash
# Deploy functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View logs
firebase functions:log
```

## 📊 Current Status

### ✅ Completed (Phase 1)
- [x] Nx workspace initialization with pnpm
- [x] Strict TypeScript and ESLint configuration
- [x] @house-finder/domain library with comprehensive Zod schemas
- [x] @house-finder/api-interfaces library structure
- [x] @house-finder/extraction-engine with Strategy Pattern
- [x] UnifiedHouseModel with 40+ validated fields
- [x] Base provider interfaces (DataProvider, BaseScraper, BaseApiClient)
- [x] ZillowApiClient implementation with error handling
- [x] Comprehensive unit tests (21 passing tests)

### 🚧 In Progress
- API client HTTP mocking refinement
- Playwright scraper implementation

### 📋 Next Steps
1. Complete Immoscout24 scraper with Playwright
2. Implement DataTransformerService
3. Create NestJS backend application
4. Build OrchestratorService for Cloud Tasks
5. Set up Firebase Functions Gen 2
6. Create Angular frontend with Signals
7. Implement real-time Firestore integration

## 📄 License

MIT

## 👥 Contributors

Elite Fullstack & Data Engineer Team

# House Finder - Firebase Functions Gen 2

Production-ready Cloud Functions with Cloud Tasks integration for distributed property extraction.

## Architecture

```
HTTP Request
    ↓
Firebase Function (startExtraction)
    ↓
Creates Cloud Tasks (one per source)
    ↓
Cloud Task Handler (processExtraction)
    ↓
Executes extraction & saves to Firestore
```

## Functions

### HTTP Triggered Functions

#### `startExtraction`
- **Trigger**: HTTPS POST
- **Purpose**: Initiates extraction for a location
- **Flow**:
  1. Discovers sources using AI agent
  2. Creates Firestore jobs
  3. Creates Cloud Tasks for each source
  4. Returns job IDs

**Request:**
```json
{
  "location": "Germany"
}
```

**Response:**
```json
{
  "message": "Started extraction for Germany with 2 sources",
  "jobs": [
    {
      "id": "job-immoscout24-...",
      "sourceId": "immoscout24",
      "status": "pending",
      "priority": 10
    }
  ]
}
```

#### `discoverSources`
- **Trigger**: HTTPS POST
- **Purpose**: Discovers and grades sources
- **Returns**: List of sources with quality grades

#### `getJobs`
- **Trigger**: HTTPS GET
- **Purpose**: Retrieves extraction jobs
- **Query Params**: `status`, `limit`

#### `getProperties`
- **Trigger**: HTTPS GET
- **Purpose**: Retrieves extracted properties
- **Query Params**: `city`, `minPrice`, `maxPrice`, `limit`

#### `getStatistics`
- **Trigger**: HTTPS GET
- **Purpose**: Returns extraction statistics

### Task Queue Functions

#### `processExtraction`
- **Trigger**: Cloud Tasks
- **Purpose**: Processes actual extraction for a single source
- **Features**:
  - Automatic retry (max 3 attempts)
  - Rate limiting (5 concurrent)
  - Exponential backoff
  - Result persistence to Firestore

## Firestore Collections

### `properties`
Extracted property data with UnifiedHouseModel schema.

**Fields:**
- `id` - Unique property identifier
- `title` - Property title
- `price` - Property price
- `location` - Address, city, coordinates
- `metadata` - Source, confidence, extractedAt
- `createdAt` - Firestore timestamp

**Indexes:**
- `location.city` + `price`
- `location.city` + `createdAt`
- `metadata.confidence` + `price`

### `extraction-jobs`
Job tracking and status.

**Fields:**
- `id` - Job identifier
- `sourceId` - Source name
- `location` - Search location
- `status` - pending/running/completed/failed
- `priority` - Priority level (3, 5, 7, 10)
- `createdAt`, `startedAt`, `completedAt`
- `propertiesCount` - Number of properties extracted

**Indexes:**
- `status` + `createdAt`
- `priority` + `createdAt`

## Cloud Tasks Setup

### Create Queue
```bash
gcloud tasks queues create extraction-queue \
  --location=us-central1 \
  --max-concurrent-dispatches=5 \
  --max-dispatches-per-second=10
```

### Configure Environment
Set these environment variables in Firebase Functions config:

```bash
firebase functions:config:set \
  cloudtasks.queue="extraction-queue" \
  cloudtasks.location="us-central1"
```

## Deployment

### Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Authenticated: `firebase login`
3. Project selected: `firebase use <project-id>`

### Build
```bash
cd apps/backend-functions
npm run build
```

### Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:startExtraction

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

### Local Development
```bash
# Start emulators
npm run serve

# Functions: http://localhost:5001
# Firestore: http://localhost:8080
# UI: http://localhost:4000
```

## Environment Variables

Required for production:
- `GCP_PROJECT` - Google Cloud Project ID
- `CLOUD_TASKS_QUEUE` - Task queue name (default: extraction-queue)
- `CLOUD_TASKS_LOCATION` - Queue location (default: us-central1)
- `FUNCTION_URL` - Base URL for functions

## Security

### Firestore Rules
- **Properties**: Public read, Functions-only write
- **Jobs**: Public read, Functions-only write

### Authentication
Cloud Tasks are automatically authenticated via service accounts.

## Monitoring

### View Logs
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only startExtraction

# Follow logs in real-time
firebase functions:log --follow
```

### Metrics
View in Firebase Console:
- Function invocations
- Error rate
- Execution time
- Active instances

## Error Handling

### Automatic Retry
Cloud Tasks automatically retries failed extractions:
- **Max attempts**: 3
- **Backoff**: Exponential (up to 300 seconds)
- **Error tracking**: Stored in Firestore job document

### Manual Retry
Re-dispatch failed jobs:
```typescript
// Get failed jobs
const failed = await db.collection('extraction-jobs')
  .where('status', '==', 'failed')
  .get();

// Re-create tasks
for (const job of failed.docs) {
  await createExtractionTask(job.id, job.data().source, job.data().location);
}
```

## Cost Optimization

### Tips
1. **Rate limiting**: Prevents expensive parallel executions
2. **Timeout**: 540s max prevents runaway functions
3. **Memory**: 512MB balances cost vs performance
4. **Cold start**: Gen 2 functions have faster cold starts

### Estimated Costs
Based on 1000 extractions/day:
- Functions: ~$5-10/month
- Firestore: ~$2-5/month
- Cloud Tasks: ~$1-2/month

**Total**: ~$10-20/month for moderate usage

## Production Checklist

- [ ] Cloud Tasks queue created
- [ ] Firestore indexes deployed
- [ ] Security rules deployed
- [ ] Environment variables configured
- [ ] Functions deployed
- [ ] Monitoring alerts set up
- [ ] Error tracking configured
- [ ] Cost alerts enabled

## Support

For issues or questions:
- Check Firebase Console logs
- Review Firestore data
- Monitor Cloud Tasks queue
- Check function metrics

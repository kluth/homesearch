/**
 * Firebase Functions Gen 2 for House Finder
 * Production-ready cloud functions with Cloud Tasks integration
 */

import { onRequest } from 'firebase-functions/v2/https';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import * as admin from 'firebase-admin';
import { CloudTasksClient } from '@google-cloud/tasks';
import {
  SourceDiscoveryAgent,
  ProviderRegistry,
  DataTransformerService,
  ResponseGeneratorService,
  type DiscoveredSource,
  type UserPreferences,
  type ResponseGenerationOptions,
} from '@house-finder/extraction-engine';
import type { UnifiedHouseModel } from '@house-finder/domain';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

// Initialize Cloud Tasks
const tasksClient = new CloudTasksClient();

// Set global options for all functions
setGlobalOptions({
  region: 'us-central1',
  maxInstances: 10,
  memory: '512MiB',
  timeoutSeconds: 540,
});

/**
 * HTTPS Function: Start Extraction
 * Discovers sources and creates Cloud Tasks for each source
 */
export const startExtraction = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      const { location } = request.body as { location: string };

      if (!location) {
        response.status(400).json({ error: 'Location is required' });
        return;
      }

      console.log(`Starting extraction for location: ${location}`);

      // Initialize discovery agent
      const agent = new SourceDiscoveryAgent();
      await agent.initialize();

      // Discover sources
      const sources = await agent.discoverSources({
        location,
        limit: 10,
      });

      console.log(`Discovered ${sources.length} sources`);

      // Create Firestore batch for jobs
      const batch = db.batch();
      const jobs: any[] = [];

      // Create jobs and Cloud Tasks for each source
      for (const source of sources) {
        const jobId = `job-${source.name}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const jobData = {
          id: jobId,
          sourceId: source.name,
          location,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          priority: calculatePriority(source.quality?.score ?? 0),
          source: {
            name: source.name,
            url: source.url,
            type: source.type,
            quality: source.quality,
          },
        };

        // Save job to Firestore
        const jobRef = db.collection('extraction-jobs').doc(jobId);
        batch.set(jobRef, jobData);

        // Create Cloud Task
        await createExtractionTask(jobId, source, location);

        jobs.push(jobData);
      }

      // Commit batch
      await batch.commit();

      console.log(`Created ${jobs.length} extraction jobs`);

      response.json({
        message: `Started extraction for ${location} with ${jobs.length} sources`,
        jobs,
      });
    } catch (error) {
      console.error('Error starting extraction:', error);
      response.status(500).json({
        error: 'Failed to start extraction',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * HTTPS Function: Discover Sources
 * Discovers and grades sources for a location
 */
export const discoverSources = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      const { location, limit = 10 } = request.body as { location: string; limit?: number };

      if (!location) {
        response.status(400).json({ error: 'Location is required' });
        return;
      }

      const agent = new SourceDiscoveryAgent();
      await agent.initialize();

      const sources = await agent.discoverSources({ location, limit });

      response.json({
        message: `Discovered ${sources.length} sources for ${location}`,
        sources,
      });
    } catch (error) {
      console.error('Error discovering sources:', error);
      response.status(500).json({
        error: 'Failed to discover sources',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

/**
 * Cloud Task Handler: Process Extraction
 * Executes actual property extraction for a specific source
 */
export const processExtraction = onTaskDispatched(
  {
    retryConfig: {
      maxAttempts: 3,
      maxBackoffSeconds: 300,
    },
    rateLimits: {
      maxConcurrentDispatches: 5,
    },
  },
  async (request) => {
    try {
      const { jobId, source, location } = request.data as {
        jobId: string;
        source: DiscoveredSource;
        location: string;
      };

      console.log(`Processing extraction for job ${jobId}, source: ${source.name}`);

      // Update job status to running
      const jobRef = db.collection('extraction-jobs').doc(jobId);
      await jobRef.update({
        status: 'running',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Simulate extraction (in production, would use actual providers)
      const properties = await simulateExtraction(source, location);

      // Transform and deduplicate
      const transformer = new DataTransformerService();
      const transformedProperties = transformer.transform(properties);

      // Save properties to Firestore
      const batch = db.batch();
      for (const property of transformedProperties) {
        const propertyRef = db.collection('properties').doc(property.id);
        batch.set(propertyRef, {
          ...property,
          metadata: {
            ...property.metadata,
            extractedAt: admin.firestore.Timestamp.fromDate(property.metadata.extractedAt),
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();

      // Update job status to completed
      await jobRef.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        propertiesCount: transformedProperties.length,
      });

      console.log(
        `Completed extraction for job ${jobId}. Extracted ${transformedProperties.length} properties.`
      );
    } catch (error) {
      console.error('Error processing extraction:', error);

      // Update job status to failed
      const { jobId } = request.data as { jobId: string };
      await db
        .collection('extraction-jobs')
        .doc(jobId)
        .update({
          status: 'failed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: error instanceof Error ? error.message : String(error),
        });

      throw error; // Let Cloud Tasks handle retry
    }
  }
);

/**
 * HTTPS Function: Get Jobs
 * Retrieves extraction jobs from Firestore
 */
export const getJobs = onRequest({ cors: true }, async (request, response) => {
  try {
    const { status, limit = 50 } = request.query as { status?: string; limit?: string };

    let query: admin.firestore.Query = db
      .collection('extraction-jobs')
      .orderBy('createdAt', 'desc')
      .limit(Number(limit));

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    response.json(jobs);
  } catch (error) {
    console.error('Error getting jobs:', error);
    response.status(500).json({ error: 'Failed to get jobs' });
  }
});

/**
 * HTTPS Function: Get Properties
 * Retrieves properties from Firestore
 */
export const getProperties = onRequest({ cors: true }, async (request, response) => {
  try {
    const { limit = 50, city, minPrice, maxPrice } = request.query as {
      limit?: string;
      city?: string;
      minPrice?: string;
      maxPrice?: string;
    };

    let query: admin.firestore.Query = db
      .collection('properties')
      .orderBy('createdAt', 'desc')
      .limit(Number(limit));

    if (city) {
      query = query.where('location.city', '==', city);
    }

    if (minPrice) {
      query = query.where('price', '>=', Number(minPrice));
    }

    if (maxPrice) {
      query = query.where('price', '<=', Number(maxPrice));
    }

    const snapshot = await query.get();
    const properties = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    response.json(properties);
  } catch (error) {
    console.error('Error getting properties:', error);
    response.status(500).json({ error: 'Failed to get properties' });
  }
});

/**
 * HTTPS Function: Get Statistics
 * Retrieves extraction statistics
 */
export const getStatistics = onRequest({ cors: true }, async (request, response) => {
  try {
    // Get job counts
    const jobsSnapshot = await db.collection('extraction-jobs').get();
    const jobs = jobsSnapshot.docs.map((doc) => doc.data());

    const stats = {
      totalJobs: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      running: jobs.filter((j) => j.status === 'running').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      totalProperties: jobs.reduce((sum, j) => sum + (j.propertiesCount || 0), 0),
    };

    response.json(stats);
  } catch (error) {
    console.error('Error getting statistics:', error);
    response.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * HTTPS Function: Generate Response
 * Generates personalized response to a property listing in the appropriate language
 */
export const generateResponse = onRequest({ cors: true }, async (request, response) => {
  try {
    const {
      propertyId,
      userPreferences,
      language,
      tone,
      includeViewingRequest = true,
      specificQuestions = [],
    } = request.body as {
      propertyId: string;
      userPreferences: UserPreferences;
      language?: string;
      tone?: string;
      includeViewingRequest?: boolean;
      specificQuestions?: string[];
    };

    // Validate required fields
    if (!propertyId) {
      response.status(400).json({ error: 'Property ID is required' });
      return;
    }

    if (!userPreferences) {
      response.status(400).json({ error: 'User preferences are required' });
      return;
    }

    // Fetch property from Firestore
    const propertyDoc = await db.collection('properties').doc(propertyId).get();

    if (!propertyDoc.exists) {
      response.status(404).json({ error: 'Property not found' });
      return;
    }

    const property = propertyDoc.data() as UnifiedHouseModel;

    // Initialize response generator
    const generator = new ResponseGeneratorService();

    // Validate user preferences
    if (!generator.validatePreferences(userPreferences)) {
      response.status(400).json({
        error: 'Invalid user preferences. Name or email is required.',
      });
      return;
    }

    // Generate response
    const generatedResponse = generator.generateResponse({
      property,
      userPreferences,
      language: language as any,
      tone: tone as any,
      includeViewingRequest,
      specificQuestions,
    });

    // Save generated response to Firestore for tracking
    const responseRef = db.collection('generated-responses').doc();
    await responseRef.set({
      id: responseRef.id,
      propertyId,
      propertyTitle: property.title,
      propertyUrl: property.url,
      userId: userPreferences.email ?? userPreferences.name,
      subject: generatedResponse.subject,
      body: generatedResponse.body,
      language: generatedResponse.language,
      tone: generatedResponse.tone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sent: false, // Track whether user actually sent it
    });

    console.log(`Generated response for property ${propertyId} in ${generatedResponse.language}`);

    response.json({
      message: 'Response generated successfully',
      response: generatedResponse,
      responseId: responseRef.id,
    });
  } catch (error) {
    console.error('Error generating response:', error);
    response.status(500).json({
      error: 'Failed to generate response',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Mark Response as Sent
 * Updates a generated response to mark it as sent
 */
export const markResponseSent = onRequest({ cors: true }, async (request, response) => {
  try {
    const { responseId, sentAt } = request.body as {
      responseId: string;
      sentAt?: string;
    };

    if (!responseId) {
      response.status(400).json({ error: 'Response ID is required' });
      return;
    }

    const responseRef = db.collection('generated-responses').doc(responseId);
    const responseDoc = await responseRef.get();

    if (!responseDoc.exists) {
      response.status(404).json({ error: 'Response not found' });
      return;
    }

    await responseRef.update({
      sent: true,
      sentAt: sentAt != null ? new Date(sentAt) : admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Marked response ${responseId} as sent`);

    response.json({
      message: 'Response marked as sent',
      responseId,
    });
  } catch (error) {
    console.error('Error marking response as sent:', error);
    response.status(500).json({
      error: 'Failed to mark response as sent',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Get Generated Responses
 * Retrieves generated responses for tracking
 */
export const getGeneratedResponses = onRequest({ cors: true }, async (request, response) => {
  try {
    const { userId, sent, limit = 50 } = request.query as {
      userId?: string;
      sent?: string;
      limit?: string;
    };

    let query: admin.firestore.Query = db
      .collection('generated-responses')
      .orderBy('createdAt', 'desc')
      .limit(Number(limit));

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (sent != null) {
      query = query.where('sent', '==', sent === 'true');
    }

    const snapshot = await query.get();
    const responses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    response.json(responses);
  } catch (error) {
    console.error('Error getting generated responses:', error);
    response.status(500).json({ error: 'Failed to get generated responses' });
  }
});

/**
 * Helper: Create Cloud Task for extraction
 */
async function createExtractionTask(
  jobId: string,
  source: DiscoveredSource,
  location: string
): Promise<void> {
  const project = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  const queue = process.env.CLOUD_TASKS_QUEUE || 'extraction-queue';
  const locationId = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
  const url = process.env.FUNCTION_URL || `https://${locationId}-${project}.cloudfunctions.net`;

  const parent = tasksClient.queuePath(project!, locationId, queue);

  const task = {
    httpRequest: {
      httpMethod: 'POST' as const,
      url: `${url}/processExtraction`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: Buffer.from(
        JSON.stringify({
          jobId,
          source,
          location,
        })
      ).toString('base64'),
    },
    scheduleTime: {
      seconds: Date.now() / 1000 + 5, // Schedule 5 seconds from now
    },
  };

  await tasksClient.createTask({ parent, task });
}

/**
 * Helper: Calculate priority from quality score
 */
function calculatePriority(qualityScore: number): number {
  if (qualityScore >= 90) return 10; // CRITICAL
  if (qualityScore >= 75) return 7; // HIGH
  if (qualityScore >= 60) return 5; // MEDIUM
  return 3; // LOW
}

/**
 * Helper: Simulate extraction (placeholder for actual provider execution)
 */
async function simulateExtraction(
  source: DiscoveredSource,
  location: string
): Promise<UnifiedHouseModel[]> {
  // In production, this would:
  // 1. Instantiate the actual provider (scraper or API client)
  // 2. Execute extraction with the location parameters
  // 3. Return the results

  console.log(`Simulating extraction from ${source.name} for ${location}`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Return empty array for now
  // In production, this would return actual property data
  return [];
}

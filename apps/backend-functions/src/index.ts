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
  DataTransformerService,
  ResponseGeneratorService,
  RecommendationEngine,
  NLPSearchParser,
  PriceIntelligence,
  type DiscoveredSource,
  type UserPreferences as RecommendationUserPreferences,
  type InquiryUserPreferences,
  type PropertyInteraction,
} from '@house-finder/extraction-engine';
import type { UnifiedHouseModel } from '@house-finder/domain';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

// Initialize Cloud Tasks
const tasksClient = new CloudTasksClient();

// Initialize AI Services
const recommendationEngine = new RecommendationEngine();
const nlpParser = new NLPSearchParser();
const priceIntelligence = new PriceIntelligence();

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
      userPreferences: InquiryUserPreferences;
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
 * HTTPS Function: Smart Search with NLP
 * Parses natural language queries into structured search
 */
export const smartSearch = onRequest({ cors: true }, async (request, response) => {
  try {
    const { query } = request.body as { query: string };

    if (!query) {
      response.status(400).json({ error: 'Query is required' });
      return;
    }

    // Parse natural language query
    const parsed = nlpParser.parse(query);

    // Get all properties from Firestore
    const propertiesSnapshot = await db.collection('properties').limit(500).get();
    const allProperties = propertiesSnapshot.docs.map((doc) => doc.data() as UnifiedHouseModel);

    // Filter based on parsed preferences
    const filtered = filterPropertiesByPreferences(allProperties, parsed.preferences);

    console.log(`Smart search: "${query}" -> ${filtered.length} results`);

    response.json({
      message: 'Search completed successfully',
      query: parsed.originalQuery,
      interpretation: parsed.interpretation,
      confidence: parsed.confidence,
      preferences: parsed.preferences,
      results: filtered.slice(0, 50), // Limit to 50 results
      totalResults: filtered.length,
    });
  } catch (error) {
    console.error('Error in smart search:', error);
    response.status(500).json({
      error: 'Failed to process search',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Get Personalized Recommendations
 * Returns AI-powered property recommendations
 */
export const getRecommendations = onRequest({ cors: true }, async (request, response) => {
  try {
    const { userId, limit = 20 } = request.query as { userId?: string; limit?: string };

    if (!userId) {
      response.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Get user preferences from Firestore
    const userDoc = await db.collection('user-preferences').doc(userId).get();
    const userPreferences = userDoc.exists ? userDoc.data() as RecommendationUserPreferences : undefined;

    if (userPreferences != null) {
      recommendationEngine.setUserPreferences(userPreferences);
    }

    // Get user interactions
    const interactionsSnapshot = await db
      .collection('property-interactions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const interactions = interactionsSnapshot.docs.map((doc) => doc.data() as PropertyInteraction);
    interactions.forEach((interaction) => recommendationEngine.addInteraction(interaction));

    // Get available properties
    const propertiesSnapshot = await db.collection('properties').limit(500).get();
    const allProperties = propertiesSnapshot.docs.map((doc) => doc.data() as UnifiedHouseModel);

    // Get recommendations
    const recommendations = recommendationEngine.getRecommendations(
      userId,
      allProperties,
      Number(limit)
    );

    console.log(`Generated ${recommendations.length} recommendations for user ${userId}`);

    response.json({
      message: 'Recommendations generated successfully',
      recommendations,
      userPreferences,
      interactionCount: interactions.length,
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    response.status(500).json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Track Property Interaction
 * Records user interactions for learning
 */
export const trackInteraction = onRequest({ cors: true }, async (request, response) => {
  try {
    const interaction = request.body as PropertyInteraction;

    if (!interaction.userId || !interaction.propertyId || !interaction.type) {
      response.status(400).json({ error: 'userId, propertyId, and type are required' });
      return;
    }

    // Add timestamp if not provided
    if (!interaction.timestamp) {
      interaction.timestamp = new Date();
    }

    // Save to Firestore
    const interactionRef = db.collection('property-interactions').doc();
    await interactionRef.set({
      id: interactionRef.id,
      ...interaction,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Add to recommendation engine
    recommendationEngine.addInteraction(interaction);

    console.log(`Tracked ${interaction.type} interaction for user ${interaction.userId}`);

    response.json({
      message: 'Interaction tracked successfully',
      interactionId: interactionRef.id,
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    response.status(500).json({
      error: 'Failed to track interaction',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Get Price Analysis
 * Analyzes property price vs market
 */
export const getPriceAnalysis = onRequest({ cors: true }, async (request, response) => {
  try {
    const { propertyId } = request.query as { propertyId: string };

    if (!propertyId) {
      response.status(400).json({ error: 'Property ID is required' });
      return;
    }

    // Get property
    const propertyDoc = await db.collection('properties').doc(propertyId).get();

    if (!propertyDoc.exists) {
      response.status(404).json({ error: 'Property not found' });
      return;
    }

    const property = propertyDoc.data() as UnifiedHouseModel;

    // Get market data (properties in same city)
    const marketSnapshot = await db
      .collection('properties')
      .where('location.city', '==', property.location.city)
      .limit(200)
      .get();

    const marketData = marketSnapshot.docs.map((doc) => doc.data() as UnifiedHouseModel);

    // Analyze price
    const analysis = priceIntelligence.analyzePrice(property, marketData);

    // Get negotiation suggestion
    const negotiation = priceIntelligence.getNegotiationSuggestion(analysis);

    console.log(`Price analysis for ${propertyId}: ${analysis.verdict} (score: ${analysis.fairnessScore})`);

    response.json({
      message: 'Price analysis completed',
      analysis,
      negotiation,
    });
  } catch (error) {
    console.error('Error analyzing price:', error);
    response.status(500).json({
      error: 'Failed to analyze price',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Set User Preferences
 * Saves user search preferences
 */
export const setUserPreferences = onRequest({ cors: true }, async (request, response) => {
  try {
    const preferences = request.body as RecommendationUserPreferences;

    if (!preferences.userId) {
      response.status(400).json({ error: 'User ID is required' });
      return;
    }

    // Save to Firestore
    await db.collection('user-preferences').doc(preferences.userId).set(preferences);

    // Update recommendation engine
    recommendationEngine.setUserPreferences(preferences);

    console.log(`Updated preferences for user ${preferences.userId}`);

    response.json({
      message: 'Preferences saved successfully',
      preferences,
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    response.status(500).json({
      error: 'Failed to save preferences',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Get User Preferences
 * Retrieves user search preferences
 */
export const getUserPreferences = onRequest({ cors: true }, async (request, response) => {
  try {
    const { userId } = request.query as { userId: string };

    if (!userId) {
      response.status(400).json({ error: 'User ID is required' });
      return;
    }

    const userDoc = await db.collection('user-preferences').doc(userId).get();

    if (!userDoc.exists) {
      response.status(404).json({ error: 'User preferences not found' });
      return;
    }

    response.json(userDoc.data());
  } catch (error) {
    console.error('Error getting preferences:', error);
    response.status(500).json({ error: 'Failed to get preferences' });
  }
});

/**
 * HTTPS Function: Get Market Trend
 * Analyzes market trends for a location
 */
export const getMarketTrend = onRequest({ cors: true }, async (request, response) => {
  try {
    const { location, propertyType = 'apartment' } = request.query as {
      location: string;
      propertyType?: string;
    };

    if (!location) {
      response.status(400).json({ error: 'Location is required' });
      return;
    }

    // Get historical data
    const snapshot = await db
      .collection('properties')
      .where('location.city', '==', location)
      .limit(200)
      .get();

    const historicalData = snapshot.docs.map((doc) => doc.data() as UnifiedHouseModel);

    // Analyze trend
    const trend = priceIntelligence.analyzeMarketTrend(
      location,
      propertyType,
      historicalData
    );

    console.log(`Market trend for ${location}: ${trend.direction} (${trend.priceChange}%)`);

    response.json({
      message: 'Market trend analyzed',
      trend,
    });
  } catch (error) {
    console.error('Error analyzing market trend:', error);
    response.status(500).json({
      error: 'Failed to analyze market trend',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Helper: Filter properties by preferences
 */
function filterPropertiesByPreferences(
  properties: UnifiedHouseModel[],
  preferences: Partial<RecommendationUserPreferences>
): UnifiedHouseModel[] {
  return properties.filter((property) => {
    // Budget filter
    if (preferences.budgetMin != null && property.price < preferences.budgetMin) {
      return false;
    }
    if (preferences.budgetMax != null && property.price > preferences.budgetMax) {
      return false;
    }

    // City filter
    if (
      preferences.preferredCities != null &&
      preferences.preferredCities.length > 0 &&
      property.location.city != null
    ) {
      const match = preferences.preferredCities.some(
        (city) => city.toLowerCase() === property.location.city?.toLowerCase()
      );
      if (!match) return false;
    }

    // Rooms filter
    if (preferences.minRooms != null && property.details?.totalRooms != null) {
      if (property.details?.totalRooms < preferences.minRooms) return false;
    }
    if (preferences.maxRooms != null && property.details?.totalRooms != null) {
      if (property.details?.totalRooms > preferences.maxRooms) return false;
    }

    // Area filter
    if (preferences.minArea != null && property.details?.livingArea != null) {
      if (property.details?.livingArea < preferences.minArea) return false;
    }
    if (preferences.maxArea != null && property.details?.livingArea != null) {
      if (property.details?.livingArea > preferences.maxArea) return false;
    }

    return true;
  });
}

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
/**
 * HTTPS Function: Start Onboarding Conversation
 * Creates a new conversational onboarding session
 */
export const startOnboarding = onRequest({ cors: true }, async (request, response) => {
  try {
    const { userId } = request.body as { userId: string };

    if (!userId) {
      response.status(400).json({ error: 'User ID is required' });
      return;
    }

    const { ConversationalOnboardingService } = await import('./onboarding/conversational-onboarding.js');
    const onboardingService = new ConversationalOnboardingService(db);

    const conversation = await onboardingService.startConversation(userId);

    console.log(`Started onboarding conversation ${conversation.id} for user ${userId}`);

    response.json({
      message: 'Onboarding conversation started',
      conversation,
    });
  } catch (error) {
    console.error('Error starting onboarding:', error);
    response.status(500).json({
      error: 'Failed to start onboarding',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Process Onboarding Message
 * Processes a user message in an onboarding conversation
 */
export const processOnboardingMessage = onRequest({ cors: true }, async (request, response) => {
  try {
    const { conversationId, message } = request.body as {
      conversationId: string;
      message: string;
    };

    if (!conversationId || !message) {
      response.status(400).json({ error: 'Conversation ID and message are required' });
      return;
    }

    const { ConversationalOnboardingService } = await import('./onboarding/conversational-onboarding.js');
    const onboardingService = new ConversationalOnboardingService(db);

    const result = await onboardingService.processMessage(conversationId, message);

    console.log(`Processed message in conversation ${conversationId}`);

    response.json({
      message: 'Message processed successfully',
      conversation: result.conversation,
      response: result.response,
      questions: result.questions,
      shouldCreateAgents: result.conversation.stage === 'agent_creation',
    });
  } catch (error) {
    console.error('Error processing onboarding message:', error);
    response.status(500).json({
      error: 'Failed to process message',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Create Search Agents from Conversation
 * Creates search agents based on completed onboarding conversation
 */
export const createSearchAgentsFromConversation = onRequest({ cors: true }, async (request, response) => {
  try {
    const { conversationId } = request.body as { conversationId: string };

    if (!conversationId) {
      response.status(400).json({ error: 'Conversation ID is required' });
      return;
    }

    const { ConversationalOnboardingService } = await import('./onboarding/conversational-onboarding.js');
    const onboardingService = new ConversationalOnboardingService(db);

    const agents = await onboardingService.createSearchAgents(conversationId);

    console.log(`Created ${agents.length} search agents from conversation ${conversationId}`);

    // Mark conversation as completed
    await db.collection('onboarding_conversations').doc(conversationId).update({
      status: 'completed',
      stage: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    response.json({
      message: `Successfully created ${agents.length} search agents`,
      agents,
    });
  } catch (error) {
    console.error('Error creating search agents:', error);
    response.status(500).json({
      error: 'Failed to create search agents',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Get Onboarding Conversation
 * Retrieves the current state of an onboarding conversation
 */
export const getOnboardingConversation = onRequest({ cors: true }, async (request, response) => {
  try {
    const { conversationId } = request.query as { conversationId: string };

    if (!conversationId) {
      response.status(400).json({ error: 'Conversation ID is required' });
      return;
    }

    const conversationDoc = await db
      .collection('onboarding_conversations')
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      response.status(404).json({ error: 'Conversation not found' });
      return;
    }

    response.json(conversationDoc.data());
  } catch (error) {
    console.error('Error getting onboarding conversation:', error);
    response.status(500).json({
      error: 'Failed to get conversation',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Get User Search Agents
 * Retrieves all search agents for a user
 */
export const getUserSearchAgents = onRequest({ cors: true }, async (request, response) => {
  try {
    const { userId, activeOnly = false } = request.query as {
      userId: string;
      activeOnly?: boolean;
    };

    if (!userId) {
      response.status(400).json({ error: 'User ID is required' });
      return;
    }

    let query = db.collection('search_agents').where('userId', '==', userId);

    if (activeOnly) {
      query = query.where('active', '==', true) as admin.firestore.Query;
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const agents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    console.log(`Retrieved ${agents.length} search agents for user ${userId}`);

    response.json({
      message: 'Search agents retrieved successfully',
      agents,
    });
  } catch (error) {
    console.error('Error getting search agents:', error);
    response.status(500).json({
      error: 'Failed to get search agents',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * HTTPS Function: Update Search Agent
 * Updates a search agent's criteria or settings
 */
export const updateSearchAgent = onRequest({ cors: true }, async (request, response) => {
  try {
    const { agentId, updates } = request.body as {
      agentId: string;
      updates: Record<string, any>;
    };

    if (!agentId || !updates) {
      response.status(400).json({ error: 'Agent ID and updates are required' });
      return;
    }

    const agentRef = db.collection('search_agents').doc(agentId);
    const agentDoc = await agentRef.get();

    if (!agentDoc.exists) {
      response.status(404).json({ error: 'Search agent not found' });
      return;
    }

    await agentRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Updated search agent ${agentId}`);

    response.json({
      message: 'Search agent updated successfully',
      agentId,
    });
  } catch (error) {
    console.error('Error updating search agent:', error);
    response.status(500).json({
      error: 'Failed to update search agent',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Authentication Triggers
 *
 * NOTE: Full user management API available in auth-functions.ts requires Express.
 * Install: cd apps/backend-functions && pnpm install express @types/express
 */
export {
  beforeUserCreate,
  beforeUserSignIn,
} from './auth/simple-auth.js';

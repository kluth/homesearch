"use strict";
/**
 * Firebase Functions Gen 2 for House Finder
 * Production-ready cloud functions with Cloud Tasks integration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeUserSignIn = exports.beforeUserCreate = exports.getMarketTrend = exports.getUserPreferences = exports.setUserPreferences = exports.getPriceAnalysis = exports.trackInteraction = exports.getRecommendations = exports.smartSearch = exports.getGeneratedResponses = exports.markResponseSent = exports.generateResponse = exports.getStatistics = exports.getProperties = exports.getJobs = exports.processExtraction = exports.discoverSources = exports.startExtraction = void 0;
const https_1 = require("firebase-functions/v2/https");
const tasks_1 = require("firebase-functions/v2/tasks");
const options_1 = require("firebase-functions/v2/options");
const admin = __importStar(require("firebase-admin"));
const tasks_2 = require("@google-cloud/tasks");
const extraction_engine_1 = require("@house-finder/extraction-engine");
// Initialize Firebase Admin
admin.initializeApp();
// Initialize Firestore
const db = admin.firestore();
// Initialize Cloud Tasks
const tasksClient = new tasks_2.CloudTasksClient();
// Initialize AI Services
const recommendationEngine = new extraction_engine_1.RecommendationEngine();
const nlpParser = new extraction_engine_1.NLPSearchParser();
const priceIntelligence = new extraction_engine_1.PriceIntelligence();
// Set global options for all functions
(0, options_1.setGlobalOptions)({
    region: 'us-central1',
    maxInstances: 10,
    memory: '512MiB',
    timeoutSeconds: 540,
});
/**
 * HTTPS Function: Start Extraction
 * Discovers sources and creates Cloud Tasks for each source
 */
exports.startExtraction = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { location } = request.body;
        if (!location) {
            response.status(400).json({ error: 'Location is required' });
            return;
        }
        console.log(`Starting extraction for location: ${location}`);
        // Initialize discovery agent
        const agent = new extraction_engine_1.SourceDiscoveryAgent();
        await agent.initialize();
        // Discover sources
        const sources = await agent.discoverSources({
            location,
            limit: 10,
        });
        console.log(`Discovered ${sources.length} sources`);
        // Create Firestore batch for jobs
        const batch = db.batch();
        const jobs = [];
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
    }
    catch (error) {
        console.error('Error starting extraction:', error);
        response.status(500).json({
            error: 'Failed to start extraction',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * HTTPS Function: Discover Sources
 * Discovers and grades sources for a location
 */
exports.discoverSources = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { location, limit = 10 } = request.body;
        if (!location) {
            response.status(400).json({ error: 'Location is required' });
            return;
        }
        const agent = new extraction_engine_1.SourceDiscoveryAgent();
        await agent.initialize();
        const sources = await agent.discoverSources({ location, limit });
        response.json({
            message: `Discovered ${sources.length} sources for ${location}`,
            sources,
        });
    }
    catch (error) {
        console.error('Error discovering sources:', error);
        response.status(500).json({
            error: 'Failed to discover sources',
            message: error instanceof Error ? error.message : String(error),
        });
    }
});
/**
 * Cloud Task Handler: Process Extraction
 * Executes actual property extraction for a specific source
 */
exports.processExtraction = (0, tasks_1.onTaskDispatched)({
    retryConfig: {
        maxAttempts: 3,
        maxBackoffSeconds: 300,
    },
    rateLimits: {
        maxConcurrentDispatches: 5,
    },
}, async (request) => {
    try {
        const { jobId, source, location } = request.data;
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
        const transformer = new extraction_engine_1.DataTransformerService();
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
        console.log(`Completed extraction for job ${jobId}. Extracted ${transformedProperties.length} properties.`);
    }
    catch (error) {
        console.error('Error processing extraction:', error);
        // Update job status to failed
        const { jobId } = request.data;
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
});
/**
 * HTTPS Function: Get Jobs
 * Retrieves extraction jobs from Firestore
 */
exports.getJobs = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { status, limit = 50 } = request.query;
        let query = db
            .collection('extraction-jobs')
            .orderBy('createdAt', 'desc')
            .limit(Number(limit));
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.get();
        const jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        response.json(jobs);
    }
    catch (error) {
        console.error('Error getting jobs:', error);
        response.status(500).json({ error: 'Failed to get jobs' });
    }
});
/**
 * HTTPS Function: Get Properties
 * Retrieves properties from Firestore
 */
exports.getProperties = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { limit = 50, city, minPrice, maxPrice } = request.query;
        let query = db
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
    }
    catch (error) {
        console.error('Error getting properties:', error);
        response.status(500).json({ error: 'Failed to get properties' });
    }
});
/**
 * HTTPS Function: Get Statistics
 * Retrieves extraction statistics
 */
exports.getStatistics = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
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
    }
    catch (error) {
        console.error('Error getting statistics:', error);
        response.status(500).json({ error: 'Failed to get statistics' });
    }
});
/**
 * HTTPS Function: Generate Response
 * Generates personalized response to a property listing in the appropriate language
 */
exports.generateResponse = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { propertyId, userPreferences, language, tone, includeViewingRequest = true, specificQuestions = [], } = request.body;
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
        const property = propertyDoc.data();
        // Initialize response generator
        const generator = new extraction_engine_1.ResponseGeneratorService();
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
            language: language,
            tone: tone,
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
    }
    catch (error) {
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
exports.markResponseSent = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { responseId, sentAt } = request.body;
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
    }
    catch (error) {
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
exports.getGeneratedResponses = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { userId, sent, limit = 50 } = request.query;
        let query = db
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
    }
    catch (error) {
        console.error('Error getting generated responses:', error);
        response.status(500).json({ error: 'Failed to get generated responses' });
    }
});
/**
 * HTTPS Function: Smart Search with NLP
 * Parses natural language queries into structured search
 */
exports.smartSearch = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { query } = request.body;
        if (!query) {
            response.status(400).json({ error: 'Query is required' });
            return;
        }
        // Parse natural language query
        const parsed = nlpParser.parse(query);
        // Get all properties from Firestore
        const propertiesSnapshot = await db.collection('properties').limit(500).get();
        const allProperties = propertiesSnapshot.docs.map((doc) => doc.data());
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
    }
    catch (error) {
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
exports.getRecommendations = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { userId, limit = 20 } = request.query;
        if (!userId) {
            response.status(400).json({ error: 'User ID is required' });
            return;
        }
        // Get user preferences from Firestore
        const userDoc = await db.collection('user-preferences').doc(userId).get();
        const userPreferences = userDoc.exists ? userDoc.data() : undefined;
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
        const interactions = interactionsSnapshot.docs.map((doc) => doc.data());
        interactions.forEach((interaction) => recommendationEngine.addInteraction(interaction));
        // Get available properties
        const propertiesSnapshot = await db.collection('properties').limit(500).get();
        const allProperties = propertiesSnapshot.docs.map((doc) => doc.data());
        // Get recommendations
        const recommendations = recommendationEngine.getRecommendations(userId, allProperties, Number(limit));
        console.log(`Generated ${recommendations.length} recommendations for user ${userId}`);
        response.json({
            message: 'Recommendations generated successfully',
            recommendations,
            userPreferences,
            interactionCount: interactions.length,
        });
    }
    catch (error) {
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
exports.trackInteraction = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const interaction = request.body;
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
    }
    catch (error) {
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
exports.getPriceAnalysis = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { propertyId } = request.query;
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
        const property = propertyDoc.data();
        // Get market data (properties in same city)
        const marketSnapshot = await db
            .collection('properties')
            .where('location.city', '==', property.location.city)
            .limit(200)
            .get();
        const marketData = marketSnapshot.docs.map((doc) => doc.data());
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
    }
    catch (error) {
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
exports.setUserPreferences = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const preferences = request.body;
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
    }
    catch (error) {
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
exports.getUserPreferences = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { userId } = request.query;
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
    }
    catch (error) {
        console.error('Error getting preferences:', error);
        response.status(500).json({ error: 'Failed to get preferences' });
    }
});
/**
 * HTTPS Function: Get Market Trend
 * Analyzes market trends for a location
 */
exports.getMarketTrend = (0, https_1.onRequest)({ cors: true }, async (request, response) => {
    try {
        const { location, propertyType = 'apartment' } = request.query;
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
        const historicalData = snapshot.docs.map((doc) => doc.data());
        // Analyze trend
        const trend = priceIntelligence.analyzeMarketTrend(location, propertyType, historicalData);
        console.log(`Market trend for ${location}: ${trend.direction} (${trend.priceChange}%)`);
        response.json({
            message: 'Market trend analyzed',
            trend,
        });
    }
    catch (error) {
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
function filterPropertiesByPreferences(properties, preferences) {
    return properties.filter((property) => {
        // Budget filter
        if (preferences.budgetMin != null && property.price < preferences.budgetMin) {
            return false;
        }
        if (preferences.budgetMax != null && property.price > preferences.budgetMax) {
            return false;
        }
        // City filter
        if (preferences.preferredCities != null &&
            preferences.preferredCities.length > 0 &&
            property.location.city != null) {
            const match = preferences.preferredCities.some((city) => city.toLowerCase() === property.location.city?.toLowerCase());
            if (!match)
                return false;
        }
        // Rooms filter
        if (preferences.minRooms != null && property.details?.totalRooms != null) {
            if (property.details?.totalRooms < preferences.minRooms)
                return false;
        }
        if (preferences.maxRooms != null && property.details?.totalRooms != null) {
            if (property.details?.totalRooms > preferences.maxRooms)
                return false;
        }
        // Area filter
        if (preferences.minArea != null && property.details?.livingArea != null) {
            if (property.details?.livingArea < preferences.minArea)
                return false;
        }
        if (preferences.maxArea != null && property.details?.livingArea != null) {
            if (property.details?.livingArea > preferences.maxArea)
                return false;
        }
        return true;
    });
}
/**
 * Helper: Create Cloud Task for extraction
 */
async function createExtractionTask(jobId, source, location) {
    const project = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const queue = process.env.CLOUD_TASKS_QUEUE || 'extraction-queue';
    const locationId = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
    const url = process.env.FUNCTION_URL || `https://${locationId}-${project}.cloudfunctions.net`;
    const parent = tasksClient.queuePath(project, locationId, queue);
    const task = {
        httpRequest: {
            httpMethod: 'POST',
            url: `${url}/processExtraction`,
            headers: {
                'Content-Type': 'application/json',
            },
            body: Buffer.from(JSON.stringify({
                jobId,
                source,
                location,
            })).toString('base64'),
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
function calculatePriority(qualityScore) {
    if (qualityScore >= 90)
        return 10; // CRITICAL
    if (qualityScore >= 75)
        return 7; // HIGH
    if (qualityScore >= 60)
        return 5; // MEDIUM
    return 3; // LOW
}
/**
 * Helper: Simulate extraction (placeholder for actual provider execution)
 */
async function simulateExtraction(source, location) {
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
 * Authentication Triggers
 *
 * NOTE: Full user management API available in auth-functions.ts requires Express.
 * Install: cd apps/backend-functions && pnpm install express @types/express
 */
var simple_auth_js_1 = require("./auth/simple-auth.js");
Object.defineProperty(exports, "beforeUserCreate", { enumerable: true, get: function () { return simple_auth_js_1.beforeUserCreate; } });
Object.defineProperty(exports, "beforeUserSignIn", { enumerable: true, get: function () { return simple_auth_js_1.beforeUserSignIn; } });
//# sourceMappingURL=index.js.map
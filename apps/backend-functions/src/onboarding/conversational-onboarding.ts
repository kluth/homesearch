import { Firestore } from 'firebase-admin/firestore';
import {
  OnboardingConversation,
  ConversationStage,
  NLQuery,
  SearchAgent,
  SearchAgentType,
  GeneratedQuestion,
  ConversationContext,
  SmartSuggestion,
} from '@house-finder/domain';

/**
 * Conversational Onboarding Service
 *
 * Handles natural language onboarding conversations, extracts user intent,
 * and creates personalized search agents.
 */
export class ConversationalOnboardingService {
  constructor(private firestore: Firestore) {}

  /**
   * Start a new onboarding conversation
   */
  async startConversation(userId: string): Promise<OnboardingConversation> {
    const conversation: OnboardingConversation = {
      id: this.firestore.collection('onboarding_conversations').doc().id,
      userId,
      stage: ConversationStage.GREETING,
      status: 'active',
      messages: [
        {
          id: this.generateId(),
          role: 'assistant',
          content: this.getGreeting(),
          timestamp: new Date(),
        },
      ],
      extractedContext: {
        confidence: {
          overall: 0,
        },
      },
      startedAt: new Date(),
      lastMessageAt: new Date(),
    };

    await this.firestore
      .collection('onboarding_conversations')
      .doc(conversation.id)
      .set(conversation);

    return conversation;
  }

  /**
   * Process user message and generate response
   */
  async processMessage(
    conversationId: string,
    userMessage: string
  ): Promise<{
    conversation: OnboardingConversation;
    response: string;
    questions?: GeneratedQuestion[];
    suggestions?: SmartSuggestion[];
  }> {
    // Get existing conversation
    const conversationDoc = await this.firestore
      .collection('onboarding_conversations')
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data() as OnboardingConversation;

    // Parse the user's message using NLP
    const nlQuery = await this.parseNaturalLanguage(
      conversation.userId,
      userMessage,
      conversationId
    );

    // Add user message to conversation
    conversation.messages.push({
      id: this.generateId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      extractedInfo: this.extractInfoFromQuery(nlQuery),
      intent: nlQuery.intent.primary,
      confidence: nlQuery.intent.confidence,
    });

    // Update conversation context
    await this.updateContext(conversation, nlQuery);

    // Determine next stage and generate response
    const { response, questions, suggestions } = await this.generateResponse(
      conversation,
      nlQuery
    );

    // Add assistant response
    conversation.messages.push({
      id: this.generateId(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      questions,
    });

    // Update conversation
    conversation.lastMessageAt = new Date();

    await this.firestore
      .collection('onboarding_conversations')
      .doc(conversationId)
      .update({
        messages: conversation.messages,
        extractedContext: conversation.extractedContext,
        missingInfo: conversation.missingInfo,
        stage: conversation.stage,
        lastMessageAt: conversation.lastMessageAt,
      });

    return { conversation, response, questions, suggestions };
  }

  /**
   * Parse natural language query
   */
  private async parseNaturalLanguage(
    userId: string,
    rawQuery: string,
    conversationId?: string
  ): Promise<NLQuery> {
    // In production, this would use OpenAI, Google Cloud NLP, or similar
    // For now, we'll use pattern matching and keywords

    const nlQuery: NLQuery = {
      id: this.generateId(),
      userId,
      conversationId,
      rawQuery,
      language: 'en',
      parsed: this.extractComponents(rawQuery),
      intent: this.classifyIntent(rawQuery),
      entities: this.extractEntities(rawQuery),
      sentiment: this.analyzeSentiment(rawQuery),
      createdAt: new Date(),
    };

    // Save query for learning
    await this.firestore.collection('nl_queries').doc(nlQuery.id).set(nlQuery);

    return nlQuery;
  }

  /**
   * Extract components from natural language
   */
  private extractComponents(query: string): NLQuery['parsed'] {
    const lowerQuery = query.toLowerCase();

    return {
      location: this.extractLocation(lowerQuery),
      price: this.extractPrice(lowerQuery),
      propertyType: this.extractPropertyType(lowerQuery),
      bedrooms: this.extractBedrooms(lowerQuery),
      bathrooms: this.extractBathrooms(lowerQuery),
      features: this.extractFeatures(lowerQuery),
      timeline: this.extractTimeline(lowerQuery),
      lifestyle: this.extractLifestyle(lowerQuery),
      commute: this.extractCommute(lowerQuery),
    };
  }

  /**
   * Extract location information
   */
  private extractLocation(query: string) {
    const mentioned = /\b(in|near|around|at)\s+([a-z\s]+)/i.test(query);

    if (!mentioned) {
      return { mentioned: false };
    }

    const entities: any[] = [];

    // City extraction (simple pattern)
    const cityMatch = query.match(/\b(in|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (cityMatch) {
      entities.push({
        text: cityMatch[2],
        type: 'city',
        confidence: 0.8,
        normalized: cityMatch[2],
      });
    }

    // State extraction
    const statePattern = /\b(CA|NY|TX|FL|IL|PA|OH|GA|NC|MI|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|IA|MS|AR|KS|UT|NV|NM|WV|NE|ID|HI|NH|ME|MT|RI|DE|SD|ND|AK|VT|WY|California|New York|Texas|Florida|Illinois)\b/i;
    const stateMatch = query.match(statePattern);
    if (stateMatch) {
      entities.push({
        text: stateMatch[0],
        type: 'state',
        confidence: 0.9,
        normalized: stateMatch[0],
      });
    }

    return { mentioned, entities };
  }

  /**
   * Extract price information
   */
  private extractPrice(query: string) {
    const mentioned = /\$([\d,]+)k?|under|below|up to|max|budget/i.test(query);

    if (!mentioned) {
      return { mentioned: false };
    }

    let min: number | undefined;
    let max: number | undefined;

    // Price with 'k' notation: $500k
    const priceKMatch = query.match(/\$(\d+)k/i);
    if (priceKMatch) {
      max = parseInt(priceKMatch[1]) * 1000;
    }

    // Exact price: $500,000
    const exactPriceMatch = query.match(/\$([\d,]+)/);
    if (exactPriceMatch) {
      const price = parseInt(exactPriceMatch[1].replace(/,/g, ''));
      if (query.includes('under') || query.includes('max') || query.includes('up to')) {
        max = price;
      } else if (query.includes('above') || query.includes('over')) {
        min = price;
      } else {
        max = price;
      }
    }

    // Range: $300k to $500k
    const rangeMatch = query.match(/\$(\d+)k?\s*(?:to|-)\s*\$(\d+)k?/i);
    if (rangeMatch) {
      min = parseInt(rangeMatch[1]) * (rangeMatch[1].length <= 3 ? 1000 : 1);
      max = parseInt(rangeMatch[2]) * (rangeMatch[2].length <= 3 ? 1000 : 1);
    }

    return {
      mentioned,
      min,
      max,
      currency: 'USD',
      confidence: 0.85,
    };
  }

  /**
   * Extract property type
   */
  private extractPropertyType(query: string) {
    const types: string[] = [];

    const typePatterns = {
      house: /\b(house|home|single-family|single family)\b/i,
      condo: /\b(condo|condominium)\b/i,
      apartment: /\b(apartment|apt|flat)\b/i,
      townhouse: /\b(townhouse|townhome|town home)\b/i,
      loft: /\bloft\b/i,
      villa: /\bvilla\b/i,
    };

    for (const [type, pattern] of Object.entries(typePatterns)) {
      if (pattern.test(query)) {
        types.push(type);
      }
    }

    return {
      mentioned: types.length > 0,
      types: types.length > 0 ? types : undefined,
      confidence: types.length > 0 ? 0.9 : undefined,
    };
  }

  /**
   * Extract bedroom requirements
   */
  private extractBedrooms(query: string) {
    const bedroomMatch = query.match(/(\d+)\s*(?:\+|or more)?\s*(?:bed|bedroom)/i);

    if (!bedroomMatch) {
      return { mentioned: false };
    }

    const number = parseInt(bedroomMatch[1]);
    const isMinimum = /\+|or more|at least/i.test(query);

    return {
      mentioned: true,
      min: isMinimum ? number : undefined,
      exact: !isMinimum ? number : undefined,
      confidence: 0.95,
    };
  }

  /**
   * Extract bathroom requirements
   */
  private extractBathrooms(query: string) {
    const bathroomMatch = query.match(/(\d+(?:\.\d+)?)\s*(?:bath|bathroom)/i);

    if (!bathroomMatch) {
      return { mentioned: false };
    }

    const number = parseFloat(bathroomMatch[1]);

    return {
      mentioned: true,
      min: number,
      confidence: 0.9,
    };
  }

  /**
   * Extract features and amenities
   */
  private extractFeatures(query: string) {
    const features: { mustHave: string[]; preferred: string[]; avoid: string[] } = {
      mustHave: [],
      preferred: [],
      avoid: [],
    };

    const featurePatterns = {
      pool: /\b(pool|swimming pool)\b/i,
      garage: /\b(garage|parking)\b/i,
      garden: /\b(garden|yard|backyard)\b/i,
      balcony: /\b(balcony|terrace|patio)\b/i,
      fireplace: /\bfireplace\b/i,
      ac: /\b(ac|air conditioning|a\/c)\b/i,
      heating: /\b(heating|hvac)\b/i,
      hardwood: /\b(hardwood|wood floor)\b/i,
      carpet: /\bcarpet\b/i,
      laundry: /\b(laundry|washer|dryer|w\/d)\b/i,
      dishwasher: /\bdishwasher\b/i,
      elevator: /\belevator\b/i,
      doorman: /\bdoorman\b/i,
    };

    for (const [feature, pattern] of Object.entries(featurePatterns)) {
      if (pattern.test(query)) {
        // Determine if it's a must-have or preference
        const isMustHave = /\b(must|need|require|essential)\b/i.test(query);
        const isPreferred = /\b(prefer|like|want|nice to have)\b/i.test(query);
        const isAvoid = /\b(no|without|avoid|don't want)\b/i.test(query);

        if (isAvoid) {
          features.avoid.push(feature);
        } else if (isMustHave) {
          features.mustHave.push(feature);
        } else {
          features.preferred.push(feature);
        }
      }
    }

    const mentioned =
      features.mustHave.length > 0 ||
      features.preferred.length > 0 ||
      features.avoid.length > 0;

    return mentioned ? { mentioned, ...features } : { mentioned: false };
  }

  /**
   * Extract timeline information
   */
  private extractTimeline(query: string) {
    const timelineKeywords = {
      urgent: /\b(asap|urgent|immediately|right away|now)\b/i,
      soon: /\b(soon|within \d+ months?|next month)\b/i,
      flexible: /\b(flexible|no rush|whenever)\b/i,
      browsing: /\b(looking|browsing|just looking|exploring)\b/i,
    };

    let urgency: any;
    const keywords: string[] = [];

    for (const [level, pattern] of Object.entries(timelineKeywords)) {
      if (pattern.test(query)) {
        urgency = level;
        const match = query.match(pattern);
        if (match) keywords.push(match[0]);
      }
    }

    return {
      mentioned: urgency !== undefined,
      urgency,
      keywords: keywords.length > 0 ? keywords : undefined,
    };
  }

  /**
   * Extract lifestyle indicators
   */
  private extractLifestyle(query: string) {
    const indicators: string[] = [];
    const keywords: string[] = [];

    const lifestylePatterns = {
      family_friendly: /\b(family|kids|children|school)\b/i,
      walkable: /\b(walk|walkable|pedestrian)\b/i,
      nightlife: /\b(nightlife|bars|restaurants|entertainment)\b/i,
      quiet: /\b(quiet|peaceful|calm)\b/i,
      urban: /\b(urban|city|downtown)\b/i,
      suburban: /\b(suburban|suburbs)\b/i,
      near_transit: /\b(transit|metro|subway|train|bus)\b/i,
      pet_friendly: /\b(pet|dog|cat)\b/i,
    };

    for (const [indicator, pattern] of Object.entries(lifestylePatterns)) {
      if (pattern.test(query)) {
        indicators.push(indicator);
        const match = query.match(pattern);
        if (match) keywords.push(match[0]);
      }
    }

    return {
      mentioned: indicators.length > 0,
      indicators: indicators.length > 0 ? indicators : undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
    };
  }

  /**
   * Extract commute information
   */
  private extractCommute(query: string) {
    const mentioned = /\b(commute|work|office|minutes? away|drive to)\b/i.test(query);

    if (!mentioned) {
      return { mentioned: false };
    }

    // Extract time: "30 minutes from downtown"
    const timeMatch = query.match(/(\d+)\s*(?:min|minute|minutes)/i);
    const maxTime = timeMatch ? parseInt(timeMatch[1]) : undefined;

    // Extract location: "close to downtown", "near the office"
    const locationMatch = query.match(/(?:to|from|near)\s+([a-z\s]+)/i);
    const workLocation = locationMatch ? locationMatch[1].trim() : undefined;

    return {
      mentioned,
      workLocation,
      maxTime,
    };
  }

  /**
   * Classify user intent
   */
  private classifyIntent(query: string): NLQuery['intent'] {
    const lowerQuery = query.toLowerCase();

    // Question patterns
    if (/^(what|where|when|how|why|which|can you|could you)/i.test(query)) {
      return {
        primary: 'ask_question',
        confidence: 0.9,
      };
    }

    // Confirmation patterns
    if (/^(yes|yeah|yep|sure|ok|okay|sounds good|that works|correct)/i.test(query)) {
      return {
        primary: 'confirm',
        confidence: 0.95,
      };
    }

    // Rejection patterns
    if (/^(no|nope|not really|actually)/i.test(query)) {
      return {
        primary: 'reject',
        confidence: 0.95,
      };
    }

    // Modification patterns
    if (/(change|update|modify|different|instead)/i.test(query)) {
      return {
        primary: 'modify_criteria',
        confidence: 0.85,
      };
    }

    // Default: providing search criteria
    return {
      primary: 'provide_criteria',
      confidence: 0.8,
    };
  }

  /**
   * Extract named entities
   */
  private extractEntities(query: string): NLQuery['entities'] {
    const entities: any[] = [];

    // Numbers
    const numbers = query.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g);
    if (numbers) {
      numbers.forEach((num, i) => {
        entities.push({
          text: num,
          type: 'number',
          value: parseFloat(num.replace(/,/g, '')),
          confidence: 0.99,
          position: {
            start: query.indexOf(num),
            end: query.indexOf(num) + num.length,
          },
        });
      });
    }

    return entities.length > 0 ? entities : undefined;
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(query: string): NLQuery['sentiment'] {
    // Simple keyword-based sentiment
    const positiveWords = /\b(love|great|perfect|amazing|wonderful|nice|good)\b/gi;
    const negativeWords = /\b(hate|terrible|awful|bad|poor|worst)\b/gi;

    const positiveMatches = (query.match(positiveWords) || []).length;
    const negativeMatches = (query.match(negativeWords) || []).length;

    const score = (positiveMatches - negativeMatches) / Math.max(positiveMatches + negativeMatches, 1);
    const label = score > 0.3 ? 'positive' : score < -0.3 ? 'negative' : 'neutral';

    return {
      score,
      label,
      confidence: 0.7,
    };
  }

  /**
   * Extract info from NL query to conversation format
   */
  private extractInfoFromQuery(nlQuery: NLQuery): any {
    const info: any = {};

    if (nlQuery.parsed.location?.mentioned && nlQuery.parsed.location.entities) {
      info.location = {};
      nlQuery.parsed.location.entities.forEach((entity) => {
        if (entity.type === 'city') info.location.city = entity.normalized;
        if (entity.type === 'state') info.location.state = entity.normalized;
      });
    }

    if (nlQuery.parsed.price?.mentioned) {
      info.priceRange = {
        min: nlQuery.parsed.price.min,
        max: nlQuery.parsed.price.max,
        currency: nlQuery.parsed.price.currency,
      };
    }

    if (nlQuery.parsed.propertyType?.mentioned) {
      info.propertyType = nlQuery.parsed.propertyType.types;
    }

    if (nlQuery.parsed.bedrooms?.mentioned) {
      info.bedrooms = {
        min: nlQuery.parsed.bedrooms.min,
        exact: nlQuery.parsed.bedrooms.exact,
      };
    }

    if (nlQuery.parsed.bathrooms?.mentioned) {
      info.bathrooms = {
        min: nlQuery.parsed.bathrooms.min,
      };
    }

    if (nlQuery.parsed.features?.mentioned) {
      info.mustHave = nlQuery.parsed.features.mustHave;
      info.niceToHave = nlQuery.parsed.features.preferred;
      info.dealBreakers = nlQuery.parsed.features.avoid;
    }

    if (nlQuery.parsed.timeline?.mentioned) {
      info.timeline = {
        urgency: nlQuery.parsed.timeline.urgency,
      };
    }

    if (nlQuery.parsed.lifestyle?.mentioned) {
      info.lifestyle = nlQuery.parsed.lifestyle.indicators;
    }

    if (nlQuery.parsed.commute?.mentioned) {
      info.workLocation = {
        address: nlQuery.parsed.commute.workLocation,
        maxCommuteMinutes: nlQuery.parsed.commute.maxTime,
      };
    }

    return Object.keys(info).length > 0 ? info : undefined;
  }

  /**
   * Update conversation context based on new information
   */
  private async updateContext(conversation: OnboardingConversation, nlQuery: NLQuery) {
    if (!conversation.extractedContext) {
      conversation.extractedContext = {
        confidence: {
          location: 0,
          price: 0,
          features: 0,
          overall: 0,
        },
      };
    }

    // Merge location info
    if (nlQuery.parsed.location?.mentioned && nlQuery.parsed.location.entities) {
      if (!conversation.extractedContext.location) {
        conversation.extractedContext.location = {};
      }

      nlQuery.parsed.location.entities.forEach((entity) => {
        if (entity.type === 'city') {
          conversation.extractedContext!.location!.city = entity.normalized;
        }
        if (entity.type === 'state') {
          conversation.extractedContext!.location!.state = entity.normalized;
        }
      });

      conversation.extractedContext.confidence.location = 0.8;
    }

    // Merge property preferences
    if (
      nlQuery.parsed.price?.mentioned ||
      nlQuery.parsed.propertyType?.mentioned ||
      nlQuery.parsed.bedrooms?.mentioned ||
      nlQuery.parsed.bathrooms?.mentioned
    ) {
      if (!conversation.extractedContext.propertyPreferences) {
        conversation.extractedContext.propertyPreferences = {};
      }

      if (nlQuery.parsed.price?.mentioned) {
        conversation.extractedContext.propertyPreferences.priceMin = nlQuery.parsed.price.min;
        conversation.extractedContext.propertyPreferences.priceMax = nlQuery.parsed.price.max;
        conversation.extractedContext.confidence.price = 0.85;
      }

      if (nlQuery.parsed.propertyType?.mentioned) {
        conversation.extractedContext.propertyPreferences.types = nlQuery.parsed.propertyType.types;
      }

      if (nlQuery.parsed.bedrooms?.mentioned) {
        conversation.extractedContext.propertyPreferences.bedroomsMin = nlQuery.parsed.bedrooms.min;
        conversation.extractedContext.propertyPreferences.bedroomsMax = nlQuery.parsed.bedrooms.exact;
      }

      if (nlQuery.parsed.bathrooms?.mentioned) {
        conversation.extractedContext.propertyPreferences.bathroomsMin = nlQuery.parsed.bathrooms.min;
      }
    }

    // Merge features
    if (nlQuery.parsed.features?.mentioned) {
      conversation.extractedContext.mustHaveFeatures = [
        ...(conversation.extractedContext.mustHaveFeatures || []),
        ...(nlQuery.parsed.features.mustHave || []),
      ];
      conversation.extractedContext.niceToHaveFeatures = [
        ...(conversation.extractedContext.niceToHaveFeatures || []),
        ...(nlQuery.parsed.features.preferred || []),
      ];
      conversation.extractedContext.dealBreakers = [
        ...(conversation.extractedContext.dealBreakers || []),
        ...(nlQuery.parsed.features.avoid || []),
      ];

      conversation.extractedContext.confidence.features = 0.8;
    }

    // Merge timeline
    if (nlQuery.parsed.timeline?.mentioned) {
      if (!conversation.extractedContext.timeline) {
        conversation.extractedContext.timeline = {};
      }
      conversation.extractedContext.timeline.urgency = nlQuery.parsed.timeline.urgency;
    }

    // Merge lifestyle
    if (nlQuery.parsed.lifestyle?.mentioned) {
      conversation.extractedContext.lifestyle = [
        ...(conversation.extractedContext.lifestyle || []),
        ...(nlQuery.parsed.lifestyle.indicators || []),
      ];
    }

    // Merge commute
    if (nlQuery.parsed.commute?.mentioned) {
      conversation.extractedContext.workCommute = {
        address: nlQuery.parsed.commute.workLocation,
        maxMinutes: nlQuery.parsed.commute.maxTime,
      };
    }

    // Update overall confidence
    const confidences = [
      conversation.extractedContext.confidence.location || 0,
      conversation.extractedContext.confidence.price || 0,
      conversation.extractedContext.confidence.features || 0,
    ];
    conversation.extractedContext.confidence.overall =
      confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }

  /**
   * Generate response based on conversation state
   */
  private async generateResponse(
    conversation: OnboardingConversation,
    nlQuery: NLQuery
  ): Promise<{
    response: string;
    questions?: GeneratedQuestion[];
    suggestions?: SmartSuggestion[];
  }> {
    const context = conversation.extractedContext;

    // Check if we have enough information to create agents
    const hasLocation = context?.location?.city || context?.location?.state;
    const hasPrice = context?.propertyPreferences?.priceMax;
    const hasPropertyType = context?.propertyPreferences?.types;

    if (hasLocation && hasPrice) {
      // We have minimum required info
      conversation.stage = ConversationStage.CONFIRMATION;

      return {
        response: this.generateConfirmationMessage(context!),
        questions: [],
      };
    }

    // Generate follow-up questions
    const questions = await this.generateFollowUpQuestions(conversation);

    conversation.stage = ConversationStage.CLARIFICATION;

    return {
      response: this.generateClarificationMessage(questions),
      questions,
    };
  }

  /**
   * Generate follow-up questions
   */
  private async generateFollowUpQuestions(
    conversation: OnboardingConversation
  ): Promise<GeneratedQuestion[]> {
    const questions: GeneratedQuestion[] = [];
    const context = conversation.extractedContext;

    // Location question
    if (!context?.location?.city && !context?.location?.state) {
      questions.push({
        id: this.generateId(),
        conversationId: conversation.id,
        question: 'Which city or area are you looking to move to?',
        category: 'location',
        type: 'free_text',
        importance: 'critical',
        priority: 100,
        validation: {
          required: true,
        },
        asked: false,
        answered: false,
        skipped: false,
        createdAt: new Date(),
      });
    }

    // Price question
    if (!context?.propertyPreferences?.priceMax) {
      questions.push({
        id: this.generateId(),
        conversationId: conversation.id,
        question: "What's your budget? (You can say something like '$500k' or '$300k to $500k')",
        category: 'price',
        type: 'free_text',
        importance: 'critical',
        priority: 90,
        validation: {
          required: true,
        },
        asked: false,
        answered: false,
        skipped: false,
        createdAt: new Date(),
      });
    }

    // Property type question
    if (!context?.propertyPreferences?.types) {
      questions.push({
        id: this.generateId(),
        conversationId: conversation.id,
        question: 'What type of property are you looking for?',
        category: 'property_type',
        type: 'multiple_choice',
        options: [
          { value: 'house', label: 'House' },
          { value: 'condo', label: 'Condo' },
          { value: 'apartment', label: 'Apartment' },
          { value: 'townhouse', label: 'Townhouse' },
        ],
        importance: 'important',
        priority: 80,
        validation: {
          required: false,
        },
        asked: false,
        answered: false,
        skipped: false,
        createdAt: new Date(),
      });
    }

    return questions;
  }

  /**
   * Generate clarification message
   */
  private generateClarificationMessage(questions: GeneratedQuestion[]): string {
    if (questions.length === 0) {
      return "Great! I think I have all the information I need. Let me create some personalized search agents for you.";
    }

    const firstQuestion = questions[0];
    return `Thanks for that info! ${firstQuestion.question}`;
  }

  /**
   * Generate confirmation message
   */
  private generateConfirmationMessage(context: any): string {
    const location = context.location?.city || context.location?.state || 'your area';
    const price = context.propertyPreferences?.priceMax
      ? `up to $${(context.propertyPreferences.priceMax / 1000).toFixed(0)}k`
      : '';
    const beds = context.propertyPreferences?.bedroomsMin
      ? `${context.propertyPreferences.bedroomsMin}+ bedrooms`
      : '';

    return `Perfect! So you're looking for properties ${location ? `in ${location}` : ''} ${price} ${beds}. Should I create personalized search agents for you? They'll automatically find new listings that match your criteria and send you alerts.`;
  }

  /**
   * Create search agents from conversation
   */
  async createSearchAgents(conversationId: string): Promise<SearchAgent[]> {
    const conversationDoc = await this.firestore
      .collection('onboarding_conversations')
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data() as OnboardingConversation;
    const context = conversation.extractedContext!;
    const agents: SearchAgent[] = [];

    // Create primary search agent
    const primaryAgent = await this.createPrimaryAgent(conversation, context);
    agents.push(primaryAgent);

    // Create alternative agents (slightly different criteria)
    if (context.propertyPreferences?.priceMax) {
      const expandedAgent = await this.createExpandedAgent(conversation, context);
      agents.push(expandedAgent);
    }

    // Update conversation
    await this.firestore
      .collection('onboarding_conversations')
      .doc(conversationId)
      .update({
        generatedAgents: agents.map((a) => ({
          agentId: a.id,
          type: a.type,
          createdAt: new Date(),
        })),
        stage: ConversationStage.AGENT_CREATION,
      });

    // Configure waiting content based on location
    await this.configureWaitingContent(conversation.userId, context);

    // Create user preferences
    await this.createUserPreferences(conversation.userId, context);

    return agents;
  }

  /**
   * Create primary search agent
   */
  private async createPrimaryAgent(
    conversation: OnboardingConversation,
    context: any
  ): Promise<SearchAgent> {
    const agent: SearchAgent = {
      id: this.generateId(),
      userId: conversation.userId,
      conversationId: conversation.id,
      name: 'My Main Search',
      description: 'Primary search based on your conversation',
      type: SearchAgentType.PRIMARY,
      criteria: {
        location: {
          city: context.location?.city,
          state: context.location?.state,
          country: context.location?.country || 'USA',
          radius: 25, // 25km default
        },
        propertyTypes: context.propertyPreferences?.types || ['house', 'condo'],
        price: {
          min: context.propertyPreferences?.priceMin,
          max: context.propertyPreferences?.priceMax,
          currency: 'USD',
        },
        bedrooms: {
          min: context.propertyPreferences?.bedroomsMin,
        },
        bathrooms: {
          min: context.propertyPreferences?.bathroomsMin,
        },
        features: {
          required: context.mustHaveFeatures,
          preferred: context.niceToHaveFeatures,
          excluded: context.dealBreakers,
        },
      },
      weights: {
        price: 8,
        location: 9,
        size: 6,
        features: context.mustHaveFeatures?.length > 0 ? 9 : 6,
        condition: 5,
        schools: context.lifestyle?.includes('family_friendly') ? 8 : 5,
        commute: context.workCommute ? 8 : 5,
      },
      actions: {
        autoAlert: true,
        alertFrequency: context.timeline?.urgency === 'urgent' ? 'instant' : 'daily',
        autoSave: true,
        emailDigest: true,
      },
      active: true,
      runFrequency: 'daily',
      totalMatches: 0,
      newMatches: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.firestore.collection('search_agents').doc(agent.id).set(agent);

    return agent;
  }

  /**
   * Create expanded search agent (broader criteria)
   */
  private async createExpandedAgent(
    conversation: OnboardingConversation,
    context: any
  ): Promise<SearchAgent> {
    const agent: SearchAgent = {
      id: this.generateId(),
      userId: conversation.userId,
      conversationId: conversation.id,
      name: 'Expanded Search',
      description: 'Slightly higher price range, more options',
      type: SearchAgentType.EXPANDED,
      criteria: {
        location: {
          city: context.location?.city,
          state: context.location?.state,
          country: context.location?.country || 'USA',
          radius: 40, // Larger radius
        },
        propertyTypes: context.propertyPreferences?.types || ['house', 'condo', 'townhouse'],
        price: {
          min: context.propertyPreferences?.priceMin,
          max: context.propertyPreferences?.priceMax
            ? context.propertyPreferences.priceMax * 1.15
            : undefined, // 15% higher
          currency: 'USD',
        },
        bedrooms: {
          min: context.propertyPreferences?.bedroomsMin,
        },
        bathrooms: {
          min: context.propertyPreferences?.bathroomsMin,
        },
        features: {
          preferred: context.mustHaveFeatures, // Must-haves become preferred
          excluded: context.dealBreakers,
        },
      },
      weights: {
        price: 7,
        location: 8,
        size: 6,
        features: 6,
        condition: 5,
        schools: context.lifestyle?.includes('family_friendly') ? 7 : 5,
        commute: context.workCommute ? 7 : 5,
      },
      actions: {
        autoAlert: true,
        alertFrequency: 'weekly',
        autoSave: false,
        emailDigest: true,
      },
      active: true,
      runFrequency: 'weekly',
      totalMatches: 0,
      newMatches: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.firestore.collection('search_agents').doc(agent.id).set(agent);

    return agent;
  }

  /**
   * Configure waiting content based on user's target location
   */
  private async configureWaitingContent(userId: string, context: any) {
    // Detect target location and language
    const targetCountry = this.detectTargetCountry(context.location);
    const targetLanguage = this.detectLanguageForCountry(targetCountry);

    // Create waiting content progress document
    const progressRef = this.firestore.collection('waiting_content_progress').doc(userId);

    await progressRef.set({
      userId,
      targetLocation: {
        city: context.location?.city,
        state: context.location?.state,
        country: targetCountry,
      },
      targetLanguage,
      currentLevel: 'beginner',
      completedLessons: [],
      completedCulturalContent: [],
      streakDays: 0,
      lastActivityAt: new Date(),
      achievements: [],
      totalPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `Configured waiting content for user ${userId} - Location: ${context.location?.city}, Language: ${targetLanguage}`
    );
  }

  /**
   * Detect target country from location context
   */
  private detectTargetCountry(location: any): string {
    // Default to USA
    if (!location) return 'USA';

    // If country is explicitly mentioned, use it
    if (location.country) return location.country;

    // If state is mentioned, likely USA
    if (location.state) {
      const usStates = [
        'AL',
        'AK',
        'AZ',
        'AR',
        'CA',
        'CO',
        'CT',
        'DE',
        'FL',
        'GA',
        'HI',
        'ID',
        'IL',
        'IN',
        'IA',
        'KS',
        'KY',
        'LA',
        'ME',
        'MD',
        'MA',
        'MI',
        'MN',
        'MS',
        'MO',
        'MT',
        'NE',
        'NV',
        'NH',
        'NJ',
        'NM',
        'NY',
        'NC',
        'ND',
        'OH',
        'OK',
        'OR',
        'PA',
        'RI',
        'SC',
        'SD',
        'TN',
        'TX',
        'UT',
        'VT',
        'VA',
        'WA',
        'WV',
        'WI',
        'WY',
        'California',
        'Texas',
        'Florida',
        'New York',
      ];
      if (usStates.some((s) => location.state.includes(s))) {
        return 'USA';
      }
    }

    // City-based detection (basic examples)
    const cityCountryMap: Record<string, string> = {
      London: 'UK',
      Paris: 'France',
      Berlin: 'Germany',
      Madrid: 'Spain',
      Rome: 'Italy',
      Tokyo: 'Japan',
      Sydney: 'Australia',
      Toronto: 'Canada',
      Vancouver: 'Canada',
      Montreal: 'Canada',
    };

    if (location.city && cityCountryMap[location.city]) {
      return cityCountryMap[location.city];
    }

    return 'USA'; // Default
  }

  /**
   * Detect language for country
   */
  private detectLanguageForCountry(country: string): string {
    const countryLanguageMap: Record<string, string> = {
      USA: 'en-US',
      UK: 'en-GB',
      France: 'fr',
      Germany: 'de',
      Spain: 'es',
      Italy: 'it',
      Japan: 'ja',
      China: 'zh-CN',
      Canada: 'en-CA',
      Australia: 'en-AU',
      Mexico: 'es-MX',
      Brazil: 'pt-BR',
    };

    return countryLanguageMap[country] || 'en-US';
  }

  /**
   * Create user preferences from conversation
   */
  private async createUserPreferences(userId: string, context: any) {
    // Create UserPreferences document compatible with ai/recommendations.ts
    const preferences = {
      userId,
      budgetMin: context.propertyPreferences?.priceMin,
      budgetMax: context.propertyPreferences?.priceMax,
      preferredCities: context.location?.city ? [context.location.city] : [],
      preferredStates: context.location?.state ? [context.location.state] : [],
      minRooms: context.propertyPreferences?.bedroomsMin,
      maxRooms: context.propertyPreferences?.bedroomsMax,
      minBathrooms: context.propertyPreferences?.bathroomsMin,
      minArea: context.propertyPreferences?.minArea,
      maxArea: context.propertyPreferences?.maxArea,
      propertyTypes: context.propertyPreferences?.types || [],
      mustHaveFeatures: context.mustHaveFeatures || [],
      niceToHaveFeatures: context.niceToHaveFeatures || [],
      dealBreakers: context.dealBreakers || [],
      lifestyle: context.lifestyle || [],
      workCommute: context.workCommute,
      timeline: context.timeline,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.firestore.collection('user_preferences').doc(userId).set(preferences);

    console.log(`Created user preferences for user ${userId}`);
  }

  /**
   * Get greeting message
   */
  private getGreeting(): string {
    return "Hi! I'm here to help you find your perfect home. Just tell me what you're looking for in your own words. For example, you could say 'I'm looking for a 3-bedroom house in Austin under $500k' or 'I need an apartment near downtown with parking.'";
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return this.firestore.collection('_').doc().id;
  }
}

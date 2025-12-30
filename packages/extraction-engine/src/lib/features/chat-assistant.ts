/**
 * AI Chat Assistant for Conversational Property Search
 * Natural language interface with context-aware responses
 */

import type { UnifiedHouseModel } from '@house-finder/domain';
import type { UserPreferences } from '../ai/recommendation-engine.js';
import type { ParsedSearchQuery } from '../ai/nlp-search-parser.js';

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: ChatIntent;
    entities?: Record<string, any>;
    suggestedActions?: SuggestedAction[];
  };
}

/**
 * Chat intent classification
 */
export enum ChatIntent {
  SEARCH = 'search',
  FILTER = 'filter',
  COMPARE = 'compare',
  GET_DETAILS = 'get_details',
  CALCULATE_MORTGAGE = 'calculate_mortgage',
  GET_RECOMMENDATIONS = 'get_recommendations',
  SAVE_SEARCH = 'save_search',
  ASK_QUESTION = 'ask_question',
  GREETING = 'greeting',
  FAREWELL = 'farewell',
  HELP = 'help',
  UNCLEAR = 'unclear',
}

/**
 * Suggested action
 */
export interface SuggestedAction {
  type: 'search' | 'view_property' | 'compare' | 'calculate' | 'save' | 'contact';
  label: string;
  data?: any;
}

/**
 * Chat session
 */
export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: ChatContext;
  startedAt: Date;
  lastActivityAt: Date;
}

/**
 * Chat context (conversation memory)
 */
export interface ChatContext {
  currentSearch?: ParsedSearchQuery;
  userPreferences?: UserPreferences;
  viewedProperties: string[]; // property IDs
  favoritedProperties: string[]; // property IDs
  comparedProperties: string[]; // property IDs
  lastMention?: {
    propertyIds?: string[];
    city?: string;
    priceRange?: { min?: number; max?: number };
  };
}

/**
 * Chat response
 */
export interface ChatResponse {
  message: ChatMessage;
  properties?: UnifiedHouseModel[];
  suggestions?: SuggestedAction[];
}

/**
 * AI Chat Assistant
 */
export class ChatAssistant {
  private sessions: Map<string, ChatSession> = new Map();

  /**
   * Process user message
   */
  public async processMessage(
    sessionId: string,
    userId: string,
    userMessage: string,
    availableProperties: UnifiedHouseModel[]
  ): Promise<ChatResponse> {
    // Get or create session
    let session = this.sessions.get(sessionId);
    if (session == null) {
      session = this.createSession(sessionId, userId);
    }

    // Add user message to history
    const userMsg: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    session.messages.push(userMsg);

    // Classify intent
    const intent = this.classifyIntent(userMessage, session.context);

    // Process based on intent
    const response = await this.generateResponse(
      intent,
      userMessage,
      session,
      availableProperties
    );

    // Add assistant message to history
    const assistantMsg: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: response.message.content,
      timestamp: new Date(),
      metadata: {
        intent,
        suggestedActions: response.suggestions,
      },
    };
    session.messages.push(assistantMsg);

    // Update session
    session.lastActivityAt = new Date();
    this.sessions.set(sessionId, session);

    return {
      message: assistantMsg,
      properties: response.properties,
      suggestions: response.suggestions,
    };
  }

  /**
   * Get chat history
   */
  public getHistory(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId)?.messages ?? [];
  }

  /**
   * Clear chat history
   */
  public clearHistory(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Create new session
   */
  private createSession(sessionId: string, userId: string): ChatSession {
    return {
      id: sessionId,
      userId,
      messages: [],
      context: {
        viewedProperties: [],
        favoritedProperties: [],
        comparedProperties: [],
      },
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };
  }

  /**
   * Classify user intent
   */
  private classifyIntent(message: string, context: ChatContext): ChatIntent {
    const lowerMessage = message.toLowerCase();

    // Greetings
    if (
      /^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerMessage)
    ) {
      return ChatIntent.GREETING;
    }

    // Farewell
    if (/^(bye|goodbye|see you|thanks|thank you)/i.test(lowerMessage)) {
      return ChatIntent.FAREWELL;
    }

    // Help
    if (/help|how to|what can you|guide/i.test(lowerMessage)) {
      return ChatIntent.HELP;
    }

    // Search/find properties
    if (
      /(find|search|looking for|show me|i want|i need|property|apartment|house)/i.test(
        lowerMessage
      )
    ) {
      return ChatIntent.SEARCH;
    }

    // Filter/refine search
    if (
      /(filter|refine|narrow down|only|exclude|without|cheaper|more expensive)/i.test(
        lowerMessage
      ) &&
      context.currentSearch != null
    ) {
      return ChatIntent.FILTER;
    }

    // Compare properties
    if (/(compare|difference|versus|vs|which is better)/i.test(lowerMessage)) {
      return ChatIntent.COMPARE;
    }

    // Get property details
    if (
      /(tell me more|details|information about|what about|this one|that one)/i.test(
        lowerMessage
      )
    ) {
      return ChatIntent.GET_DETAILS;
    }

    // Mortgage calculation
    if (
      /(mortgage|afford|monthly payment|loan|interest|down payment)/i.test(
        lowerMessage
      )
    ) {
      return ChatIntent.CALCULATE_MORTGAGE;
    }

    // Recommendations
    if (/(recommend|suggest|best|top|similar)/i.test(lowerMessage)) {
      return ChatIntent.GET_RECOMMENDATIONS;
    }

    // Save search
    if (/(save|remember|alert|notify)/i.test(lowerMessage)) {
      return ChatIntent.SAVE_SEARCH;
    }

    // Questions
    if (/(\?|why|how|what|when|where|which)/i.test(lowerMessage)) {
      return ChatIntent.ASK_QUESTION;
    }

    return ChatIntent.UNCLEAR;
  }

  /**
   * Generate response based on intent
   */
  private async generateResponse(
    intent: ChatIntent,
    userMessage: string,
    session: ChatSession,
    availableProperties: UnifiedHouseModel[]
  ): Promise<{ message: ChatMessage; properties?: UnifiedHouseModel[]; suggestions?: SuggestedAction[] }> {
    let content = '';
    let properties: UnifiedHouseModel[] = [];
    let suggestions: SuggestedAction[] = [];

    switch (intent) {
      case ChatIntent.GREETING:
        content = this.handleGreeting();
        suggestions = this.getSuggestions('greeting');
        break;

      case ChatIntent.FAREWELL:
        content = this.handleFarewell(session);
        break;

      case ChatIntent.HELP:
        content = this.handleHelp();
        suggestions = this.getSuggestions('help');
        break;

      case ChatIntent.SEARCH:
        const searchResult = this.handleSearch(
          userMessage,
          session,
          availableProperties
        );
        content = searchResult.content;
        properties = searchResult.properties;
        suggestions = searchResult.suggestions;
        break;

      case ChatIntent.FILTER:
        const filterResult = this.handleFilter(userMessage, session, availableProperties);
        content = filterResult.content;
        properties = filterResult.properties;
        suggestions = filterResult.suggestions;
        break;

      case ChatIntent.COMPARE:
        content = this.handleCompare(session);
        suggestions = this.getSuggestions('compare');
        break;

      case ChatIntent.GET_DETAILS:
        content = this.handleGetDetails(userMessage, session, availableProperties);
        suggestions = this.getSuggestions('details');
        break;

      case ChatIntent.CALCULATE_MORTGAGE:
        content = this.handleMortgage();
        suggestions = this.getSuggestions('mortgage');
        break;

      case ChatIntent.GET_RECOMMENDATIONS:
        const recsResult = this.handleRecommendations(
          session,
          availableProperties
        );
        content = recsResult.content;
        properties = recsResult.properties;
        suggestions = recsResult.suggestions;
        break;

      case ChatIntent.SAVE_SEARCH:
        content = this.handleSaveSearch(session);
        suggestions = this.getSuggestions('save');
        break;

      case ChatIntent.ASK_QUESTION:
        content = this.handleQuestion(userMessage, session);
        break;

      case ChatIntent.UNCLEAR:
        content = this.handleUnclear();
        suggestions = this.getSuggestions('unclear');
        break;
    }

    return {
      message: {
        id: this.generateId(),
        role: 'assistant',
        content,
        timestamp: new Date(),
      },
      properties,
      suggestions,
    };
  }

  /**
   * Handle greeting
   */
  private handleGreeting(): string {
    const greetings = [
      "Hi! I'm your AI property assistant. I can help you find your perfect home. What are you looking for?",
      "Hello! Ready to find your dream property? Tell me what you're interested in.",
      "Hey there! I can help you search for properties, compare options, and calculate affordability. How can I assist you?",
    ];

    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Handle farewell
   */
  private handleFarewell(session: ChatSession): string {
    const viewedCount = session.context.viewedProperties.length;
    const favoritedCount = session.context.favoritedProperties.length;

    if (favoritedCount > 0) {
      return `Goodbye! You've favorited ${favoritedCount} properties. Don't forget to reach out to the landlords! I'll be here when you need me.`;
    } else if (viewedCount > 0) {
      return `Thanks for chatting! You've viewed ${viewedCount} properties. Feel free to come back anytime!`;
    } else {
      return "Goodbye! Come back anytime you're ready to search for properties. Happy house hunting!";
    }
  }

  /**
   * Handle help
   */
  private handleHelp(): string {
    return `I can help you with:

🔍 **Search**: "Find 2 bedroom apartments in Berlin under 1500"
📊 **Compare**: "Compare these properties" (after viewing multiple)
💰 **Calculate**: "Can I afford a €300,000 property?"
⭐ **Recommend**: "Show me similar properties"
💾 **Save**: "Save this search for later"
❓ **Ask**: Any questions about properties or the process

What would you like to do?`;
  }

  /**
   * Handle search
   */
  private handleSearch(
    message: string,
    session: ChatSession,
    availableProperties: UnifiedHouseModel[]
  ): { content: string; properties: UnifiedHouseModel[]; suggestions: SuggestedAction[] } {
    // Simple keyword extraction for demo
    const keywords = {
      cities: ['berlin', 'munich', 'hamburg', 'cologne', 'frankfurt'],
      propertyTypes: ['apartment', 'house', 'studio', 'loft'],
      features: ['balcony', 'garden', 'parking', 'elevator'],
    };

    const lowerMessage = message.toLowerCase();

    // Extract city
    const city = keywords.cities.find((c) => lowerMessage.includes(c));

    // Extract price
    const priceMatch = /(\d+)\s*(?:euro|€|eur)/gi.exec(message);
    const maxPrice = priceMatch != null ? parseInt(priceMatch[1]) : undefined;

    // Filter properties
    let filtered = availableProperties;

    if (city != null) {
      filtered = filtered.filter(
        (p) => p.location.city?.toLowerCase() === city
      );
    }

    if (maxPrice != null) {
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    // Update session context
    session.context.currentSearch = {
      originalQuery: message,
      preferences: {
        preferredCities: city != null ? [city] : undefined,
        budgetMax: maxPrice,
      },
      keywords: [],
      confidence: 0.7,
      interpretation: `Looking for properties${city ? ` in ${city}` : ''}${maxPrice ? ` under €${maxPrice}` : ''}`,
    };

    const results = filtered.slice(0, 10);

    let content = `I found ${results.length} properties`;
    if (city != null) content += ` in ${city}`;
    if (maxPrice != null) content += ` under €${maxPrice}`;
    content += '. Here are the top matches:';

    const suggestions: SuggestedAction[] = [];

    if (results.length > 0) {
      suggestions.push({
        type: 'view_property',
        label: 'View first property',
        data: { propertyId: results[0].id },
      });

      if (results.length >= 2) {
        suggestions.push({
          type: 'compare',
          label: 'Compare top 3',
          data: { propertyIds: results.slice(0, 3).map((p) => p.id) },
        });
      }

      suggestions.push({
        type: 'save',
        label: 'Save this search',
        data: { query: message },
      });
    }

    return { content, properties: results, suggestions };
  }

  /**
   * Handle filter
   */
  private handleFilter(
    message: string,
    session: ChatSession,
    availableProperties: UnifiedHouseModel[]
  ): { content: string; properties: UnifiedHouseModel[]; suggestions: SuggestedAction[] } {
    const lowerMessage = message.toLowerCase();

    // Apply filters based on message
    let filtered = availableProperties;

    if (/cheaper|less expensive|lower price/i.test(lowerMessage)) {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (/expensive|higher price|premium/i.test(lowerMessage)) {
      filtered = filtered.sort((a, b) => b.price - a.price);
    } else if (/larger|bigger|more space/i.test(lowerMessage)) {
      filtered = filtered.sort((a, b) => (b.details?.livingArea ?? 0) - (a.details?.livingArea ?? 0));
    } else if (/smaller|compact/i.test(lowerMessage)) {
      filtered = filtered.sort((a, b) => (a.details?.livingArea ?? 0) - (b.details?.livingArea ?? 0));
    }

    const results = filtered.slice(0, 10);

    return {
      content: `I've refined your search. Here are ${results.length} properties matching your updated criteria:`,
      properties: results,
      suggestions: [
        {
          type: 'view_property',
          label: 'View first result',
          data: { propertyId: results[0]?.id },
        },
      ],
    };
  }

  /**
   * Handle compare
   */
  private handleCompare(session: ChatSession): string {
    const compared = session.context.comparedProperties;

    if (compared.length < 2) {
      return "I need at least 2 properties to compare. Can you tell me which properties you'd like to compare?";
    }

    return `I'll compare these ${compared.length} properties for you. You'll see a side-by-side comparison with price, size, features, and value analysis.`;
  }

  /**
   * Handle get details
   */
  private handleGetDetails(
    message: string,
    session: ChatSession,
    availableProperties: UnifiedHouseModel[]
  ): string {
    const lastMention = session.context.lastMention;

    if (lastMention?.propertyIds != null && lastMention.propertyIds.length > 0) {
      const propertyId = lastMention.propertyIds[0];
      const property = availableProperties.find((p) => p.id === propertyId);

      if (property != null) {
        return `Here are the details for ${property.title}:

📍 Location: ${property.location.city}${property.location.country ? ', ' + property.location.country : ''}
💰 Price: €${property.price}/month
📐 Size: ${property.details?.livingArea ?? 'N/A'} m²
🚪 Rooms: ${property.details?.totalRooms ?? 'N/A'}
🏢 Type: ${property.propertyType ?? 'N/A'}

${property.description ?? 'No description available'}

Would you like to calculate mortgage payments, compare with similar properties, or generate a response to the landlord?`;
      }
    }

    return "Which property would you like to know more about? You can say the number or describe it.";
  }

  /**
   * Handle mortgage calculation
   */
  private handleMortgage(): string {
    return `I can help you calculate mortgage payments and affordability.

Please provide:
- Property price
- Your monthly income
- Down payment percentage (typically 20%)
- Interest rate (typically 4-6%)

For example: "Can I afford a €300,000 property with €5,000 monthly income and 20% down?"`;
  }

  /**
   * Handle recommendations
   */
  private handleRecommendations(
    session: ChatSession,
    availableProperties: UnifiedHouseModel[]
  ): { content: string; properties: UnifiedHouseModel[]; suggestions: SuggestedAction[] } {
    // Get personalized recommendations based on context
    const favorited = session.context.favoritedProperties;
    const viewed = session.context.viewedProperties;

    if (favorited.length === 0 && viewed.length === 0) {
      return {
        content:
          "I'll need to learn your preferences first. Try searching for some properties or tell me what you're looking for!",
        properties: [],
        suggestions: [
          {
            type: 'search',
            label: 'Start a search',
            data: {},
          },
        ],
      };
    }

    // Simple recommendation: similar to viewed/favorited
    const recommendations = availableProperties.slice(0, 5);

    return {
      content: `Based on your activity, here are my top recommendations:`,
      properties: recommendations,
      suggestions: [
        {
          type: 'view_property',
          label: 'View top recommendation',
          data: { propertyId: recommendations[0]?.id },
        },
      ],
    };
  }

  /**
   * Handle save search
   */
  private handleSaveSearch(session: ChatSession): string {
    if (session.context.currentSearch == null) {
      return "You haven't performed a search yet. Try searching for properties first, then I can save it for you!";
    }

    return `I've saved your search! I'll notify you when new properties matching your criteria become available. You can set notification frequency (instant, daily, weekly) in your settings.`;
  }

  /**
   * Handle question
   */
  private handleQuestion(message: string, session: ChatSession): string {
    const lowerMessage = message.toLowerCase();

    if (/price|cost|expensive/i.test(lowerMessage)) {
      return "Property prices vary by location, size, and features. I can show you market analysis and price trends for any property. What location are you interested in?";
    }

    if (/location|area|neighborhood/i.test(lowerMessage)) {
      return "I can help you search by city or neighborhood. Which area interests you? For example: Berlin, Munich, Hamburg, etc.";
    }

    if (/afford|budget|income/i.test(lowerMessage)) {
      return "I can calculate exactly what you can afford based on your income and debts. Just tell me your monthly income and I'll show you your maximum budget!";
    }

    if (/rent|buy|difference/i.test(lowerMessage)) {
      return "I can compare renting vs buying for you! This analysis includes total costs over 5 years, break-even point, and home equity. Which property would you like to analyze?";
    }

    return "That's a great question! I can help you with property search, price analysis, mortgage calculations, and recommendations. What specific information do you need?";
  }

  /**
   * Handle unclear intent
   */
  private handleUnclear(): string {
    return "I'm not sure I understood that. I can help you:\n\n• Find properties\n• Compare options\n• Calculate affordability\n• Get recommendations\n• Answer questions\n\nWhat would you like to do?";
  }

  /**
   * Get suggested actions
   */
  private getSuggestions(context: string): SuggestedAction[] {
    const suggestions: Record<string, SuggestedAction[]> = {
      greeting: [
        {
          type: 'search',
          label: 'Find apartments in Berlin',
          data: { query: 'apartments in Berlin under 1500' },
        },
        {
          type: 'calculate',
          label: 'Check affordability',
          data: {},
        },
      ],
      help: [
        {
          type: 'search',
          label: 'Start searching',
          data: {},
        },
      ],
      compare: [
        {
          type: 'compare',
          label: 'Compare selected',
          data: {},
        },
      ],
      details: [
        {
          type: 'calculate',
          label: 'Calculate mortgage',
          data: {},
        },
        {
          type: 'contact',
          label: 'Generate response',
          data: {},
        },
      ],
      mortgage: [
        {
          type: 'calculate',
          label: 'Open calculator',
          data: {},
        },
      ],
      save: [
        {
          type: 'save',
          label: 'Save with alerts',
          data: {},
        },
      ],
      unclear: [
        {
          type: 'search',
          label: 'Find properties',
          data: {},
        },
        {
          type: 'calculate',
          label: 'Check budget',
          data: {},
        },
      ],
    };

    return suggestions[context] ?? [];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

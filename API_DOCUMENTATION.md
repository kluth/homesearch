# House Finder Engine - API Documentation

## 🚀 Overview

The House Finder Engine is an AI-powered property search platform with intelligent recommendations, natural language search, multi-language response generation, and market price intelligence.

## 📍 Base URL

```
https://us-central1-house-finder-production.cloudfunctions.net
```

## 🔑 Authentication

Most endpoints are public. User-specific endpoints require a `userId` parameter.

---

## 🎯 Property Extraction & Discovery

### 1. Start Extraction

Discovers sources for a location and starts background extraction jobs.

**Endpoint:** `POST /startExtraction`

**Request:**
```json
{
  "location": "Berlin"
}
```

**Response:**
```json
{
  "message": "Started extraction for Berlin with 8 sources",
  "jobs": [
    {
      "id": "job-immoscout24-1234567890",
      "sourceId": "immoscout24",
      "status": "pending",
      "priority": 10,
      "source": {
        "name": "immoscout24",
        "url": "https://www.immoscout24.de",
        "type": "scraper",
        "quality": {
          "score": 95,
          "grade": "EXCELLENT"
        }
      }
    }
  ]
}
```

### 2. Discover Sources

Discovers and grades sources for a location using AI.

**Endpoint:** `POST /discoverSources`

**Request:**
```json
{
  "location": "Munich",
  "limit": 10
}
```

**Response:**
```json
{
  "message": "Discovered 8 sources for Munich",
  "sources": [
    {
      "name": "immoscout24",
      "url": "https://www.immoscout24.de",
      "type": "scraper",
      "quality": {
        "score": 95,
        "grade": "EXCELLENT",
        "metrics": {
          "dataRichness": 100,
          "reliability": 95,
          "coverage": 100,
          "performance": 80
        }
      },
      "confidence": 0.95
    }
  ]
}
```

### 3. Get Extraction Jobs

Retrieves extraction job status.

**Endpoint:** `GET /getJobs?status=running&limit=50`

**Response:**
```json
[
  {
    "id": "job-123",
    "sourceId": "immoscout24",
    "status": "running",
    "priority": 10,
    "createdAt": "2025-12-29T10:00:00Z",
    "propertiesCount": 15
  }
]
```

### 4. Get Properties

Retrieves extracted properties with filtering.

**Endpoint:** `GET /getProperties?city=Berlin&minPrice=1000&maxPrice=2000&limit=50`

**Response:**
```json
[
  {
    "id": "prop-abc123",
    "title": "Modern 2-bedroom apartment in Berlin Mitte",
    "price": 1500,
    "location": {
      "city": "Berlin",
      "country": "Germany"
    },
    "rooms": 2,
    "area": 75,
    "type": "apartment",
    "url": "https://...",
    "metadata": {
      "source": "immoscout24.de",
      "extractedAt": "2025-12-29T09:30:00Z",
      "confidence": 0.95
    }
  }
]
```

---

## 🧠 AI-Powered Search & Recommendations

### 5. Smart Search (NLP)

Natural language property search with intelligent query parsing.

**Endpoint:** `POST /smartSearch`

**Request:**
```json
{
  "query": "2 bedroom apartment in Berlin under 1500 with balcony and parking"
}
```

**Response:**
```json
{
  "message": "Search completed successfully",
  "query": "2 bedroom apartment in Berlin under 1500 with balcony and parking",
  "interpretation": "Looking for apartment in Berlin with budget under €1500 with 2 rooms must have: balcony, parking",
  "confidence": 0.85,
  "preferences": {
    "preferredCities": ["Berlin"],
    "budgetMax": 1500,
    "minRooms": 2,
    "maxRooms": 2,
    "propertyTypes": ["apartment"],
    "mustHaveFeatures": ["balcony", "parking"]
  },
  "results": [...],
  "totalResults": 47
}
```

**More Query Examples:**
```
"studio near university, pets allowed"
"family house with garden in Munich max 2000 euro"
"luxury penthouse with pool and gym"
"cheap 3 room flat, furnished, downtown"
"apartment 80-100 sqm between 1200 and 1800"
```

### 6. Get Personalized Recommendations

AI-powered property recommendations based on user behavior and preferences.

**Endpoint:** `GET /getRecommendations?userId=user123&limit=20`

**Response:**
```json
{
  "message": "Recommendations generated successfully",
  "recommendations": [
    {
      "property": {...},
      "score": 92,
      "reasons": [
        "Perfect price match",
        "In your preferred location: Berlin",
        "Similar to properties you liked"
      ],
      "matchBreakdown": {
        "priceMatch": 95,
        "locationMatch": 100,
        "featuresMatch": 85,
        "similarityToLiked": 80,
        "popularityScore": 70
      },
      "tags": ["Great Value", "New", "Popular"]
    }
  ],
  "userPreferences": {...},
  "interactionCount": 15
}
```

**Scoring Algorithm:**
- 30% Price Match - Rewards properties in budget
- 25% Location Match - Preferred cities/countries
- 20% Features Match - Must-have features
- 15% Similarity - Similar to liked properties
- 10% Popularity - User engagement across platform

**Tags:**
- `Great Value` - <70% of max budget
- `New` - Listed <24 hours ago
- `Popular` - High interaction count
- `Premium` - €2000+ and >100 sqm

---

## 👤 User Profiles & Preferences

### 7. Set User Preferences

Save user search criteria for personalized recommendations.

**Endpoint:** `POST /setUserPreferences`

**Request:**
```json
{
  "userId": "user123",
  "budgetMin": 800,
  "budgetMax": 1800,
  "preferredCities": ["Berlin", "Munich"],
  "preferredCountries": ["Germany"],
  "propertyTypes": ["apartment"],
  "minRooms": 2,
  "maxRooms": 3,
  "minArea": 60,
  "maxArea": 100,
  "mustHaveFeatures": ["balcony", "parking"],
  "niceToHaveFeatures": ["elevator", "garden"],
  "excludeFeatures": [],
  "pets": true,
  "furnished": false
}
```

**Response:**
```json
{
  "message": "Preferences saved successfully",
  "preferences": {...}
}
```

### 8. Get User Preferences

Retrieve saved user preferences.

**Endpoint:** `GET /getUserPreferences?userId=user123`

### 9. Track Property Interaction

Record user actions for learning and recommendations.

**Endpoint:** `POST /trackInteraction`

**Request:**
```json
{
  "userId": "user123",
  "propertyId": "prop-abc123",
  "type": "favorite",
  "duration": 45,
  "responseGenerated": false,
  "responseSent": false
}
```

**Interaction Types:**
- `view` - Property viewed
- `favorite` - Property favorited
- `unfavorite` - Property unfavorited
- `generate_response` - Response generated
- `send_response` - Response sent to landlord
- `reject` - Property rejected
- `share` - Property shared

**Response:**
```json
{
  "message": "Interaction tracked successfully",
  "interactionId": "int-xyz789"
}
```

---

## 💰 Price Intelligence & Market Analysis

### 10. Get Price Analysis

Analyzes if a property is fairly priced compared to market.

**Endpoint:** `GET /getPriceAnalysis?propertyId=prop-abc123`

**Response:**
```json
{
  "message": "Price analysis completed",
  "analysis": {
    "property": {...},
    "fairnessScore": 68,
    "estimatedFairPrice": 1380,
    "pricePerSqm": 18.67,
    "marketComparison": {
      "averagePrice": 1520,
      "medianPrice": 1450,
      "priceRange": {
        "min": 1100,
        "max": 1900
      },
      "percentile": 35
    },
    "verdict": "good_deal",
    "insights": [
      "🔥 Excellent deal! 10.3% below market average",
      "€18.67/m² (market avg: €20.80/m²)",
      "In the lowest 25% of prices - exceptional value",
      "Based on 47 comparable properties",
      "💡 Recommendation: Act quickly - this is a good opportunity"
    ],
    "confidence": 0.85
  },
  "negotiation": {
    "shouldNegotiate": false,
    "suggestedOffer": 1400,
    "strategy": "This is already a good deal. Offer asking price to secure it quickly."
  }
}
```

**Price Verdicts:**
- `great_deal` - ≥15% below market (score 65-100)
- `good_deal` - 5-15% below market (score 55-64)
- `fair_price` - ±5% of market (score 45-54)
- `slightly_high` - 5-15% above market (score 35-44)
- `overpriced` - >15% above market (score 0-34)

**Negotiation Strategies:**
- **Great Deal (score ≥55):** "Don't negotiate - pay asking price to secure it quickly."
- **Fair Price (45-54):** "Try modest 3% discount but be prepared to pay full price."
- **Overpriced (<45):** "Offer estimated fair value. Be prepared to walk away if they won't negotiate."

### 11. Get Market Trend

Analyzes price trends over time for a location.

**Endpoint:** `GET /getMarketTrend?location=Berlin&propertyType=apartment`

**Response:**
```json
{
  "message": "Market trend analyzed",
  "trend": {
    "location": "Berlin",
    "propertyType": "apartment",
    "period": "last_90_days",
    "averagePrice": 1450,
    "priceChange": 5.2,
    "direction": "rising",
    "velocity": "moderate",
    "sampleSize": 142
  }
}
```

**Trend Directions:**
- `rising` - Prices increasing >2%
- `falling` - Prices decreasing >2%
- `stable` - Prices within ±2%

**Velocity:**
- `fast` - >10% change
- `moderate` - 5-10% change
- `slow` - <5% change

---

## 📝 Multi-Language Response Generation

### 12. Generate Response

Creates personalized response to property listing in appropriate language.

**Endpoint:** `POST /generateResponse`

**Request:**
```json
{
  "propertyId": "prop-abc123",
  "userPreferences": {
    "name": "Max Mustermann",
    "email": "max@example.com",
    "phone": "+49 123 456789",
    "moveInDate": "01.03.2024",
    "householdSize": 2,
    "pets": false,
    "employmentStatus": "Full-time employed",
    "additionalInfo": "Non-smoker, work from home occasionally"
  },
  "includeViewingRequest": true,
  "specificQuestions": [
    "Is a fitted kitchen included?",
    "Is there parking available?"
  ],
  "tone": "professional"
}
```

**Response:**
```json
{
  "message": "Response generated successfully",
  "response": {
    "subject": "Anfrage: Modern 2-bedroom apartment in Berlin (prop-abc123)",
    "body": "Sehr geehrte Damen und Herren,\n\nich interessiere mich für die Immobilie \"Modern 2-bedroom apartment in Berlin\" (Ref: prop-abc123).\n\nDie Lage und die Ausstattung des Objekts entsprechen genau meinen Vorstellungen.\n\nIch würde mich sehr über einen Besichtigungstermin freuen. 01.03.2024\n\nEinige Informationen über mich:\n- Employment: Full-time employed\n- Household size: 2 people\n- Pets: No\n- Non-smoker, work from home occasionally\n\nIch hätte noch einige Fragen:\n1. Is a fitted kitchen included?\n2. Is there parking available?\n\nIch freue mich auf Ihre Rückmeldung und stehe für weitere Informationen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\nMax Mustermann\nEmail: max@example.com\nPhone: +49 123 456789",
    "language": "de",
    "tone": "professional",
    "propertyReference": "prop-abc123"
  },
  "responseId": "resp-xyz789"
}
```

**Supported Languages:**
- 🇩🇪 German (DE)
- 🇬🇧 English (EN)
- 🇫🇷 French (FR)
- 🇪🇸 Spanish (ES)
- 🇮🇹 Italian (IT)
- 🇳🇱 Dutch (NL)
- 🇵🇹 Portuguese (PT)

**Auto-Detection Priority:**
1. TLD (.de, .fr, .es, .it, .nl, .pt)
2. Site names (immoscout24 = German, seloger = French)
3. Content keywords

**Tones:**
- `formal` - Very formal business language
- `professional` - Professional but approachable (default)
- `friendly` - Warm and personable
- `casual` - Relaxed and conversational

### 13. Mark Response as Sent

Track which responses were actually sent to landlords.

**Endpoint:** `POST /markResponseSent`

**Request:**
```json
{
  "responseId": "resp-xyz789",
  "sentAt": "2025-12-29T11:30:00Z"
}
```

### 14. Get Generated Responses

Retrieve response history for analytics.

**Endpoint:** `GET /getGeneratedResponses?userId=user123&sent=true&limit=50`

---

## 📊 Statistics & Monitoring

### 15. Get Statistics

Retrieves extraction and processing statistics.

**Endpoint:** `GET /getStatistics`

**Response:**
```json
{
  "totalJobs": 156,
  "pending": 12,
  "running": 8,
  "completed": 132,
  "failed": 4,
  "totalProperties": 3420
}
```

---

## 🎯 Use Case Examples

### Example 1: First-Time User Search

```javascript
// 1. User types natural language query
POST /smartSearch
{
  "query": "2 bedroom apartment in Berlin under 1500 with balcony"
}

// 2. System parses and returns results
// User browses properties

// 3. Track view interactions
POST /trackInteraction
{
  "userId": "user123",
  "propertyId": "prop-001",
  "type": "view",
  "duration": 45
}

// 4. User favorites interesting property
POST /trackInteraction
{
  "userId": "user123",
  "propertyId": "prop-001",
  "type": "favorite"
}

// 5. Get price analysis
GET /getPriceAnalysis?propertyId=prop-001
// Response: "Great deal! 12% below market"

// 6. Generate response to landlord
POST /generateResponse
{
  "propertyId": "prop-001",
  "userPreferences": {...}
}

// 7. Mark as sent
POST /markResponseSent
{
  "responseId": "resp-001"
}
```

### Example 2: Returning User with Learned Preferences

```javascript
// 1. System has learned from 15 interactions
GET /getRecommendations?userId=user123&limit=20

// Returns personalized feed with reasons:
// - "Similar to properties you liked"
// - "In your preferred location: Berlin"
// - "Great value - well within your budget"

// 2. User clicks recommended property
POST /trackInteraction
{
  "userId": "user123",
  "propertyId": "recommended-prop",
  "type": "view"
}

// 3. System learns and improves future recommendations
```

### Example 3: Market Research

```javascript
// 1. Check market trends
GET /getMarketTrend?location=Munich&propertyType=apartment
// Response: Prices rising 8.5% (moderate velocity)

// 2. Analyze specific property
GET /getPriceAnalysis?propertyId=prop-456
// Response: Overpriced - 18% above market

// 3. Get negotiation advice
// Response: "Offer €1,200 (fair market value). Be prepared to walk away."
```

---

## 🔧 Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `404` - Resource Not Found
- `500` - Internal Server Error

---

## 🚀 Performance & Limits

- **Rate Limits:** 10 requests/second per user
- **Max Results:** 500 properties per query
- **Recommendation Limit:** 100 recommendations per request
- **Market Data:** Up to 200 comparables for price analysis
- **Search History:** 100 most recent interactions per user

---

## 📈 Data Models

### UnifiedHouseModel
```typescript
{
  id: string;
  title: string;
  price: number;
  location: {
    city?: string;
    country?: string;
    address?: string;
    zipCode?: string;
  };
  rooms?: number;
  area?: number;
  type?: string; // apartment, house, studio, etc.
  description?: string;
  url: string;
  source: string;
  metadata: {
    source: string;
    extractedAt: Date;
    confidence?: number;
  };
}
```

### UserPreferences
```typescript
{
  userId: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredCities?: string[];
  preferredCountries?: string[];
  propertyTypes?: string[];
  minRooms?: number;
  maxRooms?: number;
  minArea?: number;
  maxArea?: number;
  mustHaveFeatures?: string[];
  niceToHaveFeatures?: string[];
  excludeFeatures?: string[];
  pets?: boolean;
  furnished?: boolean;
}
```

### RecommendedProperty
```typescript
{
  property: UnifiedHouseModel;
  score: number; // 0-100
  reasons: string[];
  matchBreakdown: {
    priceMatch: number;
    locationMatch: number;
    featuresMatch: number;
    similarityToLiked: number;
    popularityScore: number;
  };
  tags: string[];
}
```

---

## 🎓 Best Practices

1. **Track All Interactions** - Feed the recommendation engine for better results
2. **Set User Preferences** - Improves recommendation accuracy significantly
3. **Use NLP Search** - More intuitive than form-based filters
4. **Check Price Analysis** - Before making offers
5. **Review Market Trends** - Understand if it's a buyer's or seller's market
6. **Generate Responses Early** - Save drafts for properties you're interested in
7. **Monitor Statistics** - Track your search activity and response rates

---

## 🔐 Privacy & GDPR

- User data can be deleted via `clearUserData(userId)` method
- All personal data encrypted at rest
- Minimal data retention (90 days for interactions)
- User controls all preference data
- No third-party data sharing

---

## 📞 Support

For API issues or questions:
- GitHub Issues: https://github.com/anthropics/house-finder
- Email: support@house-finder.example.com

---

**Built with ❤️ using TypeScript, NestJS, Angular 21, Firebase, and AI/ML**

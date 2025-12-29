/**
 * Automatic language and field discovery utilities
 */

/**
 * Language detection result
 */
export interface LanguageDetection {
  primary: string; // ISO 639-1 code
  confidence: number; // 0-1
  detected: string[]; // All detected languages
}

/**
 * Field discovery result
 */
export interface FieldDiscovery {
  fields: string[];
  selectors: Record<string, string>;
  confidence: number;
}

/**
 * Auto-discovery utilities for languages and fields
 */
export class AutoDiscovery {
  /**
   * Detect language from HTML content
   */
  public detectLanguage(html: string, url: string): LanguageDetection {
    const detected: string[] = [];
    let primary = 'en';
    let confidence = 0.5;

    // 1. Check HTML lang attribute
    const htmlLangMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    if (htmlLangMatch?.[1]) {
      const langCode = this.normalizeLangCode(htmlLangMatch[1]);
      detected.push(langCode);
      primary = langCode;
      confidence = 0.9;
    }

    // 2. Check meta tags
    const metaLangMatch = html.match(
      /<meta[^>]+(?:http-equiv=["']content-language["'][^>]+content=["']([^"']+)["']|content=["']([^"']+)["'][^>]+http-equiv=["']content-language["'])/i
    );
    if (metaLangMatch) {
      const langCode = this.normalizeLangCode(metaLangMatch[1] || metaLangMatch[2] || '');
      if (langCode && !detected.includes(langCode)) {
        detected.push(langCode);
        if (confidence < 0.8) {
          primary = langCode;
          confidence = 0.8;
        }
      }
    }

    // 3. Analyze URL for country code TLD
    const tldMatch = url.match(/\.([a-z]{2})(?:\/|$)/i);
    if (tldMatch?.[1]) {
      const tld = tldMatch[1].toLowerCase();
      const langFromTld = this.languageFromTLD(tld);
      if (langFromTld && !detected.includes(langFromTld)) {
        detected.push(langFromTld);
        if (confidence < 0.7) {
          primary = langFromTld;
          confidence = 0.7;
        }
      }
    }

    // 4. Analyze content for language-specific patterns
    const contentLang = this.detectFromContent(html);
    if (contentLang && !detected.includes(contentLang)) {
      detected.push(contentLang);
      if (confidence < 0.6) {
        primary = contentLang;
        confidence = 0.6;
      }
    }

    return {
      primary,
      confidence,
      detected: detected.length > 0 ? detected : ['en'],
    };
  }

  /**
   * Discover available fields from HTML
   */
  public discoverFields(html: string): FieldDiscovery {
    const fields: Set<string> = new Set();
    const selectors: Record<string, string> = {};

    // Common real estate field patterns
    const fieldPatterns: Array<{ field: string; patterns: RegExp[]; selectorHints: string[] }> = [
      {
        field: 'price',
        patterns: [
          /\bprice\b/i,
          /\bprix\b/i,
          /\bpreis\b/i,
          /\bprecio\b/i,
          /\bprezzo\b/i,
          /\$|€|£|¥/,
        ],
        selectorHints: [
          '.price',
          '.property-price',
          '[data-price]',
          '.listing-price',
          '.cost',
        ],
      },
      {
        field: 'bedrooms',
        patterns: [
          /\bbedrooms?\b/i,
          /\bbeds?\b/i,
          /\bchambres?\b/i,
          /\bschlafzimmer\b/i,
          /\bdormitorios?\b/i,
          /\bcamere?\b/i,
        ],
        selectorHints: ['.bedrooms', '.beds', '[data-beds]', '.bed-count'],
      },
      {
        field: 'bathrooms',
        patterns: [
          /\bbathrooms?\b/i,
          /\bbaths?\b/i,
          /\bsalles? de bain\b/i,
          /\bbadezimmer\b/i,
          /\bbaños?\b/i,
          /\bbagni?\b/i,
        ],
        selectorHints: ['.bathrooms', '.baths', '[data-baths]', '.bath-count'],
      },
      {
        field: 'livingArea',
        patterns: [
          /\bsquare feet\b/i,
          /\bsq\.?\s*ft\b/i,
          /\bm²\b/i,
          /\bm2\b/i,
          /\bsqm\b/i,
          /\barea\b/i,
          /\bfläche\b/i,
          /\bsuperficie\b/i,
        ],
        selectorHints: ['.area', '.sqft', '.square-feet', '[data-area]', '.size'],
      },
      {
        field: 'address',
        patterns: [
          /\baddress\b/i,
          /\blocation\b/i,
          /\badresse\b/i,
          /\bdirección\b/i,
          /\bindirizzo\b/i,
        ],
        selectorHints: ['.address', '.location', '[data-address]', '.property-address'],
      },
      {
        field: 'title',
        patterns: [/\btitle\b/i, /\bheading\b/i, /\bname\b/i],
        selectorHints: ['h1', 'h2', '.title', '.heading', '.property-title'],
      },
      {
        field: 'description',
        patterns: [
          /\bdescription\b/i,
          /\bdetails\b/i,
          /\bbeschreibung\b/i,
          /\bdescripción\b/i,
          /\bdescrizione\b/i,
        ],
        selectorHints: ['.description', '.details', '[data-description]', '.property-description'],
      },
      {
        field: 'images',
        patterns: [/\bimages?\b/i, /\bphotos?\b/i, /\bbilder\b/i, /\bfotos?\b/i],
        selectorHints: ['.images', '.photos', '.gallery', 'img', '[data-image]'],
      },
      {
        field: 'propertyType',
        patterns: [
          /\bproperty type\b/i,
          /\btype\b/i,
          /\bapartment\b/i,
          /\bhouse\b/i,
          /\bcondo\b/i,
          /\bwohnung\b/i,
          /\bhaus\b/i,
        ],
        selectorHints: ['.property-type', '.type', '[data-type]'],
      },
      {
        field: 'yearBuilt',
        patterns: [
          /\byear built\b/i,
          /\bbuilt\b/i,
          /\bbaujahr\b/i,
          /\baño de construcción\b/i,
          /\banno di costruzione\b/i,
        ],
        selectorHints: ['.year-built', '.built', '[data-year]'],
      },
      {
        field: 'lotSize',
        patterns: [
          /\blot size\b/i,
          /\bland area\b/i,
          /\bplot\b/i,
          /\bgrundstück\b/i,
          /\bparcela\b/i,
          /\bterreno\b/i,
        ],
        selectorHints: ['.lot-size', '.land-area', '[data-lot]'],
      },
      {
        field: 'parkingSpaces',
        patterns: [
          /\bparking\b/i,
          /\bgarage\b/i,
          /\bcarport\b/i,
          /\bstellplatz\b/i,
          /\bplaza de garaje\b/i,
          /\bposto auto\b/i,
        ],
        selectorHints: ['.parking', '.garage', '[data-parking]'],
      },
      {
        field: 'energyRating',
        patterns: [
          /\benergy rating\b/i,
          /\benergy certificate\b/i,
          /\bepc\b/i,
          /\benergie\b/i,
          /\bcertificación energética\b/i,
        ],
        selectorHints: ['.energy-rating', '.epc', '[data-energy]'],
      },
    ];

    // Search for each field pattern in HTML
    for (const { field, patterns, selectorHints } of fieldPatterns) {
      // Check if any pattern matches
      const hasPattern = patterns.some((pattern) => pattern.test(html));

      if (hasPattern) {
        fields.add(field);

        // Try to find the most likely selector
        for (const hint of selectorHints) {
          if (html.includes(hint)) {
            selectors[field] = hint;
            break;
          }
        }

        // If no selector found, use generic
        if (!selectors[field]) {
          selectors[field] = `.${field.toLowerCase()}`;
        }
      }
    }

    // Calculate confidence based on how many fields we found
    const confidence = Math.min(fields.size / 10, 1); // Expect at least 10 fields for 100%

    return {
      fields: Array.from(fields),
      selectors,
      confidence,
    };
  }

  /**
   * Normalize language code to ISO 639-1
   */
  private normalizeLangCode(code: string): string {
    // Extract first part if locale format (e.g., "en-US" -> "en")
    const normalized = code.toLowerCase().split(/[-_]/)[0] ?? 'en';

    // Map common variations
    const mappings: Record<string, string> = {
      eng: 'en',
      deu: 'de',
      ger: 'de',
      fra: 'fr',
      fre: 'fr',
      spa: 'es',
      ita: 'it',
      por: 'pt',
      nld: 'nl',
      dut: 'nl',
    };

    return mappings[normalized] ?? normalized;
  }

  /**
   * Get language from country TLD
   */
  private languageFromTLD(tld: string): string | null {
    const tldToLang: Record<string, string> = {
      de: 'de',
      fr: 'fr',
      es: 'es',
      it: 'it',
      nl: 'nl',
      pt: 'pt',
      pl: 'pl',
      cz: 'cs',
      at: 'de',
      ch: 'de',
      be: 'nl',
      uk: 'en',
      ie: 'en',
      au: 'en',
      nz: 'en',
      ca: 'en',
    };

    return tldToLang[tld] ?? null;
  }

  /**
   * Detect language from content patterns
   */
  private detectFromContent(html: string): string | null {
    // Count language-specific words
    const languagePatterns: Record<string, RegExp[]> = {
      de: [
        /\b(und|der|die|das|für|mit|auf|von|zu|im|ist|werden|sich)\b/gi,
        /\b(wohnung|haus|zimmer|kaufen|mieten)\b/gi,
      ],
      fr: [
        /\b(et|le|la|les|de|du|à|pour|dans|sur|avec|par)\b/gi,
        /\b(appartement|maison|pièce|acheter|louer)\b/gi,
      ],
      es: [
        /\b(y|el|la|los|las|de|del|a|en|con|por|para)\b/gi,
        /\b(apartamento|casa|habitación|comprar|alquilar)\b/gi,
      ],
      it: [
        /\b(e|il|la|i|le|di|del|a|in|con|per|da)\b/gi,
        /\b(appartamento|casa|camera|comprare|affittare)\b/gi,
      ],
      en: [
        /\b(and|the|of|to|in|for|on|with|at|by|from)\b/gi,
        /\b(apartment|house|room|buy|rent|property)\b/gi,
      ],
    };

    const scores: Record<string, number> = {};

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      scores[lang] = 0;
      for (const pattern of patterns) {
        const matches = html.match(pattern);
        scores[lang] += matches?.length ?? 0;
      }
    }

    // Find language with highest score
    let maxScore = 0;
    let detectedLang: string | null = null;

    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    // Only return if we have reasonable confidence (at least 10 matches)
    return maxScore >= 10 ? detectedLang : null;
  }

  /**
   * Parse location and expand abbreviations
   */
  public parseLocation(
    location: string,
    abbreviations: Record<string, string>
  ): { normalized: string; expanded: string; confidence: number } {
    const normalized = location.toLowerCase().trim();

    // Check if it's an abbreviation
    if (abbreviations[normalized]) {
      return {
        normalized,
        expanded: abbreviations[normalized]!,
        confidence: 0.95,
      };
    }

    // Check for partial matches
    for (const [abbrev, full] of Object.entries(abbreviations)) {
      if (normalized.includes(abbrev) || full.includes(normalized)) {
        return {
          normalized,
          expanded: full,
          confidence: 0.8,
        };
      }
    }

    // No match found
    return {
      normalized,
      expanded: normalized,
      confidence: 0.5,
    };
  }
}

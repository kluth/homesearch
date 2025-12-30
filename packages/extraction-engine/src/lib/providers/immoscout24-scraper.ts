import { chromium, type Browser, type Page } from 'playwright';
import {
  BaseScraper,
  type ExtractionResult,
  type SearchParams,
  type ProviderConfig,
} from './base-provider.js';
import {
  type UnifiedHouseModel,
  PropertyType,
  ListingStatus,
  createHouseModel,
} from '@house-finder/domain';

/**
 * Configuration for Immoscout24 Scraper
 */
export interface Immoscout24Config extends ProviderConfig {
  baseUrl: string;
  headless?: boolean;
  userAgents?: string[];
}

/**
 * User agents for rotation to avoid detection
 */
const DEFAULT_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

/**
 * Immoscout24 Scraper Implementation
 */
export class Immoscout24Scraper extends BaseScraper {
  readonly name = 'immoscout24';
  private readonly baseUrl: string;
  private readonly headless: boolean;
  private readonly userAgents: string[];
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(config: Immoscout24Config) {
    super(config);
    this.baseUrl = config.baseUrl;
    this.headless = config.headless ?? true;
    this.userAgents = config.userAgents ?? DEFAULT_USER_AGENTS;
  }

  async extract(params?: SearchParams): Promise<ExtractionResult> {
    const startTime = Date.now();
    const houses: UnifiedHouseModel[] = [];
    const errors = [];

    try {
      // Build search URL
      const searchUrl = this.buildSearchUrl(params);

      // Initialize browser if needed
      if (this.browser === null) {
        await this.initializeBrowser();
      }

      if (this.page === null) {
        throw new Error('Page not initialized');
      }

      // Navigate to search results
      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle',
        timeout: this.config.timeout ?? 30000,
      });

      // Wait for results to load
      await this.page.waitForSelector('.result-list', { timeout: 10000 }).catch(() => {
        // Continue if selector not found
      });

      // Get page HTML
      const html = await this.page.content();

      // Parse listings from HTML
      const listings = this.parseListingsFromHtml(html);
      houses.push(...listings);

      const duration = Date.now() - startTime;
      return this.createSuccessResult(houses, {
        duration,
        pagesScraped: 1,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      errors.push(
        this.createError(
          'EXTRACTION_FAILED',
          error instanceof Error ? error.message : 'Unknown scraping error',
          {
            duration,
            url: this.baseUrl,
          }
        )
      );

      return this.createFailedResult(houses, errors, {
        duration,
        pagesScraped: 0,
      });
    }
  }

  async validateConfig(): Promise<boolean> {
    if (!this.baseUrl || this.baseUrl.trim() === '') {
      return false;
    }

    try {
      new URL(this.baseUrl);
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto(this.baseUrl, { timeout: 10000 });
      const isAccessible = page.url().includes('immobilienscout24');

      await browser.close();
      return isAccessible;
    } catch {
      return false;
    }
  }

  async cleanup(): Promise<void> {
    if (this.page != null) {
      await this.page.close().catch(() => {
        // Ignore cleanup errors
      });
      this.page = null;
    }

    if (this.browser != null) {
      await this.browser.close().catch(() => {
        // Ignore cleanup errors
      });
      this.browser = null;
    }
  }

  /**
   * Initialize Playwright browser with anti-detection measures
   */
  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    this.page = await this.browser.newPage({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
    });

    // Remove webdriver property to avoid detection
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
  }

  /**
   * Build search URL from parameters
   */
  public buildSearchUrl(params?: SearchParams): string {
    const baseSearchUrl = `${this.baseUrl}/Suche/de`;
    let pathPart = '';

    if (params?.location?.city != null) {
      const normalizedCity = this.normalizeGermanCity(params.location.city);
      pathPart = `/${normalizedCity}/wohnung-kaufen`;
    } else {
      pathPart = '/wohnung-kaufen';
    }

    const urlParams = new URLSearchParams();

    if (params?.priceRange?.min != null) {
      urlParams.append('price', params.priceRange.min.toString());
    }

    if (params?.priceRange?.max != null) {
      urlParams.append('priceto', params.priceRange.max.toString());
    }

    if (params?.limit != null) {
      urlParams.append('pageSize', params.limit.toString());
    }

    const query = urlParams.toString();
    const fullPath = `${baseSearchUrl}${pathPart}`;
    return query.length > 0 ? `${fullPath}?${query}` : fullPath;
  }

  /**
   * Parse listings from HTML content
   */
  public parseListingsFromHtml(html: string): UnifiedHouseModel[] {
    const houses: UnifiedHouseModel[] = [];

    try {
      // Simple regex-based parsing (in production, use a proper HTML parser like cheerio)
      const articleRegex = /<article[^>]*data-id="(\d+)"[^>]*>([\s\S]*?)<\/article>/g;
      let match;

      while ((match = articleRegex.exec(html)) !== null) {
        const listingId = match[1];
        const articleHtml = match[2];

        if (listingId == null || articleHtml == null) continue;

        try {
          const house = this.parseArticle(listingId, articleHtml);
          if (house != null) {
            houses.push(house);
          }
        } catch {
          // Skip malformed articles
          continue;
        }
      }
    } catch {
      // Return empty array on parsing errors
      return [];
    }

    return houses;
  }

  /**
   * Parse individual article HTML
   */
  private parseArticle(listingId: string, articleHtml: string): UnifiedHouseModel | null {
    try {
      // Extract title
      const titleMatch = /<h5[^>]*class="result-list-entry__brand-title"[^>]*>([^<]+)<\/h5>/.exec(
        articleHtml
      );
      const title = titleMatch?.[1]?.trim() ?? 'Unknown Property';

      // Extract price
      const priceMatch = /<span[^>]*class="font-highlight"[^>]*>([^<]+)<\/span>/.exec(articleHtml);
      const priceText = priceMatch?.[1]?.trim() ?? '';
      const price = this.parseGermanPrice(priceText);

      if (price === null || price === 0) {
        return null; // Skip listings without valid price
      }

      // Extract location
      const addressMatch = /<span>(\d{5})\s+([^,<]+)(?:,\s*([^<]+))?<\/span>/.exec(articleHtml);
      const postalCode = addressMatch?.[1] ?? '';
      const city = addressMatch?.[2]?.trim() ?? 'Unknown';
      const district = addressMatch?.[3]?.trim();

      // Extract living area
      const areaMatch = /(\d+(?:,\d+)?)\s*m²/.exec(articleHtml);
      const livingArea = areaMatch?.[1] != null
        ? parseFloat(areaMatch[1].replace(',', '.'))
        : undefined;

      // Extract room count
      const roomMatch = /(\d+)\s+Zimmer/.exec(articleHtml);
      const rooms = roomMatch?.[1] != null ? parseInt(roomMatch[1], 10) : undefined;

      // Detect property type from title
      const propertyType = this.detectPropertyType(title);

      return createHouseModel({
        id: `immoscout24-${listingId}`,
        source: this.name,
        url: `${this.baseUrl}/expose/${listingId}`,
        title,
        price,
        currency: 'EUR',
        propertyType,
        status: ListingStatus.ACTIVE,
        location: {
          city,
          postalCode,
          neighborhood: district,
          country: 'Germany',
        },
        details: {
          livingArea,
          totalRooms: rooms,
        },
        metadata: {
          extractedAt: new Date(),
          rawData: { originalHtml: articleHtml.substring(0, 500) }, // Store snippet
        },
      });
    } catch {
      return null;
    }
  }

  /**
   * Parse German price format (e.g., "450.000 €" -> 450000)
   */
  public parseGermanPrice(priceText: string): number | null {
    try {
      // Remove currency symbol and spaces
      const cleaned = priceText.replace(/[€\s]/g, '');

      // Remove dots (thousands separator in German)
      const normalized = cleaned.replace(/\./g, '');

      // Replace comma with dot (decimal separator in German)
      const withDecimal = normalized.replace(',', '.');

      const parsed = parseFloat(withDecimal);

      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  }

  /**
   * Detect property type from German title
   */
  public detectPropertyType(title: string): PropertyType {
    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes('einfamilienhaus') ||
      lowerTitle.includes('reihenhaus') ||
      lowerTitle.includes('doppelhaushälfte') ||
      lowerTitle.includes('haus')
    ) {
      return PropertyType.HOUSE;
    }

    if (
      lowerTitle.includes('wohnung') ||
      lowerTitle.includes('apartment') ||
      lowerTitle.includes('eigentumswohnung')
    ) {
      return PropertyType.APARTMENT;
    }

    if (lowerTitle.includes('grundstück') || lowerTitle.includes('bauland')) {
      return PropertyType.LAND;
    }

    // Default to house
    return PropertyType.HOUSE;
  }

  /**
   * Normalize German city names for URLs
   */
  private normalizeGermanCity(city: string): string {
    return city
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/\s+/g, '-');
  }

  /**
   * Get random user agent for rotation
   */
  public getRandomUserAgent(): string {
    const index = Math.floor(Math.random() * this.userAgents.length);
    return this.userAgents[index] ?? this.userAgents[0] ?? '';
  }
}

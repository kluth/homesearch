import { describe, it, expect } from '@jest/globals';
import { AutoDiscovery } from './auto-discovery';

describe('AutoDiscovery', () => {
  let discovery: AutoDiscovery;

  beforeEach(() => {
    discovery = new AutoDiscovery();
  });

  describe('Language Detection', () => {
    it('should detect language from HTML lang attribute', () => {
      const html = '<html lang="de-DE"><body>Immobilien</body></html>';
      const result = discovery.detectLanguage(html, 'https://example.de');

      expect(result.primary).toBe('de');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.detected).toContain('de');
    });

    it('should detect language from country TLD', () => {
      const html = '<html><body>Property listings</body></html>';
      const result = discovery.detectLanguage(html, 'https://example.fr');

      expect(result.primary).toBe('fr');
      expect(result.detected).toContain('fr');
    });

    it('should detect language from content patterns', () => {
      const html = `
        <html>
          <body>
            <h1>Immobilien kaufen und mieten</h1>
            <p>Wohnung mit 3 Zimmer in Berlin</p>
            <p>Das Haus hat einen schönen Garten und ist sehr ruhig</p>
          </body>
        </html>
      `;
      const result = discovery.detectLanguage(html, 'https://example.com');

      expect(result.primary).toBe('de');
    });

    it('should detect French from content', () => {
      const html = `
        <html>
          <body>
            <h1>Appartements à vendre et à louer</h1>
            <p>Maison avec jardin dans le centre de la ville</p>
            <p>Les appartements et les maisons sont disponibles pour acheter ou louer</p>
            <p>Dans le quartier, vous trouvez de nombreux appartements avec des jardins</p>
            <p>La maison est située dans un quartier calme avec beaucoup de commerces</p>
          </body>
        </html>
      `;
      const result = discovery.detectLanguage(html, 'https://example.com');

      expect(result.primary).toBe('fr');
    });

    it('should detect Spanish from content', () => {
      const html = `
        <html>
          <body>
            <h1>Casas y apartamentos en venta</h1>
            <p>Comprar o alquilar pisos en Madrid y Barcelona</p>
            <p>Los apartamentos y las casas están disponibles para comprar</p>
            <p>En el barrio encontrarás muchos pisos con jardines y terrazas</p>
            <p>La casa está situada en una zona tranquila con muchos comercios</p>
          </body>
        </html>
      `;
      const result = discovery.detectLanguage(html, 'https://example.com');

      expect(result.primary).toBe('es');
    });

    it('should default to English when no clear language detected', () => {
      const html = '<html><body><div>123</div></body></html>';
      const result = discovery.detectLanguage(html, 'https://example.com');

      expect(result.detected).toContain('en');
    });
  });

  describe('Field Discovery', () => {
    it('should discover price field', () => {
      const html = `
        <div class="listing">
          <span class="price">$500,000</span>
        </div>
      `;
      const result = discovery.discoverFields(html);

      expect(result.fields).toContain('price');
      expect(result.selectors.price).toBe('.price');
    });

    it('should discover bedrooms and bathrooms', () => {
      const html = `
        <div class="property-card">
          <span class="bedrooms">3 bedrooms</span>
          <span class="bathrooms">2 bathrooms</span>
        </div>
      `;
      const result = discovery.discoverFields(html);

      expect(result.fields).toContain('bedrooms');
      expect(result.fields).toContain('bathrooms');
      expect(result.selectors.bedrooms).toBe('.bedrooms');
      expect(result.selectors.bathrooms).toBe('.bathrooms');
    });

    it('should discover living area field', () => {
      const html = `
        <div>
          <span class="area">1,200 sq ft</span>
          <span class="size">120 m²</span>
        </div>
      `;
      const result = discovery.discoverFields(html);

      expect(result.fields).toContain('livingArea');
    });

    it('should discover address field', () => {
      const html = `
        <div class="listing">
          <div class="address">123 Main Street, Berlin</div>
        </div>
      `;
      const result = discovery.discoverFields(html);

      expect(result.fields).toContain('address');
      expect(result.selectors.address).toBe('.address');
    });

    it('should discover multiple fields from German site', () => {
      const html = `
        <div class="immobilie">
          <h2 class="title">Schöne Wohnung in München</h2>
          <div class="preis">450.000 €</div>
          <span class="zimmer">3 Schlafzimmer</span>
          <span class="badezimmer">2 Badezimmer</span>
          <span class="fläche">120 m²</span>
        </div>
      `;
      const result = discovery.discoverFields(html);

      expect(result.fields).toContain('price');
      expect(result.fields).toContain('bedrooms');
      expect(result.fields).toContain('bathrooms');
      expect(result.fields).toContain('livingArea');
    });

    it('should calculate confidence based on discovered fields', () => {
      const html = `
        <div>
          <div class="price">$500,000</div>
          <div class="bedrooms">3 beds</div>
          <div class="bathrooms">2 baths</div>
          <div class="area">1500 sqft</div>
          <div class="address">123 Main St</div>
        </div>
      `;
      const result = discovery.discoverFields(html);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Location Parsing', () => {
    it('should expand country abbreviations', () => {
      const abbreviations = {
        de: 'germany',
        fr: 'france',
        us: 'united states',
      };

      const result = discovery.parseLocation('de', abbreviations);

      expect(result.expanded).toBe('germany');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle full country names', () => {
      const abbreviations = {
        de: 'germany',
      };

      const result = discovery.parseLocation('Germany', abbreviations);

      expect(result.normalized).toBe('germany');
      expect(result.expanded).toBe('germany');
    });

    it('should handle partial matches', () => {
      const abbreviations = {
        'united states': 'united states',
        usa: 'united states',
      };

      const result = discovery.parseLocation('USA', abbreviations);

      expect(result.expanded).toBe('united states');
    });

    it('should return original for unknown locations', () => {
      const abbreviations = {};

      const result = discovery.parseLocation('Unknown Place', abbreviations);

      expect(result.normalized).toBe('unknown place');
      expect(result.expanded).toBe('unknown place');
      expect(result.confidence).toBeLessThan(0.6);
    });
  });
});

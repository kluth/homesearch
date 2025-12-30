/**
 * Response Generator Service
 * Generates personalized responses to property offers in local languages
 */

import type { UnifiedHouseModel } from '@house-finder/domain';

/**
 * Supported languages for response generation
 */
export enum ResponseLanguage {
  GERMAN = 'de',
  ENGLISH = 'en',
  FRENCH = 'fr',
  SPANISH = 'es',
  ITALIAN = 'it',
  DUTCH = 'nl',
  PORTUGUESE = 'pt',
}

/**
 * Response tone options
 */
export enum ResponseTone {
  FORMAL = 'formal',
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  CASUAL = 'casual',
}

/**
 * User preferences for response generation
 */
export interface InquiryUserPreferences {
  name?: string;
  email?: string;
  phone?: string;
  moveInDate?: string;
  householdSize?: number;
  pets?: boolean;
  employmentStatus?: string;
  additionalInfo?: string;
}

/**
 * Generated response
 */
export interface GeneratedResponse {
  subject: string;
  body: string;
  language: ResponseLanguage;
  tone: ResponseTone;
  propertyReference?: string;
}

/**
 * Response generation options
 */
export interface ResponseGenerationOptions {
  property: UnifiedHouseModel;
  userPreferences: InquiryUserPreferences;
  language?: ResponseLanguage; // If not provided, auto-detect from property
  tone?: ResponseTone;
  includeViewingRequest?: boolean;
  specificQuestions?: string[];
}

/**
 * Language-specific response templates
 */
interface ResponseTemplate {
  greeting: string;
  introduction: string;
  interestStatement: string;
  viewingRequest: string;
  personalInfo: string;
  questions: string;
  closing: string;
  signature: string;
  subject: string;
}

/**
 * Response Generator Service
 * Generates personalized, language-appropriate responses to property listings
 */
export class ResponseGeneratorService {
  private templates: Map<ResponseLanguage, ResponseTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Generate a personalized response to a property offer
   */
  public generateResponse(options: ResponseGenerationOptions): GeneratedResponse {
    const {
      property,
      userPreferences,
      tone = ResponseTone.PROFESSIONAL,
      includeViewingRequest = true,
      specificQuestions = [],
    } = options;

    // Detect language from property or use provided language
    const language = options.language ?? this.detectLanguage(property);

    // Get template for language
    const template = this.templates.get(language);
    if (template == null) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Build response components
    const greeting = this.buildGreeting(template, tone);
    const introduction = this.buildIntroduction(template, property, userPreferences);
    const interestStatement = this.buildInterestStatement(template, property, tone);
    const viewingSection = includeViewingRequest
      ? this.buildViewingRequest(template, userPreferences)
      : '';
    const personalInfoSection = this.buildPersonalInfo(template, userPreferences);
    const questionsSection =
      specificQuestions.length > 0
        ? this.buildQuestions(template, specificQuestions)
        : '';
    const closing = this.buildClosing(template, tone);
    const signature = this.buildSignature(template, userPreferences);

    // Combine all sections
    const body = [
      greeting,
      introduction,
      interestStatement,
      viewingSection,
      personalInfoSection,
      questionsSection,
      closing,
      signature,
    ]
      .filter((section) => section.length > 0)
      .join('\n\n');

    // Generate subject line
    const subject = this.buildSubject(template, property);

    return {
      subject,
      body,
      language,
      tone,
      propertyReference: property.id,
    };
  }

  /**
   * Detect language from property listing
   */
  private detectLanguage(property: UnifiedHouseModel): ResponseLanguage {
    const text = `${property.title} ${property.description ?? ''}`.toLowerCase();

    // Check for country-specific domains or explicit language markers
    const source = property.metadata.source.toLowerCase();

    // Priority 1: Check TLD first (most reliable)
    if (source.includes('.de')) return ResponseLanguage.GERMAN;
    if (source.includes('.fr')) return ResponseLanguage.FRENCH;
    if (source.includes('.es')) return ResponseLanguage.SPANISH;
    if (source.includes('.it')) return ResponseLanguage.ITALIAN;
    if (source.includes('.nl')) return ResponseLanguage.DUTCH;
    if (source.includes('.pt') || source.includes('.br')) return ResponseLanguage.PORTUGUESE;

    // Priority 2: Check well-known site names
    if (source.includes('immoscout24') || source.includes('immowelt')) return ResponseLanguage.GERMAN;
    if (source.includes('seloger')) return ResponseLanguage.FRENCH;
    if (source.includes('immobiliare')) return ResponseLanguage.ITALIAN;
    if (source.includes('funda')) return ResponseLanguage.DUTCH;

    // Priority 3: Check content for language-specific words
    // German
    if (
      text.includes('wohnung') ||
      text.includes('haus') ||
      text.includes('miete')
    ) {
      return ResponseLanguage.GERMAN;
    }

    // French
    if (
      text.includes('appartement') ||
      text.includes('maison') ||
      text.includes('loyer')
    ) {
      return ResponseLanguage.FRENCH;
    }

    // Spanish
    if (
      text.includes('piso') ||
      text.includes('casa') ||
      text.includes('alquiler')
    ) {
      return ResponseLanguage.SPANISH;
    }

    // Italian
    if (
      text.includes('appartamento') ||
      text.includes('affitto')
    ) {
      return ResponseLanguage.ITALIAN;
    }

    // Dutch
    if (
      text.includes('woning') ||
      text.includes('huur')
    ) {
      return ResponseLanguage.DUTCH;
    }

    // Portuguese
    if (
      text.includes('apartamento') ||
      text.includes('aluguel')
    ) {
      return ResponseLanguage.PORTUGUESE;
    }

    // Default to English
    return ResponseLanguage.ENGLISH;
  }

  /**
   * Build greeting based on tone
   */
  private buildGreeting(template: ResponseTemplate, tone: ResponseTone): string {
    return template.greeting;
  }

  /**
   * Build introduction with property reference
   */
  private buildIntroduction(
    template: ResponseTemplate,
    property: UnifiedHouseModel,
    userPreferences: InquiryUserPreferences
  ): string {
    return template.introduction
      .replace('{propertyTitle}', property.title)
      .replace('{propertyId}', property.id)
      .replace('{location}', property.location.city ?? '');
  }

  /**
   * Build interest statement
   */
  private buildInterestStatement(
    template: ResponseTemplate,
    property: UnifiedHouseModel,
    tone: ResponseTone
  ): string {
    return template.interestStatement
      .replace('{propertyType}', property.type ?? 'property')
      .replace('{location}', property.location.city ?? '');
  }

  /**
   * Build viewing request
   */
  private buildViewingRequest(
    template: ResponseTemplate,
    userPreferences: InquiryUserPreferences
  ): string {
    let request = template.viewingRequest;

    if (userPreferences.moveInDate != null) {
      request = request.replace('{moveInDate}', userPreferences.moveInDate);
    } else {
      request = request.replace('{moveInDate}', '');
    }

    return request;
  }

  /**
   * Build personal information section
   */
  private buildPersonalInfo(
    template: ResponseTemplate,
    userPreferences: InquiryUserPreferences
  ): string {
    const info: string[] = [];

    if (userPreferences.employmentStatus != null) {
      info.push(`Employment: ${userPreferences.employmentStatus}`);
    }

    if (userPreferences.householdSize != null) {
      info.push(
        `Household size: ${userPreferences.householdSize} ${userPreferences.householdSize === 1 ? 'person' : 'people'}`
      );
    }

    if (userPreferences.pets != null) {
      info.push(`Pets: ${userPreferences.pets ? 'Yes' : 'No'}`);
    }

    if (userPreferences.additionalInfo != null) {
      info.push(userPreferences.additionalInfo);
    }

    if (info.length === 0) {
      return '';
    }

    return template.personalInfo + '\n' + info.map((i) => `- ${i}`).join('\n');
  }

  /**
   * Build questions section
   */
  private buildQuestions(template: ResponseTemplate, questions: string[]): string {
    const questionList = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    return template.questions.replace('{questions}', questionList);
  }

  /**
   * Build closing
   */
  private buildClosing(template: ResponseTemplate, tone: ResponseTone): string {
    return template.closing;
  }

  /**
   * Build signature
   */
  private buildSignature(
    template: ResponseTemplate,
    userPreferences: InquiryUserPreferences
  ): string {
    const parts: string[] = [];

    if (userPreferences.name != null) {
      parts.push(userPreferences.name);
    }

    if (userPreferences.email != null) {
      parts.push(`Email: ${userPreferences.email}`);
    }

    if (userPreferences.phone != null) {
      parts.push(`Phone: ${userPreferences.phone}`);
    }

    return parts.join('\n');
  }

  /**
   * Build subject line
   */
  private buildSubject(
    template: ResponseTemplate,
    property: UnifiedHouseModel
  ): string {
    return template.subject
      .replace('{propertyTitle}', property.title)
      .replace('{propertyId}', property.id)
      .replace('{location}', property.location.city ?? '');
  }

  /**
   * Initialize language templates
   */
  private initializeTemplates(): void {
    // German templates
    this.templates.set(ResponseLanguage.GERMAN, {
      greeting: 'Sehr geehrte Damen und Herren,',
      introduction:
        'ich interessiere mich für die Immobilie "{propertyTitle}" (Ref: {propertyId}).',
      interestStatement:
        'Die Lage und die Ausstattung des Objekts entsprechen genau meinen Vorstellungen.',
      viewingRequest:
        'Ich würde mich sehr über einen Besichtigungstermin freuen. {moveInDate}',
      personalInfo: 'Einige Informationen über mich:',
      questions: 'Ich hätte noch einige Fragen:\n{questions}',
      closing:
        'Ich freue mich auf Ihre Rückmeldung und stehe für weitere Informationen gerne zur Verfügung.',
      signature: 'Mit freundlichen Grüßen,',
      subject: 'Anfrage: {propertyTitle} ({propertyId})',
    });

    // English templates
    this.templates.set(ResponseLanguage.ENGLISH, {
      greeting: 'Dear Sir or Madam,',
      introduction: 'I am interested in the property "{propertyTitle}" (Ref: {propertyId}).',
      interestStatement:
        'The location and features of this property match my requirements perfectly.',
      viewingRequest:
        'I would be very interested in scheduling a viewing. {moveInDate}',
      personalInfo: 'Some information about me:',
      questions: 'I have a few questions:\n{questions}',
      closing:
        'I look forward to your response and am happy to provide any additional information.',
      signature: 'Kind regards,',
      subject: 'Inquiry: {propertyTitle} ({propertyId})',
    });

    // French templates
    this.templates.set(ResponseLanguage.FRENCH, {
      greeting: 'Madame, Monsieur,',
      introduction:
        'Je suis intéressé(e) par le bien "{propertyTitle}" (Réf: {propertyId}).',
      interestStatement:
        "L'emplacement et les caractéristiques de ce bien correspondent parfaitement à mes attentes.",
      viewingRequest:
        'Je serais très intéressé(e) par une visite. {moveInDate}',
      personalInfo: 'Quelques informations me concernant:',
      questions: "J'aurais quelques questions:\n{questions}",
      closing:
        "J'attends votre réponse avec intérêt et reste à votre disposition pour toute information complémentaire.",
      signature: 'Cordialement,',
      subject: 'Demande de renseignements: {propertyTitle} ({propertyId})',
    });

    // Spanish templates
    this.templates.set(ResponseLanguage.SPANISH, {
      greeting: 'Estimado/a señor/a,',
      introduction:
        'Estoy interesado/a en la propiedad "{propertyTitle}" (Ref: {propertyId}).',
      interestStatement:
        'La ubicación y las características de esta propiedad se ajustan perfectamente a mis necesidades.',
      viewingRequest: 'Me gustaría mucho programar una visita. {moveInDate}',
      personalInfo: 'Alguna información sobre mí:',
      questions: 'Tengo algunas preguntas:\n{questions}',
      closing:
        'Espero su respuesta y quedo a su disposición para cualquier información adicional.',
      signature: 'Atentamente,',
      subject: 'Consulta: {propertyTitle} ({propertyId})',
    });

    // Italian templates
    this.templates.set(ResponseLanguage.ITALIAN, {
      greeting: 'Gentile Signore/Signora,',
      introduction:
        'Sono interessato/a all\'immobile "{propertyTitle}" (Rif: {propertyId}).',
      interestStatement:
        'La posizione e le caratteristiche di questo immobile corrispondono perfettamente alle mie esigenze.',
      viewingRequest: 'Sarei molto interessato/a a fissare una visita. {moveInDate}',
      personalInfo: 'Alcune informazioni su di me:',
      questions: 'Ho alcune domande:\n{questions}',
      closing:
        'Resto in attesa di un Suo riscontro e rimango a disposizione per ulteriori informazioni.',
      signature: 'Cordiali saluti,',
      subject: 'Richiesta informazioni: {propertyTitle} ({propertyId})',
    });

    // Dutch templates
    this.templates.set(ResponseLanguage.DUTCH, {
      greeting: 'Geachte heer/mevrouw,',
      introduction:
        'Ik ben geïnteresseerd in de woning "{propertyTitle}" (Ref: {propertyId}).',
      interestStatement:
        'De locatie en kenmerken van deze woning komen perfect overeen met mijn wensen.',
      viewingRequest: 'Ik zou graag een bezichtiging inplannen. {moveInDate}',
      personalInfo: 'Enkele gegevens over mij:',
      questions: 'Ik heb nog enkele vragen:\n{questions}',
      closing:
        'Ik zie uit naar uw reactie en sta open voor het verstrekken van aanvullende informatie.',
      signature: 'Met vriendelijke groet,',
      subject: 'Aanvraag: {propertyTitle} ({propertyId})',
    });

    // Portuguese templates
    this.templates.set(ResponseLanguage.PORTUGUESE, {
      greeting: 'Prezado/a Senhor/a,',
      introduction:
        'Estou interessado/a no imóvel "{propertyTitle}" (Ref: {propertyId}).',
      interestStatement:
        'A localização e as características deste imóvel correspondem perfeitamente às minhas necessidades.',
      viewingRequest: 'Gostaria muito de agendar uma visita. {moveInDate}',
      personalInfo: 'Algumas informações sobre mim:',
      questions: 'Tenho algumas perguntas:\n{questions}',
      closing:
        'Aguardo sua resposta e estou à disposição para fornecer informações adicionais.',
      signature: 'Atenciosamente,',
      subject: 'Consulta: {propertyTitle} ({propertyId})',
    });
  }

  /**
   * Get available languages
   */
  public getAvailableLanguages(): ResponseLanguage[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Validate user preferences
   */
  public validatePreferences(preferences: InquiryUserPreferences): boolean {
    // At minimum, we need a name or email
    return preferences.name != null || preferences.email != null;
  }
}

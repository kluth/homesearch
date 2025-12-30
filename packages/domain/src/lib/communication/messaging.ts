import { z } from 'zod';

/**
 * In-App Messaging System
 */

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  PROPERTY_SHARE = 'property_share',
  APPOINTMENT_REQUEST = 'appointment_request',
  OFFER = 'offer',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  type: z.nativeEnum(MessageType),
  content: z.string(),

  // Attachments
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(['image', 'document', 'video']),
    url: z.string().url(),
    filename: z.string(),
    size: z.number(),
    mimeType: z.string(),
  })).optional(),

  // Property share
  propertyId: z.string().optional(),

  // Appointment request
  appointmentRequest: z.object({
    propertyId: z.string(),
    requestedDate: z.date(),
    requestedTime: z.string(),
    duration: z.number(), // minutes
    type: z.enum(['viewing', 'virtual_tour', 'open_house']),
    notes: z.string().optional(),
  }).optional(),

  // Offer details
  offerDetails: z.object({
    propertyId: z.string(),
    amount: z.number(),
    contingencies: z.array(z.string()),
    closingDate: z.date(),
    earnestMoney: z.number(),
  }).optional(),

  // Status
  status: z.nativeEnum(MessageStatus).default(MessageStatus.SENDING),
  sentAt: z.date(),
  deliveredAt: z.date().optional(),
  readAt: z.date().optional(),

  // Moderation
  flagged: z.boolean().default(false),
  flagReason: z.string().optional(),

  // Reply reference
  replyToId: z.string().optional(),

  // Reactions
  reactions: z.array(z.object({
    userId: z.string(),
    emoji: z.string(),
    createdAt: z.date(),
  })).optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Conversations
 */
export enum ConversationType {
  DIRECT = 'direct', // 1-on-1
  GROUP = 'group', // Multiple participants
  PROPERTY_INQUIRY = 'property_inquiry', // Buyer to agent about specific property
  WORKSPACE = 'workspace', // Team workspace chat
}

export const ConversationSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(ConversationType),

  // Participants
  participants: z.array(z.object({
    userId: z.string(),
    role: z.enum(['buyer', 'seller', 'agent', 'admin']),
    joinedAt: z.date(),
    leftAt: z.date().optional(),
    unreadCount: z.number().default(0),
    lastReadAt: z.date().optional(),
  })),

  // Metadata
  title: z.string().optional(),
  propertyId: z.string().optional(), // For property inquiries
  workspaceId: z.string().optional(), // For workspace chats

  // Last message
  lastMessage: z.object({
    content: z.string(),
    senderId: z.string(),
    sentAt: z.date(),
  }).optional(),

  // Settings
  muted: z.boolean().default(false),
  archived: z.boolean().default(false),
  pinned: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

/**
 * Video Calls & Virtual Showings
 */
export enum CallStatus {
  SCHEDULED = 'scheduled',
  STARTING = 'starting',
  IN_PROGRESS = 'in_progress',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
}

export const VideoCallSchema = z.object({
  id: z.string(),
  conversationId: z.string().optional(),
  propertyId: z.string().optional(),

  // Participants
  hostId: z.string(),
  participants: z.array(z.object({
    userId: z.string(),
    joinedAt: z.date().optional(),
    leftAt: z.date().optional(),
    duration: z.number().optional(), // seconds
  })),

  // Call details
  scheduledStart: z.date(),
  scheduledEnd: z.date(),
  actualStart: z.date().optional(),
  actualEnd: z.date().optional(),
  duration: z.number().optional(), // seconds

  // Virtual showing specific
  isVirtualShowing: z.boolean().default(false),
  showingNotes: z.string().optional(),
  roomsShown: z.array(z.string()).optional(),

  // Meeting room details
  meetingRoomId: z.string().optional(),
  meetingRoomUrl: z.string().url().optional(),
  recordingUrl: z.string().url().optional(),

  status: z.nativeEnum(CallStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type VideoCall = z.infer<typeof VideoCallSchema>;

/**
 * Appointment Scheduling
 */
export enum AppointmentStatus {
  REQUESTED = 'requested',
  CONFIRMED = 'confirmed',
  RESCHEDULED = 'rescheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  PROPERTY_VIEWING = 'property_viewing',
  VIRTUAL_TOUR = 'virtual_tour',
  OPEN_HOUSE = 'open_house',
  CONSULTATION = 'consultation',
  INSPECTION = 'inspection',
  APPRAISAL = 'appraisal',
  FINAL_WALKTHROUGH = 'final_walkthrough',
}

export const AppointmentSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  type: z.nativeEnum(AppointmentType),

  // Participants
  requesterId: z.string(), // Usually buyer
  agentId: z.string().optional(),
  attendees: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    email: z.string().email(),
    confirmed: z.boolean().default(false),
  })),

  // Scheduling
  requestedDate: z.date(),
  requestedTime: z.string(), // "10:00"
  confirmedDate: z.date().optional(),
  confirmedTime: z.string().optional(),
  duration: z.number().default(30), // minutes
  timezone: z.string().default('America/New_York'),

  // Location
  location: z.object({
    type: z.enum(['in_person', 'virtual']),
    address: z.string().optional(),
    meetingUrl: z.string().url().optional(),
    accessInstructions: z.string().optional(),
  }),

  // Details
  notes: z.string().optional(),
  specialRequests: z.string().optional(),

  // Reminders
  reminders: z.array(z.object({
    before: z.number(), // minutes before
    sentAt: z.date().optional(),
  })).optional(),

  // Status
  status: z.nativeEnum(AppointmentStatus).default(AppointmentStatus.REQUESTED),
  statusHistory: z.array(z.object({
    status: z.nativeEnum(AppointmentStatus),
    changedAt: z.date(),
    changedBy: z.string(),
    reason: z.string().optional(),
  })),

  // Follow-up
  feedbackRequested: z.boolean().default(false),
  feedbackSubmitted: z.boolean().default(false),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

/**
 * Document Sharing & E-Signatures
 */
export enum DocumentType {
  OFFER = 'offer',
  CONTRACT = 'contract',
  DISCLOSURE = 'disclosure',
  INSPECTION_REPORT = 'inspection_report',
  APPRAISAL = 'appraisal',
  TITLE = 'title',
  PROOF_OF_FUNDS = 'proof_of_funds',
  PRE_APPROVAL = 'pre_approval',
  OTHER = 'other',
}

export enum SignatureStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export const SharedDocumentSchema = z.object({
  id: z.string(),
  propertyId: z.string().optional(),
  conversationId: z.string().optional(),
  workspaceId: z.string(),

  // Document details
  type: z.nativeEnum(DocumentType),
  title: z.string(),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  filename: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),

  // Sharing
  uploadedBy: z.string(),
  sharedWith: z.array(z.object({
    userId: z.string(),
    accessLevel: z.enum(['view', 'comment', 'edit']),
    viewedAt: z.date().optional(),
    downloadedAt: z.date().optional(),
  })),

  // E-Signature
  requiresSignature: z.boolean().default(false),
  signatures: z.array(z.object({
    userId: z.string(),
    name: z.string(),
    status: z.nativeEnum(SignatureStatus),
    signedAt: z.date().optional(),
    ipAddress: z.string().optional(),
    signatureImageUrl: z.string().url().optional(),
  })).optional(),

  // Versioning
  version: z.number().default(1),
  previousVersionId: z.string().optional(),

  // Security
  encrypted: z.boolean().default(false),
  password: z.string().optional(),
  expiresAt: z.date().optional(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SharedDocument = z.infer<typeof SharedDocumentSchema>;

/**
 * Notification Preferences
 */
export const NotificationPreferencesSchema = z.object({
  userId: z.string(),

  // Channel preferences
  email: z.object({
    enabled: z.boolean().default(true),
    newMessage: z.boolean().default(true),
    appointmentReminder: z.boolean().default(true),
    priceAlert: z.boolean().default(true),
    newMatch: z.boolean().default(true),
    marketUpdate: z.boolean().default(false),
    newsletter: z.boolean().default(true),
  }),

  push: z.object({
    enabled: z.boolean().default(true),
    newMessage: z.boolean().default(true),
    appointmentReminder: z.boolean().default(true),
    priceAlert: z.boolean().default(true),
    newMatch: z.boolean().default(true),
    marketUpdate: z.boolean().default(false),
  }),

  sms: z.object({
    enabled: z.boolean().default(false),
    appointmentReminder: z.boolean().default(true),
    urgentAlerts: z.boolean().default(true),
  }),

  // Quiet hours
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().default('22:00'),
    end: z.string().default('08:00'),
    timezone: z.string().default('America/New_York'),
  }),

  updatedAt: z.date(),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

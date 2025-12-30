/**
 * HOA Meeting Analyzer
 * Analyze HOA meeting minutes, board decisions, and community sentiment.
 */

import { z } from 'zod';

export const HOAMeetingSchema = z.object({
  propertyId: z.string(),
  recentMeetings: z.array(z.object({
    date: z.string(),
    type: z.enum(['regular', 'special', 'annual', 'emergency']),
    attendance: z.number(),
    duration: z.number().describe('Minutes'),
    keyTopics: z.array(z.string()),
    decisions: z.array(z.object({
      topic: z.string(),
      decision: z.string(),
      vote: z.object({
        for: z.number(),
        against: z.number(),
        abstain: z.number(),
      }).optional(),
      impact: z.enum(['low', 'moderate', 'high', 'critical']),
    })),
    summary: z.string(),
  })),
  hotTopics: z.array(z.object({
    topic: z.string(),
    frequency: z.number().describe('Times discussed in last 12 months'),
    sentiment: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
    status: z.enum(['resolved', 'ongoing', 'escalating', 'new']),
    description: z.string(),
  })),
  upcomingVotes: z.array(z.object({
    topic: z.string(),
    scheduledDate: z.string(),
    description: z.string(),
    potentialImpact: z.object({
      fees: z.number().optional(),
      property: z.string(),
      timeline: z.string(),
    }),
    controversy: z.enum(['none', 'low', 'moderate', 'high']),
  })),
  boardActivity: z.object({
    meetingFrequency: z.number().describe('Meetings per year'),
    averageAttendance: z.number(),
    decisionsMade: z.number().describe('Last 12 months'),
    openItems: z.number(),
    transparency: z.enum(['excellent', 'good', 'fair', 'poor']),
  }),
  communityIssues: z.array(z.object({
    category: z.string(),
    issue: z.string(),
    raisedDate: z.string(),
    status: z.enum(['open', 'in_progress', 'resolved', 'deferred']),
    residentConcern: z.enum(['low', 'moderate', 'high']),
  })),
  financialDiscussions: z.array(z.object({
    topic: z.string(),
    meetingDate: z.string(),
    summary: z.string(),
    impact: z.object({
      type: z.enum(['fee_increase', 'special_assessment', 'reserve_funding', 'expense_reduction']),
      amount: z.number().optional(),
    }),
  })),
  sentiment: z.object({
    overall: z.enum(['very_positive', 'positive', 'neutral', 'negative', 'very_negative']),
    trends: z.object({
      improving: z.boolean(),
      concerns: z.array(z.string()),
      positives: z.array(z.string()),
    }),
    residentEngagement: z.enum(['very_high', 'high', 'moderate', 'low', 'very_low']),
  }),
  redFlags: z.array(z.object({
    flag: z.string(),
    severity: z.enum(['minor', 'moderate', 'major', 'critical']),
    description: z.string(),
    recommendation: z.string(),
  })),
  governanceQuality: z.object({
    score: z.number().min(0).max(100),
    rating: z.enum(['excellent', 'good', 'fair', 'poor']),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
  }),
});

export type HOAMeeting = z.infer<typeof HOAMeetingSchema>;

export class HOAMeetingAnalyzer {
  public analyzeHOAMeetings(
    propertyId: string,
    hoaName: string
  ): HOAMeeting {
    // Analyze recent meetings
    const recentMeetings = this.getRecentMeetings();

    // Identify hot topics
    const hotTopics = this.identifyHotTopics(recentMeetings);

    // Upcoming votes
    const upcomingVotes = this.getUpcomingVotes();

    // Board activity metrics
    const boardActivity = this.analyzeBoardActivity(recentMeetings);

    // Community issues
    const communityIssues = this.getCommunityIssues();

    // Financial discussions
    const financialDiscussions = this.getFinancialDiscussions();

    // Community sentiment
    const sentiment = this.analyzeSentiment(hotTopics, communityIssues);

    // Red flags
    const redFlags = this.identifyRedFlags(financialDiscussions, hotTopics, boardActivity);

    // Governance quality
    const governanceQuality = this.assessGovernance(boardActivity, sentiment, redFlags);

    return {
      propertyId,
      recentMeetings,
      hotTopics,
      upcomingVotes,
      boardActivity,
      communityIssues,
      financialDiscussions,
      sentiment,
      redFlags,
      governanceQuality,
    };
  }

  private getRecentMeetings(): HOAMeeting['recentMeetings'] {
    return [
      {
        date: '2025-01-15',
        type: 'regular',
        attendance: 6,
        duration: 90,
        keyTopics: ['Budget review', 'Pool renovation', 'Landscaping contract'],
        decisions: [
          {
            topic: 'Pool renovation approval',
            decision: 'Approved with modifications',
            vote: { for: 5, against: 1, abstain: 0 },
            impact: 'high',
          },
          {
            topic: 'Landscaping contract renewal',
            decision: 'Approved',
            vote: { for: 6, against: 0, abstain: 0 },
            impact: 'low',
          },
        ],
        summary: 'Productive meeting with focus on pool renovation. Budget on track.',
      },
      {
        date: '2024-12-10',
        type: 'regular',
        attendance: 5,
        duration: 75,
        keyTopics: ['Parking enforcement', 'Holiday decorations', 'Security cameras'],
        decisions: [
          {
            topic: 'Security camera installation',
            decision: 'Approved for common areas',
            vote: { for: 4, against: 1, abstain: 0 },
            impact: 'moderate',
          },
        ],
        summary: 'Discussion on parking violations. Security cameras approved for entry points.',
      },
      {
        date: '2024-11-05',
        type: 'special',
        attendance: 7,
        duration: 120,
        keyTopics: ['Special assessment', 'Roof repairs', 'Reserve study'],
        decisions: [
          {
            topic: 'Emergency roof repair assessment',
            decision: 'Deferred pending second bid',
            impact: 'critical',
          },
        ],
        summary: 'Special meeting called for roof emergency. Seeking additional contractor bids.',
      },
    ];
  }

  private identifyHotTopics(meetings: HOAMeeting['recentMeetings']): HOAMeeting['hotTopics'] {
    return [
      {
        topic: 'Parking violations',
        frequency: 8,
        sentiment: 'negative',
        status: 'ongoing',
        description: 'Resident complaints about guest parking and enforcement inconsistency',
      },
      {
        topic: 'Pool renovation',
        frequency: 6,
        sentiment: 'positive',
        status: 'resolved',
        description: 'Community pool upgrade approved, construction scheduled for spring',
      },
      {
        topic: 'Fee increase discussion',
        frequency: 4,
        sentiment: 'negative',
        status: 'escalating',
        description: 'Reserve study indicates need for potential fee increase next year',
      },
      {
        topic: 'Security improvements',
        frequency: 5,
        sentiment: 'positive',
        status: 'ongoing',
        description: 'Camera installation approved, additional measures under consideration',
      },
    ];
  }

  private getUpcomingVotes(): HOAMeeting['upcomingVotes'] {
    return [
      {
        topic: 'Annual fee increase',
        scheduledDate: '2025-03-15',
        description: 'Vote on 8% HOA fee increase to fund reserve requirements',
        potentialImpact: {
          fees: 32,
          property: 'Monthly fees would increase from $400 to $432',
          timeline: 'Effective July 1, 2025',
        },
        controversy: 'high',
      },
      {
        topic: 'Clubhouse renovation',
        scheduledDate: '2025-02-20',
        description: 'Approve $150,000 clubhouse modernization project',
        potentialImpact: {
          fees: 0,
          property: 'Funded from reserves, no fee increase',
          timeline: 'Summer 2025 completion',
        },
        controversy: 'low',
      },
    ];
  }

  private analyzeBoardActivity(meetings: HOAMeeting['recentMeetings']): HOAMeeting['boardActivity'] {
    return {
      meetingFrequency: 12,
      averageAttendance: 85,
      decisionsMade: 24,
      openItems: 7,
      transparency: 'good',
    };
  }

  private getCommunityIssues(): HOAMeeting['communityIssues'] {
    return [
      {
        category: 'Maintenance',
        issue: 'Common area lighting insufficient',
        raisedDate: '2024-10-12',
        status: 'in_progress',
        residentConcern: 'moderate',
      },
      {
        category: 'Rules',
        issue: 'Pet policy enforcement inconsistent',
        raisedDate: '2024-09-05',
        status: 'open',
        residentConcern: 'high',
      },
      {
        category: 'Amenities',
        issue: 'Gym equipment outdated',
        raisedDate: '2024-11-20',
        status: 'deferred',
        residentConcern: 'low',
      },
    ];
  }

  private getFinancialDiscussions(): HOAMeeting['financialDiscussions'] {
    return [
      {
        topic: 'Reserve study findings',
        meetingDate: '2024-11-05',
        summary: 'Reserve study indicates underfunding by $250,000 over 10 years',
        impact: {
          type: 'fee_increase',
          amount: 32,
        },
      },
      {
        topic: 'Pool renovation financing',
        meetingDate: '2025-01-15',
        summary: 'Pool renovation to be funded through combination of reserves and loan',
        impact: {
          type: 'reserve_funding',
          amount: 85000,
        },
      },
      {
        topic: 'Insurance premium increase',
        meetingDate: '2024-12-10',
        summary: 'Property insurance renewal at 22% increase due to market conditions',
        impact: {
          type: 'fee_increase',
          amount: 12,
        },
      },
    ];
  }

  private analyzeSentiment(
    hotTopics: HOAMeeting['hotTopics'],
    issues: HOAMeeting['communityIssues']
  ): HOAMeeting['sentiment'] {
    return {
      overall: 'neutral',
      trends: {
        improving: true,
        concerns: [
          'Fee increase upcoming',
          'Parking enforcement issues',
          'Reserve funding shortfall',
        ],
        positives: [
          'Active board addressing issues',
          'Pool renovation moving forward',
          'Security improvements approved',
        ],
      },
      residentEngagement: 'moderate',
    };
  }

  private identifyRedFlags(
    financial: HOAMeeting['financialDiscussions'],
    topics: HOAMeeting['hotTopics'],
    board: HOAMeeting['boardActivity']
  ): HOAMeeting['redFlags'] {
    const flags: HOAMeeting['redFlags'] = [];

    // Check for reserve underfunding
    const reserveIssue = financial.find(f => f.summary.includes('underfunding'));
    if (reserveIssue) {
      flags.push({
        flag: 'Reserve underfunding',
        severity: 'moderate',
        description: 'Reserve study shows $250,000 shortfall over 10 years',
        recommendation: 'Review reserve funding plan and fee increase proposal',
      });
    }

    // Check for escalating issues
    const escalating = topics.filter(t => t.status === 'escalating');
    if (escalating.length > 0) {
      flags.push({
        flag: 'Unresolved escalating issues',
        severity: 'minor',
        description: `${escalating.length} topics showing escalating concern`,
        recommendation: 'Monitor board\'s handling of contentious issues',
      });
    }

    // Check for transparency
    if (board.transparency === 'poor' || board.transparency === 'fair') {
      flags.push({
        flag: 'Limited transparency',
        severity: 'moderate',
        description: 'Meeting minutes and financial reports not readily accessible',
        recommendation: 'Request access to HOA documents and meeting minutes',
      });
    }

    return flags;
  }

  private assessGovernance(
    board: HOAMeeting['boardActivity'],
    sentiment: HOAMeeting['sentiment'],
    redFlags: HOAMeeting['redFlags']
  ): HOAMeeting['governanceQuality'] {
    let score = 75; // Base score

    // Adjust for board activity
    if (board.transparency === 'excellent') score += 10;
    if (board.transparency === 'good') score += 5;
    if (board.averageAttendance > 80) score += 5;
    if (board.openItems < 10) score += 5;

    // Adjust for sentiment
    if (sentiment.trends.improving) score += 5;
    if (sentiment.residentEngagement === 'high' || sentiment.residentEngagement === 'very_high') score += 5;

    // Adjust for red flags
    const criticalFlags = redFlags.filter(f => f.severity === 'critical' || f.severity === 'major');
    score -= criticalFlags.length * 10;

    score = Math.max(0, Math.min(100, score));

    let rating: HOAMeeting['governanceQuality']['rating'];
    if (score >= 85) rating = 'excellent';
    else if (score >= 70) rating = 'good';
    else if (score >= 55) rating = 'fair';
    else rating = 'poor';

    return {
      score,
      rating,
      strengths: [
        'Regular meetings with good attendance',
        'Active decision-making',
        'Addressing community concerns',
        'Transparent financial discussions',
      ],
      weaknesses: [
        'Reserve funding shortfall',
        'Some persistent issues unresolved',
        'Upcoming fee increases likely',
      ],
    };
  }
}

/**
 * Customer Risk Scoring Algorithm
 *
 * Calculates a risk score (0-100) based on multiple factors:
 * - Days since last contact
 * - Service history gaps
 * - Vehicle age
 * - Engagement patterns
 * - Purchase timeline
 */

export interface RiskScoreInput {
  daysSinceLastContact: number | null;
  daysSinceLastService: number | null;
  vehicleAgeMonths: number | null;
  totalActivities: number;
  emailEngagementRate: number | null; // 0-100
  lifecycleStage: string;
  hasVehicle: boolean;
  hasOpenEnquiry: boolean;
}

export interface RiskScoreResult {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  name: string;
  contribution: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Calculate customer risk score
 */
export function calculateRiskScore(input: RiskScoreInput): RiskScoreResult {
  const factors: RiskFactor[] = [];
  let totalScore = 0;

  // Factor 1: Days since last contact (max 30 points)
  if (input.daysSinceLastContact !== null) {
    let contactScore = 0;
    let severity: 'low' | 'medium' | 'high' = 'low';
    let description = '';

    if (input.daysSinceLastContact > 90) {
      contactScore = 30;
      severity = 'high';
      description = 'No contact in over 90 days - critical engagement gap';
    } else if (input.daysSinceLastContact > 60) {
      contactScore = 20;
      severity = 'high';
      description = 'No contact in 60-90 days - needs immediate attention';
    } else if (input.daysSinceLastContact > 30) {
      contactScore = 10;
      severity = 'medium';
      description = 'No contact in 30-60 days - follow-up recommended';
    } else if (input.daysSinceLastContact > 14) {
      contactScore = 5;
      severity = 'low';
      description = 'Contact within last 30 days';
    }

    if (contactScore > 0) {
      factors.push({
        name: 'Contact Gap',
        contribution: contactScore,
        description,
        severity,
      });
      totalScore += contactScore;
    }
  } else {
    // Never contacted - high risk
    factors.push({
      name: 'Never Contacted',
      contribution: 25,
      description: 'Customer has never been contacted',
      severity: 'high',
    });
    totalScore += 25;
  }

  // Factor 2: Service history gaps (max 25 points)
  if (input.hasVehicle) {
    if (input.daysSinceLastService !== null) {
      let serviceScore = 0;
      let severity: 'low' | 'medium' | 'high' = 'low';
      let description = '';

      if (input.daysSinceLastService > 365) {
        serviceScore = 25;
        severity = 'high';
        description = 'No service in over 12 months - high churn risk';
      } else if (input.daysSinceLastService > 180) {
        serviceScore = 15;
        severity = 'medium';
        description = 'No service in 6-12 months - service reminder needed';
      } else if (input.daysSinceLastService > 90) {
        serviceScore = 8;
        severity = 'low';
        description = 'Service within last 6 months';
      }

      if (serviceScore > 0) {
        factors.push({
          name: 'Service Gap',
          contribution: serviceScore,
          description,
          severity,
        });
        totalScore += serviceScore;
      }
    } else {
      // Has vehicle but never serviced
      factors.push({
        name: 'No Service History',
        contribution: 15,
        description: 'Vehicle registered but no service record',
        severity: 'medium',
      });
      totalScore += 15;
    }
  }

  // Factor 3: Vehicle age (max 15 points) - older vehicles = trade-in opportunity
  if (input.vehicleAgeMonths !== null) {
    let ageScore = 0;
    let severity: 'low' | 'medium' | 'high' = 'low';
    let description = '';

    if (input.vehicleAgeMonths > 48) {
      ageScore = 15;
      severity = 'medium';
      description = 'Vehicle over 4 years old - trade-in opportunity';
    } else if (input.vehicleAgeMonths > 36) {
      ageScore = 10;
      severity = 'low';
      description = 'Vehicle 3-4 years old - consider trade-in campaign';
    } else if (input.vehicleAgeMonths > 24) {
      ageScore = 5;
      severity = 'low';
      description = 'Vehicle 2-3 years old';
    }

    if (ageScore > 0) {
      factors.push({
        name: 'Vehicle Age',
        contribution: ageScore,
        description,
        severity,
      });
      totalScore += ageScore;
    }
  }

  // Factor 4: Low engagement (max 15 points)
  if (input.totalActivities < 3) {
    const engagementScore = input.totalActivities === 0 ? 15 : 10;
    factors.push({
      name: 'Low Engagement',
      contribution: engagementScore,
      description: `Only ${input.totalActivities} recorded interactions`,
      severity: input.totalActivities === 0 ? 'high' : 'medium',
    });
    totalScore += engagementScore;
  }

  // Factor 5: Email engagement rate (max 10 points)
  if (input.emailEngagementRate !== null && input.emailEngagementRate < 20) {
    const emailScore = input.emailEngagementRate < 10 ? 10 : 5;
    factors.push({
      name: 'Low Email Engagement',
      contribution: emailScore,
      description: `${input.emailEngagementRate}% email open rate`,
      severity: input.emailEngagementRate < 10 ? 'medium' : 'low',
    });
    totalScore += emailScore;
  }

  // Factor 6: Lifecycle stage risk adjustment
  const stageRiskAdjustments: Record<string, number> = {
    prospect: 5,
    lead: 3,
    test_drive: 0,
    negotiating: -5,
    purchased: -10,
    service_customer: -5,
    at_risk: 10,
    inactive: 15,
  };

  const stageAdjustment = stageRiskAdjustments[input.lifecycleStage] || 0;
  if (stageAdjustment !== 0) {
    totalScore += stageAdjustment;
  }

  // Ensure score is within bounds
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (totalScore >= 70) {
    level = 'critical';
  } else if (totalScore >= 50) {
    level = 'high';
  } else if (totalScore >= 30) {
    level = 'medium';
  } else {
    level = 'low';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (input.daysSinceLastContact === null || input.daysSinceLastContact > 30) {
    recommendations.push('Schedule a follow-up call or email');
  }

  if (input.hasVehicle && (input.daysSinceLastService === null || input.daysSinceLastService > 180)) {
    recommendations.push('Send service reminder');
  }

  if (input.vehicleAgeMonths !== null && input.vehicleAgeMonths > 36) {
    recommendations.push('Consider trade-in campaign targeting');
  }

  if (input.totalActivities < 3) {
    recommendations.push('Increase engagement with personalized outreach');
  }

  if (input.lifecycleStage === 'at_risk' || input.lifecycleStage === 'inactive') {
    recommendations.push('Prioritize win-back campaign');
  }

  return {
    score: Math.round(totalScore),
    level,
    factors,
    recommendations,
  };
}

/**
 * Batch calculate risk scores for multiple customers
 */
export async function batchCalculateRiskScores(
  customers: Array<{
    id: string;
    retentionProfile?: {
      lastContactDate?: Date | string | null;
      lastEngagementDate?: Date | string | null;
      lifecycleStage?: string;
    } | null;
    vehicles?: Array<{
      lastServiceDate?: Date | string | null;
      createdAt?: Date | string;
    }>;
    activities?: Array<any>;
  }>
): Map<string, RiskScoreResult> {
  const results = new Map<string, RiskScoreResult>();
  const now = Date.now();

  for (const customer of customers) {
    // Calculate days since last contact
    let daysSinceLastContact: number | null = null;
    if (customer.retentionProfile?.lastContactDate) {
      const lastContact = new Date(customer.retentionProfile.lastContactDate).getTime();
      daysSinceLastContact = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));
    }

    // Calculate days since last service
    let daysSinceLastService: number | null = null;
    let vehicleAgeMonths: number | null = null;

    if (customer.vehicles && customer.vehicles.length > 0) {
      const latestServiceDate = customer.vehicles
        .filter(v => v.lastServiceDate)
        .map(v => new Date(v.lastServiceDate!).getTime())
        .sort((a, b) => b - a)[0];

      if (latestServiceDate) {
        daysSinceLastService = Math.floor((now - latestServiceDate) / (1000 * 60 * 60 * 24));
      }

      // Calculate oldest vehicle age
      const oldestVehicleDate = customer.vehicles
        .filter(v => v.createdAt)
        .map(v => new Date(v.createdAt!).getTime())
        .sort((a, b) => a - b)[0];

      if (oldestVehicleDate) {
        vehicleAgeMonths = Math.floor((now - oldestVehicleDate) / (1000 * 60 * 60 * 24 * 30));
      }
    }

    const input: RiskScoreInput = {
      daysSinceLastContact,
      daysSinceLastService,
      vehicleAgeMonths,
      totalActivities: customer.activities?.length || 0,
      emailEngagementRate: null, // Would need to calculate from email logs
      lifecycleStage: customer.retentionProfile?.lifecycleStage || 'prospect',
      hasVehicle: (customer.vehicles?.length || 0) > 0,
      hasOpenEnquiry: false, // Would need to check enquiries
    };

    results.set(customer.id, calculateRiskScore(input));
  }

  return results;
}

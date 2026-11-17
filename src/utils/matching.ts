import {
  BroadField,
  GradeSystem,
  OnboardingProfile,
  ProgramOpportunity,
  StudyLevel,
} from '../types/program';

export interface GradeConversionResult {
  gpa4: number;
  label: string;
  tierMessage: string;
}

export function convertLocalGradeToGpa(
  system: GradeSystem | '',
  rawInput: string
): GradeConversionResult | null {
  if (!system || !rawInput.trim()) return null;
  const val = rawInput.trim().toUpperCase();

  if (system === 'KCSE Grade') {
    const kcseMap: Record<string, number> = {
      A: 4.0,
      'A-': 3.85,
      'B+': 3.6,
      B: 3.35,
      'B-': 3.1,
      'C+': 2.85,
      C: 2.5,
      'C-': 2.2,
    };
    const gpa4 = kcseMap[val] ?? 3.4;
    return {
      gpa4,
      label: `${gpa4.toFixed(2)} / 4.0 GPA`,
      tierMessage:
        gpa4 >= 3.5
          ? 'Eligible for Merit Scholarships & Work-Study'
          : gpa4 >= 3.0
          ? 'Eligible for Work-Study & Need-Based Aid'
          : 'Meets Associate / Pathway Entry Criteria',
    };
  }

  if (system === '4.0 GPA Scale') {
    const parsed = parseFloat(rawInput);
    if (!Number.isFinite(parsed)) return null;
    const gpa4 = Math.min(4.0, Math.max(1.0, parsed));
    return {
      gpa4,
      label: `${gpa4.toFixed(2)} / 4.0 GPA`,
      tierMessage:
        gpa4 >= 3.6
          ? 'Highly Competitive for Full-Ride & Merit Aid'
          : gpa4 >= 3.2
          ? 'Eligible for Merit & Work-Study'
          : 'Eligible for Need-Based & Pathway Programs',
    };
  }

  if (system === 'Percentage (%)') {
    const parsed = parseFloat(rawInput.replace('%', ''));
    if (!Number.isFinite(parsed)) return null;
    const pct = Math.min(100, Math.max(40, parsed));
    let gpa4 = 2.7;
    if (pct >= 90) gpa4 = 4.0;
    else if (pct >= 85) gpa4 = 3.8;
    else if (pct >= 80) gpa4 = 3.6;
    else if (pct >= 75) gpa4 = 3.35;
    else if (pct >= 70) gpa4 = 3.1;
    else if (pct >= 65) gpa4 = 2.85;
    return {
      gpa4,
      label: `${gpa4.toFixed(2)} / 4.0 GPA`,
      tierMessage:
        gpa4 >= 3.5
          ? 'Eligible for Merit & Work-Study'
          : 'Eligible for Work-Study & Co-op Tracks',
    };
  }

  if (val.includes('FIRST') || val.includes('1ST')) {
    return {
      gpa4: 3.9,
      label: '3.90 / 4.0 GPA',
      tierMessage: 'Eligible for Full Fellowships & Graduate Assistantships',
    };
  }
  if (val.includes('2:1') || val.includes('UPPER')) {
    return {
      gpa4: 3.55,
      label: '3.55 / 4.0 GPA',
      tierMessage: 'Eligible for Merit Scholarships & Work-Study',
    };
  }
  if (val.includes('2:2') || val.includes('LOWER')) {
    return {
      gpa4: 3.05,
      label: '3.05 / 4.0 GPA',
      tierMessage: 'Eligible for Taught Master’s & Work-Study',
    };
  }
  return {
    gpa4: 3.4,
    label: '3.40 / 4.0 GPA',
    tierMessage: 'Eligible for Merit & Work-Study',
  };
}

export interface TuitionSplitEstimate {
  grossAnnualUsd: number;
  institutionCovers80Usd: number;
  householdShare20Usd: number;
  estimatedWorkStudyOffsetUsd: number;
  netHouseholdAfterWorkUsd: number;
  basisLabel: string;
}

export function calculateTuitionSplitEstimate(
  degreeType: Exclude<StudyLevel, 'All Levels'> | '',
  broadFields: BroadField[],
  majors: string[],
  targetCountries: string[]
): TuitionSplitEstimate {
  // Base annual tuition & fees estimate (USD) by degree level
  let baseCost = 34000;
  if (degreeType === 'Associate / Diploma') baseCost = 22000;
  else if (degreeType === 'Undergraduate') baseCost = 36000;
  else if (degreeType === "Master's") baseCost = 40000;
  else if (degreeType === 'PhD') baseCost = 44000;

  // Field cost adjustment
  if (broadFields.includes('Health, Medicine & Life Sciences')) {
    baseCost += 6000;
  } else if (broadFields.includes('Engineering & Computer Science')) {
    baseCost += 3500;
  } else if (broadFields.includes('Business, Economics & Finance')) {
    baseCost += 2500;
  } else if (broadFields.includes('Arts, Humanities & Social Sciences')) {
    baseCost -= 3000;
  }

  // Destination cost adjustment (e.g., Germany has lower tuition)
  if (
    targetCountries.length > 0 &&
    targetCountries.every((c) => c === 'Germany' || c === 'France')
  ) {
    baseCost = Math.round(baseCost * 0.45);
  } else if (
    targetCountries.includes('Canada') &&
    !targetCountries.includes('United States')
  ) {
    baseCost = Math.round(baseCost * 0.85);
  }

  const institutionCovers80Usd = Math.round(baseCost * 0.8);
  const householdShare20Usd = baseCost - institutionCovers80Usd;
  // Typical part-time campus work-study (15 hrs/wk * 32 wks * $16/hr) = ~$7,680/yr
  const estimatedWorkStudyOffsetUsd = Math.min(householdShare20Usd, 6400);
  const netHouseholdAfterWorkUsd = Math.max(
    0,
    householdShare20Usd - estimatedWorkStudyOffsetUsd
  );

  const degreeLabel = degreeType || 'Selected Degree';
  const courseLabel = majors[0] ?? broadFields[0] ?? 'General Program';

  return {
    grossAnnualUsd: baseCost,
    institutionCovers80Usd,
    householdShare20Usd,
    estimatedWorkStudyOffsetUsd,
    netHouseholdAfterWorkUsd,
    basisLabel: `${degreeLabel} · ${courseLabel}`,
  };
}

export interface ScoredProgram {
  program: ProgramOpportunity;
  matchPercent: number;
  highlights: string[];
}

export function computePersonalizedMatches(
  programs: ProgramOpportunity[],
  profile: OnboardingProfile
): ScoredProgram[] {
  return programs
    .map((program) => {
      let score = 58;
      const highlights: string[] = [];

      if (profile.degreeType && program.studyLevels.includes(profile.degreeType)) {
        score += 14;
        highlights.push(`${profile.degreeType} eligible`);
      } else if (profile.degreeType) {
        score -= 18;
      }

      if (
        profile.targetCountries.includes('Open to All') ||
        profile.targetCountries.length === 0 ||
        profile.targetCountries.includes(program.country)
      ) {
        score += 10;
      } else {
        score -= 10;
      }

      const fieldMatch = profile.broadFields.some((f) => program.fields.includes(f));
      if (fieldMatch || profile.broadFields.length === 0) {
        score += 8;
        if (profile.majors.length > 0) {
          highlights.push(`Supports ${profile.majors[0]}`);
        }
      }

      if (profile.estimatedGpa4 > 0 && profile.estimatedGpa4 >= program.minGpa4Scale) {
        score += 6;
        highlights.push('GPA above cutoff');
      } else if (profile.estimatedGpa4 > 0) {
        score -= 8;
      }

      if (
        profile.educationLanguage === 'English' &&
        profile.passportCountry &&
        program.noIeltsCountries.includes(profile.passportCountry)
      ) {
        score += 4;
        highlights.push(`IELTS waived (${profile.passportCountry})`);
      }

      const wantsCombinedAidAndJob = profile.workStudyPreferences.includes(
        'Full Need-Based / Merit Scholarship + Part-Time On-Campus Job'
      );
      const wantsCoop = profile.workStudyPreferences.includes('Paid Co-op / Industry Internship');
      const wantsRA = profile.workStudyPreferences.includes(
        'Graduate Teaching / Research Assistantship'
      );

      if (
        (wantsCombinedAidAndJob &&
          (program.onCampusWorkAllowed || program.supportsFullCoverage)) ||
        (wantsCoop && program.coopEligible) ||
        (wantsRA && program.fundingType === 'Research Assistantship')
      ) {
        score += 5;
      }

      const clamped = Math.max(62, Math.min(98, score));
      return {
        program,
        matchPercent: clamped,
        highlights: highlights.slice(0, 3),
      };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent);
}

export function getDeadlineCountdownText(deadlineStr: string): string {
  const target = new Date(deadlineStr).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (Number.isNaN(diffDays)) return deadlineStr;
  if (diffDays <= 0) return 'Deadline passed';
  if (diffDays === 1) return '1 day left';
  return `${diffDays} days left`;
}

export function getDemonym(country: string): string {
  if (!country) return 'International';
  const map: Record<string, string> = {
    Kenya: 'Kenyan',
    Nigeria: 'Nigerian',
    India: 'Indian',
    Ghana: 'Ghanaian',
    Brazil: 'Brazilian',
    Vietnam: 'Vietnamese',
    Indonesia: 'Indonesian',
    Pakistan: 'Pakistani',
    Mexico: 'Mexican',
    Philippines: 'Filipino',
    Bangladesh: 'Bangladeshi',
    Egypt: 'Egyptian',
    'South Africa': 'South African',
    Uganda: 'Ugandan',
    Rwanda: 'Rwandan',
    Ethiopia: 'Ethiopian',
    Colombia: 'Colombian',
    Canada: 'Canadian',
    'United States': 'US',
    'United Kingdom': 'UK',
    Germany: 'German',
    France: 'French',
    Australia: 'Australian',
    Japan: 'Japanese',
    'South Korea': 'South Korean',
    China: 'Chinese',
    Malaysia: 'Malaysian',
    Nepal: 'Nepali',
    Morocco: 'Moroccan',
    Tanzania: 'Tanzanian',
    Zimbabwe: 'Zimbabwean',
    Zambia: 'Zambian',
  };
  return map[country] ?? `${country} Citizen`;
}

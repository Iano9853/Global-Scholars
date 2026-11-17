import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  GraduationCap,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  BROAD_FIELDS,
  COUNTRY_OPTIONS_WITH_FLAGS,
  MAJORS_BY_FIELD,
  SUGGESTED_MAJORS,
  WIZARD_TARGET_DESTINATIONS,
} from '../data/programs';
import {
  BroadField,
  GradeSystem,
  OnboardingProfile,
  StudyLevel,
  WorkStudyPreference,
} from '../types/program';
import {
  calculateTuitionSplitEstimate,
  convertLocalGradeToGpa,
} from '../utils/matching';

interface OnboardingWizardProps {
  initialProfile: OnboardingProfile;
  userName: string;
  isMatchingPhase: boolean;
  onSaveLater: (draft: OnboardingProfile) => void;
  onFinishWizard: (completed: OnboardingProfile, destination: 'dashboard' | 'vault') => void;
}

const DEGREE_CARDS: {
  value: Exclude<StudyLevel, 'All Levels'>;
  title: string;
  subtitle: string;
}[] = [
  {
    value: 'Associate / Diploma',
    title: 'Associate / Diploma',
    subtitle: '2-year college & co-op technical diplomas',
  },
  {
    value: 'Undergraduate',
    title: "Bachelor's Degree (Undergraduate)",
    subtitle: '4-year first degree with campus work-study & co-op',
  },
  {
    value: "Master's",
    title: "Master's Degree (Taught or Research)",
    subtitle: '1–2 year graduate study with RA/TA & Werkstudent roles',
  },
  {
    value: 'PhD',
    title: 'PhD / Doctorate',
    subtitle: 'Funded doctoral research fellowships & stipends',
  },
];

const INTAKE_WINDOWS = [
  'Fall 2026 (Aug/Sep)',
  'Spring 2027 (Jan/Feb)',
  'Fall 2027',
  'Flexible / Earliest Available',
];

const EDUCATION_LEVELS = [
  'High School / Secondary School (e.g., KCSE, WAEC, A-Levels, IB, CBSE)',
  "Undergraduate Bachelor's Degree",
  "Master's Degree",
];

const GRADE_SYSTEMS: GradeSystem[] = [
  'KCSE Grade',
  '4.0 GPA Scale',
  'Percentage (%)',
  'UK Class Honours',
];

const STANDARDIZED_TESTS = [
  'None yet',
  'SAT / ACT',
  'GRE / GMAT',
  'IELTS / TOEFL / Duolingo',
];

const WORK_STUDY_MODELS: { value: WorkStudyPreference; desc: string }[] = [
  {
    value: 'Full Need-Based / Merit Scholarship + Part-Time On-Campus Job',
    desc: 'Combines institutional tuition aid/merit grants with paid on-campus roles (library, IT desk, lab assistant up to 20 hrs/wk)',
  },
  {
    value: 'Paid Co-op / Industry Internship',
    desc: 'Alternating academic study terms with full-time paid industry placements (up to 40 hrs/wk)',
  },
  {
    value: 'Graduate Teaching / Research Assistantship',
    desc: 'Tuition remission plus monthly stipend for Master’s or PhD teaching/lab duties',
  },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialProfile,
  userName,
  isMatchingPhase,
  onSaveLater,
  onFinishWizard,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [draft, setDraft] = useState<OnboardingProfile>(initialProfile);
  const [countrySearch, setCountrySearch] = useState('');
  const [majorQuery, setMajorQuery] = useState('');
  const [stepError, setStepError] = useState('');

  const filteredPassportCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS_WITH_FLAGS;
    return COUNTRY_OPTIONS_WITH_FLAGS.filter((c) => c.name.toLowerCase().includes(q));
  }, [countrySearch]);

  const majorPool = useMemo(() => {
    if (draft.broadFields.length > 0) {
      return draft.broadFields.flatMap((field) => MAJORS_BY_FIELD[field]);
    }
    return SUGGESTED_MAJORS;
  }, [draft.broadFields]);

  const majorSuggestions = useMemo(() => {
    const q = majorQuery.trim().toLowerCase();
    return majorPool
      .filter((m) => !draft.majors.includes(m) && (!q || m.toLowerCase().includes(q)))
      .slice(0, 12);
  }, [majorPool, majorQuery, draft.majors]);

  const gradeConversion = useMemo(
    () => convertLocalGradeToGpa(draft.gradeSystem, draft.rawGrade),
    [draft.gradeSystem, draft.rawGrade]
  );

  const tuitionSplit = useMemo(
    () =>
      calculateTuitionSplitEstimate(
        draft.degreeType,
        draft.broadFields,
        draft.majors,
        draft.targetCountries
      ),
    [draft.degreeType, draft.broadFields, draft.majors, draft.targetCountries]
  );

  const toggleField = (field: BroadField) => {
    setStepError('');
    setDraft((prev) => {
      const exists = prev.broadFields.includes(field);
      return {
        ...prev,
        broadFields: exists
          ? prev.broadFields.filter((f) => f !== field)
          : [...prev.broadFields, field],
      };
    });
  };

  const addMajor = (major: string) => {
    const clean = major.trim();
    if (!clean || draft.majors.includes(clean) || draft.majors.length >= 3) return;
    setStepError('');
    setDraft((prev) => ({ ...prev, majors: [...prev.majors, clean] }));
    setMajorQuery('');
  };

  const removeMajor = (major: string) => {
    setDraft((prev) => ({ ...prev, majors: prev.majors.filter((m) => m !== major) }));
  };

  const toggleTest = (test: string) => {
    setDraft((prev) => {
      if (test === 'None yet') {
        return {
          ...prev,
          standardizedTests: prev.standardizedTests.includes('None yet') ? [] : ['None yet'],
        };
      }
      const withoutNone = prev.standardizedTests.filter((t) => t !== 'None yet');
      const exists = withoutNone.includes(test);
      const next = exists
        ? withoutNone.filter((t) => t !== test)
        : [...withoutNone, test];
      return { ...prev, standardizedTests: next };
    });
  };

  const toggleWorkPref = (pref: WorkStudyPreference) => {
    setStepError('');
    setDraft((prev) => {
      const exists = prev.workStudyPreferences.includes(pref);
      const next = exists
        ? prev.workStudyPreferences.filter((p) => p !== pref)
        : [...prev.workStudyPreferences, pref];
      return { ...prev, workStudyPreferences: next };
    });
  };

  const toggleTargetCountry = (country: string) => {
    setStepError('');
    setDraft((prev) => {
      if (country === 'Open to All') {
        return {
          ...prev,
          targetCountries: prev.targetCountries.includes('Open to All') ? [] : ['Open to All'],
        };
      }
      const withoutAll = prev.targetCountries.filter((c) => c !== 'Open to All');
      const exists = withoutAll.includes(country);
      const next = exists
        ? withoutAll.filter((c) => c !== country)
        : [...withoutAll, country];
      return { ...prev, targetCountries: next };
    });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!draft.passportCountry) {
        setStepError('Please select your passport country / citizenship.');
        return;
      }
      if (!draft.educationLanguage) {
        setStepError('Please select the primary language of your previous education.');
        return;
      }
    }
    if (step === 2) {
      if (!draft.degreeType) {
        setStepError('Please choose the degree type you are applying for.');
        return;
      }
      if (draft.broadFields.length === 0 && draft.majors.length === 0) {
        setStepError('Please select at least one faculty or add a specific course/major.');
        return;
      }
    }
    if (step === 3) {
      if (!draft.completedEducation) {
        setStepError('Please select your highest completed education level.');
        return;
      }
      if (!draft.gradeSystem || !draft.rawGrade.trim()) {
        setStepError('Please choose your grading system and enter your grade or GPA.');
        return;
      }
    }
    setStepError('');
    setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
  };

  const buildFinalProfile = (): OnboardingProfile => ({
    ...draft,
    estimatedGpa4: gradeConversion?.gpa4 ?? 0,
    budgetTier: `~$${tuitionSplit.householdShare20Usd.toLocaleString()} / yr (20% Household Share)`,
    onboardingCompleted: true,
  });

  const handleFinish = (destination: 'dashboard' | 'vault') => {
    if (draft.workStudyPreferences.length === 0) {
      setStepError('Please select at least one preferred work-study or scholarship model.');
      return;
    }
    if (draft.targetCountries.length === 0) {
      setStepError('Please choose at least one target study destination (or Open to All).');
      return;
    }
    setStepError('');
    onFinishWizard(buildFinalProfile(), destination);
  };

  if (isMatchingPhase) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-8 sm:p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-[#0C2340] text-[#E59E16] flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display font-extrabold text-[22px] sm:text-[24px] text-[#0C2340]">
            Your Personalized Matches Are Ready
          </h2>
          <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
            Checking visa work-hour rules, IELTS exemptions for{' '}
            <strong className="text-[#0C2340]">{draft.passportCountry}</strong>, and GPA
            equivalency ({gradeConversion?.label ?? 'Submitted'}) across verified
            universities...
          </p>
          <div className="mt-6 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#E59E16] rounded-full w-full transition-all duration-1000" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* Wizard Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[920px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0C2340] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="font-display font-bold text-[14px] sm:text-[15px] text-[#0C2340] whitespace-nowrap">
              ScholarWork Global
            </span>
          </div>

          <div className="text-[12.5px] sm:text-[13px] font-semibold text-[#0C2340] tabular-nums whitespace-nowrap">
            Step {step} of 4
          </div>

          <button
            type="button"
            onClick={() =>
              onSaveLater({
                ...draft,
                estimatedGpa4: gradeConversion?.gpa4 ?? 0,
              })
            }
            className="text-[12.5px] sm:text-[13px] font-semibold text-slate-600 hover:text-[#0C2340] cursor-pointer whitespace-nowrap"
          >
            Save &amp; finish later
          </button>
        </div>

        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-[#E59E16] transition-all duration-200"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </header>

      {/* Wizard Card */}
      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="text-[12px] font-semibold text-[#B46900]">
                  Step 1 · Citizenship &amp; Language Background
                </p>
                <h1 className="mt-1 font-display font-bold text-[22px] sm:text-[24px] text-[#0C2340]">
                  Welcome, {userName.split(' ')[0]}. Where are you applying from?
                </h1>
                <p className="mt-1.5 text-[14px] text-slate-600">
                  Determines legal student visa eligibility, domestic vs. international aid rules,
                  and English proficiency waivers.
                </p>
              </div>

              {/* Searchable Passport Country */}
              <div className="space-y-2">
                <label
                  htmlFor="passport-search"
                  className="block text-[13px] font-semibold text-[#0C2340]"
                >
                  Passport Country / Citizenship
                </label>
                <div className="relative">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    id="passport-search"
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Type to search your country..."
                    className="w-full h-10 pl-9 pr-3.5 rounded-lg border border-slate-300 text-[13px] text-[#0C2340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                  />
                </div>
                <select
                  aria-label="Select passport country"
                  value={draft.passportCountry}
                  onChange={(e) => {
                    const nextCountry = e.target.value;
                    setStepError('');
                    setDraft((prev) => ({
                      ...prev,
                      passportCountry: nextCountry,
                      residenceCountry:
                        !prev.residenceCountry || prev.residenceCountry === prev.passportCountry
                          ? nextCountry
                          : prev.residenceCountry,
                    }));
                  }}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-[14px] font-medium text-[#0C2340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                >
                  <option value="">Select your passport country...</option>
                  {filteredPassportCountries.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Country of Residence */}
              <div className="space-y-1.5">
                <label
                  htmlFor="residence-country"
                  className="block text-[13px] font-semibold text-[#0C2340]"
                >
                  Current Country of Residence
                </label>
                <select
                  id="residence-country"
                  value={draft.residenceCountry}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, residenceCountry: e.target.value }))
                  }
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-[14px] font-medium text-[#0C2340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                >
                  <option value="">Select your country of residence...</option>
                  {COUNTRY_OPTIONS_WITH_FLAGS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary Language */}
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#0C2340]">
                  Primary Language of Previous Education
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['English', 'French', 'Other'] as const).map((lang) => {
                    const active = draft.educationLanguage === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setStepError('');
                          setDraft((prev) => ({ ...prev, educationLanguage: lang }));
                        }}
                        className={`h-11 rounded-lg border text-[14px] font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0C2340] border-[#0C2340] text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
                {draft.educationLanguage === 'English' && (
                  <p className="text-[13px] text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      Unlocks &ldquo;No IELTS/TOEFL Required&rdquo; eligibility on qualifying
                      universities.
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-[12px] font-semibold text-[#B46900]">
                  Step 2 · Degree Type &amp; Intended Course of Study
                </p>
                <h1 className="mt-1 font-display font-bold text-[22px] sm:text-[24px] text-[#0C2340]">
                  What degree and course are you targeting?
                </h1>
                <p className="mt-1.5 text-[14px] text-slate-600">
                  Used to estimate tuition costs, match department bursaries, and check co-op
                  streams.
                </p>
              </div>

              {/* Degree Type Sought Cards */}
              <div className="space-y-2">
                <span className="block text-[13px] font-semibold text-[#0C2340]">
                  Degree Type Sought
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DEGREE_CARDS.map((card) => {
                    const selected = draft.degreeType === card.value;
                    return (
                      <button
                        key={card.value}
                        type="button"
                        onClick={() => {
                          setStepError('');
                          setDraft((prev) => ({ ...prev, degreeType: card.value }));
                        }}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-[#0C2340] bg-[#0C2340]/5 ring-1 ring-[#0C2340]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-[14px] text-[#0C2340]">
                            {card.title}
                          </span>
                          {selected && (
                            <Check className="w-4 h-4 text-[#0C2340] shrink-0" />
                          )}
                        </div>
                        <p className="mt-1 text-[12px] text-slate-500">{card.subtitle}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Broad Field / Faculty */}
              <div className="space-y-2">
                <span className="block text-[13px] font-semibold text-[#0C2340]">
                  Broad Field / Faculty (Select one or more to browse majors)
                </span>
                <div className="flex flex-wrap gap-2">
                  {BROAD_FIELDS.map((field) => {
                    const active = draft.broadFields.includes(field);
                    return (
                      <button
                        key={field}
                        type="button"
                        onClick={() => toggleField(field)}
                        className={`px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0C2340] border-[#0C2340] text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {field}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Course / Major Tag Input (65+ Courses + Any Custom Course) */}
              <div className="space-y-2">
                <label
                  htmlFor="major-input"
                  className="block text-[13px] font-semibold text-[#0C2340]"
                >
                  Specific Course / Major (Pick or type up to 3 courses)
                </label>

                {draft.majors.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {draft.majors.map((major) => (
                      <span
                        key={major}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-[13px] font-semibold text-[#0C2340]"
                      >
                        <span>{major}</span>
                        <button
                          type="button"
                          onClick={() => removeMajor(major)}
                          className="text-slate-500 hover:text-red-600 cursor-pointer"
                          aria-label={`Remove ${major}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    id="major-input"
                    type="text"
                    value={majorQuery}
                    disabled={draft.majors.length >= 3}
                    onChange={(e) => setMajorQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addMajor(majorQuery);
                      }
                    }}
                    placeholder={
                      draft.majors.length >= 3
                        ? 'Maximum 3 courses selected'
                        : 'Search 65+ courses or type your exact major and press Enter...'
                    }
                    className="flex-1 h-10 px-3.5 rounded-lg border border-slate-300 text-[13px] text-[#0C2340] disabled:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                  />
                  {majorQuery.trim() && draft.majors.length < 3 && (
                    <button
                      type="button"
                      onClick={() => addMajor(majorQuery)}
                      className="px-3.5 h-10 rounded-lg bg-[#0C2340] text-white text-[12.5px] font-semibold whitespace-nowrap cursor-pointer"
                    >
                      Add Course
                    </button>
                  )}
                </div>

                {draft.majors.length < 3 && majorSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {majorSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addMajor(suggestion)}
                        className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[12px] font-medium text-slate-700 cursor-pointer"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Preferred Intake Window */}
              <div className="space-y-2">
                <span className="block text-[13px] font-semibold text-[#0C2340]">
                  Preferred Intake Window
                </span>
                <div className="flex flex-wrap gap-2">
                  {INTAKE_WINDOWS.map((windowOpt) => {
                    const active = draft.intakeWindow === windowOpt;
                    return (
                      <button
                        key={windowOpt}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({ ...prev, intakeWindow: windowOpt }))
                        }
                        className={`px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0C2340] border-[#0C2340] text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {windowOpt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-[12px] font-semibold text-[#B46900]">
                  Step 3 · Academic Standing &amp; Grade Converter
                </p>
                <h1 className="mt-1 font-display font-bold text-[22px] sm:text-[24px] text-[#0C2340]">
                  What is your current academic standing?
                </h1>
                <p className="mt-1.5 text-[14px] text-slate-600">
                  Converts your local grading scale into US/Canadian GPA equivalency to highlight
                  scholarships you qualify for.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="completed-edu"
                  className="block text-[13px] font-semibold text-[#0C2340]"
                >
                  Highest Completed Education Level
                </label>
                <select
                  id="completed-edu"
                  value={draft.completedEducation}
                  onChange={(e) => {
                    setStepError('');
                    setDraft((prev) => ({ ...prev, completedEducation: e.target.value }));
                  }}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 bg-white text-[14px] text-[#0C2340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
                >
                  <option value="">Select completed education level...</option>
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="grade-system"
                      className="block text-[12px] font-semibold text-slate-600 mb-1"
                    >
                      Your Grading System
                    </label>
                    <select
                      id="grade-system"
                      value={draft.gradeSystem}
                      onChange={(e) => {
                        setStepError('');
                        setDraft((prev) => ({
                          ...prev,
                          gradeSystem: e.target.value as GradeSystem | '',
                        }));
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-[13px] font-medium text-[#0C2340]"
                    >
                      <option value="">Select grading system...</option>
                      {GRADE_SYSTEMS.map((sys) => (
                        <option key={sys} value={sys}>
                          {sys}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="raw-grade"
                      className="block text-[12px] font-semibold text-slate-600 mb-1"
                    >
                      Your Score / Grade
                    </label>
                    <input
                      id="raw-grade"
                      type="text"
                      value={draft.rawGrade}
                      onChange={(e) => {
                        setStepError('');
                        setDraft((prev) => ({ ...prev, rawGrade: e.target.value }));
                      }}
                      placeholder="Enter your actual grade (e.g., B+, 3.6, 85)"
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-[14px] font-semibold text-[#0C2340]"
                    />
                  </div>
                </div>

                {gradeConversion && (
                  <div className="px-3.5 py-2.5 rounded-lg bg-white border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-[13px]">
                    <span className="font-semibold text-[#0C2340] tabular-nums">
                      Estimated US Equivalent: {gradeConversion.label}
                    </span>
                    <span className="font-medium text-emerald-700">
                      {gradeConversion.tierMessage}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="block text-[13px] font-semibold text-[#0C2340]">
                  Standardized Tests Taken (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STANDARDIZED_TESTS.map((test) => {
                    const checked = draft.standardizedTests.includes(test);
                    return (
                      <label
                        key={test}
                        className={`px-3.5 py-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer text-[13px] font-medium ${
                          checked
                            ? 'border-[#0C2340] bg-[#0C2340]/5 text-[#0C2340]'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTest(test)}
                          className="w-4 h-4 accent-[#0C2340]"
                        />
                        <span>{test}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <p className="text-[12px] font-semibold text-[#B46900]">
                  Step 4 · Work-Study Funding &amp; 80% / 20% Cost Breakdown
                </p>
                <h1 className="mt-1 font-display font-bold text-[22px] sm:text-[24px] text-[#0C2340]">
                  How would you like to fund your studies?
                </h1>
                <p className="mt-1.5 text-[14px] text-slate-600">
                  Review your estimated annual program cost with an 80% institutional coverage
                  model and select your preferred funding streams.
                </p>
              </div>

              {/* Combined Funding Models */}
              <div className="space-y-2">
                <span className="block text-[13px] font-semibold text-[#0C2340]">
                  Preferred Work-Study &amp; Funding Model (Select all that fit)
                </span>
                <div className="space-y-2.5">
                  {WORK_STUDY_MODELS.map((item) => {
                    const selected = draft.workStudyPreferences.includes(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => toggleWorkPref(item.value)}
                        className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-[#0C2340] bg-[#0C2340]/5 ring-1 ring-[#0C2340]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-display font-bold text-[14px] text-[#0C2340]">
                            {item.value}
                          </span>
                          {selected && <Check className="w-4 h-4 text-[#0C2340] shrink-0" />}
                        </div>
                        <p className="mt-1 text-[12.5px] text-slate-500 leading-snug">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Study Destinations */}
              <div className="space-y-2">
                <span className="block text-[13px] font-semibold text-[#0C2340]">
                  Target Study Destinations
                </span>
                <div className="flex flex-wrap gap-2">
                  {WIZARD_TARGET_DESTINATIONS.map((country) => {
                    const active = draft.targetCountries.includes(country);
                    return (
                      <button
                        key={country}
                        type="button"
                        onClick={() => toggleTargetCountry(country)}
                        className={`px-3.5 py-2 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0C2340] border-[#0C2340] text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {country}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Computed 80% Institution / 20% Student Household Contribution */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#0C2340] text-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-semibold text-[#E59E16]">
                      Computed Annual Out-of-Pocket Estimate
                    </p>
                    <p className="text-[13px] text-slate-300 mt-0.5">{tuitionSplit.basisLabel}</p>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="text-[12px] text-slate-300 block">
                      Estimated Total Tuition &amp; Fees
                    </span>
                    <span className="font-mono font-bold text-[16px]">
                      ${tuitionSplit.grossAnnualUsd.toLocaleString()} / yr
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/15">
                  <div className="p-3 rounded-lg bg-white/10">
                    <span className="text-[12px] text-slate-300 block">
                      School Pays (80% Institutional Aid)
                    </span>
                    <span className="mt-0.5 block font-display font-bold text-[18px] text-emerald-400 tabular-nums">
                      ${tuitionSplit.institutionCovers80Usd.toLocaleString()} / yr
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/10">
                    <span className="text-[12px] text-slate-300 block">
                      Student Household Share (Remaining 20%)
                    </span>
                    <span className="mt-0.5 block font-display font-bold text-[18px] text-[#E59E16] tabular-nums">
                      ${tuitionSplit.householdShare20Usd.toLocaleString()} / yr
                    </span>
                  </div>
                </div>

                <p className="text-[12.5px] text-slate-300 leading-relaxed tabular-nums">
                  With part-time campus work-study (~$
                  {tuitionSplit.estimatedWorkStudyOffsetUsd.toLocaleString()}/yr), remaining
                  net household out-of-pocket drops to{' '}
                  <strong className="text-white">
                    ${tuitionSplit.netHouseholdAfterWorkUsd.toLocaleString()} / yr
                  </strong>
                  .
                </p>
              </div>

              {/* Readiness Check */}
              <div className="p-4 rounded-xl bg-[#F4F6F9] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[14px] text-[#0C2340]">
                    Document Readiness Check
                  </p>
                  <p className="text-[12.5px] text-slate-600">
                    Do you already have your transcripts or CV ready to upload?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, hasDocsReady: !prev.hasDocsReady }))
                  }
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold border transition-colors shrink-0 cursor-pointer ${
                    draft.hasDocsReady
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  {draft.hasDocsReady ? 'Yes, Ready to Upload' : 'Not Yet'}
                </button>
              </div>
            </div>
          )}

          {stepError && (
            <div className="mt-5 px-3.5 py-2.5 rounded-lg bg-[#FCE8E6] border border-red-200 text-[13px] text-[#8A1C17] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{stepError}</span>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => {
                  setStepError('');
                  setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
                }}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-[13.5px] font-semibold text-[#0C2340] hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-lg bg-[#0C2340] hover:bg-[#16365E] text-white font-display font-bold text-[14px] inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {draft.hasDocsReady && (
                  <button
                    type="button"
                    onClick={() => handleFinish('vault')}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#0C2340] text-[13.5px] font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Upload Documents to Vault</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleFinish('dashboard')}
                  className="px-6 py-2.5 rounded-lg bg-[#E59E16] hover:bg-[#D48E0D] text-[#0C2340] font-display font-bold text-[14px] inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Finish Setup &amp; View Matches</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

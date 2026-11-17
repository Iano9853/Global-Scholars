import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Globe2,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';
import { COUNTRY_OPTIONS_WITH_FLAGS, PROGRAMS_DATA } from '../data/programs';
import { ActiveTab, StudyLevel } from '../types/program';
import { calculateTuitionSplitEstimate } from '../utils/matching';

interface HowItWorksViewProps {
  onNavigate: (tab: ActiveTab) => void;
  userCountry?: string;
}

const STEPS = [
  {
    number: '01.',
    title: 'Match by Citizenship & Visa Eligibility',
    description:
      'Filter opportunities specifically open to non-citizen applicants. Many university financial aid and federal work-study portals default to domestic students—we surface verified international pathways.',
    icon: Globe2,
  },
  {
    number: '02.',
    title: 'Verify Official .edu Work & Aid Policies',
    description:
      'Every listing links institutional aid grants with legal campus work-hour limits (such as F-1 20 hrs/wk, Canadian Study Permit Co-op, or German Werkstudent §16b rules).',
    icon: ShieldCheck,
  },
  {
    number: '03.',
    title: 'Identify English-Medium Waivers',
    description:
      'Check automatically whether your home country secondary or bachelor curriculum qualifies for an IELTS/TOEFL waiver via an official Medium of Instruction letter.',
    icon: CheckCircle2,
  },
  {
    number: '04.',
    title: 'Confirm Requirements & Receive Official Outreach',
    description:
      'Once you review a university’s criteria and tick the requirements acknowledgement checkbox, your selection is logged and a confirmation email is dispatched for admissions outreach.',
    icon: FileCheck2,
  },
];

const FAQS = [
  {
    q: 'How does the 80% / 20% financial split work?',
    a: 'Partner aid packages target covering 80% of annual tuition and mandatory fees through institutional scholarships or assistantships, leaving a 20% household share that can often be offset further via part-time campus work-study.',
  },
  {
    q: 'Are any documents or credentials pre-filled for new accounts?',
    a: 'No. Every newly registered student starts with an empty Document Vault and fresh onboarding selections so your record stays completely accurate and private.',
  },
  {
    q: 'Can I log in if I have not created an account yet?',
    a: 'No. For account security, both email/password and Google login verify that you have an active registered profile before granting access.',
  },
  {
    q: 'What happens after I tick "I have read all requirements" on a university?',
    a: 'A confirmation pop-up confirms your selection, your status updates to "Official Outreach Requested", and a confirmation email is sent directly to your registered address so an official from that school can reach out.',
  },
];

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onNavigate, userCountry }) => {
  const [waiverCountry, setWaiverCountry] = useState(userCountry || 'Kenya');
  const [instructionLang, setInstructionLang] = useState<'English' | 'Other'>('English');
  const [explainerDegree, setExplainerDegree] =
    useState<Exclude<StudyLevel, 'All Levels'>>('Undergraduate');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const waiverMatchingSchools = useMemo(() => {
    if (instructionLang !== 'English') return [];
    return PROGRAMS_DATA.filter((p) => p.noIeltsCountries.includes(waiverCountry));
  }, [waiverCountry, instructionLang]);

  const sampleSplit = useMemo(
    () => calculateTuitionSplitEstimate(explainerDegree, [], [], []),
    [explainerDegree]
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="max-w-2xl">
        <h1 className="font-display font-extrabold text-[28px] sm:text-[34px] text-[#0C2340] tracking-tight">
          How ScholarWork Global Works
        </h1>
        <p className="mt-2.5 text-[15px] text-slate-600 leading-relaxed">
          Built to give international applicants transparent, verifiable numbers on tuition
          coverage, legal part-time work caps, and application readiness before you pay an
          application fee.
        </p>
      </div>

      {/* 4 Core Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[14px] font-semibold text-[#B46900]">
                    {step.number}
                  </span>
                  <Icon className="w-5 h-5 text-[#0C2340]" aria-hidden="true" />
                </div>
                <h2 className="mt-3 font-display font-bold text-[18px] text-[#0C2340]">
                  {step.title}
                </h2>
                <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Tools Row: IELTS Waiver Checker + 80/20 Explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive IELTS Waiver Checker */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-display font-bold text-[18px] text-[#0C2340]">
            Instant IELTS Waiver Checker
          </h2>
          <p className="text-[13px] text-slate-600">
            Check which verified institutions waive IELTS/TOEFL based on your citizenship and prior
            language of instruction.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="waiver-country"
                className="block text-[12px] font-semibold text-slate-600 mb-1"
              >
                Passport Country
              </label>
              <select
                id="waiver-country"
                value={waiverCountry}
                onChange={(e) => setWaiverCountry(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-[13px] text-[#0C2340]"
              >
                {COUNTRY_OPTIONS_WITH_FLAGS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="waiver-lang"
                className="block text-[12px] font-semibold text-slate-600 mb-1"
              >
                School Instruction Language
              </label>
              <select
                id="waiver-lang"
                value={instructionLang}
                onChange={(e) => setInstructionLang(e.target.value as 'English' | 'Other')}
                className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-[13px] text-[#0C2340]"
              >
                <option value="English">English Medium (MOI)</option>
                <option value="Other">Non-English Medium</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F6F9] space-y-2">
            {instructionLang !== 'English' ? (
              <p className="text-[13px] text-slate-600">
                An official IELTS, TOEFL iBT, or Duolingo English score will be required by most
                institutions when prior schooling was not taught in English.
              </p>
            ) : waiverMatchingSchools.length > 0 ? (
              <>
                <p className="text-[13px] font-semibold text-emerald-700">
                  {waiverMatchingSchools.length} verified universities offer an English-medium
                  waiver for {waiverCountry}:
                </p>
                <p className="text-[12.5px] text-slate-700 leading-relaxed">
                  {waiverMatchingSchools.map((s) => s.university).join(', ')}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-slate-600">
                Standard IELTS/TOEFL scores are generally recommended for {waiverCountry}, though
                individual admissions officers may accept an official MOI letter upon request.
              </p>
            )}
          </div>
        </section>

        {/* Interactive 80% / 20% Cost Model Explainer */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-[18px] text-[#0C2340]">
              80% / 20% Aid Split Explainer
            </h2>
            <select
              value={explainerDegree}
              onChange={(e) =>
                setExplainerDegree(e.target.value as Exclude<StudyLevel, 'All Levels'>)
              }
              aria-label="Degree level for 80/20 tuition preview"
              className="h-9 px-2.5 rounded-md border border-slate-300 bg-white text-[12.5px] font-semibold text-[#0C2340]"
            >
              <option value="Associate / Diploma">Diploma</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Master's">Master&apos;s</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          <p className="text-[13px] text-slate-600">
            See how an 80% institutional scholarship combines with part-time on-campus work-study.
          </p>

          <div className="p-4 rounded-lg bg-[#F4F6F9] space-y-2 text-[13px] tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-600">Estimated Gross Tuition</span>
              <span className="font-mono font-semibold text-[#0C2340]">
                ${sampleSplit.grossAnnualUsd.toLocaleString()}/yr
              </span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>University Covers (80%)</span>
              <span className="font-mono font-semibold">
                -${sampleSplit.institutionCovers80Usd.toLocaleString()}/yr
              </span>
            </div>
            <div className="flex justify-between font-semibold text-[#0C2340] pt-2 border-t border-slate-200">
              <span>Household 20% Responsibility</span>
              <span className="font-mono">${sampleSplit.householdShare20Usd.toLocaleString()}/yr</span>
            </div>
            <div className="flex justify-between text-[#1D4E89]">
              <span>Campus Work-Study Offset</span>
              <span className="font-mono">
                -${sampleSplit.estimatedWorkStudyOffsetUsd.toLocaleString()}/yr
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Official Outreach Timeline & Verified Domains */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MailCheck className="w-5 h-5 text-emerald-700" aria-hidden="true" />
          <h2 className="font-display font-bold text-[18px] text-[#0C2340]">
            What Happens After You Select a School
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13.5px]">
          <div className="p-4 rounded-lg bg-[#F4F6F9] space-y-1">
            <div className="font-mono text-[12px] font-bold text-[#B46900]">Step A</div>
            <div className="font-semibold text-[#0C2340]">Review &amp; Tick Requirements</div>
            <p className="text-slate-600 text-[13px]">
              Confirm you meet the visa, GPA, and language rules listed on your preferred school.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#F4F6F9] space-y-1">
            <div className="font-mono text-[12px] font-bold text-[#B46900]">Step B</div>
            <div className="font-semibold text-[#0C2340]">Instant Confirmation &amp; Email</div>
            <p className="text-slate-600 text-[13px]">
              A confirmation pop-up appears and dispatches a Reference ID email directly to you.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#F4F6F9] space-y-1">
            <div className="font-mono text-[12px] font-bold text-[#B46900]">Step C</div>
            <div className="font-semibold text-[#0C2340]">Admissions Official Follow-Up</div>
            <p className="text-slate-600 text-[13px]">
              An advisor from the institution reaches out shortly to learn more about your goals.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="space-y-3">
        <h2 className="font-display font-bold text-[20px] text-[#0C2340]">
          Frequently Asked Questions
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {FAQS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-display font-semibold text-[15px] text-[#0C2340]">
                    {item.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-[13.5px] text-slate-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="bg-[#0C2340] rounded-xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h2 className="font-display font-bold text-[20px]">
            Ready to build your shortlisted work-study plan?
          </h2>
          <p className="mt-1 text-[14px] text-slate-300">
            Browse verified scholarships and paid co-ops, compare visa work rules, or open Document
            Vault.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('visa-guides')}
            className="px-4 py-2.5 rounded-md border border-white/25 hover:bg-white/10 text-white text-[13.5px] font-semibold cursor-pointer"
          >
            Visa &amp; Work Guides
          </button>
          <button
            type="button"
            onClick={() => onNavigate('browse')}
            className="px-5 py-2.5 rounded-md bg-[#E59E16] hover:bg-[#D48E0D] text-[#0C2340] font-display font-bold text-[14px] inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Browse Programs</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

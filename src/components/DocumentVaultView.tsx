import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FilePlus2,
  FileText,
  Lock,
  MailCheck,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { ApplicationSubmission, ProgramOpportunity, VaultDocument } from '../types/program';
import { UniversityCrest } from './UniversityCrest';

interface DocumentVaultViewProps {
  isAuthenticated: boolean;
  userName?: string;
  userEmail?: string;
  savedPrograms: ProgramOpportunity[];
  applications: ApplicationSubmission[];
  documents: VaultDocument[];
  onCycleDocStatus: (doc: VaultDocument) => void;
  onAddDocument: (payload: {
    title: string;
    category: VaultDocument['category'];
    status: VaultDocument['status'];
    notes: string;
    fileName?: string;
    fileSizeBytes?: number;
  }) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  onRemoveSaved: (programId: string) => void;
  onViewRequirements: (program: ProgramOpportunity) => void;
  onBrowsePrograms: () => void;
  onPromptSignUp: () => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type CategoryFilter = 'All' | VaultDocument['category'];

const CATEGORIES: CategoryFilter[] = [
  'All',
  'Academic',
  'Financial',
  'Language',
  'Identity',
  'Work Authorization',
];

function guessCategory(docTitle: string): VaultDocument['category'] {
  const lower = docTitle.toLowerCase();
  if (lower.includes('passport') || lower.includes('id')) return 'Identity';
  if (lower.includes('financial') || lower.includes('aid')) return 'Financial';
  if (lower.includes('ielts') || lower.includes('toefl') || lower.includes('waiver'))
    return 'Language';
  if (lower.includes('work') || lower.includes('permit')) return 'Work Authorization';
  return 'Academic';
}

export const DocumentVaultView: React.FC<DocumentVaultViewProps> = ({
  isAuthenticated,
  userName,
  userEmail,
  savedPrograms,
  applications,
  documents,
  onCycleDocStatus,
  onAddDocument,
  onDeleteDocument,
  onRemoveSaved,
  onViewRequirements,
  onBrowsePrograms,
  onPromptSignUp,
}) => {
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<VaultDocument['category']>('Academic');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSavingDoc, setIsSavingDoc] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [docSearch, setDocSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const readyCount = documents.filter((d) => d.status === 'Ready').length;
  const progressPct = documents.length > 0 ? Math.round((readyCount / documents.length) * 100) : 0;

  const filteredDocuments = useMemo(() => {
    const q = docSearch.trim().toLowerCase();
    return documents.filter((d) => {
      if (categoryFilter !== 'All' && d.category !== categoryFilter) return false;
      if (
        q &&
        !d.title.toLowerCase().includes(q) &&
        !d.notes.toLowerCase().includes(q) &&
        !(d.fileName ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [documents, categoryFilter, docSearch]);

  // Gap Analyzer: collect requiredDocuments from saved + applied programs not yet in documents
  const missingRecommendedDocs = useMemo(() => {
    const requiredSet = new Set<string>();
    for (const p of savedPrograms) {
      for (const req of p.requiredDocuments) requiredSet.add(req);
    }
    const missing: string[] = [];
    requiredSet.forEach((reqDoc) => {
      const firstWord = reqDoc.toLowerCase().split(' ')[0];
      const exists = documents.some(
        (d) =>
          d.title.toLowerCase().includes(firstWord) ||
          reqDoc.toLowerCase().includes(d.title.toLowerCase())
      );
      if (!exists) missing.push(reqDoc);
    });
    return missing;
  }, [savedPrograms, documents]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDocTitle.trim() || attachedFile?.name.replace(/\.[^/.]+$/, '') || '';
    if (!trimmed) return;
    setIsSavingDoc(true);
    try {
      await onAddDocument({
        title: trimmed,
        category: newDocCategory,
        status: attachedFile ? 'Ready' : 'In Progress',
        notes: newDocNotes.trim() || 'Added by applicant.',
        fileName: attachedFile?.name,
        fileSizeBytes: attachedFile?.size,
      });
      setNewDocTitle('');
      setNewDocNotes('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleQuickAddGap = async (docName: string) => {
    await onAddDocument({
      title: docName,
      category: guessCategory(docName),
      status: 'In Progress',
      notes: 'Added from saved university requirement gap check.',
    });
  };

  const handleExportSummary = () => {
    const lines = [
      'SCHOLARWORK GLOBAL — APPLICATION PACKET SUMMARY',
      `Applicant: ${userName || 'Student'} (${userEmail || ''})`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      `SELECTED SCHOOLS & OFFICIAL OUTREACH (${applications.length})`,
      ...(applications.length
        ? applications.map((a) => `- ${a.university}: ${a.status} (Email: ${a.studentEmail})`)
        : ['- None selected yet']),
      '',
      `SAVED PROGRAMS (${savedPrograms.length})`,
      ...(savedPrograms.length
        ? savedPrograms.map((p) => `- ${p.programTitle} | Deadline: ${p.deadline}`)
        : ['- None saved yet']),
      '',
      `DOCUMENT VAULT (${readyCount}/${documents.length} Ready)`,
      ...(documents.length
        ? documents.map(
            (d) =>
              `- [${d.status}] ${d.title} (${d.category})${d.fileName ? ` — File: ${d.fileName}` : ''}`
          )
        : ['- No documents added yet']),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scholarwork-packet-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#0C2340]/8 text-[#0C2340] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="font-display font-bold text-[24px] text-[#0C2340]">
            Your Personal Document Vault
          </h1>
          <p className="text-[14.5px] text-slate-600 max-w-md mx-auto leading-relaxed">
            Create a free verified student account or log in to store your own transcripts,
            passport, CV, and saved program deadlines securely. Nothing is pre-filled.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onPromptSignUp}
              className="px-5 py-2.5 rounded-lg bg-[#E59E16] hover:bg-[#D48E0D] text-[#0C2340] font-display font-bold text-[14px] cursor-pointer"
            >
              Sign Up Free
            </button>
            <button
              type="button"
              onClick={onBrowsePrograms}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-[#0C2340] text-[14px] font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Browse Programs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] text-[#0C2340] tracking-tight">
            Application Tracker &amp; Document Vault
          </h1>
          <p className="mt-1.5 text-[14.5px] sm:text-[15px] text-slate-600">
            Track the schools you selected, monitor saved deadlines, and attach your own admission
            and visa documents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 shrink-0">
            <div className="text-[11.5px] font-medium text-slate-500">Packet Readiness</div>
            <div className="mt-0.5 flex items-baseline gap-2 tabular-nums">
              <span className="font-display font-bold text-[18px] text-[#0C2340]">
                {readyCount} / {documents.length}
              </span>
              <span className="text-[12.5px] font-medium text-emerald-700">
                ({progressPct}% Ready)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportSummary}
            className="h-11 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#0C2340] text-[13px] font-semibold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Selected Schools & Official Outreach Tracker */}
      {applications.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display font-bold text-[18px] text-[#0C2340]">
            Selected Schools &amp; Official Outreach ({applications.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => (
              <div
                key={app.programId}
                className="bg-white rounded-xl border border-emerald-200 p-4 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
                    <MailCheck className="w-4 h-4" aria-hidden="true" />
                    <span>{app.status}</span>
                  </div>
                  <h3 className="font-display font-bold text-[15px] text-[#0C2340]">
                    {app.university}
                  </h3>
                  <p className="text-[12.5px] text-slate-600">{app.programTitle}</p>
                  <p className="text-[12px] text-slate-500">
                    Confirmation address: {app.studentEmail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Saved Programs Tracker */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display font-bold text-[18px] text-[#0C2340]">
            Saved Programs ({savedPrograms.length})
          </h2>
          <button
            type="button"
            onClick={onBrowsePrograms}
            className="text-[13px] font-semibold text-[#1D4E89] hover:underline cursor-pointer"
          >
            + Browse Programs
          </button>
        </div>

        {savedPrograms.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Bookmark className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
            <h3 className="mt-3 font-display font-bold text-[16px] text-[#0C2340]">
              No programs saved to your tracker yet
            </h3>
            <p className="mt-1 text-[14px] text-slate-600 max-w-md mx-auto">
              Click &ldquo;Save to Tracker&rdquo; on any scholarship or work-study opportunity to
              track its deadline and requirements here.
            </p>
            <button
              type="button"
              onClick={onBrowsePrograms}
              className="mt-4 px-5 py-2.5 rounded-md bg-[#0C2340] hover:bg-[#16365E] text-white text-[13px] font-semibold cursor-pointer"
            >
              Browse Verified Programs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPrograms.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <UniversityCrest theme={program.crestTheme} university={program.university} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-[15px] text-[#0C2340] leading-snug">
                      {program.programTitle}
                    </h3>
                    <p className="mt-1 text-[13px] text-slate-600">
                      {program.hourlyPayRange} {program.aidSummary}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-800 tabular-nums">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Deadline: {program.deadline}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onRemoveSaved(program.id)}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Remove</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewRequirements(program)}
                    className="px-3.5 py-1.5 rounded-md bg-[#0C2340] hover:bg-[#16365E] text-white text-[12px] font-semibold cursor-pointer"
                  >
                    View Checklist
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Missing Required Docs Gap Analyzer (Derived purely from user's saved schools) */}
      {missingRecommendedDocs.length > 0 && (
        <section className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-3">
          <div>
            <h2 className="font-display font-bold text-[15px] text-[#0C2340]">
              Missing Documents Needed by Your Saved Schools
            </h2>
            <p className="text-[12.5px] text-slate-600">
              Click any item below to log it into your vault as &ldquo;In Progress&rdquo; before
              attaching the file.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingRecommendedDocs.map((req) => (
              <button
                key={req}
                type="button"
                onClick={() => handleQuickAddGap(req)}
                className="px-3 py-1.5 rounded-md bg-white border border-amber-300 hover:bg-amber-100 text-[12.5px] font-medium text-[#0C2340] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                <span>{req}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Document Vault (Starts Empty Until User Uploads or Registers Own Documents) */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-[18px] text-[#0C2340]">
              Your Uploaded &amp; Registered Documents ({documents.length})
            </h2>
            <p className="text-[13px] text-slate-500">
              Attach files from your device or add items you are preparing. Nothing is pre-populated.
            </p>
          </div>

          {documents.length > 0 && (
            <div className="relative w-full md:w-64">
              <Search
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search vault documents..."
                className="w-full h-9 pl-8 pr-3 rounded-md border border-slate-200 bg-white text-[13px] text-[#0C2340]"
              />
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold border cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#0C2340] border-[#0C2340] text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {documents.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
              <h3 className="mt-3 font-display font-bold text-[16px] text-[#0C2340]">
                Your Document Vault is empty
              </h3>
              <p className="mt-1 text-[13.5px] text-slate-600 max-w-md mx-auto">
                Use the form below to attach your actual documents (Passport, Academic
                Transcripts, CV, Statement of Purpose) or log items you are preparing.
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-8 text-center text-[13.5px] text-slate-500">
              No uploaded documents match that filter or search query.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                      <span className="font-semibold text-[14px] text-[#0C2340]">
                        {doc.title}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-[12px] font-medium text-slate-500">
                        {doc.category}
                      </span>
                      {doc.fileName && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="font-mono text-[12px] text-[#1D4E89]">
                            {doc.fileName}{' '}
                            {doc.fileSizeBytes ? `(${formatFileSize(doc.fileSizeBytes)})` : ''}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-slate-600">{doc.notes}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => onCycleDocStatus(doc)}
                      className={`px-3.5 py-1.5 rounded-md text-[12px] font-semibold border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                        doc.status === 'Ready'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                          : doc.status === 'In Progress'
                          ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {doc.status === 'Ready' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {doc.status === 'In Progress' && <Clock className="w-3.5 h-3.5" />}
                      {doc.status === 'Missing' && <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{doc.status}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                      aria-label={`Delete ${doc.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Upload Document Form */}
          <form
            onSubmit={handleAdd}
            className="bg-[#F8FAFC] border-t border-slate-200 p-4 sm:p-6 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_auto] gap-3">
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Document title (e.g., Official High School Transcript)"
                className="h-10 px-3.5 rounded-md border border-slate-300 bg-white text-[13px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
              />
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value as VaultDocument['category'])}
                className="h-10 px-3 rounded-md border border-slate-300 bg-white text-[13px] text-[#0C2340] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
              >
                <option value="Academic">Academic</option>
                <option value="Financial">Financial</option>
                <option value="Language">Language</option>
                <option value="Identity">Identity</option>
                <option value="Work Authorization">Work Authorization</option>
              </select>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="vault-file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setAttachedFile(file);
                    if (file && !newDocTitle.trim()) {
                      setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
                    }
                  }}
                  className="sr-only"
                />
                <label
                  htmlFor="vault-file-upload"
                  className="h-10 px-3.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-[13px] font-medium text-[#0C2340] inline-flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto whitespace-nowrap"
                >
                  <Upload className="w-4 h-4 text-slate-500" aria-hidden="true" />
                  <span>{attachedFile ? attachedFile.name : 'Attach File (Optional)'}</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newDocNotes}
                onChange={(e) => setNewDocNotes(e.target.value)}
                placeholder="Optional note (e.g., Certified by registrar, expires 2029)"
                className="flex-1 h-10 px-3.5 rounded-md border border-slate-300 bg-white text-[13px] text-[#0C2340] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C2340]"
              />
              <button
                type="submit"
                disabled={isSavingDoc || (!newDocTitle.trim() && !attachedFile)}
                className="h-10 px-5 rounded-md bg-[#0C2340] hover:bg-[#16365E] disabled:opacity-50 text-white text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" aria-hidden="true" />
                <span>{isSavingDoc ? 'Saving...' : 'Save to Vault'}</span>
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

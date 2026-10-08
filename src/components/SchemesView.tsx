import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Landmark,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  Calculator,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  FileText,
  Check,
  X,
  RefreshCw,
  Edit3,
  Archive,
  History,
  Info,
  BadgeCheck,
} from 'lucide-react';
import { LanguageCode } from '../types';
import { formatCurrency } from '../utils/financeEngine';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface SchemesViewProps {
  language: LanguageCode;
}

export interface SchemeItem {
  id: string;
  name: string;
  fullName: string;
  nameTa: string;
  fullNameTa?: string;
  governmentLevel: 'STATE' | 'CENTRAL';
  department: string;
  departmentTa?: string;
  category: string;
  description: string;
  descriptionTa: string;
  beneficiaryTypes: string[];
  businessTypes: string[];
  projectCostMin: number;
  projectCostMax: number;
  subsidyPercentage: number;
  subsidyMaximum: number;
  interestSubvention: number;
  ageRules: {
    min: number;
    maxGeneral: number;
    maxSpecial: number;
    description: string;
  };
  educationRules: {
    minimum: string;
    description: string;
  };
  residencyRules: {
    state: string;
    minYears: number;
    description: string;
  };
  incomeRules: {
    maxAnnualFamilyIncome: number | null;
    description: string;
  };
  sectorRules: {
    allowedSectors: string[];
    excludedSectors: string[];
    description: string;
  };
  specialCategoryRules: {
    promoterContributionGeneral: number;
    promoterContributionSpecial: number;
    additionalBenefits: string;
  };
  applicationUrl: string;
  officialSourceUrl: string;
  officialDocumentUrl: string;
  sourceAuthority: string;
  lastVerifiedAt: string;
  status: string;
  isStale: boolean;
  staleWarning: string | null;
  sources?: Array<{
    id?: string;
    authority: string;
    title: string;
    documentUrl: string;
    portalUrl: string;
    version: string;
    verifiedAt: string;
    status: string;
    notes?: string;
  }>;
}

interface EligibilityCheckResponse {
  scheme_id: string;
  scheme_name: string;
  status: 'MATCH' | 'PARTIAL_MATCH' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_INFORMATION';
  matched: Array<{ criterion: string; message: string }>;
  missing: Array<{ field: string; label: string; labelTa: string; description: string }>;
  failed: Array<{ criterion: string; message: string }>;
  estimated_subsidy?: {
    eligible_percentage: number;
    estimated_amount: number;
    max_subsidy_cap: number;
    interest_subvention_percent: number;
  };
  explanation: string;
  explanationTa: string;
  disclaimer: string;
  disclaimerTa: string;
  source: {
    authority: string;
    official_source_url: string;
    official_document_url: string;
    last_verified_at: string;
    is_stale: boolean;
  };
}

export const SchemesView: React.FC<SchemesViewProps> = ({ language }) => {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'wholesale' || userRole === ('admin' as any);

  // Schemes state
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<SchemeItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('ALL');

  // Subsidy calculator state
  const [projectCost, setProjectCost] = useState<number>(1500000);

  // Eligibility Modal state
  const [isEligibilityOpen, setIsEligibilityOpen] = useState<boolean>(false);
  const [eligibilityLoading, setEligibilityLoading] = useState<boolean>(false);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityCheckResponse | null>(null);
  const [eligibilityForm, setEligibilityForm] = useState({
    age: 28,
    state: 'Tamil Nadu',
    business_type: 'MANUFACTURING',
    project_cost: 1500000,
    education: 'DEGREE_DIPLOMA_ITI',
    entrepreneur_type: 'FIRST_GENERATION',
    social_category: 'GENERAL',
    annual_income: 300000,
    gender: 'MALE',
    is_differently_abled: false,
    is_ex_serviceman: false,
    location_type: 'URBAN',
  });

  // Source Transparency Modal state
  const [isSourceModalOpen, setIsSourceModalOpen] = useState<boolean>(false);

  // Admin Management Modal & Audit state
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminActionLoading, setAdminActionLoading] = useState<boolean>(false);
  const [adminSuccessMsg, setAdminSuccessMsg] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch schemes from backend
  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (selectedLevel !== 'ALL') params.set('governmentLevel', selectedLevel);
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedBusinessType !== 'ALL') params.set('businessType', selectedBusinessType);

      const endpoint = debouncedQuery
        ? `/api/schemes/search?${params.toString()}`
        : `/api/schemes?${params.toString()}`;

      const res = await api(endpoint);
      const data = await res.json();
      const list: SchemeItem[] = Array.isArray(data) ? data : data.schemes || [];
      setSchemes(list);

      if (list.length > 0) {
        setSelectedScheme((prev) => {
          if (prev) {
            const found = list.find((s) => s.id === prev.id);
            if (found) return found;
          }
          return list[0];
        });
      } else {
        setSelectedScheme(null);
      }
    } catch (err: any) {
      console.error('Failed to load schemes:', err);
      setError(err?.message || 'Failed to load official schemes');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedLevel, selectedCategory, selectedBusinessType]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  // Update calculator default when scheme changes
  useEffect(() => {
    if (selectedScheme) {
      if (projectCost < selectedScheme.projectCostMin || projectCost > selectedScheme.projectCostMax) {
        setProjectCost(Math.min(Math.max(selectedScheme.projectCostMin, 1000000), selectedScheme.projectCostMax));
      }
    }
  }, [selectedScheme]);

  // Subsidy calculation
  const calculatedSubsidy = useMemo(() => {
    if (!selectedScheme) return 0;
    const raw = Math.round(projectCost * ((selectedScheme.subsidyPercentage || 25) / 100));
    return Math.min(raw, selectedScheme.subsidyMaximum);
  }, [projectCost, selectedScheme]);

  // Execute Eligibility Engine
  const handleCheckEligibility = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedScheme) return;

    setEligibilityLoading(true);
    setEligibilityResult(null);

    try {
      const res = await api('/api/schemes/check-eligibility', {
        method: 'POST',
        body: JSON.stringify({
          scheme_id: selectedScheme.id,
          ...eligibilityForm,
          project_cost: Number(eligibilityForm.project_cost),
          age: Number(eligibilityForm.age),
          annual_income: Number(eligibilityForm.annual_income),
        }),
      });

      const data: EligibilityCheckResponse = await res.json();
      setEligibilityResult(data);
    } catch (err: any) {
      console.error('Eligibility check error:', err);
    } finally {
      setEligibilityLoading(false);
    }
  };

  // Open eligibility modal with tailored defaults
  const openEligibilityModal = (scheme: SchemeItem) => {
    setSelectedScheme(scheme);
    setEligibilityForm((prev) => ({
      ...prev,
      project_cost: Math.min(Math.max(scheme.projectCostMin, 1000000), scheme.projectCostMax),
      business_type: scheme.businessTypes[0] || 'MANUFACTURING',
    }));
    setEligibilityResult(null);
    setIsEligibilityOpen(true);
  };

  // Admin Actions
  const handleAdminVerify = async (schemeId: string) => {
    setAdminActionLoading(true);
    try {
      await api(`/api/admin/schemes/${schemeId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Verified against current official Gazette guidelines' }),
      });
      setAdminSuccessMsg(`Scheme ${schemeId.toUpperCase()} verified successfully!`);
      await fetchSchemes();
      loadAuditLogs();
    } catch (err: any) {
      alert(`Admin verify failed: ${err.message}`);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api('/api/admin/schemes/audit-logs');
      const logs = await res.json();
      setAuditLogs(logs);
    } catch (err) {
      console.warn('Could not load audit logs:', err);
    }
  };

  const getDomainFromUrl = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'N/A';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div id="govt-schemes-view-container" className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-800 via-emerald-800 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              {language === 'ta' ? '🇮🇳 இந்தியா — மத்திய & மாநில அரசு மானியங்கள்' : '🇮🇳 India — MSME & Government Schemes'}
            </span>
            <Landmark className="h-4 w-4 text-emerald-300" />
          </div>

          {/* Admin Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAdminPanelOpen(true);
                loadAuditLogs();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              <span>{language === 'ta' ? 'அரசாணை மேலாண்மை (Admin)' : 'Scheme Governance (Admin)'}</span>
            </button>
          </div>
        </div>

        <h2 className="mt-3 text-xl font-black sm:text-2xl lg:text-3xl">
          {language === 'ta'
            ? 'அரசு மானிய திட்டங்கள் & நிதி உதவி'
            : 'Government Schemes & Subsidies'}
        </h2>
        <p className="mt-1 max-w-3xl text-xs text-teal-100 sm:text-sm">
          {language === 'ta'
            ? 'இந்தியா முழுவதும் உள்ள MSME தொழிலதிபர்களுக்கான NEEDS, UYEGP, PMEGP, மூலதன மானியம், CGTMSE ஆகியவை அரசின் அதிகாரப்பூர்வ வெளியீடுகளின்படி சரிபார்க்கப்பட்ட நேரடி தரவுத்தளத்துடன் இணைக்கப்பட்டுள்ளது.'
            : 'Real, verified schemes for Indian MSME entrepreneurs — State (TN, MH, KA, AP…) + Central Government (kviconline.gov.in, msme.gov.in) official data, live-linked and eligibility-checked.'}
        </p>
      </div>

      {/* Real Database Search & Faceted Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'திட்டத்தின் பெயர், துறை அல்லது மானிய விவரங்களை தேடுக...'
                  : 'Search verified schemes (NEEDS, UYEGP, PMEGP, Capital Subsidy, BEISS)...'
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Faceted Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{language === 'ta' ? 'அனைத்து நிலைகள்' : 'All Levels'}</option>
              <option value="STATE">{language === 'ta' ? 'தமிழ்நாடு அரசு (State)' : 'Tamil Nadu (State)'}</option>
              <option value="CENTRAL">{language === 'ta' ? 'மத்திய அரசு (Central)' : 'Central Government'}</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{language === 'ta' ? 'அனைத்து பிரிவுகள்' : 'All Categories'}</option>
              <option value="CAPITAL_SUBSIDY">{language === 'ta' ? 'மூலதன மானியம்' : 'Capital Subsidy'}</option>
              <option value="EMPLOYMENT_GENERATION">{language === 'ta' ? 'வேலைவாய்ப்பு உருவாக்கம்' : 'Employment Generation'}</option>
              <option value="INTEREST_SUBVENTION">{language === 'ta' ? 'வட்டி மானியம்' : 'Interest Subvention'}</option>
              <option value="TECHNOLOGY_UPGRADATION">{language === 'ta' ? 'தொழில்நுட்ப & ஆற்றல்' : 'Technology & Energy'}</option>
              <option value="CREDIT_GUARANTEE">{language === 'ta' ? 'கடன் உத்தரவாதம்' : 'Credit Guarantee'}</option>
            </select>

            {/* Business Type Filter */}
            <select
              value={selectedBusinessType}
              onChange={(e) => setSelectedBusinessType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">{language === 'ta' ? 'அனைத்து தொழில்கள்' : 'All Business Types'}</option>
              <option value="MANUFACTURING">{language === 'ta' ? 'உற்பத்தி (Manufacturing)' : 'Manufacturing'}</option>
              <option value="SERVICE">{language === 'ta' ? 'சேவை (Service)' : 'Service Enterprise'}</option>
              <option value="TRADING">{language === 'ta' ? 'வணிகம் / விற்பனை (Trading)' : 'Business / Trading'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Scheme List + Scheme Details & Calculator */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Scheme List */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {language === 'ta' ? 'சரிபார்க்கப்பட்ட திட்டங்கள்' : 'VERIFIED SCHEMES'} ({schemes.length})
            </span>
            <button
              onClick={fetchSchemes}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{language === 'ta' ? 'புதுப்பி' : 'Refresh'}</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mt-2 h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mt-2 h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              <AlertTriangle className="mb-1 h-4 w-4" />
              {error}
            </div>
          ) : schemes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              {language === 'ta'
                ? 'பொருத்தமான அரசு திட்டங்கள் எதுவும் கிடைக்கவில்லை. தேடல் சொல்லை மாற்றவும்.'
                : 'No government schemes match the selected filters.'}
            </div>
          ) : (
            <div className="space-y-2">
              {schemes.map((s) => {
                const active = selectedScheme?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedScheme(s)}
                    className={`group cursor-pointer rounded-2xl border p-4 transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-sm dark:border-emerald-500 dark:bg-emerald-950/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {s.subsidyPercentage}% {language === 'ta' ? 'மானியம்' : 'Subsidy'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {s.governmentLevel === 'STATE' ? 'TN State' : 'Central'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        Max ₹{(s.subsidyMaximum / 100000).toFixed(1)}L
                      </span>
                    </div>

                    <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'ta' ? s.nameTa : s.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {s.fullName}
                    </p>

                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatDate(s.lastVerifiedAt)}
                      </span>
                      {s.isStale && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> Stale
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Scheme Deep-Dive & Subsidy Calculator */}
        {selectedScheme ? (
          <div className="space-y-6 lg:col-span-2">
            {/* Main Scheme Details Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {/* Header with Title and Real Official Portal Button */}
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-start">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {selectedScheme.category.replace(/_/g, ' ')}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {selectedScheme.governmentLevel === 'STATE' ? 'Government of Tamil Nadu' : 'Government of India'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                    {language === 'ta' ? selectedScheme.nameTa : selectedScheme.name}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {language === 'ta' && selectedScheme.fullNameTa ? selectedScheme.fullNameTa : selectedScheme.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedScheme.department}
                  </p>
                </div>

                {/* Real Action Buttons */}
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <a
                    href={selectedScheme.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <span>{language === 'ta' ? 'அதிகாரப்பூர்வ தளம்' : 'Official Portal'}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <div className="text-[10px] text-slate-400 sm:text-right">
                    <span>{getDomainFromUrl(selectedScheme.applicationUrl)}</span>
                  </div>
                </div>
              </div>

              {/* Stale Warning Banner if applicable */}
              {selectedScheme.isStale && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <strong>{language === 'ta' ? 'தகவல் சரிபார்ப்பு தேவை' : 'Information may require verification'}: </strong>
                    {language === 'ta'
                      ? 'இந்த திட்ட விவரங்கள் 180 நாட்களுக்கு முன்பு சரிபார்க்கப்பட்டது. அதிகாரப்பூர்வ தளத்தை நேரடியாக பார்வையிடவும்.'
                      : 'Scheme details were verified over 180 days ago. Please verify current rules directly on the official portal.'}
                  </div>
                </div>
              )}

              {/* Scheme Description */}
              <p className="mt-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {language === 'ta' ? selectedScheme.descriptionTa : selectedScheme.description}
              </p>

              {/* Source Verification Badge & CTA */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Authority:</strong> {selectedScheme.sourceAuthority} |{' '}
                    <strong>Verified:</strong> {formatDate(selectedScheme.lastVerifiedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSourceModalOpen(true)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <FileText className="h-3 w-3 text-slate-500" />
                    <span>{language === 'ta' ? 'ஆதாரம் பார்' : 'View Source'}</span>
                  </button>

                  <button
                    onClick={() => openEligibilityModal(selectedScheme)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{language === 'ta' ? 'என் தகுதியை சோதி' : 'Check My Eligibility'}</span>
                  </button>
                </div>
              </div>

              {/* Structured Criteria Matrix */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Age & Education */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'ta' ? 'வயது & கல்வி தகுதி' : 'Age & Education Qualification'}
                  </span>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{selectedScheme.ageRules.description}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{selectedScheme.educationRules.description}</span>
                    </li>
                  </ul>
                </div>

                {/* Residency & Eligible Sectors */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {language === 'ta' ? 'இருப்பிடம் & தகுதியான தொழில்கள்' : 'Residency & Sector Eligibility'}
                  </span>
                  <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{selectedScheme.residencyRules.description}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{selectedScheme.sectorRules.description}</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Special Category & Additional Benefits */}
              <div className="mt-4 rounded-2xl bg-teal-50/50 p-4 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                  {language === 'ta' ? 'சிறப்பு பிரிவினர் பலன்கள் (பெண்கள் / SC / ST / BC / MBC)' : 'Special Category Benefits (Women, SC/ST, BC/MBC)'}
                </span>
                <p className="mt-1 text-[11px] text-teal-800 dark:text-teal-300">
                  {selectedScheme.specialCategoryRules.additionalBenefits}
                </p>
                {selectedScheme.interestSubvention > 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    + {selectedScheme.interestSubvention}% {language === 'ta' ? 'கூடுதல் வட்டி மானியம் (Interest Subvention)' : 'Interest Subvention on Bank Loan'}
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Subsidy Calculator */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'மானியம் கணக்கிடு கருவி (Subsidy Calculator)' : 'Subsidy Grant Calculator'}
                </h4>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'திட்ட மதிப்பீடு (Project Cost ₹)' : 'Proposed Project / Loan Cost (₹)'}
                  </label>
                  <input
                    type="number"
                    step={50000}
                    min={selectedScheme.projectCostMin}
                    max={selectedScheme.projectCostMax}
                    value={projectCost}
                    onChange={(e) => setProjectCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-base font-bold text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Min: ₹{(selectedScheme.projectCostMin / 100000).toFixed(1)}L</span>
                    <span>Max: ₹{(selectedScheme.projectCostMax / 100000).toFixed(1)}L</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {language === 'ta' ? 'அரசு தரும் மானிய தொகை (Subsidy Grant)' : 'Estimated Govt Subsidy Grant'}
                  </span>
                  <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(calculatedSubsidy)}
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    {selectedScheme.subsidyPercentage}% direct subsidy (Max cap: ₹
                    {(selectedScheme.subsidyMaximum / 100000).toFixed(1)} Lakhs)
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── CHECK MY ELIGIBILITY MODAL ─── */}
      {isEligibilityOpen && selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEligibilityOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'ta'
                  ? `${selectedScheme.name} தகுதி பரிசீலனை`
                  : `Check My Eligibility for ${selectedScheme.name}`}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {language === 'ta'
                ? 'அரசு விதிகளின்படி உங்கள் விவரங்களை சரிபார்த்து உண்மையான மானிய தகுதியை அறியுங்கள்.'
                : 'Evaluate your profile against published Government scheme criteria.'}
            </p>

            {/* Evaluation Form */}
            <form onSubmit={handleCheckEligibility} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Age */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'விண்ணப்பதாரர் வயது' : 'Applicant Age'}
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={80}
                    value={eligibilityForm.age}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, age: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'தொழில் வகை' : 'Business Activity'}
                  </label>
                  <select
                    value={eligibilityForm.business_type}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, business_type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="MANUFACTURING">{language === 'ta' ? 'உற்பத்தி (Manufacturing)' : 'Manufacturing'}</option>
                    <option value="SERVICE">{language === 'ta' ? 'சேவை (Service Enterprise)' : 'Service Enterprise'}</option>
                    <option value="TRADING">{language === 'ta' ? 'வணிகம் / விற்பனை (Trading)' : 'Trading / Retail'}</option>
                  </select>
                </div>

                {/* Project Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'திட்ட மதிப்பீடு (₹)' : 'Project Cost (₹)'}
                  </label>
                  <input
                    type="number"
                    step={50000}
                    value={eligibilityForm.project_cost}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, project_cost: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>

                {/* Education */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'கல்வித் தகுதி' : 'Education Qualification'}
                  </label>
                  <select
                    value={eligibilityForm.education}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, education: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="DEGREE_DIPLOMA_ITI">Degree / Diploma / ITI</option>
                    <option value="12TH_PASS">12th Standard Pass (HSC)</option>
                    <option value="10TH_PASS">10th Standard Pass (SSLC)</option>
                    <option value="8TH_PASS">8th Standard Pass</option>
                    <option value="BELOW_8TH">Below 8th Standard</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'பாலினம்' : 'Gender'}
                  </label>
                  <select
                    value={eligibilityForm.gender}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, gender: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="MALE">Male (ஆண்)</option>
                    <option value="FEMALE">Female (பெண்)</option>
                    <option value="TRANSGENDER">Transgender (திருநங்கை)</option>
                  </select>
                </div>

                {/* Social Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'சமூகப் பிரிவு' : 'Social Category'}
                  </label>
                  <select
                    value={eligibilityForm.social_category}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, social_category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="GENERAL">General (பொதுப்பிரிவு)</option>
                    <option value="BC">BC / பிற்படுத்தப்பட்டோர்</option>
                    <option value="MBC">MBC / மிகவும் பிற்படுத்தப்பட்டோர்</option>
                    <option value="SC">SC / ஆதிதிராவிடர்</option>
                    <option value="ST">ST / பழங்குடியினர்</option>
                    <option value="MINORITY">Minority / சிறுபான்மையினர்</option>
                  </select>
                </div>

                {/* First-Generation Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'தொழில்முனைவோர் வகை' : 'Entrepreneur Type'}
                  </label>
                  <select
                    value={eligibilityForm.entrepreneur_type}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, entrepreneur_type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="FIRST_GENERATION">First-Generation (புதிய முதல் தலைமுறை)</option>
                    <option value="EXISTING">Existing Business Owner (ஏற்கனவே தொழில் உள்ளவர்)</option>
                  </select>
                </div>

                {/* State Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'ta' ? 'நிறுவனம் அமையுமிடம்' : 'Location State'}
                  </label>
                  <input
                    type="text"
                    value={eligibilityForm.state}
                    onChange={(e) => setEligibilityForm({ ...eligibilityForm, state: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEligibilityOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={eligibilityLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {eligibilityLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{language === 'ta' ? 'தகுதியை மதிப்பிடு' : 'Evaluate Eligibility'}</span>
                </button>
              </div>
            </form>

            {/* Results Display */}
            {eligibilityResult && (
              <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {language === 'ta' ? 'முடிவு' : 'Evaluation Result'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                      eligibilityResult.status === 'MATCH'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : eligibilityResult.status === 'PARTIAL_MATCH'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {eligibilityResult.status}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {language === 'ta' ? eligibilityResult.explanationTa : eligibilityResult.explanation}
                </p>

                {/* Criteria Breakdown */}
                <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                  {eligibilityResult.matched.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        ✓ {language === 'ta' ? 'பொருந்திய நிபந்தனைகள்' : 'Criteria Matched'}:
                      </span>
                      {eligibilityResult.matched.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                          <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{m.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {eligibilityResult.failed.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                        ✕ {language === 'ta' ? 'பூர்த்தியாகாத நிபந்தனைகள்' : 'Criteria Not Met'}:
                      </span>
                      {eligibilityResult.failed.map((f, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-300">
                          <X className="h-3 w-3 text-rose-600 shrink-0" />
                          <span>{f.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {eligibilityResult.missing.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        ⚠ {language === 'ta' ? 'கூடுதல் தகவல் தேவை' : 'Information Required'}:
                      </span>
                      {eligibilityResult.missing.map((mis, idx) => (
                        <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300">
                          • {mis.label}: {mis.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Estimated Subsidy Summary */}
                {eligibilityResult.estimated_subsidy && (
                  <div className="mt-2 rounded-xl bg-emerald-100/60 p-3 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <span>
                      Estimated Eligible Grant:{' '}
                      <strong className="text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(eligibilityResult.estimated_subsidy.estimated_amount)}
                      </strong>{' '}
                      ({eligibilityResult.estimated_subsidy.eligible_percentage}%)
                    </span>
                  </div>
                )}

                {/* Official Statutory Disclaimer */}
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  <div className="flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                    <span>
                      {language === 'ta' ? eligibilityResult.disclaimerTa : eligibilityResult.disclaimer}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── SOURCE TRANSPARENCY MODAL ─── */}
      {isSourceModalOpen && selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setIsSourceModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {selectedScheme.name} - Official Source Grounding
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Government scheme facts grounded in verified official publications.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="font-bold text-slate-700 dark:text-slate-300">Implementing Authority:</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">{selectedScheme.sourceAuthority}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="font-bold text-slate-700 dark:text-slate-300">Official Portal:</span>
                <a
                  href={selectedScheme.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400 font-semibold"
                >
                  <span>{selectedScheme.applicationUrl}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="font-bold text-slate-700 dark:text-slate-300">Official Document Guidelines:</span>
                <a
                  href={selectedScheme.officialDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400 font-semibold"
                >
                  <span>{selectedScheme.officialDocumentUrl}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span>Last Verified Date:</span>
                <span>{formatDate(selectedScheme.lastVerifiedAt)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsSourceModalOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADMIN SCHEME MANAGEMENT & AUDIT PANEL MODAL ─── */}
      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAdminPanelOpen(false);
                setAdminSuccessMsg(null);
              }}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Government Scheme Governance & Audit Console
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Authorized admin console to verify scheme facts, update parameters, and inspect audit trails.
            </p>

            {adminSuccessMsg && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                {adminSuccessMsg}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Scheme Verification & Verification Refresh
              </h4>
              <div className="space-y-2">
                {schemes.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{s.name}</span>
                      <p className="text-[11px] text-slate-500">
                        {s.sourceAuthority} | Last verified: {formatDate(s.lastVerifiedAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdminVerify(s.id)}
                        disabled={adminActionLoading}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        <span>Mark Verified</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Audit Trail List */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <History className="h-3.5 w-3.5" /> Recent Scheme Audit Logs
                  </h4>
                  <button
                    onClick={loadAuditLogs}
                    className="text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Refresh Logs
                  </button>
                </div>

                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {auditLogs.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2">No audit logs found.</div>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-xl border border-slate-100 bg-white p-2.5 text-[11px] dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                          <span>
                            {log.action} on Scheme: <strong className="text-emerald-600">{log.schemeId}</strong>
                          </span>
                          <span className="text-slate-400 text-[10px]">{formatDate(log.timestamp)}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">By: {log.changedBy}</p>
                        {log.notes && <p className="text-slate-600 dark:text-slate-300 mt-0.5 italic">{log.notes}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

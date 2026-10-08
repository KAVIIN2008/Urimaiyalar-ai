import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BrainCircuit, Mic, BarChart3, Shield, Globe, Zap, ArrowRight,
  Store, Users, Package, CreditCard, TrendingUp, Bot, CheckCircle2,
  ChevronRight, Star, Sparkles, Play, Menu, X
} from 'lucide-react';
import { LanguageCode } from '../types';
import { InstallPrompt } from './InstallPrompt';
import { Spatial3DCard, Hologram3DOrb } from './Spatial3DWidgets';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { getLanguageInfo } from '../utils/languages';
import { useTranslation } from '../contexts/LanguageContext';

interface LandingPageProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onGetStarted: () => void;
}

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI Business Intelligence',
    titleTa: 'AI வணிக நுண்ணறிவு',
    desc: 'Ask questions in Tamil or English. Get instant answers about profits, debts, and stock levels.',
    descTa: 'தமிழ் அல்லது ஆங்கிலத்தில் கேளுங்கள். லாபம், கடன், இருப்பு பற்றி உடனடி பதில்.',
    gradient: 'from-violet-500 to-purple-600',
    shadow: 'shadow-violet-500/20',
  },
  {
    icon: Mic,
    title: 'Voice-First Commerce',
    titleTa: 'குரல் வழி வணிகம்',
    desc: '"Ramesh bought 5kg rice on credit" — just speak, and the AI handles the rest.',
    descTa: '"ரமேஷ் 5 கிலோ அரிசி கடனில் வாங்கினார்" — பேசுங்கள், AI செய்யும்.',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-500/20',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    titleTa: 'நிகழ்நேர பகுப்பாய்வு',
    desc: 'Live dashboards with sales trends, profit margins, and business health scores.',
    descTa: 'விற்பனை போக்குகள், லாப வரம்புகள், வணிக ஆரோக்கிய மதிப்பெண்கள்.',
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20',
  },
  {
    icon: CreditCard,
    title: 'Smart Credit Ledger',
    titleTa: 'ஸ்மார்ட் கடன் பேரேடு',
    desc: 'Track every rupee owed. Automated payment reminders. Never lose money again.',
    descTa: 'ஒவ்வொரு ரூபாயும் கண்காணிக்கப்படும். தானியங்கு நினைவூட்டல்.',
    gradient: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-500/20',
  },
  {
    icon: Package,
    title: 'Inventory Autopilot',
    titleTa: 'இருப்பு ஆட்டோபைலட்',
    desc: 'Low stock alerts, purchase suggestions, and automatic reorder tracking.',
    descTa: 'குறைந்த இருப்பு எச்சரிக்கை, கொள்முதல் பரிந்துரைகள்.',
    gradient: 'from-cyan-500 to-blue-600',
    shadow: 'shadow-cyan-500/20',
  },
  {
    icon: Globe,
    title: 'Tamil-First Design',
    titleTa: 'தமிழ்-முதல் வடிவமைப்பு',
    desc: 'Built for Tamil Nadu businesses. Full Tamil UI, Tanglish support, and local context.',
    descTa: 'தமிழ்நாடு வணிகங்களுக்காக உருவாக்கப்பட்டது. முழு தமிழ் UI.',
    gradient: 'from-indigo-500 to-blue-600',
    shadow: 'shadow-indigo-500/20',
  },
];



const TESTIMONIALS = [
  {
    name: 'Thirumalai Krishnan',
    nameTa: 'திருமலை கிருஷ்ணன்',
    role: 'Grocery Store Owner, Madurai',
    roleTa: 'மளிகைக்கடை உரிமையாளர், மதுரை',
    text: 'Before Urimaiyalar, I was losing ₹15,000 monthly in untracked credit. Now every paisa is accounted for.',
    textTa: 'உரிமையாளர் வருவதற்கு முன், மாதம் ₹15,000 கடன் கண்காணிக்காமல் இழந்தேன். இப்போது ஒவ்வொரு பைசாவும் கணக்கில்.',
    avatar: '👨‍💼',
  },
  {
    name: 'Meenakshi Sundaram',
    nameTa: 'மீனாட்சி சுந்தரம்',
    role: 'Rice Mill Owner, Salem',
    roleTa: 'அரிசி ஆலை உரிமையாளர், சேலம்',
    text: 'The voice feature is magical. I just speak in Tamil and it records everything. My accountant is amazed.',
    textTa: 'குரல் வசதி அற்புதமானது. தமிழில் பேசுகிறேன், எல்லாம் பதிவாகிறது. என் கணக்காளர் ஆச்சரியத்தில்.',
    avatar: '👩‍💼',
  },
  {
    name: 'Rajesh Kumar',
    nameTa: 'ராஜேஷ் குமார்',
    role: 'Wholesale Dealer, Coimbatore',
    roleTa: 'மொத்த வியாபாரி, கோயம்புத்தூர்',
    text: 'Switched from Tally to Urimaiyalar. The AI understands my business better than any software I have used.',
    textTa: 'டேலி-யிலிருந்து உரிமையாளருக்கு மாறினேன். AI என் வணிகத்தை எந்த மென்பொருளையும் விட நன்றாக புரிந்துகொள்கிறது.',
    avatar: '🧑‍💼',
  },
];

export function LandingPage({ language, onLanguageChange, onGetStarted }: LandingPageProps) {
  const { t, isRTL } = useTranslation();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const isTamil = language === 'ta';

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden font-sans" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">
              URIMAIYALAR OS
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              {t('landing.navFeatures')}
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              {t('landing.testimonialsTitle')}
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 transition-colors hover:text-white">
              {t('landing.navPricing')}
            </a>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-0.5">
              <button
                onClick={() => onLanguageChange('en')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >EN</button>
              <button
                onClick={() => onLanguageChange('ta')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${language === 'ta' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >தமிழ்</button>
              <button
                onClick={() => setIsLangModalOpen(true)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${language !== 'ta' && language !== 'en' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                <Globe className="h-3 w-3 text-emerald-400" />
                <span>{language !== 'ta' && language !== 'en' ? getLanguageInfo(language).nativeName : '22 மொழிகள்'}</span>
              </button>
            </div>
            <button
              onClick={onGetStarted}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40"
            >
              {t('landing.ctaStartFree')}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/5 bg-slate-950 md:hidden"
            >
              <div className="flex flex-col gap-4 px-6 py-6">
                <a href="#features" className="text-sm font-medium text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('landing.navFeatures')}
                </a>
                <a href="#testimonials" className="text-sm font-medium text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('landing.testimonialsTitle')}
                </a>
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <span className="text-xs text-slate-400">Language:</span>
                  <button
                    onClick={() => { onLanguageChange('ta'); setMobileMenuOpen(false); }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${language === 'ta' ? 'bg-emerald-600 text-white' : 'text-slate-300 bg-white/5'}`}
                  >தமிழ்</button>
                  <button
                    onClick={() => { onLanguageChange('en'); setMobileMenuOpen(false); }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-300 bg-white/5'}`}
                  >English</button>
                  <button
                    onClick={() => { setIsLangModalOpen(true); setMobileMenuOpen(false); }}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                  >
                    <Globe className="h-3 w-3" />
                    <span>22 Languages</span>
                  </button>
                </div>
                <button
                  onClick={() => { onGetStarted(); setMobileMenuOpen(false); }}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-slate-950"
                >
                  {t('landing.ctaStartFree')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative flex min-h-[90vh] items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* High-Visibility Full Cinematic Hero Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/landing-entrepreneur-bg.jpg"
            alt="Tamil AI Voice Entrepreneur Background"
            className="h-full w-full object-cover object-right lg:object-center opacity-70 scale-100 transition-all duration-700"
          />
          {/* Pro Dark Gradient Vignette for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />
          
          {/* Glow Accents */}
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-emerald-600/25 blur-[140px] animate-pulse" />
          <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-teal-600/20 blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Column: Headline & CTAs */}
            <div className="lg:col-span-8 text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-extrabold text-emerald-400 backdrop-blur-md"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                {t('landing.heroBadge')}
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl drop-shadow-lg"
              >
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  {t('landing.heroTitle')}
                </span>
              </motion.h1>

              {/* Sub Heading */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-300 sm:text-xl drop-shadow-md"
              >
                {t('landing.heroSubtitle')}
              </motion.p>

              {/* Key Highlights Pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-300"
              >
                {[
                  `🎙️ ${t('landing.featureVoiceTitle')}`,
                  `🧠 ${t('landing.featureAiCfoTitle')}`,
                  `⚡ ${t('landing.featureSovereignTitle')}`,
                  `📊 ${t('landing.statsTitle')}`,
                ].map((item, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
                    {item}
                  </span>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
              >
                <button
                  onClick={onGetStarted}
                  className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-base font-black text-slate-950 shadow-2xl shadow-emerald-500/40 transition-all hover:scale-105 hover:shadow-emerald-500/60 active:scale-95"
                >
                  {t('landing.ctaStartFree')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={onGetStarted}
                  className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-slate-900/60 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all hover:border-white/30 hover:bg-slate-900/80"
                >
                  <Play className="h-4 w-4 text-cyan-400 fill-cyan-400" />
                  {t('landing.ctaWatchDemo')}
                </button>
              </motion.div>
            </div>

            {/* Right Column: 3D Holographic AI Showcase Card */}
            <div className="lg:col-span-4 flex justify-end">
              <Spatial3DCard depth={18} className="w-full max-w-sm">
                <div className="relative rounded-3xl border border-blue-500/40 bg-[#0a0f1d] p-6 shadow-2xl shadow-blue-950/60">
                  {/* Floating Holographic Orb Badge */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
                        <Mic className="h-6 w-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-white">
                          {isTamil ? 'தமிழ் குரல் உதவியாளர்' : 'Tamil Voice AI Assistant'}
                        </h3>
                        <p className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                          {isTamil ? 'நேரலையில் இயங்குகிறது' : '3D Spatial AI Online'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="my-4 rounded-2xl bg-slate-900/90 p-4 border border-slate-800 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="rounded-full bg-blue-500/20 p-1.5 text-blue-400 mt-0.5">
                        <Mic className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400">{isTamil ? 'குரல் கட்டளை:' : 'Voice Input:'}</div>
                        <div className="text-xs font-semibold text-white italic">
                          "{isTamil ? 'ரமேஷ் 5 கிலோ அரிசி கடனில் வாங்கினார்' : 'Ramesh bought 5kg rice on credit'}"
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{isTamil ? 'தானியங்கு நடவடிக்கை:' : 'AI Action:'}</span>
                      <span className="font-bold text-cyan-400">✓ Ledgers & Inventory Updated</span>
                    </div>
                  </div>

                  <button
                    onClick={onGetStarted}
                    className="btn-3d-primary w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 py-3 text-xs font-black text-white transition-all hover:scale-[1.02]"
                  >
                    {isTamil ? 'குரல் AI-ஐ முயற்சிக்கவும்' : 'Experience 3D Voice AI'}
                  </button>
                </div>
              </Spatial3DCard>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES SECTION ═══════════ */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 mb-4"
            >
              <Zap className="h-3.5 w-3.5" />
              {t('landing.navFeatures')}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl"
            >
              {t('landing.featuresTitle')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mx-auto mt-4 max-w-2xl text-base text-slate-400"
            >
              {t('landing.featuresSubtitle')}
            </motion.p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const title = i === 0 ? t('landing.featureAiCfoTitle') :
                            i === 1 ? t('landing.featureVoiceTitle') :
                            i === 2 ? (language === 'ta' ? feature.titleTa : feature.title) :
                            i === 3 ? (language === 'ta' ? feature.titleTa : feature.title) :
                            i === 4 ? t('landing.featureEcosystemTitle') :
                            t('landing.featureSchemesTitle');
              const desc = i === 0 ? t('landing.featureAiCfoDesc') :
                           i === 1 ? t('landing.featureVoiceDesc') :
                           i === 2 ? (language === 'ta' ? feature.descTa : feature.desc) :
                           i === 3 ? (language === 'ta' ? feature.descTa : feature.desc) :
                           i === 4 ? t('landing.featureEcosystemDesc') :
                           t('landing.featureSchemesDesc');
              return (
                <Spatial3DCard key={i} depth={14} className="h-full">
                  <div
                    className={`group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/40 ${feature.shadow}`}
                  >
                    <div style={{ transform: 'translateZ(25px)' }} className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg shadow-blue-500/25`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 style={{ transform: 'translateZ(18px)' }} className="text-lg font-bold text-white">
                      {title}
                    </h3>
                    <p style={{ transform: 'translateZ(10px)' }} className="mt-2 text-sm leading-relaxed text-slate-300">
                      {desc}
                    </p>
                    {/* Hover glow */}
                    <div className={`absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-gradient-to-br ${feature.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30`} />
                  </div>
                </Spatial3DCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="relative border-y border-white/5 bg-white/[0.01] py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-black tracking-tight sm:text-4xl"
            >
              {isTamil ? '3 எளிய படிகள்' : 'Get Started in 3 Simple Steps'}
            </motion.h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: isTamil ? 'கணக்கை உருவாக்கு' : 'Create Your Account',
                desc: isTamil ? '30 வினாடிகளில் இலவசமாக பதிவு செய்யுங்கள்' : 'Sign up free in 30 seconds. No credit card needed.',
                icon: Users,
              },
              {
                step: '02',
                title: isTamil ? 'பொருட்களை சேர்' : 'Add Your Products',
                desc: isTamil ? 'பொருட்கள், வாடிக்கையாளர்கள் சேர்க்கவும், அல்லது டெமோ பார்க்கவும்' : 'Add products, customers, or explore the demo data instantly.',
                icon: Package,
              },
              {
                step: '03',
                title: isTamil ? 'AI-யிடம் பேசு' : 'Talk to Your AI',
                desc: isTamil ? 'தமிழில் பேசுங்கள், AI உங்கள் வணிகத்தை நிர்வகிக்கும்' : 'Speak in Tamil or English. AI manages your business intelligently.',
                icon: Bot,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Spatial3DCard key={i} depth={12} className="h-full">
                  <div className="relative h-full rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center backdrop-blur-xl shadow-lg hover:border-blue-500/40">
                    <div style={{ transform: 'translateZ(20px)' }} className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 shadow-lg shadow-cyan-500/15">
                      <Icon className="h-8 w-8 text-cyan-400" />
                    </div>
                    <div className="absolute top-4 right-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-0.5 text-[10px] font-black text-white shadow-md">
                      {item.step}
                    </div>
                    <h3 style={{ transform: 'translateZ(15px)' }} className="text-base font-bold text-white">{item.title}</h3>
                    <p style={{ transform: 'translateZ(8px)' }} className="mt-2 text-sm text-slate-300">{item.desc}</p>
                  </div>
                </Spatial3DCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="testimonials" className="py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 mb-4"
          >
            <Star className="h-3.5 w-3.5" />
            {isTamil ? 'மதிப்புரைகள்' : 'TESTIMONIALS'}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-black tracking-tight sm:text-4xl"
          >
            {isTamil ? 'வணிக உரிமையாளர்கள் என்ன சொல்கிறார்கள்' : 'Loved by Business Owners'}
          </motion.h2>

          <div className="relative mt-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 sm:p-12"
              >
                <div className="mb-6 flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mx-auto max-w-xl text-lg font-medium leading-relaxed text-slate-300">
                  "{isTamil ? TESTIMONIALS[currentTestimonial].textTa : TESTIMONIALS[currentTestimonial].text}"
                </p>
                <div className="mt-8">
                  <div className="text-4xl">{TESTIMONIALS[currentTestimonial].avatar}</div>
                  <div className="mt-2 text-sm font-bold text-white">
                    {isTamil ? TESTIMONIALS[currentTestimonial].nameTa : TESTIMONIALS[currentTestimonial].name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isTamil ? TESTIMONIALS[currentTestimonial].roleTa : TESTIMONIALS[currentTestimonial].role}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Dots */}
            <div className="mt-6 flex justify-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`h-2 rounded-full transition-all ${i === currentTestimonial ? 'w-8 bg-emerald-500' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="border-t border-white/5 bg-white/[0.01] py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-black tracking-wide text-blue-400 mb-4 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              {isTamil ? '1 மாதம் முற்றிலும் இலவசம்' : '1 MONTH FREE TRIAL FOR ALL STORES'}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              {isTamil ? 'அனைத்து கடைகளுக்கும் கட்டுப்படியாகும் விலை' : 'Ultra-Affordable Pricing for Every Store'}
            </motion.h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-300">
              {isTamil
                ? 'முதல் 30 நாட்கள் இலவசம்! அதற்குப் பிறகு மாதம் வெறும் ₹29 முதல் ₹49 வரை மட்டுமே.'
                : 'Start with 1 Month Free Trial! After trial, pay just ₹29 to ₹49 per month (less than ₹1/day).'}
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {/* 1 Month Free Trial */}
            <Spatial3DCard depth={14} className="h-full">
              <div className="group relative h-full rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 flex flex-col justify-between backdrop-blur-2xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/20">
                <div>
                  <div style={{ transform: 'translateZ(15px)' }} className="inline-flex rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-400 border border-blue-500/20">
                    {isTamil ? 'அறிமுக சலுகை' : 'Free Trial'}
                  </div>
                  <div style={{ transform: 'translateZ(25px)' }} className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tight">₹0</span>
                    <span className="text-xs text-slate-400 font-medium">/ 30 days</span>
                  </div>
                  <div className="text-xs font-bold text-cyan-400 mt-1">
                    {isTamil ? 'முதல் 1 மாதம் இலவசம்' : 'First 30 Days 100% Free'}
                  </div>
                  <ul className="mt-6 space-y-3.5">
                    {[
                      isTamil ? 'முழு அணுகல் 30 நாட்கள்' : 'Full access for 30 days',
                      isTamil ? 'கட்டண அட்டை தேவையில்லை' : 'No credit card / UPI needed',
                      isTamil ? 'வரம்பற்ற விற்பனை பதிவு' : 'Unlimited sales bills',
                      isTamil ? 'தமிழ் & ஆங்கில AI' : 'Tamil & English AI',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-300">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={onGetStarted}
                  className="mt-8 w-full rounded-2xl border border-slate-700 bg-slate-800/90 py-3.5 text-xs sm:text-sm font-extrabold text-white transition-all hover:bg-slate-700 hover:border-slate-500 hover:scale-[1.02] active:scale-95 shadow-sm"
                >
                  {isTamil ? 'இலவச சோதனைத் தொடங்கு' : 'Start 1 Month Free Trial'}
                </button>
              </div>
            </Spatial3DCard>

            {/* Starter Plan - ₹29/mo */}
            <Spatial3DCard depth={14} className="h-full">
              <div className="group relative h-full rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-950/40 via-slate-900/80 to-slate-950 p-8 flex flex-col justify-between backdrop-blur-2xl transition-all duration-300 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-600/30">
                <div style={{ transform: 'translateZ(20px)' }} className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/25">
                  Value Pack
                </div>
                <div>
                  <div style={{ transform: 'translateZ(15px)' }} className="inline-flex rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300 border border-blue-500/20">
                    {isTamil ? 'ஸ்டார்ட்டர் திட்டம்' : 'Starter Store'}
                  </div>
                  <div style={{ transform: 'translateZ(25px)' }} className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tight">₹29</span>
                    <span className="text-xs text-slate-400 font-medium">/ month</span>
                  </div>
                  <div className="text-xs text-blue-400 font-semibold mt-1">
                    {isTamil ? 'மாதம் (இலவச மாதத்திற்கு பின்)' : '(after 1 month free trial)'}
                  </div>
                  <ul className="mt-6 space-y-3.5">
                    {[
                      isTamil ? 'ரொக்கம் & கடன் பேரேடு' : 'Cash & Udhar Credit Ledger',
                      isTamil ? 'இருப்பு மேலாண்மை' : 'Basic Inventory Tracking',
                      isTamil ? 'PDF ரசீது அச்சிடுதல்' : 'PDF Invoice Generation',
                      isTamil ? 'நாளிசரி லாப அறிக்கை' : 'Daily Profit Summaries',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-200">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={onGetStarted}
                  className="btn-3d-primary mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs sm:text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02]"
                >
                  {isTamil ? 'ஸ்டார்ட்டர் தேர்ந்தெடு' : 'Choose Starter'}
                </button>
              </div>
            </Spatial3DCard>

            {/* Pro Store - ₹49/mo Popular */}
            <Spatial3DCard depth={16} className="h-full">
              <div className="relative h-full rounded-3xl border-2 border-cyan-400/60 bg-gradient-to-b from-blue-900/50 via-slate-900/90 to-[#070b14] p-8 flex flex-col justify-between shadow-2xl shadow-cyan-500/25 backdrop-blur-2xl">
                <div style={{ transform: 'translateZ(25px)' }} className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-600 px-4 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/40 animate-pulse">
                  {isTamil ? 'மிகவும் விரும்பப்படும்' : 'MOST POPULAR'}
                </div>
                <div>
                  <div style={{ transform: 'translateZ(15px)' }} className="inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-black text-cyan-300 border border-cyan-400/30">
                    Pro AI Store
                  </div>
                  <div style={{ transform: 'translateZ(25px)' }} className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tight">₹49</span>
                    <span className="text-xs text-cyan-200/80 font-medium">/ month</span>
                  </div>
                  <div className="text-xs text-cyan-300 font-semibold mt-1">
                    {isTamil ? 'மாதம் (இலவச மாதத்திற்கு பின்)' : '(after 1 month free trial)'}
                  </div>
                  <ul className="mt-6 space-y-3.5">
                    {[
                      isTamil ? 'தமிழ் AI குரல் உதவியாளர்' : 'Tamil Voice AI Assistant',
                      isTamil ? 'WhatsApp ரசீது பகிர்தல்' : '1-Click WhatsApp Invoicing',
                      isTamil ? 'உடனடி UPI QR செலுத்தல்' : 'Instant Dynamic UPI QR',
                      isTamil ? 'பார்கோடு கேமரா ஸ்கேனர்' : 'AI Barcode Scanner',
                      isTamil ? '24/7 முன்னுரிமை ஆதரவு' : 'Priority Store Support',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-white">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={onGetStarted}
                  className="btn-3d-primary mt-8 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 py-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-xl transition-all hover:scale-[1.03]"
                >
                  {isTamil ? '1 மாதம் இலவசமாகத் தொடங்கு' : 'Start 1 Month Free'}
                </button>
              </div>
            </Spatial3DCard>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600/10 blur-[120px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{t('landing.heroTitle')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-400">
            {t('landing.heroSubtitle')}
          </p>
          <button
            onClick={onGetStarted}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-4 text-base font-black text-slate-950 shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105"
          >
            {t('landing.ctaStartFree')}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-bold text-slate-400">
              URIMAIYALAR OS
            </span>
          </div>
          <div className="text-xs text-slate-600">
            © {new Date().getFullYear()} Urimaiyalar Technologies Pvt. Ltd. {t('landing.footerRights')}
          </div>
          <div className="flex gap-6 text-xs text-slate-500">
            <span className="text-slate-400">{t('landing.madeForBharat')}</span>
          </div>
        </div>
      </footer>

      {/* 22 Indian Languages Selection Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        currentLanguage={language}
        onSelect={onLanguageChange}
        onClose={() => setIsLangModalOpen(false)}
      />
    </div>
  );
}

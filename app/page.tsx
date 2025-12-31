"use client";

import React, { useState } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  BarChart3,
  CheckCircle,
  Phone,
  Menu,
  Smartphone,
  Send,
  Instagram,
  Mail,
  X,
  ShieldCheck,
  Zap,
  HeartHandshake,
  AtSign,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { handleContactForm } from "./actions/contact";

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function MenuCupLanding() {
  const tNav = useTranslations("Header");
  const tHero = useTranslations("Hero");
  const tFeatures = useTranslations("Features");
  const tAbout = useTranslations("About");
  const tPricing = useTranslations("Pricing");
  const tContact = useTranslations("Contact");

  const locale = useLocale();

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsNavOpen(false);
  };

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "mk", label: "Macedonian", flag: "🇲🇰" },
  ];

  const handleLangChange = (lang: string) => {
    document.cookie = `NEXT_LOCALE=${lang}`;
    setIsLangOpen(false);
    window.location.reload();
  };

  async function onFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const formData = new FormData(event.currentTarget);
    const result = await handleContactForm(formData);

    if (!result) {
      setStatus("error");
      return;
    }

    if (result.success) {
      setStatus("success");
      (event.target as HTMLFormElement).reset();
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth overflow-x-hidden">
      {/* --- NAVIGATION --- */}
      <header className="fixed w-full bg-white/80 backdrop-blur-lg z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* LOGO */}
            <div className="flex justify-start items-center">
              <a href="#" className="flex items-center gap-3">
                <img
                  src="/logos/logonav.png"
                  alt="MenuCup Logo"
                  className="h-8 md:h-10 w-auto rounded-md"
                />
              </a>
            </div>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex space-x-8 items-center">
              <button
                onClick={() => scrollTo("features")}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                {tNav("features")}
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                {tNav("whyUs")}
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                {tNav("pricing")}
              </button>
              <button
                onClick={() => scrollTo("contact")}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                {tNav("contact")}
              </button>
            </nav>

            {/* RIGHT ACTIONS (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-sm font-bold text-slate-700 uppercase"
                >
                  <span className="text-lg">
                    {languages.find((l) => l.code === locale)?.flag}
                  </span>
                  {locale}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      isLangOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isLangOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLangChange(lang.code)}
                          className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-indigo-50 transition text-slate-700 font-medium"
                        >
                          <span className="flex items-center gap-3">
                            <span className="text-lg">{lang.flag}</span>
                            {lang.label}
                          </span>
                          {locale === lang.code && (
                            <Check size={14} className="text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => scrollTo("contact")}
                className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
              >
                {tNav("demo")}
              </button>
            </div>

            {/* MOBILE TOGGLE */}
            <div className="md:hidden">
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="p-2 text-slate-600 focus:outline-none"
              >
                {isNavOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {isNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-slate-100 px-4 py-6 space-y-6 shadow-xl"
          >
            <div className="space-y-4">
              <button
                onClick={() => scrollTo("features")}
                className="block w-full text-left font-bold text-slate-600"
              >
                {tNav("features")}
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="block w-full text-left font-bold text-slate-600"
              >
                {tNav("whyUs")}
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="block w-full text-left font-bold text-slate-600"
              >
                {tNav("pricing")}
              </button>
              <button
                onClick={() => scrollTo("contact")}
                className="block w-full text-left font-bold text-slate-600"
              >
                {tNav("contact")}
              </button>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Language
              </p>
              <div className="flex gap-4">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLangChange(lang.code)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition ${
                      locale === lang.code
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                        : "border-slate-100 text-slate-600"
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-bold text-sm uppercase">
                      {lang.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => scrollTo("contact")}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-center uppercase tracking-tight"
            >
              {tNav("demo")}
            </button>
          </motion.div>
        )}
      </header>
      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-gradient-to-b from-indigo-50/50 to-white px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span
              variants={fadeInUp}
              className="inline-block py-1 px-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6"
            >
              {tHero("tag")}
            </motion.span>
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight"
            >
              {tHero("titleTop")} <br />
              <span className="text-indigo-600 italic">
                {tHero("titleBottom")}
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="max-w-xl mx-auto text-base md:text-lg text-slate-600 mb-10 leading-relaxed"
            >
              {tHero("subtitle")}
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => scrollTo("contact")}
                className="px-8 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                {tHero("cta_start")}
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-full font-bold text-lg hover:bg-slate-50 transition-all active:scale-95"
              >
                {tHero("cta_pricing")}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section
        id="features"
        className="py-20 bg-indigo-900 text-white overflow-hidden px-4"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-indigo-300 font-bold uppercase text-sm tracking-widest mb-4 italic">
              {tFeatures("eyebrow")}
            </h2>
            <p className="text-3xl md:text-5xl font-black text-white leading-tight">
              {tFeatures("title")}
            </p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeInUp}
              className="bg-white/10 rounded-3xl p-8 border border-white/10 backdrop-blur-sm"
            >
              <BarChart3 className="h-8 w-8 text-indigo-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">
                {tFeatures("cards.driveRevenue.title")}
              </h3>
              <p className="text-indigo-100/70 text-sm leading-relaxed">
                {tFeatures("cards.driveRevenue.description")}
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="bg-white/10 rounded-3xl p-8 border border-white/10 backdrop-blur-sm"
            >
              <CheckCircle className="h-8 w-8 text-indigo-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">
                {tFeatures("cards.instantUpdates.title")}
              </h3>
              <p className="text-indigo-100/70 text-sm leading-relaxed">
                {tFeatures("cards.instantUpdates.description")}
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="bg-white/10 rounded-3xl p-8 border border-white/10 backdrop-blur-sm"
            >
              <Smartphone className="h-8 w-8 text-indigo-400 mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">
                {tFeatures("cards.frictionlessUX.title")}
              </h3>
              <p className="text-indigo-100/70 text-sm leading-relaxed">
                {tFeatures("cards.frictionlessUX.description")}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- NEW WHY US SECTION --- */}
      <section id="about" className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-indigo-600 font-bold uppercase text-xs tracking-[0.2em] mb-4">
              {tAbout("eyebrow")}
            </h2>
            <p className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              {tAbout("title")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div
                variants={fadeInUp}
                className="flex gap-6 items-start"
              >
                <div className="bg-indigo-50 p-4 rounded-2xl">
                  <ShieldCheck className="text-indigo-600" size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">
                    {tAbout("features.reliable.title")}
                  </h4>
                  <p className="text-slate-600 text-sm">
                    {tAbout("features.reliable.description")}
                  </p>
                </div>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="flex gap-6 items-start"
              >
                <div className="bg-indigo-50 p-4 rounded-2xl">
                  <Zap className="text-indigo-600" size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">
                    {tAbout("features.fast.title")}
                  </h4>
                  <p className="text-slate-600 text-sm">
                    {tAbout("features.fast.description")}
                  </p>
                </div>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="flex gap-6 items-start"
              >
                <div className="bg-indigo-50 p-4 rounded-2xl">
                  <HeartHandshake className="text-indigo-600" size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">
                    {tAbout("features.support.title")}
                  </h4>
                  <p className="text-slate-600 text-sm">
                    {tAbout("features.support.description")}
                  </p>
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="relative"
            >
              <div className="bg-indigo-600 rounded-[2rem] p-4 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
                <img
                  src="logos/logonav.png"
                  className="w-1/2 brightness-200 opacity-20"
                  alt="Background Logo"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                  <p className="text-2xl font-black text-center">
                    {tAbout("testimonial.quote")}
                  </p>
                  <p className="mt-4 font-bold opacity-70">
                    — {tAbout("testimonial.author")}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-16"
          >
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
              {tPricing("title")}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {tPricing("subtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            {/* Monthly Pay */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-bold mb-2 uppercase tracking-widest text-slate-400">
                {tPricing("monthly.label")}
              </h3>
              <div className="text-5xl font-black mb-2 text-slate-900">
                {tPricing("monthly.price")}
              </div>
              <p className="text-sm text-slate-500 mb-6">
                {tPricing("monthly.priceNote")}
              </p>
              <ul className="space-y-4 mb-8 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600" />
                  {tPricing("monthly.features.featOne")}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600" />{" "}
                  {tPricing("monthly.features.featTwo")}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600" />{" "}
                  {tPricing("monthly.features.featThree")}
                </li>
              </ul>
              <button
                onClick={() => scrollTo("contact")}
                className="w-full py-4 bg-white border-2 border-slate-100 rounded-xl font-bold hover:bg-slate-50 transition"
              >
                {tPricing("monthly.cta")}
              </button>
            </motion.div>

            {/* Yearly Pay */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              className="p-8 rounded-3xl border-2 border-indigo-600 bg-white shadow-xl relative scale-105 z-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                {tPricing("yearly.badge")}
              </div>
              <h3 className="text-lg font-bold mb-2 uppercase tracking-widest text-indigo-600">
                {tPricing("yearly.label")}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-5xl font-black text-slate-900">
                  {tPricing("yearly.price")}
                </span>
                <span className="text-lg font-bold text-slate-400">/mo</span>
              </div>
              <p className="text-sm font-bold text-indigo-600 mb-6">
                {tPricing("yearly.priceNote")}
              </p>
              <ul className="space-y-4 mb-8 text-sm text-slate-600">
                <li className="flex items-center gap-2 font-bold text-slate-900">
                  <CheckCircle size={16} className="text-indigo-600" />{" "}
                  {tPricing("yearly.features.featOne")}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600" />{" "}
                  {tPricing("yearly.features.featTwo")}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-600" />{" "}
                  {tPricing("yearly.features.featThree")}
                </li>
              </ul>
              <button
                onClick={() => scrollTo("contact")}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                {tPricing("yearly.cta")}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- CONTACT US SECTION --- */}
      <section id="contact" className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="max-w-3xl mx-auto text-center mb-16"
            initial="hidden"
            whileInView="visible"
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4 text-center">
              {tContact("title")}
            </h2>
            <p className="text-lg text-slate-500">{tContact("subtitle")}</p>
          </motion.div>
          <motion.div
            className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100"
            initial="hidden"
            whileInView="visible"
            variants={fadeInUp}
          >
            <div className="px-6 py-8 sm:p-10">
              <form
                onSubmit={onFormSubmit}
                className="grid grid-cols-1 gap-y-6"
              >
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">
                    {tContact("form.fullName.label")}
                  </label>
                  <input
                    name="fullName"
                    required
                    type="text"
                    className="mt-2 block w-full rounded-xl border-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 px-4 py-4"
                    placeholder={tContact("form.fullName.placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">
                    {tContact("form.phone.label")}
                  </label>
                  <input
                    name="phoneNumber"
                    required
                    type="text"
                    className="mt-2 block w-full rounded-xl border-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 px-4 py-4"
                    placeholder={tContact("form.phone.placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">
                    {tContact("form.email.label")}
                  </label>
                  <input
                    name="email"
                    required
                    type="email"
                    className="mt-2 block w-full rounded-xl border-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 px-4 py-4"
                    placeholder={tContact("form.email.placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-widest">
                    {tContact("form.company.label")}
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    className="mt-2 block w-full rounded-xl border-slate-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-50 px-4 py-4"
                    placeholder={tContact("form.company.placeholder")}
                  />
                </div>
                <div className="pt-4">
                  <button
                    disabled={status === "loading"}
                    type="submit"
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition active:scale-95"
                  >
                    {status === "loading" ? (
                      <>{tContact("form.sending")}</>
                    ) : status === "success" ? (
                      <>{tContact("form.success")}</>
                    ) : (
                      <>
                        {tContact("form.submit")}
                        <Send size={18} className="ml-2" />
                      </>
                    )}
                  </button>
                  {status === "error" && (
                    <p className="text-red-500 text-xs mt-2 text-center">
                      {tContact("form.error")}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER VERSION --- */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="logos/logonav.png"
                className="max-w-[150px] md:max-w-[200px] h-auto"
                alt="Logo"
              />
            </div>
            <p className="max-w-sm text-sm mb-6 leading-relaxed text-slate-500 italic font-medium">
              {tNav("slogan")}
            </p>
            <div className="flex gap-6">
              <a
                href="https://instagram.com/menucup_"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-all hover:scale-110"
              >
                <Instagram size={20} />
              </a>
              <a
                href="mailto:menucup025@gmail.com"
                className="hover:text-white transition-all hover:scale-110"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">
              {tNav("explore")}
            </h4>
            <div className="flex flex-col gap-4 text-sm font-medium">
              <button
                onClick={() => scrollTo("features")}
                className="text-left hover:text-indigo-400 transition"
              >
                {tNav("features")}
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="text-left hover:text-indigo-400 transition"
              >
                {tNav("whyUs")}
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="text-left hover:text-indigo-400 transition"
              >
                {tNav("pricing")}
              </button>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">
              {tNav("contactTwo")}
            </h4>
            <div className="flex flex-col gap-4 text-sm font-medium">
              <div className="flex gap-3 items-center">
                <AtSign size={20} />
                <a
                  href="mailto:menucup025@gmail.com"
                  className="text-indigo-400 font-bold hover:text-white transition-all text-sm block"
                >
                  menucup025@gmail.com
                </a>
              </div>
              <div className="flex gap-3 items-center">
                <Phone size={20} />
                <p className="font-medium">+38978261825</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-900 text-[10px] flex justify-between tracking-widest uppercase font-bold text-slate-600">
          <p>© 2025 MenuCup. {tNav("rights")}</p>
          <p>menucup.com</p>
        </div>
      </footer>
    </div>
  );
}

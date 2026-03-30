import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Leaf,
  Mail,
  MapPin,
  Phone,
  Pill,
  Shield,
  Star,
  Stethoscope,
  Truck,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { submitContactForm, ApiError } from '../lib/api';
import { cn } from '../utils/cn';

type Tone = 'emerald' | 'amber' | 'sky' | 'rose';

interface HighlightCard {
  icon: LucideIcon;
  title: string;
  description: string;
  tone: Tone;
}

// UPDATED CONTENT
const stats = [
  { value: 'Reliable delivery', label: 'across regions in India', note: 'dependable service coverage' },
  { value: '24-48 hrs', label: 'dispatch timeline', note: 'for approved orders' },
  { value: 'Strict quality', label: 'assurance', note: 'across sourcing and handling' },
  { value: '24/7', label: 'customer support', note: 'for order assistance' },
];

// UPDATED CONTENT
const heroSignals = [
  {
    icon: Shield,
    title: 'Verified sourcing',
    description:
      'All products are sourced from certified manufacturers and authorized distributors ensuring authenticity.',
  },
  {
    icon: Stethoscope,
    title: 'Human review',
    description: 'Prescription orders are verified by qualified professionals before approval.',
  },
  {
    icon: Truck,
    title: 'Fast dispatch',
    description: 'Efficient logistics ensure timely and safe delivery.',
  },
];




// UPDATED CONTENT
const trustHighlights: HighlightCard[] = [
  {
    icon: BadgeCheck,
    title: 'Compliance-led operations',
    description:
      'Verified sourcing, prescription-sensitive handling, and operational discipline support dependable fulfillment.',
    tone: 'emerald',
  },
  {
    icon: Shield,
    title: 'Transparent processes',
    description:
      'Clear product information, review visibility, and order communication help customers move forward with confidence.',
    tone: 'rose',
  },
  {
    icon: Clock,
    title: 'Responsive support',
    description:
      'Accessible support and timely updates keep day-to-day pharmacy operations easier to manage.',
    tone: 'amber',
  },
  {
    icon: Building2,
    title: 'Modern usability',
    description:
      'A clean digital interface simplifies ordering for distributors, clinics, retailers, and individual customers.',
    tone: 'sky',
  },
];

// UPDATED CONTENT
const careJourney = [
  {
    step: '01',
    signal: 'Product access',
    metric: 'Browse',
    title: 'Browse products',
    copy: 'Review medicine and healthcare product listings with clear information before placing an order.',
    outcome: 'Customers can evaluate essential details and move ahead with greater confidence.',
    icon: Pill,
  },
  {
    step: '02',
    signal: 'Prescription review',
    metric: 'Upload',
    title: 'Upload prescription',
    copy: 'Upload a valid prescription for applicable medicines so the order can be reviewed before approval.',
    outcome: 'Qualified professionals verify prescription orders before fulfillment.',
    icon: Upload,
  },
  {
    step: '03',
    signal: 'Secure payments',
    metric: 'Razorpay-ready',
    title: 'Secure checkout',
    copy: 'Complete orders through a secure checkout flow designed to support Razorpay integration.',
    outcome: 'Payment handling stays straightforward for customers and adaptable for operations.',
    icon: BadgeCheck,
  },
  {
    step: '04',
    signal: 'Order visibility',
    metric: 'Tracking',
    title: 'Track delivery',
    copy: 'Follow order progress from confirmation to dispatch and final delivery updates.',
    outcome: 'Clear status communication helps reduce uncertainty after checkout.',
    icon: Truck,
  },
];

// UPDATED CONTENT
const careFlowHighlights = [
  'Verified products and clear information support confident ordering.',
  'Prescription uploads are reviewed before approval and fulfillment.',
  'Secure checkout is ready for Razorpay integration when needed.',
];

// UPDATED CONTENT
const careFlowMetrics = [
  { value: '24-48 hrs', label: 'dispatch timeline' },
  { value: '24/7', label: 'customer support' },
];

// UPDATED CONTENT
const serviceCards = [
  {
    icon: Pill,
    title: 'Everyday pharmacy',
    description:
      'Essential medicines and healthcare products for daily needs.',
  },
  {
    icon: Upload,
    title: 'Prescription operations',
    description:
      'Streamlined prescription validation and fulfillment.',
  },
  {
    icon: Leaf,
    title: 'Preventive healthcare',
    description:
      'Wellness and preventive care solutions.',
  },
];

// UPDATED CONTENT
const testimonials = [
  {
    quote:
      'The ordering process is clear, and the focus on verified sourcing helps us place orders with greater confidence.',
    name: 'Distributor, Uttar Pradesh',
    role: 'Bulk procurement partner',
  },
  {
    quote:
      'Prescription handling feels structured and dependable, which is important for day-to-day clinic requirements.',
    name: 'Clinic Owner, Varanasi',
    role: 'Institutional healthcare buyer',
  },
  {
    quote:
      'Support responsiveness and delivery visibility make the platform practical for repeat business.',
    name: 'Retail Partner',
    role: 'Pharmacy operations associate',
  },
];

const toneStyles: Record<Tone, { icon: string; panel: string }> = {
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700',
    panel: 'from-emerald-500/14 via-transparent to-transparent',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    panel: 'from-amber-500/14 via-transparent to-transparent',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-700',
    panel: 'from-rose-500/14 via-transparent to-transparent',
  },
  sky: {
    icon: 'bg-sky-100 text-sky-700',
    panel: 'from-sky-500/14 via-transparent to-transparent',
  },
};

const SectionHeading: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
  invert?: boolean;
}> = ({ eyebrow, title, description, align = 'left', invert = false }) => (
  <div className={cn(align === 'center' && 'mx-auto max-w-3xl text-center')}>
    <div
      className={cn(
        'inline-flex items-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]',
        invert
          ? 'border border-white/15 bg-white/10 text-emerald-200'
          : 'border border-emerald-200 bg-white/80 text-emerald-700',
      )}
    >
      {eyebrow}
    </div>
    <h2
      className={cn(
        'mt-5 text-3xl font-black tracking-tight sm:text-4xl',
        invert ? 'text-white' : 'text-slate-950',
      )}
    >
      {title}
    </h2>
    <p
      className={cn(
        'mt-4 max-w-2xl text-base leading-7',
        invert ? 'text-slate-300' : 'text-slate-600',
        align === 'center' && 'mx-auto',
      )}
    >
      {description}
    </p>
  </div>
);

const ContactForm: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setStatus('error');
      setFeedback('Please fill in all required fields.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setStatus('error');
      setFeedback('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const result = await submitContactForm(form);
      setStatus('success');
      setFeedback(result.message);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setStatus('error');
      setFeedback(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <ScrollReveal>
      <div className="mt-14 rounded-[32px] border border-white/70 bg-white p-8 shadow-[0_26px_60px_-38px_rgba(15,23,42,0.22)]">
        <SectionHeading
          eyebrow="Get in Touch"
          title="Have a question? Send us a message."
          description="Fill out the form below and our team will get back to you."
        />

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-name" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name *</label>
            <input id="contact-name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Your full name" className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email *</label>
            <input id="contact-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-phone" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Phone</label>
            <input id="contact-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91-XXXXXXXXXX" className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-subject" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Subject *</label>
            <input id="contact-subject" name="subject" type="text" value={form.subject} onChange={handleChange} placeholder="How can we help?" className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Message *</label>
            <textarea id="contact-message" name="message" rows={4} value={form.message} onChange={handleChange} placeholder="Tell us more..." className="resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          </div>

          {feedback && (
            <div className={cn(
              'sm:col-span-2 rounded-xl px-4 py-3 text-sm font-medium',
              status === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200',
            )}>
              {feedback}
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" size="lg" className="rounded-full px-8 shadow-[0_20px_40px_-18px_rgba(5,150,105,0.65)]" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </ScrollReveal>
  );
};

export const LandingPage: React.FC = () => {
  return (
    <div className="overflow-hidden bg-[#f4f8f5]">
      <section className="relative isolate overflow-hidden pb-20 pt-10 sm:pt-14">
        <div className="mesh-surface absolute inset-0" />
        <div className="float-slow absolute -right-24 top-8 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
        <div className="float-medium float-delay absolute left-[-6rem] top-40 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:68px_68px] opacity-[0.12]" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <ScrollReveal className="max-w-3xl">
            {/* UPDATED CONTENT */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur">
              <BadgeCheck className="h-4 w-4" />
              Compliance-first pharmaceutical distribution
            </div>

            {/* UPDATED CONTENT */}
            <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Pharmacy care,
              <span className="block text-emerald-700">redefined for modern healthcare delivery.</span>
            </h1>

            {/* UPDATED CONTENT */}
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              KLB Lifesciences Pvt. Ltd. ensures quality medicines through verified sourcing, strict
              compliance, and a seamless ordering experience.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products">
                <Button
                  size="lg"
                  className="rounded-full px-7 shadow-[0_20px_40px_-18px_rgba(5,150,105,0.65)]"
                >
                  Explore Products
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link to="/upload-prescription">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/70 bg-white/70 px-7 text-slate-900 hover:border-emerald-200 hover:bg-white"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Prescription
                </Button>
              </Link>
            </div>

          </ScrollReveal>

          <ScrollReveal delay={140} className="relative">
            <div className="glass-panel relative rounded-[32px] p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  {/* UPDATED CONTENT */}
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Operational Highlights
                  </p>
                  {/* UPDATED CONTENT */}
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    A compliant ordering flow built for dependable fulfillment.
                  </h3>
                </div>
                {/* UPDATED CONTENT */}
                <div className="inline-flex flex-nowrap items-center gap-2 self-start whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50/90 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  Service ready
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-100">
                    <div className="text-3xl font-black tracking-tight text-slate-950">{stat.value}</div>
                    <div className="mt-2 text-sm font-medium text-slate-700">{stat.label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{stat.note}</div>
                  </div>
                ))}
              </div>

            </div>

          </ScrollReveal>
        </div>
      </section>

      <section className="relative pb-18 sm:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {heroSignals.map((signal, index) => {
              const Icon = signal.icon;

              return (
                <ScrollReveal key={signal.title} delay={index * 120} className="h-full">
                  <div className="glass-panel flex h-full items-start gap-4 rounded-[30px] p-6">
                    <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-slate-900">
                        {signal.title}
                      </p>
                      <p className="mt-3 text-base leading-8 text-slate-600">
                        {signal.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <ScrollReveal>
              {/* UPDATED CONTENT */}
              <SectionHeading
                eyebrow="Why KLB Lifesciences"
                title="Trusted pharmaceutical distribution with a modern experience."
                description="KLB Lifesciences combines compliance, transparency, and usability for a seamless ordering journey."
              />

              <div className="glass-panel mt-8 rounded-[30px] p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Design Principle
                </p>
                {/* UPDATED CONTENT */}
                <p className="mt-5 text-2xl font-black leading-tight text-slate-950">
                  Deliver trust through transparency.
                </p>
                {/* UPDATED CONTENT */}
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Every step from product discovery to delivery is designed for clarity, compliance,
                  and confidence.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {/* UPDATED CONTENT */}
                  {[
                    'Verified sourcing',
                    'Prescription validation',
                    'Secure checkout',
                    'Delivery visibility',
                  ].map((pill) => (
                    <div
                      key={pill}
                      className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      {pill}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <div className="grid gap-5 sm:grid-cols-2">
              {trustHighlights.map((item, index) => {
                const Icon = item.icon;
                const tone = toneStyles[item.tone];

                return (
                  <ScrollReveal key={item.title} delay={index * 110}>
                    <div
                      className={cn(
                        'relative overflow-hidden rounded-[30px] border border-white/70 bg-white/75 p-6 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.18)]',
                        'before:absolute before:inset-0 before:bg-gradient-to-br before:content-[""]',
                        tone.panel,
                      )}
                    >
                      <div className="relative">
                        <div className={cn('inline-flex rounded-2xl p-3', tone.icon)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#031120] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_24%)]" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 xl:grid-cols-[0.88fr_1.12fr] xl:items-start">
            <ScrollReveal className="xl:sticky xl:top-28">
              {/* UPDATED CONTENT */}
              <SectionHeading
                eyebrow="Ordering Flow"
                title="A clear path from product discovery to delivery."
                description="The journey is structured around browsing, prescription review, secure checkout, and delivery tracking."
                invert
              />

              <div className="mt-8 rounded-[32px] border border-white/10 bg-white/8 p-7 shadow-[0_40px_90px_-42px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="space-y-3">
                  {careFlowHighlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-4"
                    >
                      <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/14 text-emerald-200">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-7 text-slate-200">{highlight}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {careFlowMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-[24px] border border-white/8 bg-slate-950/55 px-5 py-5"
                    >
                      <div className="text-3xl font-black tracking-tight text-white">{metric.value}</div>
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/upload-prescription">
                    <Button
                      size="lg"
                      className="rounded-full px-6 shadow-[0_20px_42px_-24px_rgba(5,150,105,0.72)]"
                    >
                      {/* UPDATED CONTENT */}
                      Upload Prescription
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full border-white/20 bg-white/8 px-6 text-white hover:bg-white hover:text-slate-950"
                    >
                      {/* UPDATED CONTENT */}
                      Explore Products
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <div className="relative">
              <div className="hidden sm:absolute sm:left-[22px] sm:top-8 sm:block sm:h-[calc(100%-4rem)] sm:w-px sm:bg-gradient-to-b sm:from-emerald-300/0 sm:via-emerald-300/55 sm:to-sky-300/0" />

              <div className="space-y-5">
                {careJourney.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <ScrollReveal key={item.step} delay={index * 120}>
                      <div className="relative flex gap-4 sm:gap-6">
                        <div className="hidden pt-2 sm:flex sm:flex-col sm:items-center">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/25 bg-slate-950 text-sm font-semibold text-emerald-200 shadow-[0_0_0_10px_rgba(3,17,32,1)]">
                            {item.step}
                          </div>
                        </div>

                        <div className="flex-1 rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.72))] p-6 shadow-[0_30px_80px_-42px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200 ring-1 ring-white/10">
                                <Icon className="h-6 w-6" />
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                                  {item.signal}
                                </div>
                                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                                  {item.title}
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 sm:hidden">
                                Step {item.step}
                              </div>
                              <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                {item.metric}
                              </div>
                            </div>
                          </div>

                          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">{item.copy}</p>

                          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-emerald-200">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <p className="text-sm leading-7 text-slate-200">{item.outcome}</p>
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            {/* UPDATED CONTENT */}
            <SectionHeading
              eyebrow="Services"
              title="Pharmaceutical services tailored for everyday and prescription needs."
              description="KLB Lifesciences supports routine healthcare requirements with compliant ordering and dependable fulfillment."
              align="center"
            />
          </ScrollReveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {serviceCards.map((service, index) => {
              const Icon = service.icon;

              return (
                <ScrollReveal key={service.title} delay={index * 100}>
                  <div className="group h-full rounded-[32px] border border-white/70 bg-white p-7 shadow-[0_26px_60px_-38px_rgba(15,23,42,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_70px_-38px_rgba(15,23,42,0.28)]">
                    <div className="inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                      {service.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{service.description}</p>
                    <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      Learn more
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <ScrollReveal>
              {/* UPDATED CONTENT */}
              <SectionHeading
                eyebrow="Partner Feedback"
                title="Professional feedback grounded in reliability and service."
                description="The platform experience is designed to support distributors, clinics, and retail partners with clarity and consistency."
              />

              {/* UPDATED CONTENT */}
              <div className="mt-8 rounded-[32px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-8 text-white shadow-[0_40px_90px_-40px_rgba(5,150,105,0.6)]">
                <div className="max-w-md">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-100">
                    Client Deployment
                  </p>
                  <h3 className="mt-4 text-3xl font-black tracking-tight">
                    A website prepared for real pharmaceutical operations.
                  </h3>
                  <p className="mt-4 text-base leading-7 text-emerald-50">
                    The experience now reflects compliance-minded messaging, dependable fulfillment,
                    and enterprise-ready communication.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/products">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="rounded-full bg-white text-slate-950 hover:bg-slate-100"
                    >
                      Explore Products
                    </Button>
                  </Link>
                  <Link to="/upload-prescription">
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full border-white/70 bg-white/10 text-white hover:bg-white hover:text-emerald-700"
                    >
                      Upload Prescription
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid items-start gap-5 md:grid-cols-3">
              {testimonials.map((item, index) => (
                <ScrollReveal key={item.name} delay={index * 100}>
                  <div className="glass-panel rounded-[28px] p-6">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, starIndex) => (
                        <Star key={`${item.name}-${starIndex}`} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-7 text-slate-600">"{item.quote}"</p>
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="font-semibold text-slate-950">{item.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {item.role}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          <ContactForm />

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { icon: Phone, label: 'Phone', value: '+91-XXXXXXXXXX' },
              { icon: Mail, label: 'Email', value: 'support@klblifesciences.com' },
              { icon: MapPin, label: 'Address', value: 'Lakshmi Kund, Varanasi, Uttar Pradesh, India' },
            ].map((contact, index) => {
              const Icon = contact.icon;

              return (
                <ScrollReveal key={contact.label} delay={index * 90}>
                  <div className="rounded-[24px] border border-white/70 bg-white px-5 py-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.18)]">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {contact.label}
                        </div>
                        <div className="mt-1 font-semibold text-slate-950">{contact.value}</div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

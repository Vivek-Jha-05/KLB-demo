import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ScrollReveal } from '../ui/ScrollReveal';
import logo from '../../assets/logo.jpeg';

const quickLinks = [
  { label: 'All Products', to: '/products' },
  { label: 'Upload Prescription', to: '/upload-prescription' },
  { label: 'Track Order', to: '/dashboard' },
];

const categories = [
  { label: 'Pain Relief', to: '/products?category=Pain Relief' },
  { label: 'Vitamins & Supplements', to: '/products?category=Vitamins' },
  { label: 'Diabetes Care', to: '/products?category=Diabetes Care' },
  { label: 'Heart Health', to: '/products?category=Heart Health' },
];

const socialLinks = [
  { label: 'Website', icon: Globe },
  { label: 'WhatsApp', icon: MessageCircle },
  { label: 'Instagram', icon: Camera },
];

export const Footer: React.FC = () => {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-300">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_24%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.85fr_0.85fr_1fr]">
          <ScrollReveal className="h-full">
            <div className="h-full rounded-[32px] border border-white/10 bg-white/8 p-7 backdrop-blur-sm">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_20px_40px_-22px_rgba(5,150,105,0.8)]">
                  <img src={logo} alt="KLB Lifesciences Pvt. Ltd." className='rounded-full'/>
                </div>
                <div>
                  {/* UPDATED CONTENT */}
                  <div className="text-xl font-black tracking-tight text-white">KLB Lifesciences Pvt. Ltd.</div>
                  {/* UPDATED CONTENT */}
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    Pharmaceutical distribution
                  </div>
                </div>
              </Link>

              {/* UPDATED CONTENT */}
              <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
                KLB Lifesciences Pvt. Ltd. delivers high-quality pharmaceutical products with a
                focus on compliance, reliability, and customer satisfaction.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {/* UPDATED CONTENT */}
                {['Verified sourcing', 'Quality assurance', 'Customer support'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex gap-3">
                {socialLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href="#"
                      aria-label={item.label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8 text-slate-200 transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:text-emerald-300"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={80} className="h-full">
            <div className="h-full rounded-[28px] border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Quick Links
              </h3>
              <ul className="mt-6 space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="group flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/8 hover:text-white"
                    >
                      <span>{link.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160} className="h-full">
            <div className="h-full rounded-[28px] border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Categories
              </h3>
              <ul className="mt-6 space-y-3">
                {categories.map((category) => (
                  <li key={category.to}>
                    <Link
                      to={category.to}
                      className="group flex items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/8 hover:text-white"
                    >
                      <span>{category.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={240} className="h-full">
            <div className="h-full rounded-[28px] border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Contact
              </h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-200">
                <li className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3">
                  <Phone className="h-4 w-4 text-emerald-300" />
                  {/* UPDATED CONTENT */}
                  <span>+91-XXXXXXXXXX</span>
                </li>
                <li className="flex items-center gap-3 rounded-2xl bg-white/6 px-4 py-3">
                  <Mail className="h-4 w-4 text-emerald-300" />
                  {/* UPDATED CONTENT */}
                  <span>support@klblifesciences.com</span>
                </li>
                <li className="flex items-start gap-3 rounded-2xl bg-white/6 px-4 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-emerald-300" />
                  {/* UPDATED CONTENT */}
                  <span>Lakshmi Kund, Varanasi, Uttar Pradesh, India</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
          {/* UPDATED CONTENT */}
          <p>&copy; {new Date().getFullYear()} KLB Lifesciences Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <a href="#" className="transition hover:text-emerald-300">Privacy Policy</a>
            <a href="#" className="transition hover:text-emerald-300">Terms of Service</a>
            <a href="#" className="transition hover:text-emerald-300">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

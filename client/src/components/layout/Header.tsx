import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  HeartPulse,
  LogOut,
  Menu,
  Package,
  Pill,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { cn } from '../../utils/cn';
import { AuthModal } from '../auth/AuthModal';
import { Button } from '../ui/Button';
import logo from '../../assets/logo.jpeg';

// UPDATED CONTENT
const primaryLinks = [
  { label: 'Products', to: '/products' },
  { label: 'Upload Prescription', to: '/upload-prescription' },
];

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const headerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuthStore();
  const { getItemCount } = useCartStore();

  const cartCount = user ? getItemCount(user.id) : 0;
  const dashboardHref = user?.role === 'admin' ? '/admin' : '/dashboard';
  const firstName = user?.name?.split(' ')[0] || 'Account';

  useEffect(() => {
    setIsMenuOpen(false);
    setIsHeaderVisible(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      setIsHeaderVisible(true);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) {
      return;
    }

    const updateHeight = () => {
      setHeaderHeight(node.getBoundingClientRect().height);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(node);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 12);

      if (currentScrollY <= 24) {
        setIsHeaderVisible(true);
      } else if (currentScrollY < lastScrollY - 6) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY + 6 && !isMenuOpen) {
        setIsHeaderVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div aria-hidden style={{ height: headerHeight }} />
      <header
        ref={headerRef}
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-transform duration-300 ease-out',
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full',
        )}
      >
        <div
          className={cn(
            'border-b border-white/50 bg-[#f4f8f5]/85 backdrop-blur-2xl transition-shadow duration-300',
            isScrolled && 'shadow-[0_18px_44px_-32px_rgba(15,23,42,0.45)]',
          )}
        >

          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full  text-white shadow-[0_20px_40px_-22px_rgba(5,150,105,0.8)]">
                  {/* UPDATED CONTENT */}
                  <img src={logo} alt="KLB Lifesciences Pvt. Ltd." className='rounded-full'/>
                </div>
                <div className="min-w-0">
                  {/* UPDATED CONTENT */}
                  <div className="text-xl font-black tracking-tight text-slate-950 sm:text-xl"><span className='text-orange-500'>K</span>LB</div>
                  {/* UPDATED CONTENT */}
                  <div className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                    LifeSciences Pvt. Ltd.
                  </div>
                </div>
              </Link>

              <form onSubmit={handleSearch} className="hidden flex-1 lg:flex lg:max-w-xl">
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search medicines, health products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-white/70 bg-white/80 py-3 pl-12 pr-4 text-sm text-slate-700 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] outline-none transition placeholder:text-slate-400 focus:border-emerald-200 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </form>

              <div className="hidden items-center gap-3 md:flex">
                <nav className="flex items-center gap-1 rounded-full border border-white/70 bg-white/80 p-1 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.25)]">
                  {primaryLinks.map((link) => {
                    const isActive = location.pathname === link.to;

                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition',
                          isActive
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                {isAuthenticated && user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                      location.pathname.startsWith('/admin')
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-white/70 bg-white/80 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700',
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                {isAuthenticated && user?.role !== 'admin' && (
                  <Link
                    to="/cart"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] transition hover:-translate-y-0.5 hover:text-emerald-700"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {isAuthenticated ? (
                  <div className="group relative">
                    <button className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-left shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] transition hover:-translate-y-0.5 hover:border-emerald-200">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                        <User className="h-4.5 w-4.5" />
                      </div>
                      <div className="hidden lg:block">
                        <div className="text-sm font-semibold text-slate-900">{firstName}</div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          {user?.role === 'admin' ? 'Admin Access' : 'Customer Account'}
                        </div>
                      </div>
                    </button>

                    <div className="pointer-events-none absolute right-0 top-full mt-3 w-64 translate-y-2 rounded-[28px] border border-white/70 bg-white/92 p-2 opacity-0 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-all group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <div className="rounded-3xl bg-slate-950 px-4 py-3 text-white">
                        <div className="text-sm font-semibold">{user?.name}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                          {user?.role === 'admin' ? 'Admin workspace' : 'Care dashboard'}
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <Link
                          to={dashboardHref}
                          className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <span className="flex items-center gap-3">
                            {user?.role === 'admin' ? (
                              <Shield className="h-4 w-4" />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                            {user?.role === 'admin' ? 'Open Admin Panel' : 'My Dashboard'}
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>

                        {user?.role !== 'admin' && (
                          <Link
                            to="/cart"
                            className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <span className="flex items-center gap-3">
                              <ShoppingCart className="h-4 w-4" />
                              Cart Summary
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                              {cartCount} items
                            </span>
                          </Link>
                        )}

                        <Link
                          to="/upload-prescription"
                          className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <span className="flex items-center gap-3">
                            <HeartPulse className="h-4 w-4" />
                            Upload Prescription
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-rose-600 transition hover:bg-rose-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="rounded-full px-6 shadow-[0_20px_42px_-24px_rgba(5,150,105,0.72)]"
                  >
                    Sign In
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3 md:hidden">
                {isAuthenticated && user?.role !== 'admin' && (
                  <Link
                    to="/cart"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)]"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)]"
                  aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="mt-4 lg:hidden">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search medicines, health products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-white/70 bg-white/80 py-3 pl-12 pr-4 text-sm text-slate-700 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] outline-none transition placeholder:text-slate-400 focus:border-emerald-200 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              </div>
            </form>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-white/60 bg-white/55 backdrop-blur-xl md:hidden">
            <div className="mx-auto max-w-7xl px-4 pb-5 pt-4 sm:px-6">
              <nav className="space-y-3 rounded-[28px] border border-white/80 bg-white/85 p-4 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.32)]">
                {primaryLinks.map((link) => {
                  const isActive = location.pathname === link.to;

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition',
                        isActive
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700',
                      )}
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  );
                })}

                {isAuthenticated && (
                  <Link
                    to={dashboardHref}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <span>{user?.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}

                {isAuthenticated ? (
                  <div className="rounded-[24px] bg-slate-950 px-4 py-4 text-white">
                    <div className="text-sm font-semibold">{user?.name}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      {user?.role === 'admin' ? 'Admin access' : 'Customer account'}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full rounded-full py-3"
                  >
                    Sign In
                  </Button>
                )}
              </nav>
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

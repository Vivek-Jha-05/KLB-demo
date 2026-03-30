import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-x-hidden bg-transparent">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-20 h-[520px] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_38%),radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.12),transparent_24%),radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.1),transparent_22%)]"
      />
      <Header />
      <main className="relative flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

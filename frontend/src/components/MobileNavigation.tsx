'use client';

import React, { useState } from 'react';
import { Menu, X, Home, Briefcase, Users, MessageSquare, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/freelancers', icon: Users, label: 'Freelancers' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-theme-card rounded-lg shadow-lg border border-theme-border"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile navigation drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-theme-bg shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-theme-heading">StellarMarket</h2>
            <button
              onClick={closeMenu}
              className="p-1 rounded-lg hover:bg-theme-bg-secondary"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-stellar-blue/10 text-stellar-blue border-r-2 border-stellar-blue'
                      : 'text-theme-text hover:bg-theme-bg-secondary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
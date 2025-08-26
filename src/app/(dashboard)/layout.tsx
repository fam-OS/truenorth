'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { PresentationChartBarIcon } from '@heroicons/react/24/outline';

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`${
        isActive
          ? 'bg-gray-100 text-gray-900'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
    >
      {children}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">TrueNorth</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink href="/tasks">
                  <ClipboardDocumentListIcon className="mr-3 h-5 w-5" />
                  Tasks
                </NavLink>
                <NavLink href="/organizations">
                  <BuildingOfficeIcon className="mr-3 h-5 w-5" />
                  My Organizations
                </NavLink>
                <NavLink href="/business-units">
                  <BuildingStorefrontIcon className="mr-3 h-5 w-5" />
                  Business Units
                </NavLink>
                <NavLink href="/stakeholders">
                  <UserGroupIcon className="mr-3 h-5 w-5" />
                  Stakeholders
                </NavLink>
                <NavLink href="/ops-reviews">
                  <PresentationChartBarIcon className="mr-3 h-5 w-5" />
                  Ops Reviews
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
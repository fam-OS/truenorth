"use client";

import DashboardLayout from './(dashboard)/layout';
import DashboardPage from './(dashboard)/page';

export default function Home() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
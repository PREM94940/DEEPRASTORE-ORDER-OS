'use client';

import { useState } from 'react';
import StaffManagement from './staff-management';
import BusinessConfig from './business-config';
import StartupResetWizard from './startup-reset-wizard';
import OverviewMetrics from './overview-metrics';

export default function FounderDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'staff' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          Staff Management
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'config' ? 'border-blue-500 text-blue-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
        >
          Business Configuration
        </button>
        <button 
          onClick={() => setActiveTab('reset')}
          className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'reset' ? 'border-red-500 text-red-500' : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-red-500/50'}`}
        >
          Startup Reset Wizard
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'dashboard' && <OverviewMetrics />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'config' && <BusinessConfig />}
        {activeTab === 'reset' && <StartupResetWizard />}
      </div>
    </div>
  );
}

import React from 'react';
import { getBugs } from '@/app/(staff)/actions/bugs';

export const dynamic = 'force-dynamic';

export default async function BugsPage() {
  const bugs = await getBugs();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bug Registry</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700">
          Report Bug
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bug ID / Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source / Module</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {bugs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No bugs reported yet. Pilot is running smoothly!
                </td>
              </tr>
            ) : (
              bugs.map((bug: any) => (
                <tr key={bug.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{bug.businessId}</div>
                    <div className="text-sm text-slate-500">{new Date(bug.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bug.severity === 'P0' ? 'bg-red-100 text-red-800' :
                      bug.severity === 'P1' ? 'bg-orange-100 text-orange-800' :
                      bug.severity === 'P2' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {bug.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{bug.source}</div>
                    <div className="text-sm text-slate-500">{bug.module}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 max-w-md truncate">{bug.description}</div>
                    <div className="text-xs text-slate-500 mt-1">Reported by: {bug.reportedBy}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bug.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                      bug.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {bug.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

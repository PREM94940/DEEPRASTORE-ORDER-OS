'use client';

import { useState, useEffect } from 'react';
import { 
  getStaffMembersAction, 
  createStaffMemberAction, 
  updateStaffRoleAction, 
  toggleStaffStatusAction, 
  deleteStaffMemberAction, 
  resetStaffPasswordAction, 
  forceLogoutStaffAction 
} from '@/app/(staff)/actions/founder';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'STAFF', password: '' });

  const [errorMsg, setErrorMsg] = useState('');

  const loadStaff = async () => {
    console.log('loadStaff started');
    setIsLoading(true);
    setErrorMsg('');
    try {
      console.log('calling getStaffMembersAction...');
      const res = await getStaffMembersAction();
      console.log('getStaffMembersAction returned:', res);
      if (res.success) {
        setStaffList(res.data || []);
      } else {
        console.error('getStaffMembersAction error:', res.error);
        setErrorMsg(res.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('getStaffMembersAction exception:', err);
      setErrorMsg(err.message || 'Network error');
    } finally {
      console.log('loadStaff finally block');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await createStaffMemberAction(newStaff);
    if (res.success) {
      setShowAddForm(false);
      setNewStaff({ name: '', email: '', role: 'STAFF', password: '' });
      loadStaff();
    } else {
      setErrorMsg(res.error || 'Failed to add staff');
    }
  };

  const handleRoleChange = async (email: string, role: string) => {
    setErrorMsg('');
    const res = await updateStaffRoleAction(email, role);
    if (res.success) loadStaff();
    else setErrorMsg(res.error || 'Failed to update role');
  };

  const handleToggleStatus = async (email: string, isActive: boolean) => {
    setErrorMsg('');
    const res = await toggleStaffStatusAction(email, !isActive);
    if (res.success) loadStaff();
    else setErrorMsg(res.error || 'Failed to update status');
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${email}?`)) return;
    setErrorMsg('');
    const res = await deleteStaffMemberAction(email);
    if (res.success) loadStaff();
    else setErrorMsg(res.error || 'Failed to delete staff');
  };

  const handleResetPassword = async (email: string) => {
    const newPass = prompt(`Enter new password for ${email} (leave blank to send reset email):`);
    if (newPass === null) return; // Cancelled
    setErrorMsg('');
    const res = await resetStaffPasswordAction(email, newPass || undefined);
    if (res.success) {
      // Do nothing, success
    } else setErrorMsg(res.error || 'Failed to reset password');
  };

  const handleForceLogout = async (email: string) => {
    setErrorMsg('');
    const res = await forceLogoutStaffAction(email);
    if (res.success) {
       // Do nothing
    } else setErrorMsg(res.error || 'Failed to force logout');
  };

  if (isLoading) return <div className="text-zinc-500 py-10 text-center">Loading Staff Data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Staff Management</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl">
          {errorMsg}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddStaff} className="bg-[#111] border border-zinc-800 p-6 rounded-xl space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Add New Staff Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Full Name *</label>
              <input type="text" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Email Address *</label>
              <input type="email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Role *</label>
              <select required value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none">
                <option value="FOUNDER">FOUNDER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SALES">SALES</option>
                <option value="PRODUCTION">PRODUCTION</option>
                <option value="FINANCE">FINANCE</option>
                <option value="SUPPORT">SUPPORT</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Set Password (leave blank to email invite)</label>
              <input type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors">
              Create User
            </button>
          </div>
        </form>
      )}

      <div className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium">Name & Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {staffList.map((staff) => (
              <tr key={staff.email} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-zinc-100 font-medium">{staff.name}</div>
                  <div className="text-xs text-zinc-500">{staff.email}</div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={staff.role} 
                    onChange={(e) => handleRoleChange(staff.email, e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="FOUNDER">FOUNDER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SALES">SALES</option>
                    <option value="PRODUCTION">PRODUCTION</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="SUPPORT">SUPPORT</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleToggleStatus(staff.email, staff.isActive)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${staff.isActive ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                  >
                    {staff.isActive ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => handleForceLogout(staff.email)} className="text-xs font-medium text-amber-500 hover:text-amber-400">Force Logout</button>
                  <button onClick={() => handleResetPassword(staff.email)} className="text-xs font-medium text-blue-500 hover:text-blue-400">Reset Pass</button>
                  <button onClick={() => handleDelete(staff.email)} className="text-xs font-medium text-red-500 hover:text-red-400">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

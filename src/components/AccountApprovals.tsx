import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/auth';
import type { AuthUser } from '../lib/auth';

export default function AccountApprovals() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState<number | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiRequest<{ users: AuthUser[] }>('/api/admin/users').then(result => {
      if (!cancelled) setUsers(result.users);
    }).catch(error => {
      if (!cancelled) setError(error instanceof Error ? error.message : 'Unable to load accounts.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [revision]);

  const approve = async (user: AuthUser) => {
    setApproving(user.id);
    setError('');
    try {
      await apiRequest(`/api/admin/users/${user.id}/approve`, {});
      setUsers(previous => previous.filter(account => account.id !== user.id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Approval failed.');
    } finally {
      setApproving(null);
    }
  };

  return <section className="space-y-4">
    <div>
      <h2 className="text-xl font-bold text-[#264653]">Account approvals</h2>
      <p className="text-sm text-[#6B8EA0]">Verify each person's school identity before approving staff access. Showing up to 100 pending accounts.</p>
    </div>
    {error && <div role="alert" className="p-3 rounded-xl bg-[#FEF0EE] text-sm text-[#E76F51]">{error} <button className="underline" onClick={() => setRevision(value => value + 1)}>Try again</button></div>}
    {loading ? <p className="text-sm text-[#6B8EA0]">Loading accounts…</p> : users.length === 0 && !error ? <p className="p-5 bg-white rounded-2xl border border-[#E8EDF0] text-sm text-[#6B8EA0]">No accounts awaiting approval.</p> :
      users.map(user => <div key={user.id} className="flex flex-wrap gap-4 items-center justify-between p-4 bg-white rounded-2xl border border-[#E8EDF0]">
        <div><p className="font-semibold text-[#264653]">{user.name}</p><p className="text-sm text-[#6B8EA0]">{user.email} · {user.role}</p></div>
        <button disabled={approving !== null} onClick={() => approve(user)} className="px-4 py-2 rounded-xl bg-[#9B5DE5] text-white text-sm font-semibold disabled:opacity-60">{approving === user.id ? 'Approving…' : 'Approve account'}</button>
      </div>)}
  </section>;
}

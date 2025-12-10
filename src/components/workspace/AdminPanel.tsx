import React, { useEffect, useState } from 'react';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, RefreshCw, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UserWithRole { id: string; email: string; role: AppRole; created_at: string; }

export const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('id, email, created_at');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role as AppRole]) || []);
    setUsers((profiles || []).map(p => ({ id: p.id, email: p.email || 'Unknown', role: roleMap.get(p.id) || 'user', created_at: p.created_at })));
    setLoading(false);
  };

  useEffect(() => { if (isAdmin()) fetchUsers(); }, []);

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('user_id', userId);
    if (error) toast.error('Failed'); else { toast.success(`Role updated to ${newRole}`); setEditingUser(null); fetchUsers(); }
  };

  const getRoleBadgeClass = (role: AppRole) => role === 'admin' ? 'role-admin' : role === 'developer' ? 'role-developer' : 'role-user';
  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (!isAdmin()) return <div className="p-6 text-center"><Shield className="w-12 h-12 text-destructive mx-auto mb-4" /><h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2><p className="text-muted-foreground">Admin access required.</p></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Users className="w-6 h-6 text-primary" />User Management</h1><p className="text-muted-foreground">Manage user roles</p></div>
        <button onClick={fetchUsers} className="btn-workspace-secondary"><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />Refresh</button>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users..." className="input-workspace pl-10" /></div>

      <div className="card-workspace overflow-hidden p-0">
        <table className="w-full">
          <thead><tr className="border-b border-[hsl(var(--workspace-border))] bg-secondary/30"><th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Email</th><th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Role</th><th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Joined</th><th className="text-right px-4 py-3 text-sm font-semibold text-foreground">Actions</th></tr></thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-[hsl(var(--workspace-border))]/50 hover:bg-secondary/20">
                <td className="px-4 py-3 text-sm text-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  {editingUser === user.id ? (
                    <select value={user.role} onChange={(e) => updateUserRole(user.id, e.target.value as AppRole)} onBlur={() => setEditingUser(null)} className="input-workspace py-1 text-sm" autoFocus>
                      <option value="user">User</option><option value="developer">Developer</option><option value="admin">Admin</option>
                    </select>
                  ) : <span className={cn("role-badge", getRoleBadgeClass(user.role))}>{user.role}</span>}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => setEditingUser(user.id)} className="text-sm text-primary hover:underline">Change Role</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <div className="text-center py-8 text-muted-foreground">No users found</div>}
      </div>

      <div className="card-workspace">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20"><h4 className="font-medium text-destructive mb-2">Admin</h4><ul className="text-sm text-muted-foreground space-y-1"><li>• Full access</li><li>• Manage users</li><li>• Delete projects</li></ul></div>
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20"><h4 className="font-medium text-primary mb-2">Developer</h4><ul className="text-sm text-muted-foreground space-y-1"><li>• Create/edit projects</li><li>• Full code access</li></ul></div>
          <div className="p-4 rounded-lg bg-[hsl(var(--role-user))]/10 border border-[hsl(var(--role-user))]/20"><h4 className="font-medium text-[hsl(var(--role-user))] mb-2">User</h4><ul className="text-sm text-muted-foreground space-y-1"><li>• View only</li><li>• No editing</li></ul></div>
        </div>
      </div>
    </div>
  );
};

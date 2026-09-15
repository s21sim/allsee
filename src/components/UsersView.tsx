import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Mail,
  Clock
} from 'lucide-react';
import { UserAccount } from '../types';

interface UsersViewProps {
  users: UserAccount[];
  onAddUser: (user: UserAccount) => void;
  onUpdateUser: (id: string, user: Partial<UserAccount>) => void;
  onDeleteUser: (id: string) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [username, setUsername] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<UserAccount['role']>('operator');

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setEmail('');
    setRole('operator');
    setShowAddModal(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setShowAddModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    if (editingUser) {
      onUpdateUser(editingUser.id, {
        username: username.trim(),
        name: name.trim() || username,
        email: email.trim(),
        role,
      });
    } else {
      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        username: username.trim(),
        name: name.trim() || username,
        email: email.trim() || `${username}@allsee.local`,
        role,
        lastLogin: 'Just registered',
        active: true,
      };
      onAddUser(newUser);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Operator Accounts & Permissions (/user)
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage station control operators, guest listeners, and administrative access
          </p>
        </div>

        <button
          id="btn-add-user-modal"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Operator</span>
        </button>
      </div>

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center font-mono font-bold text-white text-sm">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {user.name}
                    </h3>
                    <span className="text-xs font-mono text-emerald-400">
                      @{user.username}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                    user.role === 'admin'
                      ? 'bg-red-950 border-red-700/60 text-red-300'
                      : user.role === 'operator'
                        ? 'bg-emerald-950 border-emerald-700/60 text-emerald-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-neutral-400 font-mono">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Last Active: {user.lastLogin}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer text-neutral-400 text-[11px]">
                <input
                  type="checkbox"
                  checked={user.active}
                  onChange={(e) =>
                    onUpdateUser(user.id, { active: e.target.checked })
                  }
                  className="rounded border-neutral-700 bg-neutral-800 text-emerald-500 focus:ring-0"
                />
                <span>{user.active ? 'Active' : 'Disabled'}</span>
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(user)}
                  className="p-1.5 text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-lg transition-colors"
                  title="Edit user role"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {users.length > 1 && (
                  <button
                    onClick={() => onDeleteUser(user.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-950 border border-neutral-800 rounded-lg transition-colors"
                    title="Remove user"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl text-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Role Security & Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-neutral-300">
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
            <h4 className="font-bold text-red-400 uppercase">Administrator</h4>
            <p className="text-neutral-400 text-[11px]">
              Full control: Asterisk reload, node host reboot, hardware shutdown, AMI credentials, and user management.
            </p>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
            <h4 className="font-bold text-emerald-400 uppercase">Operator</h4>
            <p className="text-neutral-400 text-[11px]">
              Full operational control: Connect/disconnect nodes (*1, *2, *3, *76), automated scanner, and DTMF keying.
            </p>
          </div>
          <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
            <h4 className="font-bold text-neutral-400 uppercase">Monitor (Read-Only)</h4>
            <p className="text-neutral-400 text-[11px]">
              Listen-only access: Monitor live audio stream, view active links and activity logs without transmitting or changing configurations.
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                {editingUser ? 'Edit Operator Account' : 'Add New Operator'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. k6operator"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Full Name / Operator Call</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe (K6ABC)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Email Address</label>
                <input
                  type="email"
                  placeholder="op@station.ham"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-mono">Permission Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserAccount['role'])}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 outline-none"
                >
                  <option value="operator">Operator (Connect, Scan & Key PTT)</option>
                  <option value="admin">Administrator (Full Node Host Access)</option>
                  <option value="monitor">Monitor (Read-Only Audio & View)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-neutral-300 hover:bg-neutral-800 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Save Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

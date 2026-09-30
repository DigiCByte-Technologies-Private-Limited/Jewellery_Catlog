import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { UserPlus, UserX, UserCheck } from 'lucide-react';

export function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('SALES_STAFF');

  // Fetch users
  const { data: response, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll({ limit: 50 });
      return res.data;
    },
  });

  const users = response?.data || [];

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ type: 'success', title: 'User Created', message: 'Staff member account activated' });
      setIsModalOpen(false);
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to create user' });
    },
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ type: 'success', title: 'Status Changed', message: 'User status updated' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to change status' });
    },
  });

  const columns = [
    {
      header: 'Staff Member',
      cell: (r: any) => (
        <div>
          <div className="font-semibold text-slate-900">{r.fullName || 'No Name'}</div>
          <div className="text-xs text-slate-500 font-mono">{r.email}</div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (r: any) => (
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
          {r.role}
        </span>
      ),
    },
    {
      header: 'Phone',
      cell: (r: any) => r.phone || '—',
    },
    {
      header: 'Status',
      cell: (r: any) => (
        <Badge variant={r.isActive ? 'success' : 'danger'}>
          {r.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      header: 'Last Login',
      cell: (r: any) => (r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString() : 'Never'),
    },
    {
      header: 'Actions',
      cell: (r: any) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            title={r.isActive ? 'Deactivate' : 'Activate'}
            onClick={() => toggleMutation.mutate(r.id)}
          >
            {r.isActive ? (
              <UserX className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff & Role Management</h1>
          <p className="text-slate-500 text-sm">Manage employee permissions, showroom staff, and system access</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add Staff Member
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={users} isLoading={isLoading} />
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Staff Account"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!email || !password) {
                  toast({ type: 'warning', title: 'Validation', message: 'Email and password required' });
                  return;
                }
                createMutation.mutate({ email, password, fullName, phone, role });
              }}
              isLoading={createMutation.isPending}
            >
              Create Account
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="staff@jewellery.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Temporary Password *"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Full Name"
            placeholder="e.g. Ramesh Kumar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Phone"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Select
            label="Role Assignment"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { label: 'Sales / Showroom Staff', value: 'SALES_STAFF' },
              { label: 'Catalog Manager', value: 'CATALOG_MANAGER' },
              { label: 'Pricing Manager', value: 'PRICING_MANAGER' },
              { label: 'Inventory Manager', value: 'INVENTORY_MANAGER' },
              { label: 'Store Manager', value: 'STORE_MANAGER' },
              { label: 'Accountant', value: 'ACCOUNTANT' },
              { label: 'Auditor (Read-Only)', value: 'AUDITOR' },
              { label: 'Super Administrator', value: 'SUPER_ADMIN' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

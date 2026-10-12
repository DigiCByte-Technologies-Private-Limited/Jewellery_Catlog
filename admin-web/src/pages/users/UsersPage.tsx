import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { StandardPageLayout, type StatWidget } from '../../components/layout/StandardPageLayout';
import { UserPlus, UserX, UserCheck, RotateCcw } from 'lucide-react';

export function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('SALES_STAFF');

  // Fetch users with server SQL pagination
  const { data: response, isLoading } = useQuery({
    queryKey: ['users', page, itemsPerPage, search, roleFilter, statusFilter],
    queryFn: async () => {
      const res = await usersApi.getAll({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter ? statusFilter === 'ACTIVE' : undefined,
      });
      return res.data;
    },
  });

  const users = response?.data || [];
  const totalCount = response?.meta?.total ?? users.length;
  const totalPages = response?.meta?.totalPages ?? 1;

  // Lightweight fetch for global KPI counts
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'stats-kpi'],
    queryFn: async () => {
      const res = await usersApi.getAll({ limit: 1000 });
      return res.data?.data || [];
    },
  });

  const activeCount = useMemo(
    () => allUsers.filter((u: any) => u.isActive).length,
    [allUsers]
  );
  const inactiveCount = useMemo(
    () => allUsers.filter((u: any) => !u.isActive).length,
    [allUsers]
  );
  const distinctRolesCount = useMemo(
    () => new Set(allUsers.map((u: any) => u.role)).size,
    [allUsers]
  );

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
      setRole('SALES_STAFF');
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

  const statWidgets: StatWidget[] = [
    {
      label: 'Total Staff Accounts',
      value: users.length,
      subValue: 'Across all showrooms and branches',
      color: 'gold',
      onClick: () => {
        setRoleFilter('');
        setStatusFilter('');
        setPage(1);
      },
    },
    {
      label: 'Active Staff Members',
      value: activeCount,
      subValue: 'Authorized operational logins',
      color: 'emerald',
      onClick: () => {
        setStatusFilter('ACTIVE');
        setPage(1);
      },
    },
    {
      label: 'Suspended / Inactive',
      value: inactiveCount,
      subValue: 'Revoked or ex-employee seats',
      color: 'rose',
      onClick: () => {
        setStatusFilter('INACTIVE');
        setPage(1);
      },
    },
    {
      label: 'Security Roles Active',
      value: distinctRolesCount,
      subValue: 'Granular RBAC permission groups',
      color: 'blue',
      onClick: () => {
        setRoleFilter('');
        setStatusFilter('');
        setPage(1);
      },
    },
  ];

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
      cell: (r: any) => (r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString('en-IN') : 'Never'),
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

  const customFilterToolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-56">
        <CustomDropdown
          value={roleFilter}
          onChange={(val) => {
            setRoleFilter(val);
            setPage(1);
          }}
          placeholder="All Security Roles"
          options={[
            { value: '', label: 'All Security Roles' },
            { value: 'SUPER_ADMIN', label: 'Super Administrator', badge: 'Admin' },
            { value: 'STORE_MANAGER', label: 'Store Manager', badge: 'Manager' },
            { value: 'SALES_STAFF', label: 'Sales / Showroom Staff' },
            { value: 'CATALOG_MANAGER', label: 'Catalog Manager' },
            { value: 'PRICING_MANAGER', label: 'Pricing Manager' },
            { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
            { value: 'ACCOUNTANT', label: 'Accountant' },
            { value: 'AUDITOR', label: 'Auditor (Read-Only)' },
          ]}
        />
      </div>

      <div className="w-44">
        <CustomDropdown
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          placeholder="All Statuses"
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'ACTIVE', label: 'Active Only', badge: `${activeCount}` },
            { value: 'INACTIVE', label: 'Inactive Only', badge: `${inactiveCount}` },
          ]}
        />
      </div>

      {(roleFilter || statusFilter || search) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setRoleFilter('');
            setStatusFilter('');
            setSearch('');
            setPage(1);
          }}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      <StandardPageLayout
        title="Staff & Role Management"
        description="Manage employee permissions, showroom staff accounts, role-based access control, and credentials"
        badge="Security & Human Resources"
        stats={statWidgets}
        searchPlaceholder="Search staff by name, email, phone or role..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        customFilters={customFilterToolbar}
        primaryAction={{
          label: 'Add Staff Member',
          icon: <UserPlus className="w-4 h-4 mr-2" />,
          onClick: () => setIsModalOpen(true),
        }}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        viewMode="table"
        tableContent={
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <Table columns={columns} data={users} isLoading={isLoading} />
          </div>
        }
      />

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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role Assignment
            </label>
            <CustomDropdown
              value={role}
              onChange={(val) => setRole(val)}
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
        </div>
      </Modal>
    </>
  );
}

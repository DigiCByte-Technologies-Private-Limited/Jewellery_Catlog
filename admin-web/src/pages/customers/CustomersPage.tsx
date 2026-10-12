import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../../api/customers.api';
import {
  StandardPageLayout,
  type StatWidget,
} from '../../components/layout/StandardPageLayout';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { useToast } from '../../components/ui/Toast';
import {
  Crown,
  Heart,
  Calendar,
  Gift,
  Plus,
  Phone,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export function CustomersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'OCCASIONS'>('DIRECTORY');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [createForm, setCreateForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
    anniversaryDate: '',
    tagInput: 'REGULAR',
    notes: '',
  });

  // Queries
  const { data: customersResponse, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async () => (await customersApi.getAll({ search: searchQuery || undefined, limit: 100 })).data?.data || [],
  });

  const { data: occasionsResponse, isLoading: occasionsLoading } = useQuery({
    queryKey: ['customers', 'occasions'],
    queryFn: async () => (await customersApi.getOccasions()).data?.data || [],
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => customersApi.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        type: 'success',
        title: 'Customer Added',
        message: `${res.data?.data?.fullName || 'Client'} profile created successfully`,
      });
      setIsCreateOpen(false);
      setCreateForm({
        fullName: '',
        phone: '',
        email: '',
        panNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        dateOfBirth: '',
        anniversaryDate: '',
        tagInput: 'REGULAR',
        notes: '',
      });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to create customer' });
    },
  });

  const customers = customersResponse || [];
  const occasions = occasionsResponse || [];

  const totalCustomers = customers.length;
  const vipCount = customers.filter((c: any) => c.tags?.includes('VIP') || c.tags?.includes('HNI')).length;
  const bridalCount = customers.filter((c: any) => c.tags?.includes('BRIDAL')).length;
  const totalLifetimeValue = customers.reduce((s: number, c: any) => s + Number(c.totalSpend || 0), 0);

  const columns = [
    {
      header: 'Client Details',
      cell: (r: any) => (
        <div>
          <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
            <span>{r.fullName}</span>
            {r.tags?.includes('VIP') && (
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            )}
            {r.tags?.includes('BRIDAL') && (
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-emerald-600" />
            <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a>
            {r.email && <span>· {r.email}</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'PAN / Compliance',
      cell: (r: any) => (
        r.panNumber ? (
          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {r.panNumber}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Not recorded</span>
        )
      ),
    },
    {
      header: 'Location',
      cell: (r: any) => (
        <span className="text-xs text-slate-600">
          {r.city ? `${r.city}${r.state ? `, ${r.state}` : ''}` : '—'}
        </span>
      ),
    },
    {
      header: 'Tags',
      cell: (r: any) => (
        <div className="flex gap-1 flex-wrap">
          {r.tags && r.tags.length > 0 ? (
            r.tags.map((tag: string) => {
              const variant = tag === 'VIP' ? 'warning' : tag === 'BRIDAL' ? 'danger' : 'info';
              return (
                <Badge key={tag} variant={variant} className="text-[10px] px-1.5 py-0.2">
                  {tag}
                </Badge>
              );
            })
          ) : (
            <span className="text-xs text-slate-400">Standard</span>
          )}
        </div>
      ),
    },
    {
      header: 'Celebrations',
      cell: (r: any) => (
        <div className="text-xs space-y-0.5">
          {r.dateOfBirth && (
            <div className="text-slate-600 flex items-center gap-1">
              <Gift className="w-3 h-3 text-purple-500" />
              <span>DOB: {new Date(r.dateOfBirth).toLocaleDateString()}</span>
            </div>
          )}
          {r.anniversaryDate && (
            <div className="text-rose-600 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500" />
              <span>Anniv: {new Date(r.anniversaryDate).toLocaleDateString()}</span>
            </div>
          )}
          {!r.dateOfBirth && !r.anniversaryDate && (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Total Purchases',
      cell: (r: any) => (
        <span className="font-mono text-xs font-bold text-slate-900">
          ₹{Number(r.totalSpend || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  const occasionsColumns = [
    {
      header: 'Customer',
      cell: (r: any) => (
        <div>
          <div className="font-semibold text-slate-900 text-sm">{r.fullName}</div>
          <div className="text-xs text-slate-500 font-mono">{r.phone}</div>
        </div>
      ),
    },
    {
      header: 'Celebration Event',
      cell: (r: any) => {
        const isBirthday = Boolean(r.dateOfBirth);
        return (
          <div className="flex items-center gap-1.5 font-medium text-xs">
            {isBirthday ? (
              <>
                <Gift className="w-4 h-4 text-purple-600" />
                <span className="text-purple-900">Birthday Celebration</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 text-rose-600" />
                <span className="text-rose-900">Wedding Anniversary</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      header: 'Event Date',
      cell: (r: any) => (
        <div className="font-mono text-xs font-bold text-amber-900 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span>{r.dateOfBirth ? new Date(r.dateOfBirth).toLocaleDateString() : new Date(r.anniversaryDate).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Segment / Tags',
      cell: (r: any) => (
        <div className="flex gap-1">
          {r.tags?.map((t: string) => (
            <Badge key={t} variant={t === 'VIP' ? 'warning' : 'info'} className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'CRM Action',
      cell: (r: any) => (
        <a
          href={`https://wa.me/91${r.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
            `Namaste ${r.fullName}, warm greetings from our jewellery house! Wishing you a very joyous celebration. Visit our showroom to explore our special milestone collection with festive making-charge privileges.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-medium transition-colors"
        >
          <Sparkles className="w-3 h-3 text-emerald-600" /> Send WhatsApp Wish
        </a>
      ),
    },
  ];

  // Filtered clients
  const filteredCustomers = customers.filter((c: any) => {
    if (tagFilter && !c.tags?.includes(tagFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = c.fullName?.toLowerCase().includes(q);
      const matchesPhone = c.phone?.toLowerCase().includes(q);
      const matchesEmail = c.email?.toLowerCase().includes(q);
      const matchesCity = c.city?.toLowerCase().includes(q);
      if (!matchesName && !matchesPhone && !matchesEmail && !matchesCity) return false;
    }
    return true;
  });

  const filteredOccasions = occasions.filter((o: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = o.fullName?.toLowerCase().includes(q);
      const matchesPhone = o.phone?.toLowerCase().includes(q);
      if (!matchesName && !matchesPhone) return false;
    }
    return true;
  });

  const currentDataset = activeTab === 'DIRECTORY' ? filteredCustomers : filteredOccasions;
  const totalItems = currentDataset.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedData = currentDataset.slice((page - 1) * limit, page * limit);

  const statWidgets: StatWidget[] = [
    {
      label: 'Registered Clients',
      value: totalCustomers,
      subtext: 'Verified showroom profiles',
      variant: 'default',
      onClick: () => {
        setActiveTab('DIRECTORY');
        setTagFilter('');
        setPage(1);
      },
    },
    {
      label: 'VIP / HNI Clients',
      value: vipCount,
      subtext: 'Special preview privileges',
      variant: 'gold',
      onClick: () => {
        setActiveTab('DIRECTORY');
        setTagFilter('VIP');
        setPage(1);
      },
    },
    {
      label: 'Bridal Trousseau',
      value: bridalCount,
      subtext: 'Active wedding consultations',
      variant: 'purple',
      onClick: () => {
        setActiveTab('DIRECTORY');
        setTagFilter('BRIDAL');
        setPage(1);
      },
    },
    {
      label: 'Client Lifetime Value',
      value: `₹${totalLifetimeValue.toLocaleString('en-IN')}`,
      subtext: 'Cumulative showroom spend',
      variant: 'emerald',
    },
  ];

  const filterSlot = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => {
            setActiveTab('DIRECTORY');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'DIRECTORY'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Client Directory ({totalCustomers})
        </button>
        <button
          onClick={() => {
            setActiveTab('OCCASIONS');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'OCCASIONS'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-rose-500" />
          <span>Upcoming Celebrations ({occasions.length})</span>
        </button>
      </div>

      {activeTab === 'DIRECTORY' && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-56">
            <CustomDropdown
              value={tagFilter}
              onChange={(val) => {
                setTagFilter(val);
                setPage(1);
              }}
              placeholder="All Client Segments"
              options={[
                { value: '', label: 'All Segments' },
                { value: 'VIP', label: 'VIP / HNI Clients', badge: 'VIP' },
                { value: 'BRIDAL', label: 'Bridal Consultations', badge: 'Bride' },
                { value: 'REGULAR', label: 'Regular Shoppers', badge: 'Loyal' },
              ]}
            />
          </div>

          {(tagFilter || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTagFilter('');
                setSearchQuery('');
                setPage(1);
              }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <StandardPageLayout
        title="Jewellery Customer Relationship Management"
        description="High-net-worth client profiles, bridal portfolios, KYC PAN compliance & occasion triggers"
        badge="CRM & Client Profiles"
        stats={statWidgets}
        searchPlaceholder={activeTab === 'DIRECTORY' ? 'Search clients by name, phone, email, city...' : 'Search celebrations by client...'}
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        filterSlot={filterSlot}
        primaryAction={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Customer
          </Button>
        }
        isLoading={activeTab === 'DIRECTORY' ? customersLoading : occasionsLoading}
        totalCount={totalItems}
        tableContent={
          <Table
            columns={activeTab === 'DIRECTORY' ? columns : occasionsColumns}
            data={paginatedData}
            isLoading={activeTab === 'DIRECTORY' ? customersLoading : occasionsLoading}
          />
        }
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          onPageChange: setPage,
        }}
      />

      {/* Create Customer Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Customer Profile"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!createForm.fullName || !createForm.phone) {
                  toast({ type: 'warning', title: 'Required Fields', message: 'Name and phone number are required' });
                  return;
                }
                createCustomerMutation.mutate({
                  ...createForm,
                  tags: [createForm.tagInput],
                  dateOfBirth: createForm.dateOfBirth || undefined,
                  anniversaryDate: createForm.anniversaryDate || undefined,
                });
              }}
              isLoading={createCustomerMutation.isPending}
            >
              Save Customer Profile
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="e.g. Smt. Sunita Agarwal"
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            />
            <Input
              label="Mobile Number *"
              placeholder="e.g. 9876501234"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. sunita@example.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
            <Input
              label="PAN Number (Mandatory for gold > ₹2L)"
              placeholder="e.g. ABCDE1234F"
              value={createForm.panNumber}
              onChange={(e) => setCreateForm({ ...createForm, panNumber: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              placeholder="e.g. Hyderabad"
              value={createForm.city}
              onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
            />
            <Input
              label="State"
              placeholder="e.g. Telangana"
              value={createForm.state}
              onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
            />
            <Input
              label="Pincode"
              placeholder="e.g. 500034"
              value={createForm.pincode}
              onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={createForm.dateOfBirth}
              onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
            />
            <Input
              label="Wedding Anniversary Date"
              type="date"
              value={createForm.anniversaryDate}
              onChange={(e) => setCreateForm({ ...createForm, anniversaryDate: e.target.value })}
            />
          </div>

          <Select
            label="Customer Segment / Tag"
            value={createForm.tagInput}
            onChange={(e) => setCreateForm({ ...createForm, tagInput: e.target.value })}
            options={[
              { label: 'Regular Customer', value: 'REGULAR' },
              { label: 'VIP / HNI Collector', value: 'VIP' },
              { label: 'Bridal Family', value: 'BRIDAL' },
              { label: 'Wholesale / Bullion', value: 'WHOLESALE' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship Notes & Preferences</label>
            <textarea
              rows={2}
              placeholder="Gold purity preference (e.g. only 22K 916), gemstone choices, family relations..."
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

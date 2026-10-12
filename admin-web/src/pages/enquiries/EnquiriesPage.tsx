import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enquiriesApi } from '../../api/enquiries.api';
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
  UserCheck,
  Plus,
  ArrowRight,
  RotateCcw,
  PhoneCall,
  Calendar,
  Sparkles,
} from 'lucide-react';

export function EnquiriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    preferredCategory: '',
    metalType: 'GOLD',
    budgetMin: '',
    budgetMax: '',
    occasion: 'BRIDAL',
    followUpDate: '',
    assignedStaffName: '',
    notes: '',
  });

  // Query
  const { data: enquiriesResponse, isLoading } = useQuery({
    queryKey: ['enquiries', stageFilter],
    queryFn: async () => (await enquiriesApi.getAll({ stage: stageFilter || undefined, limit: 100 })).data?.data || [],
  });

  // Mutations
  const createEnquiryMutation = useMutation({
    mutationFn: (data: any) => enquiriesApi.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      toast({
        type: 'success',
        title: 'Enquiry Registered',
        message: `Lead ${res.data?.data?.enquiryNumber || ''} created successfully`,
      });
      setIsCreateOpen(false);
      setCreateForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        preferredCategory: '',
        metalType: 'GOLD',
        budgetMin: '',
        budgetMax: '',
        occasion: 'BRIDAL',
        followUpDate: '',
        assignedStaffName: '',
        notes: '',
      });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to record enquiry' });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => enquiriesApi.updateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      toast({ type: 'success', title: 'Stage Updated', message: 'Lead progressed in sales pipeline' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Update failed' });
    },
  });

  const enquiries = enquiriesResponse || [];

  const totalLeads = enquiries.length;
  const activeLeads = enquiries.filter((e: any) => e.stage !== 'CONVERTED' && e.stage !== 'LOST').length;
  const convertedLeads = enquiries.filter((e: any) => e.stage === 'CONVERTED').length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const stageBadgeVariant: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    NEW: 'info',
    CONTACTED: 'info',
    VISITED: 'warning',
    QUOTED: 'warning',
    CONVERTED: 'success',
    LOST: 'danger',
  };

  const nextStageMap: Record<string, string> = {
    NEW: 'CONTACTED',
    CONTACTED: 'VISITED',
    VISITED: 'QUOTED',
    QUOTED: 'CONVERTED',
  };

  const columns = [
    {
      header: 'Enquiry #',
      cell: (r: any) => (
        <span className="font-mono font-bold text-amber-950 text-xs">{r.enquiryNumber}</span>
      ),
    },
    {
      header: 'Client',
      cell: (r: any) => (
        <div>
          <div className="font-semibold text-slate-900 text-sm">{r.customerName}</div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-emerald-600" />
            <a href={`tel:${r.customerPhone}`} className="hover:underline">{r.customerPhone}</a>
          </div>
        </div>
      ),
    },
    {
      header: 'Interest / Category',
      cell: (r: any) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{r.preferredCategory || 'Custom Request'}</div>
          <div className="text-slate-500">{r.metalType} · {r.occasion}</div>
        </div>
      ),
    },
    {
      header: 'Budget Range',
      cell: (r: any) => (
        <div className="font-mono text-xs font-semibold text-slate-700">
          {r.budgetMin || r.budgetMax ? (
            <span>
              ₹{Number(r.budgetMin || 0).toLocaleString('en-IN')} - ₹{Number(r.budgetMax || 0).toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">Unspecified</span>
          )}
        </div>
      ),
    },
    {
      header: 'Follow Up',
      cell: (r: any) => (
        r.followUpDate ? (
          <div className="text-xs text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>{new Date(r.followUpDate).toLocaleDateString()}</span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )
      ),
    },
    {
      header: 'Assigned Staff',
      cell: (r: any) => (
        <span className="text-xs text-slate-600 font-medium">
          {r.assignedStaffName || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Stage',
      cell: (r: any) => (
        <Badge variant={stageBadgeVariant[r.stage] || 'info'}>
          {r.stage}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (r: any) => {
        const nextStage = nextStageMap[r.stage];
        return (
          <div className="flex items-center gap-1.5">
            {nextStage && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs py-1 px-2.5 h-7"
                onClick={() => updateStageMutation.mutate({ id: r.id, stage: nextStage })}
              >
                <span>{nextStage}</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}

            {r.stage !== 'CONVERTED' && r.stage !== 'LOST' && (
              <button
                type="button"
                onClick={() => updateStageMutation.mutate({ id: r.id, stage: 'LOST' })}
                className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline px-1.5"
              >
                Mark Lost
              </button>
            )}

            {r.stage === 'CONVERTED' && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Converted
              </span>
            )}
          </div>
        );
      },
    },
  ];

  // Filtered dataset
  const filteredEnquiries = enquiries.filter((e: any) => {
    if (stageFilter && e.stage !== stageFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesNum = e.enquiryNumber?.toLowerCase().includes(q);
      const matchesName = e.customerName?.toLowerCase().includes(q);
      const matchesPhone = e.customerPhone?.toLowerCase().includes(q);
      const matchesEmail = e.customerEmail?.toLowerCase().includes(q);
      const matchesNotes = e.notes?.toLowerCase().includes(q);
      if (!matchesNum && !matchesName && !matchesPhone && !matchesEmail && !matchesNotes) return false;
    }
    return true;
  });

  const totalItems = filteredEnquiries.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedEnquiries = filteredEnquiries.slice((page - 1) * limit, page * limit);

  const statWidgets: StatWidget[] = [
    {
      label: 'Total Inquiries',
      value: totalLeads,
      subtext: 'Walk-ins & online leads recorded',
      variant: 'default',
      onClick: () => {
        setStageFilter('');
        setPage(1);
      },
    },
    {
      label: 'Active Pipeline',
      value: activeLeads,
      subtext: 'Under follow-up or quotation',
      variant: 'blue',
      onClick: () => {
        setStageFilter('NEW');
        setPage(1);
      },
    },
    {
      label: 'Converted Clients',
      value: convertedLeads,
      subtext: 'Converted to orders or bookings',
      variant: 'emerald',
      onClick: () => {
        setStageFilter('CONVERTED');
        setPage(1);
      },
    },
    {
      label: 'Conversion Ratio',
      value: `${conversionRate}%`,
      subtext: 'Closing effectiveness',
      variant: 'gold',
    },
  ];

  const filterSlot = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="w-64">
        <CustomDropdown
          value={stageFilter}
          onChange={(val) => {
            setStageFilter(val);
            setPage(1);
          }}
          placeholder="All Pipeline Stages"
          options={[
            { value: '', label: 'All Inquiries' },
            { value: 'NEW', label: 'New Walk-in Lead', badge: 'New' },
            { value: 'CONTACTED', label: 'Contacted & Followed Up', badge: 'Call' },
            { value: 'VISITED', label: 'Visited Showroom', badge: 'Visit' },
            { value: 'QUOTED', label: 'Quotation Provided', badge: 'Quote' },
            { value: 'CONVERTED', label: 'Converted Client', badge: 'Won' },
            { value: 'LOST', label: 'Lost Opportunity', badge: 'Lost' },
          ]}
        />
      </div>

      {(stageFilter || search) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStageFilter('');
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
        title="Showroom Walk-in & Digital Enquiries"
        description="Lead tracking, customer bridal consultations, and showroom sales pipeline"
        badge="Walk-ins & Pipeline"
        stats={statWidgets}
        searchPlaceholder="Search leads by #, customer name, phone, email, notes..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        filterSlot={filterSlot}
        primaryAction={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Log New Lead
          </Button>
        }
        isLoading={isLoading}
        totalCount={totalItems}
        tableContent={<Table columns={columns} data={paginatedEnquiries} />}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          onPageChange: setPage,
        }}
      />

      {/* Log Enquiry Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Log Walk-in Lead / Customer Enquiry"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!createForm.customerName || !createForm.customerPhone) {
                  toast({ type: 'warning', title: 'Required Fields', message: 'Client name and phone number are required' });
                  return;
                }
                createEnquiryMutation.mutate({
                  ...createForm,
                  budgetMin: createForm.budgetMin ? Number(createForm.budgetMin) : undefined,
                  budgetMax: createForm.budgetMax ? Number(createForm.budgetMax) : undefined,
                  followUpDate: createForm.followUpDate || undefined,
                });
              }}
              isLoading={createEnquiryMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-1.5" /> Save Enquiry
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Customer Name *"
              placeholder="e.g. Radhika Sharma"
              value={createForm.customerName}
              onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
            />
            <Input
              label="Phone Number *"
              placeholder="e.g. 9876543210"
              value={createForm.customerPhone}
              onChange={(e) => setCreateForm({ ...createForm, customerPhone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. radhika@example.com"
              value={createForm.customerEmail}
              onChange={(e) => setCreateForm({ ...createForm, customerEmail: e.target.value })}
            />
            <Input
              label="Preferred Category / Design"
              placeholder="e.g. Temple Jewellery Choker, 22K Gold Bangles"
              value={createForm.preferredCategory}
              onChange={(e) => setCreateForm({ ...createForm, preferredCategory: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Metal Type"
              value={createForm.metalType}
              onChange={(e) => setCreateForm({ ...createForm, metalType: e.target.value })}
              options={[
                { label: 'Gold', value: 'GOLD' },
                { label: 'Silver', value: 'SILVER' },
                { label: 'Platinum', value: 'PLATINUM' },
              ]}
            />
            <Select
              label="Occasion"
              value={createForm.occasion}
              onChange={(e) => setCreateForm({ ...createForm, occasion: e.target.value })}
              options={[
                { label: 'Bridal / Wedding', value: 'BRIDAL' },
                { label: 'Wedding Guest', value: 'WEDDING' },
                { label: 'Festive (Diwali/Akshaya Tritiya)', value: 'FESTIVE' },
                { label: 'Anniversary / Gift', value: 'ANNIVERSARY' },
                { label: 'Daily Wear', value: 'DAILY_WEAR' },
                { label: 'Other Gifting', value: 'GIFTING' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Budget (₹)"
              type="number"
              placeholder="e.g. 100000"
              value={createForm.budgetMin}
              onChange={(e) => setCreateForm({ ...createForm, budgetMin: e.target.value })}
            />
            <Input
              label="Max Budget (₹)"
              type="number"
              placeholder="e.g. 350000"
              value={createForm.budgetMax}
              onChange={(e) => setCreateForm({ ...createForm, budgetMax: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Follow-up Date"
              type="date"
              value={createForm.followUpDate}
              onChange={(e) => setCreateForm({ ...createForm, followUpDate: e.target.value })}
            />
            <Input
              label="Assigned Sales Staff"
              placeholder="e.g. Priya Sharma"
              value={createForm.assignedStaffName}
              onChange={(e) => setCreateForm({ ...createForm, assignedStaffName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Preferences & Notes</label>
            <textarea
              rows={3}
              placeholder="Specific design preferences, diamond clarity requirements, groom/bride details..."
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

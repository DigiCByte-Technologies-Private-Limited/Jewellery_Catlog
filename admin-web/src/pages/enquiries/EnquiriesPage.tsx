import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enquiriesApi } from '../../api/enquiries.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import {
  PhoneCall,
  UserCheck,
  Plus,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export function EnquiriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [stageFilter, setStageFilter] = useState('');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Showroom Walk-in & Digital Enquiries</h1>
          <p className="text-slate-500 text-sm">Lead tracking, customer bridal consultations, and showroom sales pipeline</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Log New Lead
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inquiries</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{totalLeads}</div>
            <div className="text-xs text-slate-400 mt-1">Walk-ins & online leads recorded</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-blue-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Active Pipeline</div>
            <div className="text-2xl font-black text-blue-900 font-mono mt-1">{activeLeads}</div>
            <div className="text-xs text-slate-400 mt-1">Under follow-up or quotation</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Converted Clients</div>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-1">{convertedLeads}</div>
            <div className="text-xs text-slate-400 mt-1">Converted to orders or advance bookings</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-amber-200">
          <CardContent className="pt-5">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Conversion Ratio</div>
            <div className="text-2xl font-black text-amber-950 font-mono mt-1 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <span>{conversionRate}%</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Sales closing effectiveness</div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 flex-wrap">
        {(['', 'NEW', 'CONTACTED', 'VISITED', 'QUOTED', 'CONVERTED', 'LOST'] as const).map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => setStageFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              stageFilter === s
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s ? s : 'All Leads'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={enquiries} isLoading={isLoading} />
      </div>

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
    </div>
  );
}

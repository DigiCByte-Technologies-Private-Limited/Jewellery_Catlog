import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Users, Search, Phone, Mail, MessageCircle, MapPin,
  CheckCircle2, XCircle, Clock,
  RefreshCw, Loader2,
  ShoppingBag, Send
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface CustomerRequest {
  id: string;
  requestId: string;
  customerName: string;
  phone: string;
  email: string;
  city?: string;
  state?: string;
  productName: string;
  desiredMetalType?: string;
  desiredPurity?: string;
  budgetMin?: number;
  budgetMax?: number;
  quantity?: string;
  message?: string;
  technicalRequirement?: string;
  status: string;
  purchaseStatus: string;
  adminNotes?: string;
  purchaseNotes?: string;
  followUpAt?: string;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    media?: Array<{ url: string }>;
  };
  history?: Array<{
    id: string;
    actorName: string;
    action: string;
    note?: string;
    createdAt: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  ASSIGNED: { label: 'New Assignment', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  NEW: { label: 'Open Lead', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  FOLLOW_UP: { label: 'In Outreach', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
  COMPLETED: { label: 'Fulfilled / Closed', badge: 'bg-green-100 text-green-800 border-green-300' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-stone-100 text-stone-600 border-stone-300' },
};

export const AssignedCustomersPage = () => {
  const { accessToken } = useAuthStore();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Follow-up modal
  const [selectedReqForFollowUp, setSelectedReqForFollowUp] = useState<CustomerRequest | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [customerResponse, setCustomerResponse] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  // Outcome modal
  const [selectedReqForOutcome, setSelectedReqForOutcome] = useState<CustomerRequest | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [confirmedQty, setConfirmedQty] = useState('1');

  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/api/v1/wholesale/auth/assigned-customers', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setRequests(res.data.data || []);
    } catch {
      toast.error('Failed to load assigned customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForFollowUp) return;
    setSavingAction(true);
    try {
      await axios.patch(
        `http://localhost:3001/api/v1/wholesale/auth/assigned-customers/${selectedReqForFollowUp.id}/follow-up`,
        {
          note: followUpNote,
          customerResponse: customerResponse || undefined,
          nextFollowUpDate: nextDate || undefined,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success('Customer follow-up logged successfully');
      setSelectedReqForFollowUp(null);
      setFollowUpNote('');
      setCustomerResponse('');
      setNextDate('');
      fetchAssigned();
    } catch {
      toast.error('Could not log follow-up');
    } finally {
      setSavingAction(false);
    }
  };

  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForOutcome) return;
    setSavingAction(true);
    try {
      await axios.patch(
        `http://localhost:3001/api/v1/wholesale/auth/assigned-customers/${selectedReqForOutcome.id}/outcome`,
        {
          purchaseStatus: outcomeStatus,
          purchaseNotes: outcomeNotes || undefined,
          confirmedQuantity: outcomeStatus === 'APPROVED' ? Number(confirmedQty) : undefined,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`Customer request marked as ${outcomeStatus}`);
      setSelectedReqForOutcome(null);
      setOutcomeNotes('');
      fetchAssigned();
    } catch {
      toast.error('Could not save outcome');
    } finally {
      setSavingAction(false);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.requestId.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search) ||
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      (r.city && r.city.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && r.status !== 'COMPLETED' && r.status !== 'CANCELLED') ||
      r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen py-10 px-4 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-[#8C6A28] text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-200">
              <Users className="w-3.5 h-3.5" />
              <span>Admin Assigned Customer Leads</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#1C1917]">
              Assigned Customers & Orders
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Direct retail customers assigned to your local wholesale territory by the Aurum HQ team.
            </p>
          </div>
          <button
            onClick={fetchAssigned}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:border-amber-400 text-stone-600 transition flex items-center gap-2 text-xs font-medium self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4 text-[#B89047]" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, phone, city, or request ID..."
              className="input-field pl-9 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'ACTIVE', 'ASSIGNED', 'FOLLOW_UP', 'COMPLETED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-[#1C1917] text-amber-200'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#B89047]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-semibold text-stone-700">No Assigned Customers Found</h3>
            <p className="text-stone-400 text-sm mt-1 max-w-md mx-auto">
              When the Aurum HQ Admin team assigns local showroom leads or customer purchase requests to your territory, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => {
              const statusCfg = STATUS_CONFIG[req.status] || {
                label: req.status,
                badge: 'bg-stone-100 text-stone-700 border-stone-200',
              };

              const cleanPhone = req.phone.replace(/[^0-9]/g, '');

              return (
                <div
                  key={req.id}
                  className="card p-6 border hover:border-amber-300/80 transition-shadow duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Left: Customer & Product Info */}
                    <div className="flex-1 space-y-4">
                      {/* Customer Header */}
                      <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
                        <span className="font-mono text-xs px-2.5 py-1 rounded bg-stone-900 text-amber-300 font-bold">
                          {req.requestId}
                        </span>
                        <h2 className="font-serif text-xl font-bold text-[#1C1917]">
                          {req.customerName}
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>
                        {req.city && (
                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#B89047]" />
                            {req.city} {req.state ? `, ${req.state}` : ''}
                          </span>
                        )}
                      </div>

                      {/* Contact Channels */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call {req.phone}</span>
                        </a>

                        <a
                          href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                            `Hello ${req.customerName}, this is regarding your inquiry for ${req.productName} with Aurum Jewels wholesale partner.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 transition font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`mailto:${req.email}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
                        >
                          <Mail className="w-3.5 h-3.5 text-stone-500" />
                          <span>{req.email}</span>
                        </a>
                      </div>

                      {/* Requested Jewelry Specs */}
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/80">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-amber-100/80 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-6 h-6 text-[#8C6A28]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-stone-900 text-sm">
                              {req.productName}
                            </h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600 mt-1">
                              {req.desiredPurity && (
                                <span>Purity: <strong>{req.desiredPurity} {req.desiredMetalType}</strong></span>
                              )}
                              {req.quantity && (
                                <span>Qty: <strong>{req.quantity}</strong></span>
                              )}
                              {(req.budgetMin || req.budgetMax) && (
                                <span>
                                  Budget: <strong>₹{req.budgetMin?.toLocaleString('en-IN')} - ₹{req.budgetMax?.toLocaleString('en-IN')}</strong>
                                </span>
                              )}
                            </div>
                            {req.message && (
                              <p className="text-xs text-stone-600 mt-2 bg-white/70 p-2 rounded border border-amber-200/50 italic">
                                "{req.message}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Admin Instructions */}
                      {req.adminNotes && (
                        <div className="text-xs bg-stone-100 p-3 rounded-lg border border-stone-200 text-stone-700">
                          <span className="font-bold text-stone-900 block mb-0.5">Admin Dispatch Instructions:</span>
                          {req.adminNotes}
                        </div>
                      )}

                      {/* Notes / Follow-up Logs */}
                      {req.purchaseNotes && (
                        <div className="text-xs text-stone-600 space-y-1">
                          <span className="font-bold text-stone-800 block">Territory Activity Log:</span>
                          <pre className="font-sans whitespace-pre-wrap bg-stone-50 p-2.5 rounded border border-stone-200 text-[11px]">
                            {req.purchaseNotes}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-stone-100 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
                      <button
                        onClick={() => {
                          setSelectedReqForFollowUp(req);
                          setFollowUpNote('');
                        }}
                        className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Log Follow-up</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedReqForOutcome(req);
                          setOutcomeStatus('APPROVED');
                        }}
                        className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Record Outcome</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal 1: Log Follow-up */}
        {selectedReqForFollowUp && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card max-w-lg w-full p-6 shadow-2xl">
              <h3 className="font-serif text-lg font-bold text-[#1C1917] mb-1">
                Log Follow-up with {selectedReqForFollowUp.customerName}
              </h3>
              <p className="text-stone-500 text-xs mb-4">
                Record your call, WhatsApp, or local showroom meeting with the client.
              </p>

              <form onSubmit={handleSaveFollowUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
                    Interaction Details *
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="e.g. Called client, agreed to showroom visit on Saturday at 11:30 AM to inspect 22K samples."
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
                    Customer Response / Feedback (Optional)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Loves design, requested quotation for matching earrings."
                    value={customerResponse}
                    onChange={(e) => setCustomerResponse(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
                    Next Follow-up Reminder Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedReqForFollowUp(null)}
                    className="btn-secondary py-2 px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAction}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    {savingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Save Interaction</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Record Outcome */}
        {selectedReqForOutcome && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card max-w-lg w-full p-6 shadow-2xl">
              <h3 className="font-serif text-lg font-bold text-[#1C1917] mb-1">
                Record Customer Outcome
              </h3>
              <p className="text-stone-500 text-xs mb-4">
                Update whether the customer completed the purchase or declined.
              </p>

              <form onSubmit={handleSaveOutcome} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
                    Purchase Status *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('APPROVED')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        outcomeStatus === 'APPROVED'
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Order Fulfilled / Sold</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('REJECTED')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        outcomeStatus === 'REJECTED'
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : 'border-stone-200 text-stone-600'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Customer Declined</span>
                    </button>
                  </div>
                </div>

                {outcomeStatus === 'APPROVED' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
                      Confirmed Quantity
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      min={1}
                      value={confirmedQty}
                      onChange={(e) => setConfirmedQty(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
                    Fulfillment / Decline Notes
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder={
                      outcomeStatus === 'APPROVED'
                        ? 'e.g. Sold in showroom, invoice generated, gold purity certified.'
                        : 'e.g. Budget was out of range, or customer purchased alternative design.'
                    }
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedReqForOutcome(null)}
                    className="btn-secondary py-2 px-4 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAction}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    {savingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Confirm Outcome</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

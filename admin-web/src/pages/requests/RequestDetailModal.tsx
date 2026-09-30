import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  requestsApi,
  type ProductRequestItem,
  type RequestHistoryItem,
} from '../../api/requests.api';
import { type StoreItem } from '../../api/stores.api';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  Package,
  Layers,
  Trash2,
  CheckCircle2,
  XCircle,
  MapPin,
  Store,
  Navigation,
  History,
  PhoneCall,
  ShoppingBag,
  Send,
  AlertTriangle,
} from 'lucide-react';

interface RequestDetailModalProps {
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export function RequestDetailModal({
  requestId,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: RequestDetailModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Active sub-tab in modal: 'workflow' | 'assignment' | 'history'
  const [activeTab, setActiveTab] = useState<'workflow' | 'assignment' | 'history'>('workflow');

  // Assign store dialog state
  const [selectedStoreToAssign, setSelectedStoreToAssign] = useState<StoreItem | null>(null);
  const [assignmentNote, setAssignmentNote] = useState('');

  // Store Follow-up state
  const [followUpNote, setFollowUpNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [customerResponse, setCustomerResponse] = useState('');

  // Purchase Outcome state
  const [outcomeStatus, setOutcomeStatus] = useState<'APPROVED' | 'REJECTED' | 'PENDING'>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState<string>('CUSTOMER_DECLINED');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [confirmedQty, setConfirmedQty] = useState<number>(1);
  const [pendingFollowUpDate, setPendingFollowUpDate] = useState('');

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // 1. Fetch fresh Request entity with relations (store, history, product)
  const {
    data: requestResponse,
    isLoading: isRequestLoading,
    refetch: refetchRequest,
  } = useQuery({
    queryKey: ['product-request-detail', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const res = await requestsApi.getById(requestId);
      return res.data?.data;
    },
    enabled: !!requestId && isOpen,
  });

  const request: ProductRequestItem | null = requestResponse || null;

  // 2. Fetch Nearby Stores ranked by proximity
  const { data: nearbyStoresResponse, isLoading: isNearbyLoading, refetch: refetchNearby } = useQuery({
    queryKey: ['nearby-stores', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const res = await requestsApi.getNearbyStores(requestId);
      return res.data?.data || [];
    },
    enabled: !!requestId && isOpen,
  });

  const nearbyStores: StoreItem[] = nearbyStoresResponse || [];

  // Invalidate query helper
  const handleActionSuccess = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ['product-requests'] });
    queryClient.invalidateQueries({ queryKey: ['requests-pipeline-stats'] });
    queryClient.invalidateQueries({ queryKey: ['requests-stats'] });
    refetchRequest();
    refetchNearby();
    onUpdated?.();
    toast({
      type: 'success',
      title: 'Action Recorded',
      message: msg,
    });
  };

  // Mutation 1: Assign Store
  const assignStoreMutation = useMutation({
    mutationFn: (data: { storeId: string; note?: string }) => {
      if (!request) throw new Error('No request');
      return requestsApi.assignStore(request.id, data);
    },
    onSuccess: () => {
      setSelectedStoreToAssign(null);
      setAssignmentNote('');
      handleActionSuccess('Customer request assigned to showroom successfully.');
      setActiveTab('workflow');
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Assignment Failed',
        message: err.response?.data?.message || 'Could not assign store.',
      });
    },
  });

  // Mutation 2: Record Follow-up
  const followUpMutation = useMutation({
    mutationFn: (data: { note: string; nextFollowUpDate?: string; customerResponse?: string }) => {
      if (!request) throw new Error('No request');
      return requestsApi.recordFollowUp(request.id, data);
    },
    onSuccess: () => {
      setFollowUpNote('');
      setNextFollowUpDate('');
      setCustomerResponse('');
      handleActionSuccess('Follow-up interaction logged and status updated to IN FOLLOW-UP.');
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Follow-up Failed',
        message: err.response?.data?.message || 'Could not log follow-up.',
      });
    },
  });

  // Mutation 3: Record Customer Purchase Outcome (APPROVED / REJECTED / PENDING)
  const purchaseOutcomeMutation = useMutation({
    mutationFn: () => {
      if (!request) throw new Error('No request');
      return requestsApi.recordPurchaseOutcome(request.id, {
        purchaseStatus: outcomeStatus,
        purchaseReason: outcomeStatus === 'REJECTED' ? rejectionReason : undefined,
        purchaseNotes: purchaseNotes || undefined,
        nextFollowUpDate: outcomeStatus === 'PENDING' ? pendingFollowUpDate : undefined,
        confirmedQuantity: outcomeStatus === 'APPROVED' ? Number(confirmedQty) : undefined,
      });
    },
    onSuccess: () => {
      setPurchaseNotes('');
      handleActionSuccess(
        outcomeStatus === 'APPROVED'
          ? 'Customer purchase marked APPROVED! Deal completed.'
          : outcomeStatus === 'REJECTED'
          ? 'Customer outcome recorded as REJECTED (Customer declined).'
          : 'Outcome logged as PENDING. Follow-up scheduled.'
      );
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Outcome Update Failed',
        message: err.response?.data?.message || 'Could not record purchase outcome.',
      });
    },
  });

  // Mutation 4: Delete Request
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!request) throw new Error('No request');
      return requestsApi.remove(request.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests-pipeline-stats'] });
      toast({
        type: 'success',
        title: 'Request Deleted',
        message: `Inquiry ${request?.requestId} was removed.`,
      });
      setIsDeleteOpen(false);
      onClose();
      onDeleted?.();
    },
    onError: (err: any) => {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || 'Could not delete request.',
      });
    },
  });

  if (!isOpen || !requestId) return null;

  const statusVariantMap: Record<string, 'gold' | 'info' | 'warning' | 'success' | 'danger'> = {
    NEW: 'gold',
    ASSIGNED: 'info',
    FOLLOW_UP: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
  };

  const primaryImage =
    request?.product?.media?.find((m) => m.isPrimary)?.thumbnailUrl ||
    request?.product?.media?.find((m) => m.isPrimary)?.originalUrl ||
    request?.product?.media?.find((m) => m.isPrimary)?.url ||
    request?.product?.media?.[0]?.thumbnailUrl ||
    request?.product?.media?.[0]?.originalUrl ||
    request?.product?.media?.[0]?.url;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={request ? `Customer Request ${request.requestId}` : 'Loading Request Details...'}
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Request
            </Button>

            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        }
      >
        {isRequestLoading || !request ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Clock className="w-6 h-6 mx-auto mb-2 animate-spin text-amber-600" />
            Loading request data...
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-700">
            {/* Top Status & Meta Header */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-950 text-sm bg-white px-2.5 py-1 rounded border border-amber-200 shadow-2xs">
                  {request.requestId}
                </span>
                <Badge variant={statusVariantMap[request.status] || 'info'}>
                  {request.status.replace('_', ' ')}
                </Badge>
                {request.purchaseStatus === 'APPROVED' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    PURCHASED (APPROVED)
                  </span>
                )}
                {request.purchaseStatus === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    NOT PURCHASED (REJECTED)
                  </span>
                )}
                {request.purchaseStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    PURCHASE PENDING
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date(request.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('workflow')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'workflow'
                    ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Request & Customer Outcome
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assignment')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'assignment'
                    ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Nearby Stores & Assignment
                {!request.assignedStoreId && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'history'
                    ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Audit Trail ({request.history?.length || 0})
              </button>
            </div>

            {/* TAB 1: WORKFLOW & OUTCOME */}
            {activeTab === 'workflow' && (
              <div className="space-y-4">
                {/* Product & Customer Details Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Product Card */}
                  <div className="p-3 rounded-lg border border-amber-200/80 bg-gradient-to-r from-amber-50/40 to-orange-50/20">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-amber-600" /> Requested Product
                    </div>
                    <div className="flex items-center gap-3">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={request.productName}
                          className="w-12 h-12 rounded object-cover border border-amber-200 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
                          <Package className="w-5 h-5 opacity-60" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate" title={request.productName}>
                          {request.productName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                          {request.quantity && (
                            <span className="font-semibold text-amber-900 bg-amber-100/70 px-1 rounded">
                              Qty: {request.quantity}
                            </span>
                          )}
                          {request.product?.category?.name && (
                            <span className="flex items-center gap-0.5">
                              <Layers className="w-3 h-3" />
                              {request.product.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {request.productId && (
                        <Link
                          to={`/products/${request.productId}`}
                          target="_blank"
                          className="p-1.5 rounded bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0"
                          title="View Product Details in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" /> Customer Information
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{request.customerName}</span>
                        {request.companyName && (
                          <span className="text-[11px] font-normal text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {request.companyName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <a
                          href={`tel:${request.phone}`}
                          className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          {request.phone}
                        </a>
                        <a
                          href={`mailto:${request.email}`}
                          className="text-slate-600 hover:text-amber-700 hover:underline flex items-center gap-1 truncate max-w-[150px]"
                        >
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{request.email}</span>
                        </a>
                      </div>
                      <div className="pt-1 flex items-center gap-1 text-[11px] text-slate-600">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="font-medium text-slate-800">
                          {request.city || 'City unstated'}
                          {request.state ? `, ${request.state}` : ''}
                        </span>
                        {request.latitude && request.longitude && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({Number(request.latitude).toFixed(3)}, {Number(request.longitude).toFixed(3)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Message */}
                <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-lg">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-700" /> Customer Requirement Message
                  </div>
                  <div className="text-xs text-slate-800 italic">"{request.message}"</div>
                  {request.technicalRequirement && (
                    <div className="mt-2 pt-2 border-t border-amber-200/50 text-[11px] text-amber-950">
                      <span className="font-semibold">Special Spec: </span>
                      {request.technicalRequirement}
                    </div>
                  )}
                </div>

                {/* Assigned Store Banner / Quick Switch */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Assigned Showroom
                      </div>
                      {request.assignedStore ? (
                        <div className="font-bold text-slate-900 text-xs">
                          {request.assignedStore.name} —{' '}
                          <span className="text-blue-700 font-medium">
                            {request.assignedStore.city}, {request.assignedStore.state}
                          </span>
                        </div>
                      ) : (
                        <div className="font-bold text-amber-800 text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Not Assigned Yet (Action Needed)
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => setActiveTab('assignment')}
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    {request.assignedStore ? 'Reassign Nearby Store' : 'Assign Nearby Store'}
                  </Button>
                </div>

                {/* Section A: Log Store Follow-up / Outreach */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      1. Showroom Outreach & Follow-up Log
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Moves request to <strong className="text-slate-600">IN FOLLOW-UP</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Outreach Interaction Details *
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Contacted customer via phone. Informed them about 22K hallmarking & current rate. Scheduled showroom trial."
                        value={followUpNote}
                        onChange={(e) => setFollowUpNote(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Customer Response (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Customer visiting this Saturday afternoon"
                        value={customerResponse}
                        onChange={(e) => setCustomerResponse(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Next Follow-up Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-1.5 focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() =>
                        followUpMutation.mutate({
                          note: followUpNote,
                          nextFollowUpDate: nextFollowUpDate || undefined,
                          customerResponse: customerResponse || undefined,
                        })
                      }
                      isLoading={followUpMutation.isPending}
                      disabled={!followUpNote.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Log Follow-up Activity
                    </Button>
                  </div>
                </div>

                {/* Section B: Record Customer Final Purchase Outcome */}
                <div className="p-3.5 rounded-lg border-2 border-amber-300 bg-amber-50/20 space-y-3">
                  <div className="border-b border-amber-200 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-amber-700" />
                        2. Record Final Customer Purchase Decision
                      </div>
                      <span className="text-[10px] font-mono text-amber-800">
                        Current: <strong>{request.purchaseStatus}</strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Business Rule: Showrooms do not approve or reject customers. Record whether the
                      customer actually purchased the product or declined.
                    </p>
                  </div>

                  {/* 3 Outcome Options */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('APPROVED')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        outcomeStatus === 'APPROVED'
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-400'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Customer Purchased
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">APPROVED</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('REJECTED')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        outcomeStatus === 'REJECTED'
                          ? 'border-rose-500 bg-rose-50/80 text-rose-950 ring-2 ring-rose-400'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                        <XCircle className="w-4 h-4" />
                        Did Not Purchase
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">REJECTED</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOutcomeStatus('PENDING')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        outcomeStatus === 'PENDING'
                          ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700">
                        <Clock className="w-4 h-4" />
                        Still Deciding
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">PENDING</div>
                    </button>
                  </div>

                  {/* Outcome details based on selection */}
                  {outcomeStatus === 'APPROVED' && (
                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
                      <div className="text-xs font-semibold text-emerald-900">
                        Confirm Customer Purchase
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Purchased Quantity
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={confirmedQty}
                            onChange={(e) => setConfirmedQty(parseInt(e.target.value) || 1)}
                            className="w-full text-xs rounded-lg border border-slate-300 p-1.5 focus:border-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Invoice / Sale Reference
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Bill #INV-9214, Paid by Card"
                            value={purchaseNotes}
                            onChange={(e) => setPurchaseNotes(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 p-1.5 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {outcomeStatus === 'REJECTED' && (
                    <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200 space-y-2">
                      <div className="text-xs font-semibold text-rose-900">
                        Record Rejection Reason (Required)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Select
                          label="Why Did Customer Not Purchase?"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          options={[
                            { label: 'Customer Declined Offer', value: 'CUSTOMER_DECLINED' },
                            { label: 'Price Too High / Beyond Budget', value: 'PRODUCT_PRICE' },
                            { label: 'Product Unavailable / Out of Stock', value: 'PRODUCT_UNAVAILABLE' },
                            { label: 'Purchased Elsewhere', value: 'PURCHASED_ELSEWHERE' },
                            { label: 'No Longer Needed', value: 'NO_LONGER_REQUIRED' },
                            { label: 'Other Reason', value: 'OTHER' },
                          ]}
                        />
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Additional Details / Context
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Looked for antique finish instead of yellow gold"
                            value={purchaseNotes}
                            onChange={(e) => setPurchaseNotes(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 p-1.5 focus:border-rose-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {outcomeStatus === 'PENDING' && (
                    <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
                      <div className="text-xs font-semibold text-amber-900">
                        Customer Is Still Deciding
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Next Scheduled Follow-up Date
                          </label>
                          <input
                            type="datetime-local"
                            value={pendingFollowUpDate}
                            onChange={(e) => setPendingFollowUpDate(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 p-1.5 focus:border-amber-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Decision Status Note
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Comparing 2 models with spouse; requested callback"
                            value={purchaseNotes}
                            onChange={(e) => setPurchaseNotes(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 p-1.5 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={() => purchaseOutcomeMutation.mutate()}
                      isLoading={purchaseOutcomeMutation.isPending}
                      className={
                        outcomeStatus === 'APPROVED'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : outcomeStatus === 'REJECTED'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Save Purchase Outcome ({outcomeStatus})
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NEARBY STORES & ASSIGNMENT */}
            {activeTab === 'assignment' && (
              <div className="space-y-4">
                {/* Customer Location Info Header */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Customer Geolocation
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {request.city || 'City not specified'}
                        {request.state ? `, ${request.state}` : ''}
                        {request.latitude && request.longitude && (
                          <span className="font-mono text-slate-500 font-normal ml-2">
                            ({Number(request.latitude).toFixed(4)}, {Number(request.longitude).toFixed(4)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Proximity computed via <strong>Haversine Formula</strong>
                  </span>
                </div>

                {/* Showroom Ranking List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-600" />
                      Nearby Showrooms Ranked by Distance
                    </h4>
                    {isNearbyLoading && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 animate-spin" /> Calculating proximity...
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {nearbyStores.map((store, idx) => {
                      const isAssigned = request.assignedStoreId === store.id;
                      const isSelected = selectedStoreToAssign?.id === store.id;

                      return (
                        <div
                          key={store.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isAssigned
                              ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                              : isSelected
                              ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-400'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 font-mono ${
                                  idx === 0
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                  <span className="truncate">{store.name}</span>
                                  {isAssigned && (
                                    <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[10px] font-bold">
                                      CURRENTLY ASSIGNED
                                    </span>
                                  )}
                                  {idx === 0 && !isAssigned && (
                                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                      NEAREST
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="truncate">{store.address}</span>
                                  <span>·</span>
                                  <span className="font-mono text-emerald-700">{store.phone}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="text-xs font-mono font-bold text-slate-900">
                                  {store.distanceKm !== undefined
                                    ? `${store.distanceKm} km`
                                    : store.distanceLabel || 'Approx. Distance'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {store.city}, {store.state}
                                </div>
                              </div>

                              {isAssigned ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="text-xs py-1 px-2.5 h-7 border-blue-300 text-blue-700 bg-blue-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Assigned
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedStoreToAssign(store)}
                                  className="text-xs py-1 px-2.5 h-7 bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  <Navigation className="w-3 h-3 mr-1" />
                                  {request.assignedStoreId ? 'Reassign' : 'Assign Store'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assignment Confirmation Box */}
                {selectedStoreToAssign && (
                  <div className="p-3.5 rounded-lg border-2 border-amber-400 bg-amber-50/40 space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <Navigation className="w-4 h-4 text-amber-700" />
                        Confirm Dispatch to {selectedStoreToAssign.name} (
                        {selectedStoreToAssign.distanceKm ?? 'N/A'} km)
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedStoreToAssign(null)}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Dispatch Instructions / Assignment Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Nearest branch with stock on display. Customer interested in 22K Kundan choker."
                        value={assignmentNote}
                        onChange={(e) => setAssignmentNote(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStoreToAssign(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          assignStoreMutation.mutate({
                            storeId: selectedStoreToAssign.id,
                            note: assignmentNote || undefined,
                          })
                        }
                        isLoading={assignStoreMutation.isPending}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Confirm Assignment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: AUDIT TRAIL / TIMELINE */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-600" />
                    Complete Request Lifecycle Audit Log
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Total events: {request.history?.length || 0}
                  </span>
                </div>

                {(!request.history || request.history.length === 0) ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                    No history events recorded yet.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {request.history.map((h: RequestHistoryItem) => {
                      const isPurchaseApproved = h.action === 'PURCHASE_APPROVED';
                      const isPurchaseRejected = h.action === 'PURCHASE_REJECTED';
                      const isStoreAssigned = h.action === 'STORE_ASSIGNED' || h.action === 'STORE_REASSIGNED';
                      const isFollowUp = h.action === 'FOLLOW_UP_ADDED' || h.action === 'CUSTOMER_CONTACTED';

                      return (
                        <div key={h.id} className="relative">
                          {/* Dot indicator */}
                          <div
                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs ${
                              isPurchaseApproved
                                ? 'bg-emerald-500'
                                : isPurchaseRejected
                                ? 'bg-rose-500'
                                : isStoreAssigned
                                ? 'bg-blue-500'
                                : isFollowUp
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />

                          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-slate-900 text-xs font-mono">
                                {h.action.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(h.createdAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5">
                              <span className="font-medium text-slate-700">{h.actorName}</span>
                              <span>·</span>
                              <span className="px-1 py-0.2 rounded bg-slate-100 font-mono text-[9px] uppercase font-semibold text-slate-600">
                                {h.actorRole}
                              </span>
                            </div>

                            {h.note && (
                              <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 italic">
                                "{h.note}"
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Request Confirmation"
        message={`Are you sure you want to delete inquiry "${request?.requestId}" from ${request?.customerName}? This will permanently remove all follow-up and audit history.`}
        confirmText="Yes, Delete Request"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

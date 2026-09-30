import React, { useState, type FormEvent } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  AlertCircle,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { requestsApi, type TrackRequestResult } from '../api/requests.api';

interface TrackRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackRequestModal: React.FC<TrackRequestModalProps> = ({ isOpen, onClose }) => {
  const [requestId, setRequestId] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<TrackRequestResult | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);

    if (!requestId.trim() || !phone.trim()) {
      setErrorMsg('Please enter both your Request ID and registered phone number.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await requestsApi.trackRequest(requestId.trim(), phone.trim());
      setResult(res.data?.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setErrorMsg(
        typeof msg === 'string'
          ? msg
          : 'Could not find a request matching this ID and phone number. Please verify details.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getPurchaseBadge = (status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Purchase Confirmed</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300">
            <XCircle className="w-3.5 h-3.5 text-stone-500" />
            <span>Not Purchased / Concluded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            <span>Purchase Decision Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/60">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
              Customer Portal
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Track Product Request & Showroom Status
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Query Form */}
          <form onSubmit={handleTrack} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                  Request ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REQ-000001"
                  value={requestId}
                  onChange={(e) => setRequestId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs font-mono font-bold text-stone-900 placeholder-stone-400 focus:outline-none transition-colors uppercase shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-600 mb-1 font-semibold">
                  Registered Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-stone-200 focus:border-amber-600 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-colors shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Verifying Record...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>Track Request</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/40 via-white to-stone-50 border border-amber-200/80 shadow-xs space-y-4">
              {/* Product Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                {result.productImage ? (
                  <img
                    src={result.productImage}
                    alt={result.productName}
                    className="w-14 h-14 rounded-xl object-cover border border-amber-200 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                    <Sparkles className="w-6 h-6 opacity-60" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-950 bg-amber-100/60 px-2 py-0.5 rounded">
                      {result.requestId}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(result.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <h4 className="font-serif text-sm font-bold text-stone-900 truncate mt-1">
                    {result.productName}
                  </h4>
                  {result.quantity && (
                    <div className="text-[11px] text-stone-500 font-mono">
                      Requested: {result.quantity}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Message & Purchase Outcome */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Purchase Outcome
                  </span>
                  {getPurchaseBadge(result.purchaseStatus)}
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed">
                  <p className="font-medium text-stone-900">{result.statusMessage}</p>
                </div>
              </div>

              {/* Assigned Showroom Info */}
              <div className="p-3 rounded-xl bg-stone-100/70 border border-stone-200 text-xs space-y-1.5">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-stone-400" />
                  <span>Assigned Showroom</span>
                </div>
                <div className="font-semibold text-stone-900">{result.assignedStoreName}</div>
                {result.assignedStoreCity && (
                  <div className="text-[11px] text-stone-500">
                    Location: {result.assignedStoreCity}
                  </div>
                )}
                {result.assignedStorePhone && (
                  <div className="text-[11px] text-stone-600 font-mono flex items-center gap-1 pt-0.5">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Showroom Desk: {result.assignedStorePhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

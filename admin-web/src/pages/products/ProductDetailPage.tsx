import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products.api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await productsApi.getOne(id!);
      return res.data?.data;
    },
    enabled: Boolean(id),
  });

  const { data: priceData } = useQuery({
    queryKey: ['product-price', id],
    queryFn: async () => {
      const res = await productsApi.getPriceBreakdown(id!);
      return res.data?.data;
    },
    enabled: Boolean(id),
  });

  // Change Status Mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => productsApi.changeStatus(id!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast({ type: 'success', title: 'Status Updated', message: 'Product status changed' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to change status' });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading product details...</div>;
  }

  if (!productData) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-slate-500">Product not found</div>
        <Button onClick={() => navigate('/products')}>Back to Catalog</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Products
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{productData.name}</h1>
              <Badge variant={productData.status === 'PUBLISHED' ? 'success' : 'warning'}>
                {productData.status}
              </Badge>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {productData.sku}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {productData.status !== 'PUBLISHED' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => statusMutation.mutate('PUBLISHED')}
              isLoading={statusMutation.isPending}
            >
              Publish Item
            </Button>
          )}
          {productData.status === 'PUBLISHED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => statusMutation.mutate('ARCHIVED')}
              isLoading={statusMutation.isPending}
            >
              Archive
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm('Delete this product?')) {
                productsApi.delete(id!).then(() => {
                  toast({ type: 'success', title: 'Deleted', message: 'Product removed' });
                  navigate('/products');
                });
              }
            }}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Attributes (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Physical & Metal Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Metal Type</div>
                  <div className="font-semibold text-slate-800">{productData.metalType}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Purity</div>
                  <div className="font-semibold text-slate-800">{productData.purity}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Color / Finish</div>
                  <div className="font-semibold text-slate-800">{productData.metalColor || 'Standard'} / {productData.metalFinish || 'Polished'}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Gross Weight</div>
                  <div className="font-bold font-mono text-slate-900">{Number(productData.grossWeight).toFixed(3)} g</div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Stone Deduction</div>
                  <div className="font-mono text-slate-700">{Number(productData.stoneWeight || 0).toFixed(3)} g</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <div className="text-xs text-amber-800">Net Metal Weight</div>
                  <div className="font-bold font-mono text-amber-950 text-base">{Number(productData.netMetalWeight || productData.grossWeight).toFixed(3)} g</div>
                </div>
              </div>

              {productData.shortDescription && (
                <div className="mt-4 pt-4 border-t border-slate-100 text-sm">
                  <div className="text-xs text-slate-400 mb-1">Description</div>
                  <p className="text-slate-700">{productData.shortDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-mono">
                <div className="p-2 border rounded">
                  <div className="text-xs text-slate-500 font-sans">Pricing Mode</div>
                  <div className="font-semibold">{productData.pricingMode}</div>
                </div>
                <div className="p-2 border rounded">
                  <div className="text-xs text-slate-500 font-sans">Wastage</div>
                  <div>{productData.wastagePercent || 0}%</div>
                </div>
                <div className="p-2 border rounded">
                  <div className="text-xs text-slate-500 font-sans">Making Charges</div>
                  <div>₹{productData.makingChargeValue} ({productData.makingChargeType})</div>
                </div>
                <div className="p-2 border rounded">
                  <div className="text-xs text-slate-500 font-sans">Hallmark / Service</div>
                  <div>₹{productData.serviceCharges || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Price Breakdown */}
        <div>
          <Card className="border-amber-300 shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-t-lg py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <CardTitle className="text-base text-white">Live Benchmark Valuation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 font-mono text-xs">
              {priceData ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-amber-950 font-sans text-xs flex justify-between items-center">
                    <span>Market Rate: ₹{priceData.metalRate?.ratePerGram}/g</span>
                    <span className="text-slate-500 font-mono">{priceData.metalRate?.purity}</span>
                  </div>

                  <div className="space-y-2 border-t pt-2 divide-y divide-slate-100">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-sans">Metal Value:</span>
                      <span>₹{priceData.breakdown?.metalValue?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-sans">Wastage ({priceData.breakdown?.wastagePercent}%):</span>
                      <span>₹{priceData.breakdown?.wastageValue?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-sans">Making Charges:</span>
                      <span>₹{priceData.breakdown?.makingChargesAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    {priceData.breakdown?.majuriAmount > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-sans">Majuri:</span>
                        <span>₹{priceData.breakdown?.majuriAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-sans">Service / Hallmark:</span>
                      <span>₹{priceData.breakdown?.serviceCharges?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 font-bold font-sans text-slate-800">
                      <span>Taxable Amount:</span>
                      <span>₹{priceData.breakdown?.taxableAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-sans">GST (3%):</span>
                      <span>₹{priceData.breakdown?.gstAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="bg-amber-100 p-3 rounded-lg border border-amber-300 text-amber-950 font-sans mt-3">
                    <div className="text-xs text-amber-800">Total Showroom Price</div>
                    <div className="text-xl font-extrabold font-mono mt-0.5">
                      ₹{priceData.breakdown?.finalPriceRounded?.toLocaleString('en-IN')}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-slate-400 font-sans text-xs">
                  Awaiting price breakdown calculation...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

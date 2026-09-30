import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { metalRatesApi } from '../../api/metal-rates.api';
import { productsApi } from '../../api/products.api';
import { approvalsApi } from '../../api/approvals.api';
import { requestsApi } from '../../api/requests.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  TrendingUp,
  Package,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  MessageSquareQuote,
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();

  // 1. Fetch live metal rates
  const { data: latestRates } = useQuery({
    queryKey: ['metal-rates', 'latest'],
    queryFn: async () => {
      const res = await metalRatesApi.getLatest();
      return res.data?.data || [];
    },
  });

  // 2. Fetch products statistics
  const { data: productsData } = useQuery({
    queryKey: ['products', 'dashboard'],
    queryFn: async () => {
      const res = await productsApi.getAll({ limit: 100 });
      return res.data?.data || [];
    },
  });

  // 3. Fetch pending approvals
  const { data: approvalsData } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const res = await approvalsApi.getAll({ status: 'PENDING', limit: 5 });
      return res.data?.data || [];
    },
  });

  // 4. Fetch customer inquiries stats
  const { data: requestStats } = useQuery({
    queryKey: ['requests-stats', 'dashboard'],
    queryFn: async () => {
      const res = await requestsApi.getStats();
      return res.data?.data;
    },
  });

  // 5. Fetch recent customer inquiries
  const { data: recentRequests } = useQuery({
    queryKey: ['product-requests', 'dashboard-recent'],
    queryFn: async () => {
      const res = await requestsApi.getAll({ limit: 4, sortBy: 'createdAt', sortOrder: 'DESC' });
      return res.data?.data || [];
    },
  });

  const gold24K = latestRates?.find((r: any) => r.metalType === 'GOLD' && r.purity === 'K24');
  const gold22K = latestRates?.find((r: any) => r.metalType === 'GOLD' && r.purity === 'K22');
  const gold18K = latestRates?.find((r: any) => r.metalType === 'GOLD' && r.purity === 'K18');
  const silver999 = latestRates?.find((r: any) => r.metalType === 'SILVER' && r.purity === 'SILVER_999');

  const totalProducts = productsData?.length || 0;
  const publishedProducts = productsData?.filter((p: any) => p.status === 'PUBLISHED').length || 0;
  const draftProducts = productsData?.filter((p: any) => p.status === 'DRAFT').length || 0;
  const pendingApprovalsCount = approvalsData?.length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h1 className="text-2xl font-bold tracking-tight">Jewellery Super Admin Dashboard</h1>
          </div>
          <p className="text-xs text-amber-200/80 mt-1">
            Real-time catalog management, live metal benchmark valuation, and role-based operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/products/new')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" /> New Product
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/metal-rates')}
            className="border-amber-400/40 text-amber-300 hover:bg-amber-500/10"
          >
            <TrendingUp className="w-4 h-4 mr-1" /> Update Rates
          </Button>
        </div>
      </div>

      {/* Live Benchmark Rates Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Today's Live Metal Benchmarks</span>
          </div>
          <button
            onClick={() => navigate('/metal-rates')}
            className="text-xs text-amber-700 hover:underline flex items-center font-medium"
          >
            Manage Rates <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
            <CardContent className="pt-5">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Gold 24K (99.9%)</div>
              <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                {gold24K ? `₹${Number(gold24K.ratePerGram).toLocaleString('en-IN')}` : '₹6,200'}
                <span className="text-xs font-normal text-slate-500 font-sans"> /g</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Base Benchmark Purity</div>
            </CardContent>
          </Card>

          <Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/40">
            <CardContent className="pt-5">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Gold 22K (Hallmark)</div>
              <div className="text-2xl font-black text-amber-900 font-mono mt-1">
                {gold22K ? `₹${Number(gold22K.ratePerGram).toLocaleString('en-IN')}` : '₹5,683'}
                <span className="text-xs font-normal text-slate-500 font-sans"> /g</span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-1">Standard 916 Jewellery</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Gold 18K (75.0%)</div>
              <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                {gold18K ? `₹${Number(gold18K.ratePerGram).toLocaleString('en-IN')}` : '₹4,650'}
                <span className="text-xs font-normal text-slate-500 font-sans"> /g</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Diamond Setting Metal</div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Silver 999 Fine</div>
              <div className="text-2xl font-black text-slate-800 font-mono mt-1">
                {silver999 ? `₹${Number(silver999.ratePerGram).toLocaleString('en-IN')}` : '₹78'}
                <span className="text-xs font-normal text-slate-500 font-sans"> /g</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">₹{silver999 ? (Number(silver999.ratePerGram) * 1000).toLocaleString('en-IN') : '78,000'} / kg</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Catalog & Operations Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Total Catalog SKUs</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalProducts}</div>
              <div className="text-xs text-slate-400 mt-0.5">{publishedProducts} published, {draftProducts} drafts</div>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg text-slate-700">
              <Package className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Customer Inquiries */}
        <Card
          className="cursor-pointer hover:border-amber-400 transition-colors"
          onClick={() => navigate('/requests')}
        >
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-amber-800">Customer Inquiries</div>
              <div className="text-2xl font-bold text-amber-950 mt-1 flex items-center gap-2">
                <span>{requestStats?.total || 0}</span>
                {requestStats?.new !== undefined && requestStats.new > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold font-mono animate-pulse">
                    {requestStats.new} new
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {requestStats?.assigned || 0} assigned, {requestStats?.approvedPurchases || 0} purchased ({requestStats?.conversionRate || 0}%)
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-700">
              <MessageSquareQuote className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Pending Approvals</div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{pendingApprovalsCount}</div>
              <div className="text-xs text-slate-400 mt-0.5">Rate & product review queue</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card>
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Regulatory Tax Status</div>
              <div className="text-xl font-bold text-slate-800 mt-1">GST 3.0% (HSN 7113)</div>
              <div className="text-xs text-slate-400 mt-0.5">PAN & KYC threshold: ₹2,00,000</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700 font-mono text-base font-bold">
              ₹
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grids: Pending Approvals, Customer Inquiries & Quick Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Customer Inquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-amber-600" />
              <span>Recent Inquiries</span>
            </CardTitle>
            <button
              onClick={() => navigate('/requests')}
              className="text-xs text-amber-700 hover:underline"
            >
              View All
            </button>
          </CardHeader>
          <CardContent>
            {recentRequests && recentRequests.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentRequests.map((r: any) => (
                  <div
                    key={r.id}
                    className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 px-1 rounded transition-colors"
                    onClick={() => navigate('/requests')}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-800 truncate">{r.customerName}</div>
                      <div className="text-slate-400 text-[11px] truncate">{r.productName}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-mono text-[10px] text-amber-900 font-bold">{r.requestId}</span>
                      <Badge variant={r.status === 'NEW' ? 'gold' : r.status === 'CLOSED' ? 'success' : 'info'}>
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No customer inquiries yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Pending Action Queue</CardTitle>
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs text-amber-700 hover:underline"
            >
              View All
            </button>
          </CardHeader>
          <CardContent>
            {approvalsData && approvalsData.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {approvalsData.map((item: any) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{item.type}</span>
                      <div className="text-slate-500">{item.entityName || 'General update'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">{item.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => navigate('/approvals')}>
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                ✅ All actions up to date. No pending approvals in queue.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Products</CardTitle>
            <button
              onClick={() => navigate('/products')}
              className="text-xs text-amber-700 hover:underline"
            >
              View Catalog
            </button>
          </CardHeader>
          <CardContent>
            {productsData && productsData.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {productsData.slice(0, 4).map((p: any) => (
                  <div
                    key={p.id}
                    className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 px-1 rounded transition-colors"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <div className="text-slate-400 font-mono">{p.sku} · {p.metalType} {p.purity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-slate-900">{Number(p.grossWeight).toFixed(3)}g</div>
                      <Badge variant={p.status === 'PUBLISHED' ? 'success' : 'info'}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No products yet. Click "+ New Product" to add your first item.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

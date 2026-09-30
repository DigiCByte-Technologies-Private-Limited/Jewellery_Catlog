import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../api/categories.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { Plus, Trash2, FolderTree } from 'lucide-react';

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [defaultWastage, setDefaultWastage] = useState('8');
  const [defaultMakingCharge, setDefaultMakingCharge] = useState('400');
  const [hsnCode, setHsnCode] = useState('7113');

  // Fetch flat categories
  const { data: response, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.getFlat({ limit: 100 });
      return res.data;
    },
  });

  const categories = response?.data || [];

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ type: 'success', title: 'Category Created', message: 'Category added to hierarchy' });
      setIsModalOpen(false);
      setName('');
      setParentId('');
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to create category' });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ type: 'success', title: 'Deleted', message: 'Category removed' });
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to delete category' });
    },
  });

  const columns = [
    {
      header: 'Category Name',
      cell: (r: any) => (
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-slate-800">{r.name}</span>
          {r.parent && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
              Child of {r.parent.name}
            </span>
          )}
        </div>
      ),
    },
    { header: 'Slug', accessorKey: 'slug' },
    {
      header: 'Default Wastage',
      cell: (r: any) => (r.defaultWastagePercent ? `${r.defaultWastagePercent}%` : '—'),
    },
    {
      header: 'Default MC',
      cell: (r: any) => (r.defaultMakingChargeValue ? `₹${r.defaultMakingChargeValue}/g` : '—'),
    },
    { header: 'HSN Code', accessorKey: 'hsnCode' },
    {
      header: 'Actions',
      cell: (r: any) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (confirm(`Delete category ${r.name}?`)) {
              deleteMutation.mutate(r.id);
            }
          }}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-500 text-sm">Manage multi-level category taxonomy and pricing defaults</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table columns={columns} data={categories} isLoading={isLoading} />
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Category"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!name.trim()) {
                  toast({ type: 'warning', title: 'Validation', message: 'Name is required' });
                  return;
                }
                createMutation.mutate({
                  name,
                  parentId: parentId || undefined,
                  defaultWastagePercent: Number(defaultWastage) || undefined,
                  defaultMakingChargeValue: Number(defaultMakingCharge) || undefined,
                  hsnCode,
                });
              }}
              isLoading={createMutation.isPending}
            >
              Create Category
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name *"
            placeholder="e.g. Bangles, Necklaces, Rings"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select
            label="Parent Category (Optional)"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            options={[
              { label: 'None (Top Level Root Category)', value: '' },
              ...categories
                .filter((c: any) => !c.parent)
                .map((c: any) => ({ label: c.name, value: c.id })),
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Wastage %"
              type="number"
              step="0.1"
              value={defaultWastage}
              onChange={(e) => setDefaultWastage(e.target.value)}
            />
            <Input
              label="Default Making Charge (₹/g)"
              type="number"
              value={defaultMakingCharge}
              onChange={(e) => setDefaultMakingCharge(e.target.value)}
            />
          </div>

          <Input
            label="HSN Code"
            placeholder="7113"
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../api/categories.api';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import { StandardPageLayout, type StatWidget } from '../../components/layout/StandardPageLayout';
import { Plus, Trash2, FolderTree, RotateCcw } from 'lucide-react';

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [hierarchyFilter, setHierarchyFilter] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [defaultWastage, setDefaultWastage] = useState('8');
  const [defaultMakingCharge, setDefaultMakingCharge] = useState('400');
  const [hsnCode, setHsnCode] = useState('7113');

  // Fetch flat categories with server SQL pagination, search & hierarchy filter
  const { data: response, isLoading } = useQuery({
    queryKey: ['categories', 'flat', page, itemsPerPage, search, hierarchyFilter],
    queryFn: async () => {
      const res = await categoriesApi.getFlat({
        page,
        limit: itemsPerPage,
        search: search || undefined,
        hierarchy: hierarchyFilter || undefined,
      });
      return res.data;
    },
  });

  // Fetch full category tree for parent selection in modal and global metrics
  const { data: treeResponse } = useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: async () => {
      const res = await categoriesApi.getTree();
      return res.data;
    },
  });

  const categories = response?.data || [];
  const totalCount = response?.meta?.total ?? 0;
  const totalPages = response?.meta?.totalPages ?? 1;

  const rootCategories = treeResponse?.data || [];
  const rootCategoriesCount = rootCategories.length;
  const subCategoriesCount = useMemo(() => {
    let count = 0;
    const countNodes = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          count += node.children.length;
          countNodes(node.children);
        }
      }
    };
    countNodes(rootCategories);
    return count;
  }, [rootCategories]);

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ type: 'success', title: 'Category Created', message: 'Category added to hierarchy' });
      setIsModalOpen(false);
      setName('');
      setParentId('');
      setDefaultWastage('8');
      setDefaultMakingCharge('400');
      setHsnCode('7113');
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

  const statWidgets: StatWidget[] = [
    {
      label: 'Total Categories',
      value: totalCount,
      subValue: 'Across entire jewellery catalog',
      color: 'gold',
      onClick: () => {
        setHierarchyFilter('');
        setPage(1);
      },
    },
    {
      label: 'Root Categories',
      value: rootCategoriesCount,
      subValue: 'Top-level primary collections',
      color: 'blue',
      onClick: () => {
        setHierarchyFilter('ROOT');
        setPage(1);
      },
    },
    {
      label: 'Sub-Categories',
      value: subCategoriesCount,
      subValue: 'Nested styles & design articles',
      color: 'purple',
      onClick: () => {
        setHierarchyFilter('SUB');
        setPage(1);
      },
    },
    {
      label: 'Primary HSN Code',
      value: '7113',
      subValue: 'Articles of jewellery & precious metals',
      color: 'emerald',
    },
  ];

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
          onClick={() => setCategoryToDelete({ id: r.id, name: r.name })}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
        </Button>
      ),
    },
  ];

  const customFilterToolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-56">
        <CustomDropdown
          value={hierarchyFilter}
          onChange={(val) => {
            setHierarchyFilter(val);
            setPage(1);
          }}
          placeholder="All Hierarchies"
          options={[
            { value: '', label: 'All Hierarchies' },
            { value: 'ROOT', label: 'Root Categories Only', badge: `${rootCategoriesCount}` },
            { value: 'SUB', label: 'Sub-Categories Only', badge: `${subCategoriesCount}` },
          ]}
        />
      </div>

      {(hierarchyFilter || search) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setHierarchyFilter('');
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
        title="Category Taxonomy & Hierarchy"
        description="Manage multi-level category taxonomy, parent-child relationships, and pricing defaults"
        badge="Catalog Governance"
        stats={statWidgets}
        searchPlaceholder="Search categories by name, slug or parent..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        customFilters={customFilterToolbar}
        primaryAction={{
          label: 'Add Category',
          icon: <Plus className="w-4 h-4 mr-2" />,
          onClick: () => setIsModalOpen(true),
        }}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
        viewMode="table"
        tableContent={
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <Table columns={columns} data={categories} isLoading={isLoading} />
          </div>
        }
      />

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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Parent Category (Optional)
            </label>
            <CustomDropdown
              value={parentId}
              onChange={(val) => setParentId(val)}
              placeholder="None (Top Level Root Category)"
              options={[
                { label: 'None (Top Level Root Category)', value: '' },
                ...rootCategories.map((c: any) => ({ label: c.name, value: c.id })),
              ]}
            />
          </div>

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

      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id);
            setCategoryToDelete(null);
          }
        }}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? Any sub-categories or products linked to it will need reassignment.`}
        confirmText="Delete Category"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

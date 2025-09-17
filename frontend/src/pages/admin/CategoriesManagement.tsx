import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Pin, PinOff, Upload } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showSuccessToast, showErrorToast } from '../../components/ui/CustomToast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
}

const CategoriesManagement = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_pinned: false
  });

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showErrorToast('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if trying to pin more than 3 categories
    if (formData.is_pinned && !editingCategory) {
      const pinnedCount = categories.filter(cat => cat.is_pinned).length;
      if (pinnedCount >= 3) {
        showErrorToast('You can only pin up to 3 categories for homepage display');
        return;
      }
    }

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        is_pinned: formData.is_pinned
      };

      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      if (editingCategory) {
        const { error } = await supabaseAdmin
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        showSuccessToast('Category updated successfully');
      } else {
        const { error } = await supabaseAdmin
          .from('categories')
          .insert([categoryData]);

        if (error) throw error;
        showSuccessToast('Category created successfully');
      }

      setShowModal(false);
      setEditingCategory(null);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      if (error.code === '23505') {
        showErrorToast('A category with this name or slug already exists');
      } else {
        showErrorToast(error.message || 'Failed to save category');
      }
    }
  };

  const togglePinned = async (categoryId: string, currentPinned: boolean) => {
    // Check if trying to pin and already have 3 pinned
    if (!currentPinned) {
      const pinnedCount = categories.filter(cat => cat.is_pinned).length;
      if (pinnedCount >= 3) {
        showErrorToast('You can only pin up to 3 categories for homepage display');
        return;
      }
    }

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { error } = await supabaseAdmin
        .from('categories')
        .update({ is_pinned: !currentPinned })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(categories.map(category =>
        category.id === categoryId
          ? { ...category, is_pinned: !currentPinned }
          : category
      ));

      showSuccessToast(`Category ${!currentPinned ? 'pinned' : 'unpinned'} successfully`);
    } catch (error) {
      console.error('Error toggling pin status:', error);
      showErrorToast('Failed to update category');
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    setDeletingCategoryId(categoryId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategoryId) return;

    setDeleting(true);
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', deletingCategoryId);

      if (error) throw error;

      setCategories(categories.filter(category => category.id !== deletingCategoryId));
      showSuccessToast('Category deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingCategoryId(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      showErrorToast('Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `categories/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: filePath });
      showSuccessToast('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showErrorToast(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        image_url: category.image_url || '',
        is_pinned: category.is_pinned
      });
    } else {
      setEditingCategory(null);
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_pinned: false
    });
  };

  const pinnedCount = categories.filter(cat => cat.is_pinned).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Categories Management</h1>
            <p className="text-[rgb(94,94,94)]">Manage product categories and homepage tiles</p>
            <p className="text-[rgb(94,94,94)] text-sm mt-1">
              Pinned categories ({pinnedCount}/3) appear as tiles on homepage
            </p>
          </div>

          <Button
            onClick={() => openEditModal()}
            className="bg-white text-black hover:bg-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories Table */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(25,25,25)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(51,51,51)]">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-[rgb(94,94,94)] truncate max-w-xs">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.image_url ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${category.image_url}`}
                          alt={category.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[rgb(51,51,51)] rounded flex items-center justify-center">
                          <span className="text-[rgb(94,94,94)] text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePinned(category.id, category.is_pinned)}
                        className="flex items-center"
                      >
                        {category.is_pinned ? (
                          <>
                            <Pin className="w-4 h-4 text-yellow-400 mr-2" />
                            <span className="text-yellow-400 text-sm">Pinned</span>
                          </>
                        ) : (
                          <>
                            <PinOff className="w-4 h-4 text-[rgb(94,94,94)] mr-2" />
                            <span className="text-[rgb(94,94,94)] text-sm">Not Pinned</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(category)}
                        className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {categories.length === 0 && (
            <div className="px-6 py-12 text-center text-[rgb(94,94,94)]">
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No categories found</p>
            </div>
          )}
        </div>

        {/* Add/Edit Category Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[rgb(51,51,51)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[rgb(94,94,94)] hover:text-white"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <Input
                  label="Category Name"
                  variant="dark"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />

                <Input
                  label="Slug"
                  variant="dark"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  helperText="URL-friendly version of the name"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                    Category Image
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full px-4 py-2.5 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200"
                    />
                    {uploading && (
                      <p className="text-[rgb(94,94,94)] text-sm">Uploading image...</p>
                    )}
                    {formData.image_url && (
                      <div className="mt-2">
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${formData.image_url}`}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                      className="mr-2 text-white accent-white"
                    />
                    <span className="text-white">Pin to homepage</span>
                  </label>
                  <p className="text-[rgb(94,94,94)] text-xs mt-1">
                    Pinned categories appear as tiles on the homepage (max 3)
                  </p>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Category Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingCategoryId(null);
          }}
          onConfirm={confirmDeleteCategory}
          title="Delete Category"
          message={`Are you sure you want to delete this category? This action cannot be undone and will affect all products in this category.`}
          confirmText="Delete Category"
          cancelText="Cancel"
          variant="danger"
          loading={deleting}
        />
      </div>
    </AdminLayout>
  );
};

export default CategoriesManagement;
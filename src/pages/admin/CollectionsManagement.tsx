import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Pin, PinOff, Package, Eye, LayoutDashboard, Grid3X3, X, Search, Upload, Image as ImageIcon } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showSuccessToast, showErrorToast } from '../../components/ui/CustomToast';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { uploadCollectionImage, deleteCollectionImage } from '../../lib/imageUpload';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  is_pinned: boolean;
  display_order: number;
  created_at: string;
  product_count?: number;
}

interface Product {
  id: string;
  title: string;
  sku: string;
  price: number;
  image_url?: string;
  is_active: boolean;
}

interface CollectionProduct {
  id: string;
  product_id: string;
  display_order: number;
  products: Product;
}

const CollectionsManagement = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Product management state
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [collectionProducts, setCollectionProducts] = useState<CollectionProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    is_pinned: false,
    display_order: 0
  });

  const pinnedCollection = collections.find(collection => collection.is_pinned);

  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user]);

  const fetchCollections = async () => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      // Fetch collections with product count
      const { data, error } = await supabaseAdmin
        .from('collections')
        .select(`
          *,
          collection_products(count)
        `)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform data to include product count
      const collectionsWithCount = data?.map(collection => ({
        ...collection,
        product_count: collection.collection_products?.[0]?.count || 0
      })) || [];

      setCollections(collectionsWithCount);
    } catch (error) {
      console.error('Error fetching collections:', error);
      showErrorToast('Failed to load collections');
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

    if (!formData.name.trim()) {
      showErrorToast('Collection name is required');
      return;
    }

    // Check if trying to pin when another collection is already pinned
    if (formData.is_pinned && !editingCollection) {
      if (pinnedCollection) {
        showErrorToast('Only one collection can be pinned at a time. Unpin the current collection first.');
        return;
      }
    }

    // Check if editing and trying to pin when another collection is pinned
    if (formData.is_pinned && editingCollection && editingCollection.id !== pinnedCollection?.id) {
      if (pinnedCollection) {
        showErrorToast('Only one collection can be pinned at a time. Unpin the current collection first.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const collectionData = {
        name: formData.name.trim(),
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description.trim() || null,
        image_url: formData.image_url.trim() || null,
        is_active: formData.is_active,
        is_pinned: formData.is_pinned,
        display_order: formData.display_order
      };

      let result;
      if (editingCollection) {
        result = await supabaseAdmin
          .from('collections')
          .update(collectionData)
          .eq('id', editingCollection.id);
      } else {
        result = await supabaseAdmin
          .from('collections')
          .insert([collectionData]);
      }

      if (result.error) throw result.error;

      showSuccessToast(
        editingCollection ? 'Collection updated successfully' : 'Collection created successfully'
      );

      setShowModal(false);
      setEditingCollection(null);
      resetForm();
      fetchCollections();
    } catch (error: any) {
      console.error('Error saving collection:', error);
      if (error.message?.includes('duplicate key')) {
        showErrorToast('A collection with this slug already exists');
      } else {
        showErrorToast('Failed to save collection');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      is_active: true,
      is_pinned: false,
      display_order: 0
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showErrorToast('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast('Image file size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // For new collections, use a temporary ID
      const collectionId = editingCollection?.id || 'temp_' + Date.now();
      const imageUrl = await uploadCollectionImage(file, collectionId);

      setFormData({
        ...formData,
        image_url: imageUrl
      });

      showSuccessToast('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      showErrorToast(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!formData.image_url) return;

    try {
      await deleteCollectionImage(formData.image_url);
      setFormData({
        ...formData,
        image_url: ''
      });
      showSuccessToast('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      showErrorToast('Failed to remove image');
    }
  };

  const openEditModal = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || '',
        image_url: collection.image_url || '',
        is_active: collection.is_active,
        is_pinned: collection.is_pinned,
        display_order: collection.display_order
      });
    } else {
      setEditingCollection(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleDeleteCollection = (collectionId: string) => {
    setDeletingCollectionId(collectionId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCollection = async () => {
    if (!deletingCollectionId) return;

    setDeleting(true);
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      // Hard delete - will cascade delete collection_products due to foreign key
      const { error } = await supabaseAdmin
        .from('collections')
        .delete()
        .eq('id', deletingCollectionId);

      if (error) throw error;

      setCollections(collections.filter(collection => collection.id !== deletingCollectionId));
      showSuccessToast('Collection deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingCollectionId(null);
    } catch (error) {
      console.error('Error deleting collection:', error);
      showErrorToast('Failed to delete collection');
    } finally {
      setDeleting(false);
    }
  };

  const togglePinStatus = async (collectionId: string, currentStatus: boolean) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      // Check if trying to pin when another collection is already pinned
      if (!currentStatus && pinnedCollection && pinnedCollection.id !== collectionId) {
        showErrorToast('Only one collection can be pinned at a time. Unpin the current collection first.');
        return;
      }

      const { error } = await supabaseAdmin
        .from('collections')
        .update({ is_pinned: !currentStatus })
        .eq('id', collectionId);

      if (error) throw error;

      setCollections(collections.map(collection =>
        collection.id === collectionId
          ? { ...collection, is_pinned: !currentStatus }
          : collection
      ));

      showSuccessToast(`Collection ${!currentStatus ? 'pinned to' : 'unpinned from'} homepage`);
    } catch (error) {
      console.error('Error toggling pin status:', error);
      showErrorToast('Failed to update pin status');
    }
  };

  const openProductsModal = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowProductsModal(true);
    fetchCollectionProducts(collection.id);
    fetchAvailableProducts();
  };

  const fetchCollectionProducts = async (collectionId: string) => {
    try {
      setLoadingProducts(true);

      const { data, error } = await supabaseAdmin
        .from('collection_products')
        .select(`
          *,
          products (
            id,
            title,
            sku,
            price,
            is_active
          )
        `)
        .eq('collection_id', collectionId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCollectionProducts(data || []);
    } catch (error) {
      console.error('Error fetching collection products:', error);
      showErrorToast('Failed to load collection products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchAvailableProducts = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('id, title, sku, price, is_active')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('title');

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error fetching available products:', error);
      showErrorToast('Failed to load available products');
    }
  };

  const addProductToCollection = async (productId: string) => {
    if (!selectedCollection) return;

    try {
      const { error } = await supabaseAdmin
        .from('collection_products')
        .insert([{
          collection_id: selectedCollection.id,
          product_id: productId,
          display_order: collectionProducts.length
        }]);

      if (error) throw error;

      showSuccessToast('Product added to collection');
      fetchCollectionProducts(selectedCollection.id);
      fetchCollections(); // Refresh product count
    } catch (error: any) {
      console.error('Error adding product to collection:', error);
      if (error.message?.includes('duplicate key')) {
        showErrorToast('Product is already in this collection');
      } else {
        showErrorToast('Failed to add product to collection');
      }
    }
  };

  const removeProductFromCollection = async (collectionProductId: string) => {
    if (!selectedCollection) return;

    try {
      const { error } = await supabaseAdmin
        .from('collection_products')
        .delete()
        .eq('id', collectionProductId);

      if (error) throw error;

      showSuccessToast('Product removed from collection');
      fetchCollectionProducts(selectedCollection.id);
      fetchCollections(); // Refresh product count
    } catch (error) {
      console.error('Error removing product from collection:', error);
      showErrorToast('Failed to remove product from collection');
    }
  };

  const filteredAvailableProducts = availableProducts.filter(product => {
    const isAlreadyInCollection = collectionProducts.some(cp => cp.product_id === product.id);
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return !isAlreadyInCollection && matchesSearch;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </AdminLayout>
    );
  }

  const breadcrumbItems = [
    {
      label: 'Admin',
      path: '/admin',
      icon: <LayoutDashboard size={16} />
    },
    {
      label: 'Collections',
      icon: <Grid3X3 size={16} />
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} variant="white" />

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Collections Management</h1>
            <p className="text-[rgb(94,94,94)]">Manage product collections and marketing campaigns</p>
            <p className="text-[rgb(94,94,94)] text-sm mt-1">
              {pinnedCollection
                ? `Pinned collection: ${pinnedCollection.name}`
                : 'No collection is currently pinned to homepage'
              }
            </p>
          </div>

          <Button
            onClick={() => openEditModal()}
            className="bg-[rgb(51,51,51)] text-white hover:bg-[rgb(64,64,64)] border border-[rgb(94,94,94)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Collection
          </Button>
        </div>

        {/* Collections Table */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(25,25,25)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Collection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Pinned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Order
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
                {collections.map((collection) => (
                  <tr key={collection.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {collection.image_url ? (
                          <img
                            className="h-10 w-10 rounded object-cover mr-4"
                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${collection.image_url}`}
                            alt={collection.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-[rgb(51,51,51)] flex items-center justify-center mr-4">
                            <Package className="h-5 w-5 text-[rgb(94,94,94)]" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">{collection.name}</div>
                          <div className="text-sm text-[rgb(94,94,94)]">/{collection.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {collection.product_count || 0} products
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        collection.is_active
                          ? 'bg-green-900/20 text-green-400 border border-green-400/20'
                          : 'bg-red-900/20 text-red-400 border border-red-400/20'
                      }`}>
                        {collection.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => togglePinStatus(collection.id, collection.is_pinned)}
                        className={`p-1 rounded transition-colors ${
                          collection.is_pinned
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-[rgb(94,94,94)] hover:text-yellow-400'
                        }`}
                      >
                        {collection.is_pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      {collection.display_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      {new Date(collection.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openProductsModal(collection)}
                        className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                        title="Manage products"
                      >
                        <Package className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(collection)}
                        className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCollection(collection.id)}
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {collections.length === 0 && (
            <div className="px-6 py-12 text-center text-[rgb(94,94,94)]">
              <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No collections found</p>
              <p className="text-sm mt-1">Create your first collection to organize products</p>
            </div>
          )}
        </div>

        {/* Add/Edit Collection Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[rgb(51,51,51)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  {editingCollection ? 'Edit Collection' : 'Add New Collection'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[rgb(94,94,94)] hover:text-white"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                    Collection Name *
                  </label>
                  <Input
                    variant="dark"
                    placeholder="Enter collection name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                    Slug
                  </label>
                  <Input
                    variant="dark"
                    placeholder="collection-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                  <p className="text-xs text-[rgb(94,94,94)] mt-1">
                    URL-friendly version (auto-generated from name)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white text-sm resize-none"
                    rows={3}
                    placeholder="Enter collection description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                    Collection Image
                  </label>

                  {/* Image Preview */}
                  {formData.image_url && (
                    <div className="mb-3">
                      <div className="relative inline-block">
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${formData.image_url}`}
                          alt="Collection preview"
                          className="w-32 h-32 object-cover rounded-lg border border-[rgb(51,51,51)]"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Section */}
                  <div className="space-y-3">
                    <div>
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`inline-flex items-center px-4 py-2 border border-[rgb(51,51,51)] rounded-lg cursor-pointer hover:bg-[rgb(25,25,25)] transition-colors text-white ${
                          uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </label>
                    </div>

                    <div className="text-xs text-[rgb(94,94,94)]">
                      Or enter image URL manually:
                    </div>

                    <Input
                      variant="dark"
                      placeholder="https://example.com/image.jpg"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>

                  <p className="text-xs text-[rgb(94,94,94)] mt-2">
                    Recommended: 800x600px or larger. Max file size: 5MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                    Display Order
                  </label>
                  <Input
                    variant="dark"
                    type="number"
                    placeholder="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      className="mr-3"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="is_active" className="text-sm text-[rgb(94,94,94)]">
                      Active (visible to customers)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_pinned"
                      className="mr-3"
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    />
                    <label htmlFor="is_pinned" className="text-sm text-[rgb(94,94,94)]">
                      Pin to homepage
                    </label>
                  </div>
                  <p className="text-xs text-[rgb(94,94,94)] mt-1">
                    Only one collection can be pinned to homepage at a time
                  </p>
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-[rgb(51,51,51)] text-white hover:bg-[rgb(64,64,64)] border border-[rgb(94,94,94)] disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : (editingCollection ? 'Update Collection' : 'Create Collection')}
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

        {/* Manage Collection Products Modal */}
        {showProductsModal && selectedCollection && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgb(51,51,51)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  Manage Products: {selectedCollection.name}
                </h3>
                <button
                  onClick={() => setShowProductsModal(false)}
                  className="text-[rgb(94,94,94)] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Available Products */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-medium">Available Products</h4>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(94,94,94)] w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          className="pl-10 pr-4 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg text-sm w-64"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredAvailableProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-white text-sm font-medium">{product.title}</div>
                            <div className="text-[rgb(94,94,94)] text-xs">
                              {product.sku} • LKR {product.price}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addProductToCollection(product.id)}
                            className="bg-blue-600 text-white hover:bg-blue-700 text-xs"
                          >
                            Add
                          </Button>
                        </div>
                      ))}

                      {filteredAvailableProducts.length === 0 && (
                        <div className="text-center py-8 text-[rgb(94,94,94)]">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No available products found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collection Products */}
                  <div>
                    <h4 className="text-white font-medium mb-4">
                      Products in Collection ({collectionProducts.length})
                    </h4>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {loadingProducts ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                        </div>
                      ) : (
                        <>
                          {collectionProducts.map((collectionProduct) => (
                            <div
                              key={collectionProduct.id}
                              className="flex items-center justify-between p-3 bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="text-white text-sm font-medium">
                                  {collectionProduct.products.title}
                                </div>
                                <div className="text-[rgb(94,94,94)] text-xs">
                                  {collectionProduct.products.sku} • LKR {collectionProduct.products.price}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-[rgb(94,94,94)]">
                                  #{collectionProduct.display_order}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeProductFromCollection(collectionProduct.id)}
                                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white text-xs"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}

                          {collectionProducts.length === 0 && (
                            <div className="text-center py-8 text-[rgb(94,94,94)]">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No products in this collection</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Collection Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingCollectionId(null);
          }}
          onConfirm={confirmDeleteCollection}
          title="Delete Collection"
          message="Are you sure you want to delete this collection? This action cannot be undone and will remove all product associations."
          confirmText="Delete Collection"
          isDestructive={true}
          loading={deleting}
        />
      </div>
    </AdminLayout>
  );
};

export default CollectionsManagement;
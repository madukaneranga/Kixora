import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { showSuccessToast, showErrorToast } from '../../components/ui/CustomToast';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  sku: string;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  categories: {
    name: string;
  } | null;
  brands: {
    name: string;
  } | null;
  product_variants: Array<{
    id: string;
    stock: number;
    size: string;
    color: string;
  }>;
}

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

const ProductsManagement = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    sku: '',
    category_id: '',
    brand_id: '',
    is_active: true,
    featured: false
  });
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
  const [currentStep, setCurrentStep] = useState(1);
  const [variants, setVariants] = useState<Array<{
    size: string;
    color: string;
    stock: number;
  }>>([]);
  const [availableColors] = useState([
    { name: 'Black', image: '/src/assests/colors/black.png' },
    { name: 'White', image: '/src/assests/colors/white.png' },
    { name: 'Red', image: '/src/assests/colors/red.png' },
    { name: 'Blue', image: '/src/assests/colors/blue.png' },
    { name: 'Green', image: '/src/assests/colors/green.png' },
    { name: 'Yellow', image: '/src/assests/colors/yellow.png' },
    { name: 'Purple', image: '/src/assests/colors/purple.png' },
    { name: 'Orange', image: '/src/assests/colors/orange.png' },
    { name: 'Pink', image: '/src/assests/colors/pink.png' },
    { name: 'Gray', image: '/src/assests/colors/gray.png' },
  ]);
  const [images, setImages] = useState<File[]>([]);
  const [simpleStock, setSimpleStock] = useState<number>(0);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        supabaseAdmin
          .from('products')
          .select(`
            *,
            categories (name),
            brands (name),
            product_variants (id, stock, size, color)
          `)
          .order('created_at', { ascending: false }),
        supabaseAdmin.from('categories').select('id, name').order('name'),
        supabaseAdmin.from('brands').select('id, name').order('name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (brandsRes.error) throw brandsRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showErrorToast('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only allow submission on the final step (step 4)
    if (currentStep !== 4) {
      nextStep();
      return;
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

      // Validate required fields
      if (!formData.title || !formData.sku || !formData.price) {
        throw new Error('Please fill in all required fields');
      }

      // Validate product type specific requirements
      if (productType === 'simple' && simpleStock < 0) {
        throw new Error('Stock quantity cannot be negative');
      }

      if (productType === 'variable' && variants.length === 0) {
        throw new Error('Variable products must have at least one variant');
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        sku: formData.sku,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        is_active: formData.is_active,
        featured: formData.featured
      };

      let productId: string;

      if (editingProduct) {
        // Update existing product
        const { error: productError } = await supabaseAdmin
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (productError) throw productError;
        productId = editingProduct.id;

        // Delete existing variants to replace them
        const { error: deleteError } = await supabaseAdmin
          .from('product_variants')
          .delete()
          .eq('product_id', productId);

        if (deleteError) throw deleteError;
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabaseAdmin
          .from('products')
          .insert([productData])
          .select('id')
          .single();

        if (productError) throw productError;
        productId = newProduct.id;
      }

      // Create variants based on product type
      const variantData: Array<{
        product_id: string;
        sku: string;
        size: string | null;
        color: string | null;
        stock: number;
      }> = [];

      if (productType === 'simple') {
        // Create single variant for simple product
        variantData.push({
          product_id: productId,
          sku: `${formData.sku}-default`,
          size: null,
          color: null,
          stock: simpleStock
        });
      } else {
        // Create variants for variable product
        variants.forEach((variant, index) => {
          const variantSku = `${formData.sku}-${index + 1}`;
          variantData.push({
            product_id: productId,
            sku: variantSku,
            size: variant.size || null,
            color: variant.color || null,
            stock: variant.stock
          });
        });
      }

      // Insert variants
      if (variantData.length > 0) {
        const { error: variantError } = await supabaseAdmin
          .from('product_variants')
          .insert(variantData);

        if (variantError) throw variantError;
      }

      showSuccessToast(editingProduct ? 'Product updated successfully' : 'Product created successfully');

      // Add a small delay before closing the modal for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      showErrorToast(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { error } = await supabaseAdmin
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(product =>
        product.id === productId
          ? { ...product, is_active: !currentStatus }
          : product
      ));

      showSuccessToast(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling product status:', error);
      showErrorToast('Failed to update product status');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    setDeletingProductId(productId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deletingProductId) return;

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
        .from('products')
        .delete()
        .eq('id', deletingProductId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== deletingProductId));
      showSuccessToast('Product deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingProductId(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      showErrorToast('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description || '',
        price: product.price.toString(),
        sku: product.sku,
        category_id: '', // We'll need to fetch this properly
        brand_id: '', // We'll need to fetch this properly
        is_active: product.is_active,
        featured: product.featured
      });

      // Determine product type and load variants
      if (product.product_variants && product.product_variants.length > 0) {
        const hasVariations = product.product_variants.some(v => v.size || v.color);

        if (hasVariations || product.product_variants.length > 1) {
          setProductType('variable');
          // Map variants without price override
          const mappedVariants = product.product_variants.map(variant => ({
            size: variant.size || '',
            color: variant.color || '',
            stock: variant.stock
          }));
          setVariants(mappedVariants);
        } else {
          setProductType('simple');
          setSimpleStock(product.product_variants[0].stock);
        }
      } else {
        setProductType('simple');
        setSimpleStock(0);
      }
    } else {
      setEditingProduct(null);
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      sku: '',
      category_id: '',
      brand_id: '',
      is_active: true,
      featured: false
    });
    setProductType('simple');
    setCurrentStep(1);
    setVariants([]);
    setImages([]);
    setSimpleStock(0);
    setFieldErrors({});
  };

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const setFieldError = (fieldName: string, error: string) => {
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleProductTypeChange = (type: 'simple' | 'variable') => {
    setProductType(type);
    if (type === 'simple') {
      setVariants([]);
    }
  };

  const addVariant = () => {
    const newVariant = {
      size: '',
      color: '',
      stock: 0
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const validateStep = (step: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    setFieldErrors({}); // Clear previous errors

    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          errors.push('Product title is required');
          setFieldError('title', 'Product title is required');
        }
        if (!formData.sku.trim()) {
          errors.push('SKU is required');
          setFieldError('sku', 'SKU is required');
        } else if (formData.sku.trim().length < 3) {
          errors.push('SKU must be at least 3 characters');
          setFieldError('sku', 'SKU must be at least 3 characters');
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
          errors.push('Valid price is required');
          setFieldError('price', 'Valid price is required');
        }
        break;

      case 2:
        if (productType === 'simple') {
          if (simpleStock < 0) {
            errors.push('Stock quantity cannot be negative');
            setFieldError('simpleStock', 'Stock quantity cannot be negative');
          }
        } else {
          if (variants.length === 0) {
            errors.push('Variable products need at least one variant');
          }
          const invalidVariants = variants.filter(v => v.stock < 0);
          if (invalidVariants.length > 0) {
            errors.push('All variant stock quantities must be non-negative');
          }
          const emptyVariants = variants.filter(v => !v.size && !v.color);
          if (emptyVariants.length > 0) {
            errors.push('All variants must have either a size or color specified');
          }
        }
        break;

      case 3:
        // Image validation can be added here
        break;

      case 4:
        // Final validation - run all validations
        const step1Validation = validateStep(1);
        const step2Validation = validateStep(2);
        errors.push(...step1Validation.errors, ...step2Validation.errors);
        break;
    }

    return { isValid: errors.length === 0, errors };
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);

    if (!validation.isValid) {
      showErrorToast(validation.errors.join(', '));
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTotalStock = (variants: any[]) => {
    return variants.reduce((total, variant) => total + (variant.stock || 0), 0);
  };

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
            <h1 className="text-2xl font-bold text-white mb-2">Products Management</h1>
            <p className="text-[rgb(94,94,94)]">Manage your product catalog</p>
          </div>

          <Button
            onClick={() => openEditModal()}
            className="bg-[rgb(51,51,51)] text-white hover:bg-[rgb(64,64,64)] border border-[rgb(94,94,94)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products Table */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(25,25,25)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(51,51,51)]">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{product.title}</div>
                        <div className="text-sm text-[rgb(94,94,94)]">SKU: {product.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {product.categories?.name || 'No Category'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      LKR {product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {getTotalStock(product.product_variants)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                        className="flex items-center"
                      >
                        {product.is_active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-400 mr-2" />
                            <span className="text-green-400 text-sm">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-red-400 mr-2" />
                            <span className="text-red-400 text-sm">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(product)}
                        className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
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

          {products.length === 0 && (
            <div className="px-6 py-12 text-center text-[rgb(94,94,94)]">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          )}
        </div>

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[rgb(51,51,51)] flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <div className="flex items-center space-x-2 mt-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step <= currentStep
                            ? 'bg-white text-black'
                            : 'bg-[rgb(51,51,51)] text-[rgb(94,94,94)]'
                        }`}>
                          {step}
                        </div>
                        {step < 4 && (
                          <div className={`w-12 h-0.5 ${
                            step < currentStep ? 'bg-white' : 'bg-[rgb(51,51,51)]'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-[rgb(94,94,94)] mt-2">
                    {currentStep === 1 && 'Basic Information'}
                    {currentStep === 2 && 'Product Type & Variants'}
                    {currentStep === 3 && 'Images & Media'}
                    {currentStep === 4 && 'Review & Create'}
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[rgb(94,94,94)] hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Product Title"
                          variant="dark"
                          value={formData.title}
                          onChange={(e) => {
                            setFormData({ ...formData, title: e.target.value });
                            clearFieldError('title');
                          }}
                          error={fieldErrors.title}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          label="SKU"
                          variant="dark"
                          value={formData.sku}
                          onChange={(e) => {
                            setFormData({ ...formData, sku: e.target.value });
                            clearFieldError('sku');
                          }}
                          error={fieldErrors.sku}
                          required
                        />
                        <p className="text-xs text-[rgb(94,94,94)] mt-1">
                          Unique identifier for this product (min 3 characters)
                        </p>
                      </div>
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Input
                          label="Price (LKR)"
                          variant="dark"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => {
                            setFormData({ ...formData, price: e.target.value });
                            clearFieldError('price');
                          }}
                          error={fieldErrors.price}
                          required
                        />
                        <p className="text-xs text-[rgb(94,94,94)] mt-1">
                          Base price (can be overridden per variant)
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                          Category
                        </label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-4 py-2.5 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white"
                        >
                          <option value="" className="bg-black">Select Category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id} className="bg-black">
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                          Brand
                        </label>
                        <select
                          value={formData.brand_id}
                          onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                          className="w-full px-4 py-2.5 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white"
                        >
                          <option value="" className="bg-black">Select Brand</option>
                          {brands.map(brand => (
                            <option key={brand.id} value={brand.id} className="bg-black">
                              {brand.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="mr-2 text-white accent-white"
                        />
                        <span className="text-white">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                          className="mr-2 text-white accent-white"
                        />
                        <span className="text-white">Featured</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 2: Product Type & Variants */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Product Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-4">Product Type</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          onClick={() => handleProductTypeChange('simple')}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            productType === 'simple'
                              ? 'border-white bg-white/5'
                              : 'border-[rgb(51,51,51)] hover:border-[rgb(94,94,94)]'
                          }`}
                        >
                          <h4 className="text-white font-medium mb-2">Simple Product</h4>
                          <p className="text-[rgb(94,94,94)] text-sm">Single product with no variations (e.g., book, accessory)</p>
                        </div>
                        <div
                          onClick={() => handleProductTypeChange('variable')}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            productType === 'variable'
                              ? 'border-white bg-white/5'
                              : 'border-[rgb(51,51,51)] hover:border-[rgb(94,94,94)]'
                          }`}
                        >
                          <h4 className="text-white font-medium mb-2">Variable Product</h4>
                          <p className="text-[rgb(94,94,94)] text-sm">Product with multiple options (e.g., sizes, colors)</p>
                        </div>
                      </div>
                    </div>

                    {/* Simple Product Stock */}
                    {productType === 'simple' && (
                      <div>
                        <Input
                          label="Stock Quantity"
                          variant="dark"
                          type="number"
                          min="0"
                          value={simpleStock}
                          onChange={(e) => {
                            setSimpleStock(parseInt(e.target.value) || 0);
                            clearFieldError('simpleStock');
                          }}
                          error={fieldErrors.simpleStock}
                          required
                        />
                      </div>
                    )}

                    {/* Variable Product Configuration */}
                    {productType === 'variable' && (
                      <div className="space-y-6">
                        {/* Help Text */}
                        {variants.length === 0 && (
                          <div className="bg-blue-900/20 border border-blue-400/20 rounded-lg p-4">
                            <div className="flex items-start text-blue-400">
                              <Package className="w-5 h-5 mr-2 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium mb-2">Manual Variant Management</p>
                                <ul className="text-xs space-y-1 text-blue-300">
                                  <li>• Add variants one by one for better control</li>
                                  <li>• Each variant can have a size, color, or both</li>
                                  <li>• Set individual stock quantities</li>
                                  <li>• Use asset images for color selection</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Add Variant Button */}
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-white">Product Variants</label>
                          <Button
                            type="button"
                            size="sm"
                            onClick={addVariant}
                            className="bg-[rgb(51,51,51)] text-white hover:bg-[rgb(64,64,64)] border border-[rgb(94,94,94)]"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Variant
                          </Button>
                        </div>

                        {/* Variants List */}
                        {variants.length > 0 && (
                          <div className="space-y-4">
                            {variants.map((variant, index) => (
                              <div key={index} className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded-lg p-4">
                                <div className="flex justify-between items-start mb-4">
                                  <h4 className="text-sm font-medium text-white">Variant {index + 1}</h4>
                                  <button
                                    type="button"
                                    onClick={() => removeVariant(index)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Size Input */}
                                  <div>
                                    <label className="block text-xs font-medium text-[rgb(94,94,94)] mb-2">Size</label>
                                    <input
                                      type="text"
                                      placeholder="e.g., S, M, L, 6, 7, 8"
                                      value={variant.size}
                                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                      className="w-full px-3 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded focus:outline-none focus:border-white text-sm"
                                    />
                                  </div>

                                  {/* Color Selection */}
                                  <div>
                                    <label className="block text-xs font-medium text-[rgb(94,94,94)] mb-2">Color</label>
                                    <div className="grid grid-cols-5 gap-1">
                                      {availableColors.map((color) => (
                                        <button
                                          key={color.name}
                                          type="button"
                                          onClick={() => updateVariant(index, 'color', color.name)}
                                          className={`w-8 h-8 rounded border-2 transition-all overflow-hidden ${
                                            variant.color === color.name
                                              ? 'border-white shadow-lg scale-110'
                                              : 'border-[rgb(51,51,51)] hover:border-[rgb(94,94,94)]'
                                          }`}
                                          title={color.name}
                                        >
                                          <img
                                            src={color.image}
                                            alt={color.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              // Fallback to solid color if image fails to load
                                              e.currentTarget.style.display = 'none';
                                              e.currentTarget.parentElement!.style.backgroundColor = color.name.toLowerCase();
                                            }}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                    {variant.color && (
                                      <p className="text-xs text-white mt-1">Selected: {variant.color}</p>
                                    )}
                                  </div>

                                  {/* Stock Input */}
                                  <div>
                                    <label className="block text-xs font-medium text-[rgb(94,94,94)] mb-2">Stock</label>
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={variant.stock}
                                      onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                      className="w-full px-3 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded focus:outline-none focus:border-white text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Images & Media */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-4">Product Images</label>

                      {/* Image Upload Area */}
                      <div
                        className="border-2 border-dashed border-[rgb(51,51,51)] rounded-lg p-8 text-center hover:border-[rgb(94,94,94)] transition-colors cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                          setImages(prev => [...prev, ...files].slice(0, 10)); // Max 10 images
                        }}
                        onClick={() => document.getElementById('imageInput')?.click()}
                      >
                        <Package className="w-12 h-12 text-[rgb(94,94,94)] mx-auto mb-4" />
                        <p className="text-white mb-2">Drop images here or click to browse</p>
                        <p className="text-[rgb(94,94,94)] text-sm">
                          Supports: JPG, PNG, WebP (Max 10 images)
                        </p>
                        <input
                          id="imageInput"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setImages(prev => [...prev, ...files].slice(0, 10));
                          }}
                        />
                      </div>

                      {/* Image Preview Grid */}
                      {images.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-white mb-3">
                            Selected Images ({images.length}/10)
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((image, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square bg-[rgb(25,25,25)] rounded-lg overflow-hidden border border-[rgb(51,51,51)]">
                                  <img
                                    src={URL.createObjectURL(image)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                                {index === 0 && (
                                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    Primary
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-[rgb(94,94,94)] mt-3">
                            First image will be used as the primary product image. Drag to reorder (coming soon).
                          </p>
                        </div>
                      )}

                      {/* No Images State */}
                      {images.length === 0 && (
                        <div className="mt-6 bg-orange-900/20 border border-orange-400/20 rounded-lg p-4">
                          <div className="flex items-start text-orange-400">
                            <Package className="w-5 h-5 mr-2 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium mb-1">No images selected</p>
                              <p className="text-orange-300 text-xs">
                                While optional, adding images greatly improves product appeal and sales
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Create */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">Review Product Details</h3>

                    <div className="bg-[rgb(25,25,25)] rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[rgb(94,94,94)]">Title:</span>
                          <span className="text-white ml-2">{formData.title}</span>
                        </div>
                        <div>
                          <span className="text-[rgb(94,94,94)]">SKU:</span>
                          <span className="text-white ml-2">{formData.sku}</span>
                        </div>
                        <div>
                          <span className="text-[rgb(94,94,94)]">Price:</span>
                          <span className="text-white ml-2">LKR {formData.price}</span>
                        </div>
                        <div>
                          <span className="text-[rgb(94,94,94)]">Type:</span>
                          <span className="text-white ml-2 capitalize">{productType}</span>
                        </div>
                      </div>

                      {productType === 'simple' && (
                        <div className="text-sm">
                          <span className="text-[rgb(94,94,94)]">Stock:</span>
                          <span className="text-white ml-2">{simpleStock} units</span>
                        </div>
                      )}

                      {productType === 'variable' && variants.length > 0 && (
                        <div>
                          <span className="text-[rgb(94,94,94)] text-sm">Variants:</span>
                          <div className="mt-2 text-sm">
                            {variants.map((variant, index) => (
                              <div key={index} className="text-white">
                                {variant.size && `${variant.size}`}{variant.size && variant.color && ' - '}{variant.color && `${variant.color}`}: {variant.stock} units
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Images Summary */}
                      <div className="text-sm">
                        <span className="text-[rgb(94,94,94)]">Images:</span>
                        <span className="text-white ml-2">
                          {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''} selected` : 'No images'}
                        </span>
                      </div>
                    </div>

                    {/* Image Preview in Review */}
                    {images.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-white mb-3">Image Preview</h4>
                        <div className="flex gap-2 overflow-x-auto">
                          {images.slice(0, 5).map((image, index) => (
                            <div key={index} className="relative flex-shrink-0">
                              <div className="w-16 h-16 bg-[rgb(25,25,25)] rounded border border-[rgb(51,51,51)] overflow-hidden">
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {index === 0 && (
                                <div className="absolute -bottom-1 -right-1 bg-white text-black text-xs px-1 rounded">
                                  1
                                </div>
                              )}
                            </div>
                          ))}
                          {images.length > 5 && (
                            <div className="w-16 h-16 bg-[rgb(25,25,25)] rounded border border-[rgb(51,51,51)] flex items-center justify-center">
                              <span className="text-[rgb(94,94,94)] text-xs">+{images.length - 5}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <div>
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                      >
                        Previous
                      </Button>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    {currentStep < 4 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-[rgb(51,51,51)] text-white hover:bg-[rgb(64,64,64)] border border-[rgb(94,94,94)]"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        loading={submitting}
                        disabled={submitting}
                        className="bg-[rgb(51,51,51)] text-white hover:bg-[rgb(64,64,64)] border border-[rgb(94,94,94)] disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Product Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingProductId(null);
          }}
          onConfirm={confirmDeleteProduct}
          title="Delete Product"
          message={`Are you sure you want to delete this product? This action cannot be undone and will remove the product from all collections and orders.`}
          confirmText="Delete Product"
          cancelText="Cancel"
          variant="danger"
          loading={deleting}
        />
      </div>
    </AdminLayout>
  );
};

export default ProductsManagement;
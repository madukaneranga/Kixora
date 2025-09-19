import { supabaseAdmin } from './supabaseAdmin';

export interface UploadedImage {
  id: string;
  url: string;
  publicUrl: string;
  fileName: string;
  size: number;
}

export const uploadProductImages = async (
  files: File[],
  productId: string
): Promise<UploadedImage[]> => {
  const uploadedImages: UploadedImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `product_${productId}_${timestamp}_${randomString}.${fileExtension}`;
    const filePath = `products/${productId}/${fileName}`;

    try {
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error for file:', file.name, uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error(`Failed to get public URL for ${file.name}`);
      }

      uploadedImages.push({
        id: uploadData.id || '',
        url: uploadData.path,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
        size: file.size
      });

    } catch (error) {
      console.error('Error uploading file:', file.name, error);

      // Clean up any successfully uploaded files if one fails
      await cleanupUploadedImages(uploadedImages);

      throw error;
    }
  }

  return uploadedImages;
};

export const saveProductImages = async (
  productId: string,
  uploadedImages: UploadedImage[]
): Promise<void> => {
  const imageRecords = uploadedImages.map((image, index) => ({
    product_id: productId,
    storage_path: image.url,
    image_url: image.publicUrl,
    alt_text: `Product image ${index + 1}`,
    display_order: index,
    is_primary: index === 0,
    file_name: image.fileName,
    file_size: image.size
  }));

  const { error } = await supabaseAdmin
    .from('product_images')
    .insert(imageRecords);

  if (error) {
    console.error('Error saving image records:', error);
    // Clean up uploaded files if database save fails
    await cleanupUploadedImages(uploadedImages);
    throw new Error('Failed to save image records to database');
  }
};

export const cleanupUploadedImages = async (
  uploadedImages: UploadedImage[]
): Promise<void> => {
  for (const image of uploadedImages) {
    try {
      await supabaseAdmin.storage
        .from('product-images')
        .remove([image.url]);
    } catch (error) {
      console.error('Error cleaning up image:', image.url, error);
    }
  }
};

export const deleteProductImages = async (productId: string): Promise<void> => {
  try {
    // Get all image records for the product
    const { data: images, error: fetchError } = await supabaseAdmin
      .from('product_images')
      .select('storage_path')
      .eq('product_id', productId);

    if (fetchError) {
      console.error('Error fetching product images:', fetchError);
      return;
    }

    if (images && images.length > 0) {
      // Delete files from storage
      const storagePaths = images.map(img => img.storage_path);
      const { error: storageError } = await supabaseAdmin.storage
        .from('product-images')
        .remove(storagePaths);

      if (storageError) {
        console.error('Error deleting images from storage:', storageError);
      }

      // Delete records from database
      const { error: dbError } = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (dbError) {
        console.error('Error deleting image records:', dbError);
      }
    }
  } catch (error) {
    console.error('Error in deleteProductImages:', error);
  }
};

export const getProductImages = async (productId: string) => {
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order');

  if (error) {
    console.error('Error fetching product images:', error);
    return [];
  }

  return data || [];
};

// Collection image upload functions
export const uploadCollectionImage = async (
  file: File,
  collectionId: string
): Promise<string> => {
  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `collection_${collectionId}_${timestamp}_${randomString}.${fileExtension}`;
  const filePath = `collections/${fileName}`;

  try {
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('collection-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error for collection image:', file.name, uploadError);
      throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('collection-images')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      throw new Error(`Failed to get public URL for ${file.name}`);
    }

    return urlData.publicUrl;

  } catch (error) {
    console.error('Error uploading collection image:', file.name, error);
    throw error;
  }
};

export const deleteCollectionImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    const filePath = pathSegments.slice(-2).join('/'); // collections/filename.jpg

    // Delete file from storage
    const { error } = await supabaseAdmin.storage
      .from('collection-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting collection image from storage:', error);
    }
  } catch (error) {
    console.error('Error in deleteCollectionImage:', error);
  }
};
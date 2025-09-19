import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface CategoryTile {
  slug: string;
  name: string;
  image_url: string;
}

const CategoryTiles = () => {
  const [categories, setCategories] = useState<CategoryTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPinnedCategories();
  }, []);

  const fetchPinnedCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('slug, name, image_url')
        .eq('is_pinned', true)
        .limit(3);

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching pinned categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8 sm:py-10 px-4 bg-white">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full py-8 sm:py-10 px-4 bg-white">
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            to={`/products?category=${category.slug}`}
            className="group relative block aspect-[3/4] overflow-hidden hover:opacity-90 transition-opacity duration-300"
          >
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${category.image_url}`}
              alt=""
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
            <div className="absolute bottom-4 left-4">
              <h3 className="text-white text-xl font-semibold">{category.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryTiles;
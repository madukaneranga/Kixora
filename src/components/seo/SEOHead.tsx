import { useEffect } from 'react';
import { useSEO, SEOData } from '../../hooks/useSEO';
import { injectMultipleStructuredData } from '../../utils/structuredData';

interface SEOHeadProps {
  seoData?: Partial<SEOData>;
  structuredData?: Array<{schema: any, id?: string}>;
  children?: React.ReactNode;
}

const SEOHead: React.FC<SEOHeadProps> = ({ seoData, structuredData, children }) => {
  // Apply SEO meta tags
  useSEO(seoData);

  // Inject structured data
  useEffect(() => {
    if (structuredData && structuredData.length > 0) {
      injectMultipleStructuredData(structuredData);
    }

    // Cleanup function to remove structured data when component unmounts
    return () => {
      structuredData?.forEach(({ id }) => {
        if (id) {
          const existingScript = document.getElementById(id);
          if (existingScript) {
            existingScript.remove();
          }
        }
      });
    };
  }, [structuredData]);

  return <>{children}</>;
};

export default SEOHead;
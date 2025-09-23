import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  variant?: 'default' | 'white';
}

const Breadcrumb = ({ items, className = '', variant = 'default' }: BreadcrumbProps) => {
  const isWhite = variant === 'white';

  const homeClass = isWhite
    ? "flex items-center text-gray-300 hover:text-white transition-colors"
    : "flex items-center text-gray-500 hover:text-gray-700 transition-colors";

  const chevronClass = isWhite
    ? "text-gray-400"
    : "text-gray-400";

  const linkClass = isWhite
    ? "text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
    : "text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1";

  const currentClass = isWhite
    ? "text-white font-medium flex items-center space-x-1"
    : "text-gray-900 font-medium flex items-center space-x-1";

  // Mobile: Show only last 2 items + current, Desktop: Show all
  const getVisibleItems = () => {
    if (items.length <= 2) return items;

    // On mobile, show only the last item before current + current
    // On desktop, show all items
    return items;
  };

  const visibleItems = getVisibleItems();

  return (
    <div className="w-full overflow-hidden">
      <nav
        className={`flex items-center space-x-1 text-xs sm:text-sm overflow-x-auto scrollbar-hide ${className}`}
        aria-label="Breadcrumb"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Link
          to="/"
          className={`${homeClass} flex-shrink-0`}
        >
          <Home size={14} className="sm:w-4 sm:h-4" />
          <span className="sr-only">Home</span>
        </Link>

        {/* Mobile: Show ellipsis if there are hidden items */}
        {items.length > 2 && (
          <div className="flex items-center space-x-1 sm:hidden">
            <ChevronRight size={12} className={chevronClass} />
            <span className={isWhite ? "text-gray-400" : "text-gray-400"}>...</span>
          </div>
        )}

        {/* Desktop: Show all items, Mobile: Show smart selection */}
        {visibleItems.map((item, index) => {
          // On mobile, only show the last item + current item
          const shouldHideOnMobile = items.length > 2 && index < items.length - 2;

          return (
            <div
              key={index}
              className={`flex items-center space-x-1 ${shouldHideOnMobile ? 'hidden sm:flex' : 'flex'} flex-shrink-0`}
            >
              <ChevronRight size={12} className={`${chevronClass} sm:w-3.5 sm:h-3.5`} />
              {item.path && index < items.length - 1 ? (
                <Link
                  to={item.path}
                  className={linkClass}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <span className={currentClass}>
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                    {item.label}
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Breadcrumb;
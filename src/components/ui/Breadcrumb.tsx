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

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <Link
        to="/"
        className={homeClass}
      >
        <Home size={16} />
        <span className="sr-only">Home</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight size={14} className={chevronClass} />
          {item.path && index < items.length - 1 ? (
            <Link
              to={item.path}
              className={linkClass}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </Link>
          ) : (
            <span className={currentClass}>
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
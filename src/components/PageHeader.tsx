import React from "react";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
}) => {
  return (
    <div className="mb-8 animate-fade-in">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-neutral-500 mb-3">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0" />
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-blue-600 transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium text-neutral-800">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Título e subtítulo */}
      <h1 className="text-3xl font-semibold text-neutral-900">{title}</h1>
      {subtitle && <p className="text-neutral-600 mt-1">{subtitle}</p>}
    </div>
  );
};

export default PageHeader;

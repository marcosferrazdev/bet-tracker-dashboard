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
  breadcrumbs = [], // Define um array vazio caso não seja passado
}) => {
  return (
    <div className="mb-8 animate-fade-in">
      {breadcrumbs.map((crumb, index) => (
        <div key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {crumb.href ? (
            <a
              href={crumb.href}
              className="hover:text-blue-600 transition-colors"
            >
              {crumb.label}
            </a>
          ) : (
            <span>{crumb.label}</span>
          )}
        </div>
      ))}

      <h1 className="text-3xl font-semibold text-neutral-900">{title}</h1>
      {subtitle && <p className="text-neutral-600 mt-1">{subtitle}</p>}
    </div>
  );
};

export default PageHeader;

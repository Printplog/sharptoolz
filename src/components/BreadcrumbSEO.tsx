import React from 'react';
import { useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbSEOProps {
  items?: BreadcrumbItem[];
}

const BreadcrumbSEO: React.FC<BreadcrumbSEOProps> = ({ items }) => {
  const location = useLocation();
  const pathnames = items ? [] : location.pathname.split('/').filter((x) => x);

  const entries = items 
    ? items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.label,
        "item": item.path.startsWith('http') ? item.path : `https://sharptoolz.com${item.path}`
      }))
    : [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://sharptoolz.com"
        },
        ...pathnames.map((value, index) => {
          const url = `https://sharptoolz.com/${pathnames.slice(0, index + 1).join('/')}`;
          const name = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
          
          return {
            "@type": "ListItem",
            "position": index + 2,
            "name": name,
            "item": url
          };
        })
      ];

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": entries
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(breadcrumbList)}
    </script>
  );
};

export default BreadcrumbSEO;

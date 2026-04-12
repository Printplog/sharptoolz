import React from 'react';
import { useLocation } from 'react-router-dom';

const BreadcrumbSEO: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
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
    ]
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(breadcrumbList)}
    </script>
  );
};

export default BreadcrumbSEO;

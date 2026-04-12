import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogImage = 'https://sharptoolz.com/logo.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
}) => {
  const siteName = 'SharpToolz';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Create realistic sample documents for testing, development, and demonstrations with SharpToolz. The ultimate professional tool for rapid document automation.';
  const siteUrl = 'https://sharptoolz.com';

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {canonical && <link rel="canonical" href={`${siteUrl}${canonical}`} />}

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      {canonical && <meta property="og:url" content={`${siteUrl}${canonical}`} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;

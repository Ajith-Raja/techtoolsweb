import fs from 'fs';

const routes = [
  { path: '/schema', name: 'Schema Generator', category: 'seo-tools' },
  { path: '/domain-age', name: 'Domain Age Checker', category: 'seo-tools' },
  { path: '/domain-authority', name: 'Domain Authority Checker', category: 'seo-tools' },
  { path: '/plagiarism', name: 'Plagiarism Checker', category: 'seo-tools' },
  { path: '/readability', name: 'Readability Checker', category: 'seo-tools' },
  { path: '/keyword-density', name: 'Keyword Density Checker', category: 'seo-tools' },
  { path: '/font-generator', name: 'Font Generator', category: 'text-tools' },
  { path: '/image-compressor', name: 'Image Compressor', category: 'image-tools' },
  { path: '/transliterate', name: 'Transliterate Converter', category: 'text-tools' },
  { path: '/diff-checker', name: 'Diff Checker', category: 'dev-tools' },
  { path: '/api-tester', name: 'API Tester', category: 'dev-tools' },
  { path: '/youtube-downloader', name: 'YouTube Downloader', category: 'media-tools' },
  { path: '/instagram-downloader', name: 'Instagram Downloader', category: 'media-tools' },
  { path: '/qr-code-generator', name: 'QR Code Generator', category: 'utility-tools' },
  { path: '/regex-tester', name: 'Regex Tester', category: 'dev-tools' },
  { path: '/image-to-svg', name: 'Image to SVG Converter', category: 'image-tools' },
  { path: '/calendar-generator', name: 'Calendar Generator', category: 'productivity-tools' },
  { path: '/speed-test', name: 'Website Speed Test', category: 'seo-tools' },
  { path: '/pre-launch-audit', name: 'Pre-Launch Audit Tool', category: 'seo-tools' },
  { path: '/content-gap-analyzer', name: 'Content Gap Analyzer', category: 'seo-tools' },

  { path: '/pdf-tools', name: 'PDF Tools Home', category: 'pdf-tools' },
  { path: '/pdf-tools/compress', name: 'Compress PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/pdf-to-word', name: 'PDF to Word Converter', category: 'pdf-tools' },
  { path: '/pdf-tools/pdf-to-image', name: 'PDF to Image Converter', category: 'pdf-tools' },
  { path: '/pdf-tools/word-to-pdf', name: 'Word to PDF Converter', category: 'pdf-tools' },
  { path: '/pdf-tools/extract-text', name: 'Extract Text from PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/extract-images', name: 'Extract Images from PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/merge', name: 'Merge PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/split', name: 'Split PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/reorder', name: 'Reorder PDF Pages', category: 'pdf-tools' },
  { path: '/pdf-tools/rotate', name: 'Rotate PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/protect', name: 'Protect PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/unlock', name: 'Unlock PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/watermark', name: 'Watermark PDF', category: 'pdf-tools' },
  { path: '/pdf-tools/metadata', name: 'Edit PDF Metadata', category: 'pdf-tools' },
  { path: '/pdf-tools/remove-pages', name: 'Remove PDF Pages', category: 'pdf-tools' },
  { path: '/pdf-tools/chat', name: 'PDF Chat Tool', category: 'pdf-tools' },

  { path: '/calculators', name: 'Calculators Home', category: 'calculators' },
  { path: '/calculators/percentage', name: 'Percentage Calculator', category: 'calculators' },
  { path: '/calculators/emi', name: 'EMI Calculator', category: 'calculators' },
  { path: '/calculators/gst', name: 'GST Calculator', category: 'calculators' },
  { path: '/calculators/unit-converter', name: 'Unit Converter', category: 'calculators' },
  { path: '/calculators/sip', name: 'SIP Calculator', category: 'calculators' },
  { path: '/calculators/retirement', name: 'Retirement Calculator', category: 'calculators' },
  { path: '/calculators/investment', name: 'Investment Calculator', category: 'calculators' },
  { path: '/calculators/income-tax', name: 'Income Tax Calculator', category: 'calculators' },
  { path: '/calculators/timezone-converter', name: 'Timezone Converter', category: 'calculators' },
  { path: '/calculators/unix-timestamp-converter', name: 'Unix Timestamp Converter', category: 'calculators' },
  { path: '/calculators/birthday-calculator', name: 'Birthday Calculator', category: 'calculators' },
  { path: '/calculators/term-life-insurance', name: 'Term Life Insurance Calculator', category: 'calculators' },
  { path: '/calculators/health-insurance', name: 'Health Insurance Calculator', category: 'calculators' },
  { path: '/calculators/car-insurance', name: 'Car Insurance Calculator', category: 'calculators' },
  { path: '/calculators/home-loan-insurance', name: 'Home Loan Insurance Calculator', category: 'calculators' },
  { path: '/calculators/rent-agreement', name: 'Rent Agreement Generator', category: 'calculators' },
  { path: '/calculators/calorie-deficit', name: 'Calorie Deficit Calculator', category: 'calculators' },
  { path: '/calculators/roi', name: 'ROI Calculator', category: 'calculators' },
  { path: '/calculators/legal-notice', name: 'Legal Notice Generator', category: 'calculators' },

  { path: '/dev-tools/table-generator', name: 'Responsive Table Generator', category: 'dev-tools' },
  { path: '/dev-tools/jwt-decoder', name: 'JWT Decoder', category: 'dev-tools' },
  { path: '/dev-tools/sitemap-visualizer', name: 'Sitemap Visualizer', category: 'dev-tools' },
  { path: '/dev-tools/webhook-simulator', name: 'Webhook Simulator', category: 'dev-tools' },
  { path: '/dev-tools/hash-generator', name: 'Hash Generator', category: 'dev-tools' },
  { path: '/dev-tools/password-strength', name: 'Password Strength Tester', category: 'dev-tools' },
  { path: '/dev-tools/cron-generator', name: 'Cron Generator', category: 'dev-tools' },
  { path: '/dev-tools/csv-to-json', name: 'CSV to JSON Converter', category: 'dev-tools' },
  { path: '/dev-tools/xml-to-json', name: 'XML to JSON Converter', category: 'dev-tools' }
];

const brand = 'TechToolsWeb';
const domain = 'https://techtoolsweb.com';

const categoryRelated = {
  'seo-tools': ['/schema', '/keyword-density', '/readability', '/content-gap-analyzer'],
  'pdf-tools': ['/pdf-tools/merge', '/pdf-tools/compress', '/pdf-tools/pdf-to-word', '/pdf-tools/split'],
  calculators: ['/calculators/emi', '/calculators/sip', '/calculators/percentage', '/calculators/roi'],
  'dev-tools': ['/dev-tools/jwt-decoder', '/dev-tools/hash-generator', '/dev-tools/csv-to-json', '/dev-tools/xml-to-json'],
  'image-tools': ['/image-compressor', '/image-to-svg', '/qr-code-generator', '/pdf-tools/pdf-to-image'],
  'text-tools': ['/font-generator', '/transliterate', '/diff-checker', '/readability'],
  'media-tools': ['/youtube-downloader', '/instagram-downloader', '/image-compressor', '/qr-code-generator'],
  'utility-tools': ['/qr-code-generator', '/calendar-generator', '/regex-tester', '/api-tester'],
  'productivity-tools': ['/calendar-generator', '/api-tester', '/diff-checker', '/regex-tester']
};

function trimToMax(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd();
}

function titleVariants(name) {
  return [
    `${name} Online Free - ${brand}`,
    `${name} Converter Free Online - ${brand}`,
    `Free ${name} Tool Online - ${brand}`,
    `${name} Generator - Fast & Free - ${brand}`,
    `${name} Online Tool - ${brand}`
  ];
}

function uniqueTitle(name, usedTitles) {
  const variants = titleVariants(name);
  for (const v of variants) {
    if (v.length >= 50 && v.length <= 60 && !usedTitles.has(v.toLowerCase())) {
      usedTitles.add(v.toLowerCase());
      return v;
    }
  }

  let fallback = `${name} Online Free Tool - ${brand}`;
  fallback = trimToMax(fallback, 60);
  if (fallback.length < 50) {
    fallback = `${name} Free Tool Online Fast - ${brand}`;
    fallback = trimToMax(fallback, 60);
  }

  let suffix = 2;
  let finalTitle = fallback;
  while (usedTitles.has(finalTitle.toLowerCase())) {
    finalTitle = trimToMax(`${fallback} ${suffix}`, 60);
    suffix++;
  }
  usedTitles.add(finalTitle.toLowerCase());
  return finalTitle;
}

function descriptionFor(name, keyword) {
  let desc = `Use the ${name.toLowerCase()} to get fast, accurate results online. Improve workflow with ${keyword} features and start free on ${brand} now.`;
  if (desc.length > 160) desc = trimToMax(desc, 160);
  if (desc.length < 140) {
    desc += ' Try it today.';
    if (desc.length > 160) desc = trimToMax(desc, 160);
  }
  return desc;
}

function slugFromPath(path) {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'home';
}

function buildKeywords(name, slug) {
  const primary = name.toLowerCase();
  const secondary = [
    `${slug.replace(/-/g, ' ')} online`,
    `${name.toLowerCase()} free`,
    `${name.toLowerCase()} tool`,
    `${name.toLowerCase()} web app`
  ];
  const longTail = [
    `best ${name.toLowerCase()} online free`,
    `${name.toLowerCase()} without signup`,
    `secure ${name.toLowerCase()} tool online`,
    `how to use ${name.toLowerCase()} quickly`
  ];
  const related = [
    `${name.toLowerCase()} generator`,
    `${name.toLowerCase()} checker`,
    `${name.toLowerCase()} converter`,
    `${name.toLowerCase()} utility`
  ];
  return { primary, secondary, longTail, related, all: [primary, ...secondary, ...longTail, ...related] };
}

function breadcrumbs(path, pageName) {
  const parts = path.split('/').filter(Boolean);
  const crumbs = [{ name: 'Home', url: '/' }];
  let current = '';
  for (let i = 0; i < parts.length; i++) {
    current += `/${parts[i]}`;
    crumbs.push({
      name: i === parts.length - 1 ? pageName : parts[i].replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
      url: current
    });
  }
  return crumbs;
}

function faqFor(name, keyword) {
  return [
    {
      question: `What is ${name} used for?`,
      answer: `${name} helps you complete ${keyword} tasks quickly in your browser with no installation needed.`
    },
    {
      question: `Is this ${name.toLowerCase()} free to use?`,
      answer: `Yes, you can use ${name} for free online on ${brand}.`
    },
    {
      question: `Do I need to sign up before using this tool?`,
      answer: `No. You can open the page and start using core ${keyword} features instantly.`
    },
    {
      question: `Is my data secure while using ${name}?`,
      answer: `The tool follows privacy-focused processing so users can run ${keyword} tasks safely.`
    },
    {
      question: `How does ${name} compare to other tools?`,
      answer: `${brand} focuses on speed, clean UX, and practical output options for daily workflows.`
    }
  ];
}

function introFor(name, keyword, secondary) {
  return `The ${name} by ${brand} is built for users who need reliable ${keyword} results without complicated setup. Whether you are a developer, marketer, student, or business user, this tool helps you finish tasks in minutes with a clear and simple workflow. You can upload, paste, test, or generate output directly in your browser and move on quickly.

This page is optimized for real use cases such as ${secondary[0]}, ${secondary[1]}, and productivity-driven workflows where speed and accuracy matter. The interface is beginner-friendly while still useful for advanced users who need repeatable results. If you are looking for a fast, secure, and free ${keyword} tool online, use ${name} on ${brand} and streamline your process today.`;
}

function searchIntent(name) {
  return {
    informational: `Users learning how ${name.toLowerCase()} works and searching for best practices.`,
    transactional: `Users ready to run ${name.toLowerCase()} actions and get output right away.`,
    navigational: `Users looking specifically for ${brand} ${name.toLowerCase()} page.`,
    commercial: `Users comparing free and paid ${name.toLowerCase()} alternatives before choosing.`
  };
}

function competitorByCategory(category, name) {
  const map = {
    'pdf-tools': ['iLovePDF', 'Smallpdf', 'Adobe Acrobat Online'],
    'seo-tools': ['Ahrefs Free Tools', 'Semrush Tools', 'SEOptimer'],
    calculators: ['Calculator.net', 'NerdWallet Calculators', 'Omni Calculator'],
    'dev-tools': ['CodeBeautify', 'RapidAPI Tools', 'JSONFormatter'],
    'image-tools': ['TinyPNG', 'CloudConvert', 'Canva Tools'],
    'media-tools': ['SaveFrom', 'Y2Mate', 'SnapInsta'],
    'text-tools': ['Prepostseo', 'TextFixer', 'OnlineUtility'],
    'utility-tools': ['QRCode Monkey', 'GoQR', 'Canva QR'],
    'productivity-tools': ['timeanddate', 'Notion utilities', 'Google Workspace templates']
  };
  return {
    competingTools: map[category] || ['Generic online tool hubs'],
    missingContent: [
      `Add a visual step-by-step guide for ${name}.`,
      'Add a side-by-side feature comparison table.',
      'Add trust and privacy details near the top section.'
    ],
    rankingOpportunities: [
      `Target long-tail intent like "${name.toLowerCase()} without signup".`,
      'Expand FAQ with People Also Ask inspired questions.',
      'Add use-case blocks for beginner, pro, and team workflows.'
    ]
  };
}

function richSnippets() {
  return ['FAQ', 'HowTo', 'SoftwareApplication', 'Breadcrumb'];
}

function imageSeo(name, slug) {
  return {
    imageFileNames: [`${slug}-tool-interface.webp`, `${slug}-result-preview.webp`, `${slug}-usage-guide.webp`],
    altText: [`${name} online interface`, `${name} output preview`, `How to use ${name} on ${brand}`],
    titleText: [`${name} Tool`, `${name} Results`, `${name} Guide`]
  };
}

const usedTitles = new Set();
const report = routes.map((route) => {
  const slug = slugFromPath(route.path);
  const keywords = buildKeywords(route.name, slug);
  const title = uniqueTitle(route.name, usedTitles);
  const description = descriptionFor(route.name, keywords.primary);
  const canonical = `${domain}${route.path}`;
  const h1 = `${route.name} Online Free`;
  const faq = faqFor(route.name, keywords.primary);

  const metadata = {
    title,
    description,
    keywords: keywords.all,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      image: `${domain}/images/og/${slug}.webp`
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image'
    }
  };

  const structuredData = {
    webApplication: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: route.name,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      url: canonical,
      description
    },
    softwareApplication: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: route.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: canonical,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description
    },
    faqPage: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer
        }
      }))
    }
  };

  const related = (categoryRelated[route.category] || []).filter((p) => p !== route.path).slice(0, 3);
  const categoryPage = route.path.startsWith('/pdf-tools')
    ? '/pdf-tools'
    : route.path.startsWith('/calculators')
    ? '/calculators'
    : route.path.startsWith('/dev-tools')
    ? '/dev-tools/table-generator'
    : '/features';

  return {
    route: route.path,
    toolName: route.name,
    seoAnalysis: {
      titleLength: title.length,
      descriptionLength: description.length,
      primaryKeyword: keywords.primary,
      uniquenessCheck: 'Generated per-route using distinct tool names and slug-driven variants.',
      searchIntent: searchIntent(route.name),
      aiSearchOptimization: [
        'Clear entity mapping via structured data.',
        'Question-driven FAQ blocks aligned with conversational queries.',
        'Direct, concise intro content suitable for answer engines.'
      ]
    },
    metadataObject: metadata,
    nextJsMetadataExport: `export const metadata = ${JSON.stringify(metadata, null, 2)};`,
    structuredData,
    h1Heading: h1,
    seoIntroContent: introFor(route.name, keywords.primary, keywords.secondary),
    faqContent: faq,
    internalLinkingSuggestions: [...related, '/', categoryPage],
    imageSeo: imageSeo(route.name, slug),
    breadcrumbStructure: breadcrumbs(route.path, route.name),
    targetKeywords: {
      mainKeyword: keywords.primary,
      secondaryKeywords: keywords.secondary,
      lowCompetitionKeywords: [
        `${route.name.toLowerCase()} without signup`,
        `quick ${route.name.toLowerCase()} online`,
        `${route.name.toLowerCase()} free browser tool`
      ],
      longTailKeywords: keywords.longTail,
      relatedSearchTerms: keywords.related
    },
    competitorAnalysis: competitorByCategory(route.category, route.name),
    richSnippetOpportunities: richSnippets(),
    improvementSuggestions: [
      'Add visual usage walkthrough with screenshots.',
      'Add trust and data handling section above the fold.',
      'Expand FAQs using Search Console query terms after indexation.'
    ]
  };
});

fs.writeFileSync('SEO_TOOL_PAGES_REPORT.json', JSON.stringify(report, null, 2));

const markdown = [];
markdown.push('# Tool Pages SEO Report');
markdown.push('');
markdown.push(`Generated on: ${new Date().toISOString()}`);
markdown.push(`Total pages: ${report.length}`);
markdown.push('');

for (const page of report) {
  markdown.push(`## ${page.toolName} (${page.route})`);
  markdown.push('');
  markdown.push('### 1) SEO Analysis');
  markdown.push('```json');
  markdown.push(JSON.stringify(page.seoAnalysis, null, 2));
  markdown.push('```');
  markdown.push('');
  markdown.push('### 2) Metadata Object');
  markdown.push('```ts');
  markdown.push(page.nextJsMetadataExport);
  markdown.push('```');
  markdown.push('');
  markdown.push('### 3) Structured Data');
  markdown.push('```json');
  markdown.push(JSON.stringify(page.structuredData, null, 2));
  markdown.push('```');
  markdown.push('');
  markdown.push('### 4) FAQ Content');
  markdown.push('```json');
  markdown.push(JSON.stringify(page.faqContent, null, 2));
  markdown.push('```');
  markdown.push('');
  markdown.push('### 5) SEO Content');
  markdown.push(page.seoIntroContent);
  markdown.push('');
  markdown.push('### 6) Improvement Suggestions');
  markdown.push('```json');
  markdown.push(JSON.stringify(page.improvementSuggestions, null, 2));
  markdown.push('```');
  markdown.push('');
}

fs.writeFileSync('SEO_TOOL_PAGES_REPORT.md', markdown.join('\n'));
console.log(`Generated ${report.length} pages in SEO_TOOL_PAGES_REPORT.md and SEO_TOOL_PAGES_REPORT.json`);

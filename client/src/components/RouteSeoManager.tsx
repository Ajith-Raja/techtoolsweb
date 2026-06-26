import { useEffect } from "react";
import { useLocation } from "wouter";
import { defaultSeoMetadata, routeSeoMetadata } from "@/lib/seoMetadata";

const SITE_NAME = "TechToolsWeb";
const NOINDEX_PATH_PREFIXES = ["/results", "/history", "/auth", "/login", "/signup"];

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getBaseSiteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";
  if (configured.trim().length > 0) {
    return trimTrailingSlash(configured.trim());
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return "https://techtoolsweb.com";
}

function toAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseSiteUrl()}${normalizedPath}`;
}

function getOrCreateMetaTagByName(name: string): HTMLMetaElement {
  const existing = document.querySelector(`meta[name=\"${name}\"]`) as HTMLMetaElement | null;
  if (existing) {
    return existing;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", name);
  document.head.appendChild(meta);
  return meta;
}

function getOrCreateMetaTagByProperty(property: string): HTMLMetaElement {
  const existing = document.querySelector(`meta[property=\"${property}\"]`) as HTMLMetaElement | null;
  if (existing) {
    return existing;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("property", property);
  document.head.appendChild(meta);
  return meta;
}

function getOrCreateCanonicalTag(): HTMLLinkElement {
  const existing = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (existing) {
    return existing;
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "canonical");
  document.head.appendChild(link);
  return link;
}

function normalizePath(path: string): string {
  if (!path) return "/";
  const withoutQueryOrHash = path.split("?")[0].split("#")[0] || "/";
  if (withoutQueryOrHash.length > 1 && withoutQueryOrHash.endsWith("/")) {
    return withoutQueryOrHash.slice(0, -1);
  }
  return withoutQueryOrHash;
}

function shouldNoIndex(path: string): boolean {
  return NOINDEX_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function RouteSeoManager() {
  const [location] = useLocation();

  useEffect(() => {
    const activePath = location || window.location.pathname;
    const normalizedPath = normalizePath(activePath);
    const meta = routeSeoMetadata[normalizedPath] ?? defaultSeoMetadata;
    const absoluteUrl = toAbsoluteUrl(normalizedPath);
    const robotsContent = shouldNoIndex(normalizedPath) ? "noindex, nofollow" : "index, follow";

    document.title = meta.title;

    const descriptionTag = getOrCreateMetaTagByName("description");
    descriptionTag.setAttribute("content", meta.description);

    const robotsTag = getOrCreateMetaTagByName("robots");
    robotsTag.setAttribute("content", robotsContent);

    const ogTitleTag = getOrCreateMetaTagByProperty("og:title");
    ogTitleTag.setAttribute("content", meta.title);

    const ogDescriptionTag = getOrCreateMetaTagByProperty("og:description");
    ogDescriptionTag.setAttribute("content", meta.description);

    const ogTypeTag = getOrCreateMetaTagByProperty("og:type");
    ogTypeTag.setAttribute("content", "website");

    const ogUrlTag = getOrCreateMetaTagByProperty("og:url");
    ogUrlTag.setAttribute("content", absoluteUrl);

    const ogSiteNameTag = getOrCreateMetaTagByProperty("og:site_name");
    ogSiteNameTag.setAttribute("content", SITE_NAME);

    const twitterCardTag = getOrCreateMetaTagByName("twitter:card");
    twitterCardTag.setAttribute("content", "summary_large_image");

    const twitterTitleTag = getOrCreateMetaTagByName("twitter:title");
    twitterTitleTag.setAttribute("content", meta.title);

    const twitterDescriptionTag = getOrCreateMetaTagByName("twitter:description");
    twitterDescriptionTag.setAttribute("content", meta.description);

    const canonicalTag = getOrCreateCanonicalTag();
    canonicalTag.setAttribute("href", absoluteUrl);
  }, [location]);

  return null;
}

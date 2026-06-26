const LOCAL_MAIN_API_BASE_URL = "http://localhost:8000";
const LOCAL_TOOLS_API_BASE_URL = "http://localhost:8001";
const LOCAL_TOOLS_WS_BASE_URL = "ws://localhost:8001";

function trimTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^wss?:\/\//i.test(value);
}

const configuredMainUrl = "https://api.techtoolsweb.com"; // This should be replaced with the actual configured main URL if available
const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "";
const productionMainBase = trimTrailingSlash(configuredMainUrl || runtimeOrigin || LOCAL_MAIN_API_BASE_URL);

export const MAIN_API_BASE_URL = import.meta.env.PROD
  ? productionMainBase
  : LOCAL_MAIN_API_BASE_URL;

export const TOOLS_API_BASE_URL = import.meta.env.PROD
  ? productionMainBase
  : LOCAL_TOOLS_API_BASE_URL;

export const TOOLS_WS_BASE_URL = import.meta.env.PROD
  ? TOOLS_API_BASE_URL.replace(/^http/i, "ws")
  : LOCAL_TOOLS_WS_BASE_URL;

export function withMainApi(path: string): string {
  if (isAbsoluteUrl(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${MAIN_API_BASE_URL}${normalized}`;
}

export function withToolsApi(path: string): string {
  if (isAbsoluteUrl(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${TOOLS_API_BASE_URL}${normalized}`;
}

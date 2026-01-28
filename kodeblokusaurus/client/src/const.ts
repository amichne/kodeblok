// Constants for the application
// Note: OAuth functionality has been disabled in the simplified UI

export const COOKIE_NAME = "kodeblok_auth";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// OAuth login URL generator - disabled
export const getLoginUrl = () => {
  console.warn("OAuth functionality is not configured for this application");
  return "#";
};

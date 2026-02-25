/**
 * FanClaw Authentication Module
 * Handles login, session management, and token validation
 */

// Session configuration
const SESSION_KEY = "fanclaw_session";
const SESSION_TIMESTAMP_KEY = "fanclaw_session_timestamp";

// FanClaw configuration type
export interface FanClawConfig {
  auth: {
    username: string;
    password: string;
    sessionDuration: number; // hours
  };
  gateway: {
    token: string;
    url: string;
  };
  captcha: {
    type: "canvas" | "none";
  };
  development: {
    localHosts: string[];
  };
}

// Session data type
export interface FanClawSession {
  username: string;
  timestamp: number;
}

// Default configuration (will be overridden by YAML config)
let fanClawConfig: FanClawConfig | null = null;

/**
 * Check if current host is a local development host
 */
export function isLocalHost(): boolean {
  const hostname = window.location.hostname;
  const localHosts = fanClawConfig?.development?.localHosts ?? ["127.0.0.1", "localhost"];
  return localHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

/**
 * Load FanClaw configuration from YAML file
 */
export async function loadFanClawConfig(): Promise<FanClawConfig | null> {
  if (fanClawConfig) {
    return fanClawConfig;
  }

  try {
    // Try to load config from multiple locations
    const configPaths = ["/fanclaw.yaml", "./fanclaw.yaml", "../fanclaw.yaml"];

    for (const path of configPaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const yamlText = await response.text();
          fanClawConfig = parseYamlConfig(yamlText);
          return fanClawConfig;
        }
      } catch {
        // Continue to next path
      }
    }

    // If no config file found, use default config
    fanClawConfig = getDefaultConfig();
    return fanClawConfig;
  } catch (error) {
    console.error("Failed to load FanClaw config:", error);
    fanClawConfig = getDefaultConfig();
    return fanClawConfig;
  }
}

/**
 * Parse YAML config (simplified parser for basic YAML structures)
 */
function parseYamlConfig(yaml: string): FanClawConfig {
  const lines = yaml.split("\n");
  const config: Partial<FanClawConfig> = {
    auth: { username: "admin", password: "fanclaw123", sessionDuration: 72 },
    gateway: { token: "", url: "" },
    captcha: { type: "canvas" },
    development: { localHosts: ["127.0.0.1", "localhost"] },
  };

  let currentSection: string | null = null;
  let currentSubSection: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    // Check for section headers (e.g., "auth:")
    const sectionMatch = trimmed.match(/^(\w+):\s*$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      currentSubSection = null;
      continue;
    }

    // Check for sub-section headers (legacy nested blocks)
    const subSectionMatch = trimmed.match(/^(\w+):\s*$/);
    if (subSectionMatch && currentSection) {
      currentSubSection = subSectionMatch[1];
      continue;
    }

    // Check for key-value pairs
    const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (kvMatch && currentSection) {
      const [, key, value] = kvMatch;
      const cleanValue = value.replace(/^["']|["']$/g, "").trim();

      // Handle captcha section with nested structure (legacy nested blocks are ignored)
      if (currentSection === "captcha") {
        if (currentSubSection) {
          continue;
        }
        if (key === "type") {
          config.captcha!.type = cleanValue === "none" ? "none" : "canvas";
        }
        continue;
      }

      switch (currentSection) {
        case "auth":
          if (key === "username") {
            config.auth!.username = cleanValue;
          }
          if (key === "password") {
            config.auth!.password = cleanValue;
          }
          if (key === "sessionDuration") {
            config.auth!.sessionDuration = parseInt(cleanValue, 10) || 72;
          }
          break;
        case "gateway":
          if (key === "token") {
            config.gateway!.token = cleanValue;
          }
          if (key === "url") {
            config.gateway!.url = cleanValue;
          }
          break;
        // Legacy captcha section is ignored (fallback to canvas)
        case "turnstile":
          if (key === "enabled" && cleanValue === "true") {
            config.captcha!.type = "canvas";
          }
          break;
      }
    }

    // Check for array items
    const arrayMatch = trimmed.match(/^-\s*["']?(.+?)["']?$/);
    if (arrayMatch && currentSection === "development") {
      const value = arrayMatch[1].trim();
      if (!config.development!.localHosts.includes(value)) {
        config.development!.localHosts.push(value);
      }
    }
  }

  return config as FanClawConfig;
}

/**
 * Get default configuration
 */
function getDefaultConfig(): FanClawConfig {
  return {
    auth: {
      username: "admin",
      password: "fanclaw123",
      sessionDuration: 72,
    },
    gateway: {
      token: "",
      url: "",
    },
    captcha: {
      type: "canvas",
    },
    development: {
      localHosts: ["127.0.0.1", "localhost"],
    },
  };
}

/**
 * Get FanClaw configuration
 */
export function getFanClawConfig(): FanClawConfig {
  return fanClawConfig ?? getDefaultConfig();
}

/**
 * Validate username and password against config
 */
export async function validateCredentials(username: string, password: string): Promise<boolean> {
  const config = await loadFanClawConfig();
  if (!config) {
    return false;
  }
  return username === config.auth.username && password === config.auth.password;
}

/**
 * Create a new session
 */
export function createSession(username: string): void {
  const session: FanClawSession = {
    username,
    timestamp: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_TIMESTAMP_KEY, String(session.timestamp));
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_TIMESTAMP_KEY);
}

/**
 * Check if the current session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  // Local hosts skip session validation
  if (isLocalHost()) {
    return true;
  }

  const sessionJson = localStorage.getItem(SESSION_KEY);
  const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);

  if (!sessionJson || !timestampStr) {
    return false;
  }

  try {
    const session: FanClawSession = JSON.parse(sessionJson);
    const config = await loadFanClawConfig();
    const sessionDuration = config?.auth?.sessionDuration ?? 72;
    const maxAge = sessionDuration * 60 * 60 * 1000; // Convert hours to milliseconds
    const now = Date.now();
    const sessionAge = now - session.timestamp;

    if (sessionAge > maxAge) {
      // Session expired
      clearSession();
      return false;
    }

    return true;
  } catch {
    clearSession();
    return false;
  }
}

/**
 * Get the gateway token from config
 */
export async function getGatewayToken(): Promise<string> {
  const config = await loadFanClawConfig();
  return config?.gateway?.token ?? "";
}

/**
 * Get the gateway URL from config or use default
 */
export async function getGatewayUrl(): Promise<string> {
  const config = await loadFanClawConfig();
  if (config?.gateway?.url) {
    return config.gateway.url;
  }
  // Use current host
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

/**
 * Get captcha configuration
 */
export async function getCaptchaConfig(): Promise<{ type: "canvas" | "none" }> {
  const config = await loadFanClawConfig();
  const type = config?.captcha?.type ?? "canvas";
  return { type: type === "none" ? "none" : "canvas" };
}

/**
 * Check if login is required for current host
 */
export async function isLoginRequired(): Promise<boolean> {
  // Local hosts don't require login
  if (isLocalHost()) {
    return false;
  }

  // Check if session is valid
  const hasValidSession = await isSessionValid();
  return !hasValidSession;
}

// Declare global window extensions

/**
 * FanClaw Integration Module
 * Manages login state and authentication flow
 */

import { refreshChatAvatar } from "./app-chat.ts";
import type { OpenClawApp } from "./app.ts";
import { loadChatHistory } from "./controllers/chat.ts";
import {
  loadFanClawConfig,
  isLoginRequired,
  validateCredentials,
  createSession,
  clearSession,
  getCaptchaConfig,
  isLocalHost,
  type FanClawConfig,
} from "./fanclaw-auth.ts";
import type { Tab } from "./navigation.ts";

export interface FanClawState {
  // Login state
  fanclawLoginUsername: string;
  fanclawLoginPassword: string;
  fanclawLoginError: string | null;
  fanclawLoginLoading: boolean;
  fanclawCaptchaType: "canvas" | "none";
  fanclawCaptchaResetNonce: number;
  fanclawConfig: FanClawConfig | null;
  fanclawRequiresLogin: boolean;
  fanclawInitialized: boolean;
}

// Initialize FanClaw state in app
export function initFanClawState(app: OpenClawApp & FanClawState): void {
  app.fanclawLoginUsername = "";
  app.fanclawLoginPassword = "";
  app.fanclawLoginError = null;
  app.fanclawLoginLoading = false;
  app.fanclawCaptchaType = "canvas";
  app.fanclawCaptchaResetNonce = 0;
  app.fanclawConfig = null;
  app.fanclawRequiresLogin = false;
  app.fanclawInitialized = false;
}

function setTabSafe(app: OpenClawApp & FanClawState, next: Tab) {
  const host = app as unknown as { setTab?: (tab: Tab) => void; tab: Tab };
  if (typeof host.setTab === "function") {
    host.setTab(next);
  } else {
    host.tab = next;
  }
}

// Initialize FanClaw authentication
export async function initFanClaw(app: OpenClawApp & FanClawState): Promise<void> {
  if (app.fanclawInitialized) {
    return;
  }

  try {
    // Load config
    const config = await loadFanClawConfig();
    app.fanclawConfig = config;

    // Apply gateway config (token + optional URL) from fanclaw.yaml
    const token = (config?.gateway?.token ?? "").trim();
    const url = (config?.gateway?.url ?? "").trim();
    const settings = (app as unknown as { settings?: { token: string; gatewayUrl: string } })
      .settings;
    if (
      typeof (app as unknown as { applySettings?: (next: unknown) => void }).applySettings ===
        "function" &&
      settings
    ) {
      const next = {
        ...settings,
        token: token || settings.token,
        gatewayUrl: url || settings.gatewayUrl,
      };
      // Call as a method to keep `this` bound.
      (app as unknown as { applySettings: (next: unknown) => void }).applySettings(next);
    }

    // Check if local host (skip login)
    if (isLocalHost()) {
      app.fanclawRequiresLogin = false;
      if ((app as unknown as { tab: Tab }).tab === "fanchat") {
        setTabSafe(app, "chat");
      }
      app.fanclawInitialized = true;
      return;
    }

    // Non-local hosts default to FanClaw flow.
    if ((app as unknown as { tab: Tab }).tab !== "fanchat") {
      setTabSafe(app, "fanchat");
    }

    // Get captcha configuration
    const captchaConfig = await getCaptchaConfig();
    app.fanclawCaptchaType = captchaConfig.type;

    // Check if login is required
    const requiresLogin = await isLoginRequired();
    app.fanclawRequiresLogin = requiresLogin;

    // If not logged in, redirect to login tab
    if (requiresLogin) {
      setTabSafe(app, "fanchat");
    }

    app.fanclawInitialized = true;
  } catch (error) {
    console.error("Failed to initialize FanClaw:", error);
    app.fanclawInitialized = true;
  }
}

// Handle login form username change
export function handleFanClawUsernameChange(app: OpenClawApp & FanClawState, value: string): void {
  app.fanclawLoginUsername = value;
  app.fanclawLoginError = null;
}

// Handle login form password change
export function handleFanClawPasswordChange(app: OpenClawApp & FanClawState, value: string): void {
  app.fanclawLoginPassword = value;
  app.fanclawLoginError = null;
}

// Handle login submission
export async function handleFanClawLogin(app: OpenClawApp & FanClawState): Promise<void> {
  if (app.fanclawLoginLoading) {
    return;
  }

  app.fanclawLoginLoading = true;
  app.fanclawLoginError = null;

  try {
    // Validate credentials
    const isValid = await validateCredentials(app.fanclawLoginUsername, app.fanclawLoginPassword);

    if (!isValid) {
      app.fanclawLoginError = "Invalid username or password";
      app.fanclawCaptchaResetNonce += 1;
      app.fanclawLoginLoading = false;
      return;
    }

    // Create session
    createSession(app.fanclawLoginUsername);

    // Clear login form
    app.fanclawLoginUsername = "";
    app.fanclawLoginPassword = "";
    app.fanclawRequiresLogin = false;
    setTabSafe(app, "fanchat");

    // Connect to gateway
    app.connect();
  } catch (error) {
    app.fanclawLoginError = `Login failed: ${String(error)}`;
  } finally {
    app.fanclawLoginLoading = false;
  }
}

// Handle logout
export async function handleFanClawLogout(app: OpenClawApp & FanClawState): Promise<void> {
  clearSession();
  app.fanclawRequiresLogin = true;
  app.fanclawLoginUsername = "";
  app.fanclawLoginPassword = "";
  app.fanclawLoginError = null;
  app.fanclawLoginLoading = false;
  app.fanclawCaptchaResetNonce += 1;
  setTabSafe(app, "fanchat");
}

// Navigate to dashboard (chat page)
export function navigateToDashboard(app: OpenClawApp & FanClawState): void {
  (app as unknown as { tab: Tab }).tab = "chat";
}

// Navigate to fanchat
export function navigateToFanChat(app: OpenClawApp & FanClawState): void {
  (app as unknown as { tab: Tab }).tab = "fanchat";
}

// Handle session key change for fanchat
export function handleFanChatSessionKeyChange(app: OpenClawApp & FanClawState, next: string): void {
  (app as unknown as { sessionKey: string }).sessionKey = next;
  (app as unknown as { chatMessage: string }).chatMessage = "";
  (app as unknown as { chatAttachments: [] }).chatAttachments = [];
  (app as unknown as { chatStream: null }).chatStream = null;
  (app as unknown as { chatStreamStartedAt: null }).chatStreamStartedAt = null;
  (app as unknown as { chatRunId: null }).chatRunId = null;
  (app as unknown as { chatQueue: [] }).chatQueue = [];

  // Reset tool stream and chat scroll
  if (typeof (app as unknown as { resetToolStream: () => void }).resetToolStream === "function") {
    (app as unknown as { resetToolStream: () => void }).resetToolStream();
  }
  if (typeof (app as unknown as { resetChatScroll: () => void }).resetChatScroll === "function") {
    (app as unknown as { resetChatScroll: () => void }).resetChatScroll();
  }

  // Update settings
  if (
    typeof (app as unknown as { applySettings: (settings: unknown) => void }).applySettings ===
    "function"
  ) {
    const settings = (
      app as unknown as { settings: { sessionKey: string; lastActiveSessionKey: string } }
    ).settings;
    (app as unknown as { applySettings: (settings: unknown) => void }).applySettings({
      ...settings,
      sessionKey: next,
      lastActiveSessionKey: next,
    });
  }

  // Load assistant identity and chat history
  void (app as unknown as { loadAssistantIdentity: () => Promise<void> }).loadAssistantIdentity();
  void loadChatHistory(app as unknown as Parameters<typeof loadChatHistory>[0]);
  void refreshChatAvatar(app as unknown as Parameters<typeof refreshChatAvatar>[0]);
}

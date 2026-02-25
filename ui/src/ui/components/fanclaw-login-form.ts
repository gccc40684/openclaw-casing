import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { icons } from "../icons.ts";
import "./captcha-canvas.ts";

type CaptchaType = "canvas" | "none";

@customElement("fanclaw-login-form")
export class FanClawLoginForm extends LitElement {
  @property({ type: String }) error: string | null = null;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) captchaType: CaptchaType = "canvas"; // "canvas" or "none"
  @property({ type: Number }) captchaResetNonce = 0;

  @state() private username = "";
  @state() private password = "";
  @state() private captchaValid = false;
  @state() private captchaError: string | null = null;

  createRenderRoot() {
    // Use light DOM to ensure custom elements render correctly inside the host app.
    return this;
  }

  protected updated(changed: Map<PropertyKey, unknown>) {
    if (changed.has("captchaResetNonce")) {
      this.reset();
    }
  }

  private handleCanvasVerify = (e: CustomEvent<{ valid: boolean }>) => {
    this.captchaValid = e.detail.valid;
    this.captchaError = e.detail.valid ? null : "Invalid verification code";
  };

  private handleSubmit = (e: Event) => {
    e.preventDefault();
    if (this.canSubmit) {
      this.dispatchEvent(
        new CustomEvent("submit", {
          detail: {
            username: this.username,
            password: this.password,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  };

  private get canSubmit() {
    const baseValid = this.username.trim() && this.password.trim() && !this.loading;
    const captchaRequired = this.captchaType !== "none";
    return baseValid && (!captchaRequired || this.captchaValid);
  }

  reset() {
    // Reset canvas captcha
    const canvasCaptcha = this.querySelector("captcha-canvas") as HTMLElement & {
      reset: () => void;
    };
    if (canvasCaptcha && typeof canvasCaptcha.reset === "function") {
      canvasCaptcha.reset();
    }
    this.captchaValid = false;
    this.captchaError = null;
  }

  render() {
    return html`
      <div class="fanclaw-login-container">
        <div class="fanclaw-login-card">
          <div class="fanclaw-login-header">
            <div class="fanclaw-logo">
              <img src="/favicon.svg" alt="FanClaw" />
            </div>
            <h1 class="fanclaw-title">FanClaw</h1>
            <p class="fanclaw-subtitle">AI Assistant Portal</p>
          </div>

          ${
            this.error
              ? html`
                <div class="fanclaw-error" role="alert">
                  ${icons.alertCircle}
                  <span>${this.error}</span>
                </div>
              `
              : nothing
          }

          ${
            this.captchaError
              ? html`
                <div class="fanclaw-error" role="alert">
                  ${icons.alertCircle}
                  <span>${this.captchaError}</span>
                </div>
              `
              : nothing
          }

          <form class="fanclaw-form" @submit=${this.handleSubmit}>
            <div class="fanclaw-field">
              <label for="fanclaw-username">Username</label>
              <div class="fanclaw-input-wrapper">
                ${icons.user}
                <input
                  id="fanclaw-username"
                  type="text"
                  .value=${this.username}
                  @input=${(e: Event) => {
                    this.username = (e.target as HTMLInputElement).value;
                    this.dispatchEvent(
                      new CustomEvent("username-change", {
                        detail: { value: this.username },
                        bubbles: true,
                        composed: true,
                      }),
                    );
                  }}
                  placeholder="Enter username"
                  autocomplete="username"
                  ?disabled=${this.loading}
                  required
                />
              </div>
            </div>

            <div class="fanclaw-field">
              <label for="fanclaw-password">Password</label>
              <div class="fanclaw-input-wrapper">
                ${icons.lock}
                <input
                  id="fanclaw-password"
                  type="password"
                  .value=${this.password}
                  @input=${(e: Event) => {
                    this.password = (e.target as HTMLInputElement).value;
                    this.dispatchEvent(
                      new CustomEvent("password-change", {
                        detail: { value: this.password },
                        bubbles: true,
                        composed: true,
                      }),
                    );
                  }}
                  placeholder="Enter password"
                  autocomplete="current-password"
                  ?disabled=${this.loading}
                  required
                />
              </div>
            </div>

            ${
              this.captchaType === "canvas"
                ? html`
                  <div class="fanclaw-field">
                    <label>Verification</label>
                    <captcha-canvas @verify=${this.handleCanvasVerify}></captcha-canvas>
                  </div>
                `
                : nothing
            }

            <button
              type="submit"
              class="btn primary fanclaw-submit"
              ?disabled=${!this.canSubmit}
            >
              ${
                this.loading
                  ? html`
                    <span class="fanclaw-spinner">${icons.loader}</span>
                    Signing in...
                  `
                  : "Sign In"
              }
            </button>
          </form>

          <div class="fanclaw-footer">
            <p>Powered by OpenClaw</p>
          </div>
        </div>
      </div>
    `;
  }
}

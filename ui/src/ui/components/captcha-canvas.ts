import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { createRef, ref } from "lit/directives/ref.js";
import { icons } from "../icons.ts";

@customElement("captcha-canvas")
export class CaptchaCanvas extends LitElement {
  @property({ type: Number }) width = 150;
  @property({ type: Number }) height = 50;
  @property({ type: Number }) length = 4;

  @state() private code = "";
  @state() private userInput = "";
  @state() private isValid = false;
  @state() private hasError = false;

  private canvasRef = createRef<HTMLCanvasElement>();

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.generateCode();
  }

  private generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < this.length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.code = result;
    this.isValid = false;
    this.hasError = false;
    this.userInput = "";
    this.drawCaptcha();

    // Dispatch event with the generated code (for debugging/logging only)
    this.dispatchEvent(
      new CustomEvent("code-generated", {
        detail: { code: this.code },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private drawCaptcha() {
    const canvas = this.canvasRef.value;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw background noise (dots)
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * this.width, Math.random() * this.height, 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * this.width, Math.random() * this.height);
      ctx.lineTo(Math.random() * this.width, Math.random() * this.height);
      ctx.stroke();
    }

    // Draw text
    const charWidth = this.width / this.length;
    for (let i = 0; i < this.code.length; i++) {
      const char = this.code[i];
      const x = i * charWidth + charWidth / 2;
      const y = this.height / 2 + 8;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);

      // Random font properties
      const fontSize = 24 + Math.random() * 8;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = `rgb(${30 + Math.random() * 100}, ${30 + Math.random() * 100}, ${30 + Math.random() * 100})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(char, 0, 0);

      ctx.restore();
    }

    // Draw more noise lines over text
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * this.height);
      ctx.lineTo(this.width, Math.random() * this.height);
      ctx.stroke();
    }
  }

  private handleInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    this.userInput = value;
    this.hasError = false;

    // Check if input matches (case-insensitive)
    if (value.length === this.length) {
      if (value.toLowerCase() === this.code.toLowerCase()) {
        this.isValid = true;
        this.hasError = false;
        this.dispatchEvent(
          new CustomEvent("verify", {
            detail: { valid: true },
            bubbles: true,
            composed: true,
          }),
        );
      } else {
        this.isValid = false;
        this.hasError = true;
        this.dispatchEvent(
          new CustomEvent("verify", {
            detail: { valid: false },
            bubbles: true,
            composed: true,
          }),
        );
      }
    } else {
      this.isValid = false;
    }
  };

  private handleRefresh = () => {
    this.generateCode();
    // Clear input
    const input = this.querySelector(".captcha-input") as HTMLInputElement;
    if (input) {
      input.value = "";
      input.focus();
    }
    this.dispatchEvent(
      new CustomEvent("verify", {
        detail: { valid: false },
        bubbles: true,
        composed: true,
      }),
    );
  };

  reset() {
    this.generateCode();
    const input = this.querySelector(".captcha-input") as HTMLInputElement;
    if (input) {
      input.value = "";
    }
    this.userInput = "";
    this.isValid = false;
    this.hasError = false;
  }

  isValidCode(): boolean {
    return this.isValid;
  }

  render() {
    return html`
      <div class="captcha-container">
        <div class="captcha-row">
          <canvas
            class="captcha-canvas"
            width="${this.width}"
            height="${this.height}"
            ${ref(this.canvasRef)}
          ></canvas>
          <button
            type="button"
            class="btn captcha-refresh"
            @click=${this.handleRefresh}
            title="Refresh code"
          >
            ${icons.loader}
          </button>
        </div>
        <div class="captcha-input-wrapper">
          <input
            type="text"
            class="captcha-input ${this.hasError ? "captcha-error" : ""} ${this.isValid ? "captcha-success" : ""}"
            placeholder="Enter code"
            maxlength="${this.length}"
            .value=${this.userInput}
            @input=${this.handleInput}
            autocomplete="off"
            autocapitalize="off"
          />
          ${
            this.isValid
              ? html`
                  <span class="captcha-status captcha-status--success">✓</span>
                `
              : this.hasError
                ? html`
                    <span class="captcha-status captcha-status--error">✗</span>
                  `
                : null
          }
        </div>
        ${
          this.hasError
            ? html`
                <div class="captcha-hint">Code doesn't match. Try again.</div>
              `
            : null
        }
      </div>
    `;
  }
}

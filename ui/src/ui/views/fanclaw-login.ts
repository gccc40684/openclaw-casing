import { html } from "lit";
import type { TemplateResult } from "lit";
import "../components/fanclaw-login-form.ts";

export type FanClawLoginProps = {
  username: string;
  password: string;
  error: string | null;
  loading: boolean;
  captchaType: "canvas" | "none";
  captchaResetNonce: number;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function renderFanClawLogin(props: FanClawLoginProps): TemplateResult {
  return html`
    <fanclaw-login-form
      .error=${props.error}
      .loading=${props.loading}
      .captchaType=${props.captchaType}
      .captchaResetNonce=${props.captchaResetNonce}
      @username-change=${(e: CustomEvent<{ value: string }>) =>
        props.onUsernameChange(e.detail.value)}
      @password-change=${(e: CustomEvent<{ value: string }>) =>
        props.onPasswordChange(e.detail.value)}
      @submit=${() => props.onSubmit()}
    ></fanclaw-login-form>
  `;
}

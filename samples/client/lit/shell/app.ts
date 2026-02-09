/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { SignalWatcher } from "@lit-labs/signals";
import { provide } from "@lit/context";
import {
  LitElement,
  html,
  css,
  nothing,
  HTMLTemplateResult,
  unsafeCSS,
} from "lit";
import { customElement, state } from "lit/decorators.js";
import { theme as uiTheme } from "./theme/default-theme.js";
import { A2UIClient } from "./client.js";
import {
  SnackbarAction,
  SnackbarMessage,
  SnackbarUUID,
  SnackType,
} from "./types/types.js";
import { type Snackbar } from "./ui/snackbar.js";
import { repeat } from "lit/directives/repeat.js";
import { v0_8 } from "@a2ui/lit";
import * as UI from "@a2ui/lit/ui";

// App elements.
import "./ui/ui.js";

// Configurations
import { AppConfig } from "./configs/types.js";
import { config as restaurantConfig } from "./configs/restaurant.js";
import { config as contactsConfig } from "./configs/contacts.js";
import { styleMap } from "lit/directives/style-map.js";

const configs: Record<string, AppConfig> = {
  restaurant: restaurantConfig,
  contacts: contactsConfig,
};

@customElement("a2ui-shell")
export class A2UILayoutEditor extends SignalWatcher(LitElement) {
  @provide({ context: UI.Context.themeContext })
  accessor theme: v0_8.Types.Theme = uiTheme;

  @state()
  accessor #requesting = false;

  @state()
  accessor #error: string | null = null;

  @state()
  accessor #lastMessages: v0_8.Types.ServerToClientMessage[] = [];

  @state()
  accessor config: AppConfig = configs.restaurant;

  @state()
  accessor #loadingTextIndex = 0;
  #loadingInterval: number | undefined;

  static styles = [
    unsafeCSS(v0_8.Styles.structuralStyles),
    css`
      :host {
        --shell-border: light-dark(rgba(148, 163, 184, 0.3), rgba(30, 41, 59, 0.6));
        --shell-surface: light-dark(rgba(255, 255, 255, 0.85), rgba(15, 23, 42, 0.72));
        --shell-surface-strong: light-dark(rgba(255, 255, 255, 0.98), rgba(15, 23, 42, 0.92));
        --shell-accent: light-dark(#4f46e5, #38bdf8);
      }

      * {
        box-sizing: border-box;
      }

      :host {
        display: block;
        max-width: 720px;
        margin: 0 auto;
        min-height: 100%;
        color: light-dark(var(--n-10), var(--n-90));
        font-family: var(--font-family);
        padding: clamp(24px, 3vw, 40px) clamp(16px, 4vw, 32px) 48px;
      }

      #hero-img {
        width: 100%;
        max-width: 420px;
        aspect-ratio: 1280/720;
        height: auto;
        margin-bottom: var(--bb-grid-size-6);
        display: block;
        margin: 0 auto;
        background: var(--background-image-light) center center / contain
          no-repeat;
        border-radius: 24px;
        box-shadow: 0 24px 48px -32px rgba(15, 23, 42, 0.55);
        transition: transform 400ms ease, box-shadow 400ms ease;
      }

      #hero-img:hover {
        transform: translateY(-4px);
        box-shadow: 0 32px 64px -36px rgba(15, 23, 42, 0.6);
      }

      #surfaces {
        width: 100%;
        max-width: 100svw;
        padding: var(--bb-grid-size-3);
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
      }

      form {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 20px;
        align-items: center;
        padding: 24px;
        border-radius: 28px;
        background: var(--shell-surface);
        border: 1px solid var(--shell-border);
        box-shadow: 0 30px 80px -60px rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(14px);
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 1s backwards;

        & h1 {
          color: light-dark(#0f172a, #f8fafc);
          font-size: clamp(28px, 4vw, 36px);
          letter-spacing: -0.03em;
          margin-bottom: 4px;
        }

        & > div {
          display: flex;
          flex: 1;
          gap: 16px;
          align-items: center;
          width: 100%;

          & > input {
            display: block;
            flex: 1;
            border-radius: 999px;
            padding: 16px 22px;
            border: 1px solid transparent;
            background: var(--shell-surface-strong);
            font-size: 16px;
            color: light-dark(var(--n-10), var(--n-90));
            box-shadow: inset 0 0 0 1px
              light-dark(rgba(148, 163, 184, 0.35), rgba(30, 41, 59, 0.6));
            transition: box-shadow 200ms ease, border-color 200ms ease,
              background 200ms ease;
          }

          & > input:focus {
            outline: none;
            border-color: var(--shell-accent);
            box-shadow: 0 0 0 3px
              light-dark(rgba(79, 70, 229, 0.2), rgba(56, 189, 248, 0.25));
          }

          & > button {
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--shell-accent);
            color: var(--n-100);
            border: none;
            padding: 12px 18px;
            border-radius: 999px;
            opacity: 0.5;
            transition: transform 200ms ease, box-shadow 200ms ease,
              opacity 200ms ease;

            &:not([disabled]) {
              cursor: pointer;
              opacity: 1;
              box-shadow: 0 12px 24px -18px rgba(15, 23, 42, 0.65);
            }

            &:not([disabled]):hover {
              transform: translateY(-1px);
            }

            &:not([disabled]):active {
              transform: translateY(0);
            }
          }
        }
      }

      .app-subtitle {
        margin: 0;
        color: light-dark(rgba(15, 23, 42, 0.7), rgba(226, 232, 240, 0.72));
        font-size: 15px;
        line-height: 1.5;
        text-align: center;
        max-width: 520px;
      }

      .app-actions {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      }

      .suggestion {
        border-radius: 999px;
        border: 1px solid var(--shell-border);
        background: light-dark(rgba(255, 255, 255, 0.8), rgba(15, 23, 42, 0.8));
        color: light-dark(rgba(15, 23, 42, 0.8), rgba(226, 232, 240, 0.9));
        padding: 8px 14px;
        font-size: 13px;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: transform 200ms ease, border-color 200ms ease,
          box-shadow 200ms ease;
      }

      .suggestion:hover {
        transform: translateY(-1px);
        border-color: light-dark(rgba(79, 70, 229, 0.4), rgba(56, 189, 248, 0.4));
        box-shadow: 0 12px 24px -18px rgba(15, 23, 42, 0.4);
      }

      .rotate {
        animation: rotate 1s linear infinite;
      }

      .pending {
        width: 100%;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: fadeIn 1s cubic-bezier(0, 0, 0.3, 1) 0.3s backwards;
        gap: 16px;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-left-color: var(--shell-accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .theme-toggle {
        padding: 0;
        margin: 0;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        top: var(--bb-grid-size-3);
        right: var(--bb-grid-size-4);
        background: light-dark(rgba(255, 255, 255, 0.9), rgba(15, 23, 42, 0.9));
        border-radius: 50%;
        color: var(--shell-accent);
        cursor: pointer;
        width: 48px;
        height: 48px;
        font-size: 32px;
        border: 1px solid var(--shell-border);
        box-shadow: 0 16px 32px -24px rgba(15, 23, 42, 0.5);
        transition: transform 200ms ease, box-shadow 200ms ease;

        & .g-icon {
          pointer-events: none;

          &::before {
            content: "dark_mode";
          }
        }
      }

      .theme-toggle:hover {
        transform: translateY(-1px);
        box-shadow: 0 20px 36px -26px rgba(15, 23, 42, 0.55);
      }

      @container style(--color-scheme: dark) {
        .theme-toggle .g-icon::before {
          content: "light_mode";
          color: var(--n-90);
        }

        #hero-img {
          background-image: var(--background-image-dark);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.6;
        }
      }

      .error {
        color: var(--e-40);
        background-color: var(--e-95);
        border: 1px solid var(--e-80);
        padding: 16px;
        border-radius: 8px;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      @keyframes rotate {
        from {
          rotate: 0deg;
        }

        to {
          rotate: 360deg;
        }
      }
    `,
  ];

  #processor = v0_8.Data.createSignalA2uiMessageProcessor();
  #a2uiClient = new A2UIClient();
  #snackbar: Snackbar | undefined = undefined;
  #pendingSnackbarMessages: Array<{
    message: SnackbarMessage;
    replaceAll: boolean;
  }> = [];

  #maybeRenderError() {
    if (!this.#error) return nothing;

    return html`<div class="error">${this.#error}</div>`;
  }

  connectedCallback() {
    super.connectedCallback();

    // Load config from URL
    const urlParams = new URLSearchParams(window.location.search);
    const appKey = urlParams.get("app") || "restaurant";
    this.config = configs[appKey] || configs.restaurant;

    // Apply the theme directly, which will use the Lit context.
    if (this.config.theme) {
      this.theme = this.config.theme;
    }

    window.document.title = this.config.title;
    window.document.documentElement.style.setProperty(
      "--background",
      this.config.background
    );

    // Initialize client with configured URL
    this.#a2uiClient = new A2UIClient(this.config.serverUrl);
  }

  render() {
    return [
      this.#renderThemeToggle(),
      this.#maybeRenderForm(),
      this.#maybeRenderData(),
      this.#maybeRenderError(),
    ];
  }

  #renderThemeToggle() {
    return html` <div>
      <button
        @click=${(evt: Event) => {
        if (!(evt.target instanceof HTMLButtonElement)) return;
        const { colorScheme } = window.getComputedStyle(evt.target);
        if (colorScheme === "dark") {
          document.body.classList.add("light");
          document.body.classList.remove("dark");
        } else {
          document.body.classList.add("dark");
          document.body.classList.remove("light");
        }
      }}
        class="theme-toggle"
      >
        <span class="g-icon filled-heavy"></span>
      </button>
    </div>`;
  }

  #maybeRenderForm() {
    if (this.#requesting) return nothing;
    if (this.#lastMessages.length > 0) return nothing;

    return html` <form
      @submit=${async (evt: Event) => {
        evt.preventDefault();
        if (!(evt.target instanceof HTMLFormElement)) {
          return;
        }
        const data = new FormData(evt.target);
        const body = data.get("body") ?? null;
        if (!body) {
          return;
        }
        const message = body as v0_8.Types.A2UIClientEventMessage;
        await this.#sendAndProcessMessage(message);
      }}
    >
      ${this.config.heroImage
        ? html`<div
            style=${styleMap({
          "--background-image-light": `url(${this.config.heroImage})`,
          "--background-image-dark": `url(${this.config.heroImageDark ?? this.config.heroImage
            })`,
        })}
            id="hero-img"
          ></div>`
        : nothing}
      <h1 class="app-title">${this.config.title}</h1>
      ${this.config.description
        ? html`<p class="app-subtitle">${this.config.description}</p>`
        : nothing}
      ${Array.isArray(this.config.suggestions) &&
      this.config.suggestions.length > 0
        ? html`<div class="app-actions">
            ${this.config.suggestions.map(
          (suggestion) => html`<button
                class="suggestion"
                type="button"
                @click=${() => this.#applySuggestion(suggestion)}
              >
                ${suggestion}
              </button>`
        )}
          </div>`
        : nothing}
      <div>
        <input
          required
          value="${this.config.placeholder}"
          autocomplete="off"
          id="body"
          name="body"
          type="text"
          ?disabled=${this.#requesting}
        />
        <button type="submit" ?disabled=${this.#requesting}>
          <span class="g-icon filled-heavy">send</span>
        </button>
      </div>
    </form>`;
  }

  #startLoadingAnimation() {
    if (
      Array.isArray(this.config.loadingText) &&
      this.config.loadingText.length > 1
    ) {
      this.#loadingTextIndex = 0;
      this.#loadingInterval = window.setInterval(() => {
        this.#loadingTextIndex =
          (this.#loadingTextIndex + 1) %
          (this.config.loadingText as string[]).length;
      }, 2000);
    }
  }

  #applySuggestion(suggestion: string) {
    const input = this.renderRoot?.querySelector<HTMLInputElement>(
      "input[name='body']"
    );
    if (!input) return;
    input.value = suggestion;
    input.focus();
  }

  #stopLoadingAnimation() {
    if (this.#loadingInterval) {
      clearInterval(this.#loadingInterval);
      this.#loadingInterval = undefined;
    }
  }

  async #sendMessage(
    message: v0_8.Types.A2UIClientEventMessage
  ): Promise<v0_8.Types.ServerToClientMessage[]> {
    try {
      this.#requesting = true;
      this.#startLoadingAnimation();
      const response = this.#a2uiClient.send(message);
      await response;
      this.#requesting = false;
      this.#stopLoadingAnimation();

      return response;
    } catch (err) {
      this.snackbar(err as string, SnackType.ERROR);
    } finally {
      this.#requesting = false;
      this.#stopLoadingAnimation();
    }

    return [];
  }

  #maybeRenderData() {
    if (this.#requesting) {
      let text = "Awaiting an answer...";
      if (this.config.loadingText) {
        if (Array.isArray(this.config.loadingText)) {
          text = this.config.loadingText[this.#loadingTextIndex];
        } else {
          text = this.config.loadingText;
        }
      }

      return html` <div class="pending">
        <div class="spinner"></div>
        <div class="loading-text">${text}</div>
      </div>`;
    }

    const surfaces = this.#processor.getSurfaces();
    if (surfaces.size === 0) {
      return nothing;
    }

    return html`<section id="surfaces">
      ${repeat(
      this.#processor.getSurfaces(),
      ([surfaceId]) => surfaceId,
      ([surfaceId, surface]) => {
        return html`<a2ui-surface
              @a2uiaction=${async (
          evt: v0_8.Events.StateEvent<"a2ui.action">
        ) => {
            const [target] = evt.composedPath();
            if (!(target instanceof HTMLElement)) {
              return;
            }

            const context: v0_8.Types.A2UIClientEventMessage["userAction"]["context"] =
              {};
            if (evt.detail.action.context) {
              const srcContext = evt.detail.action.context;
              for (const item of srcContext) {
                if (item.value.literalBoolean) {
                  context[item.key] = item.value.literalBoolean;
                } else if (item.value.literalNumber) {
                  context[item.key] = item.value.literalNumber;
                } else if (item.value.literalString) {
                  context[item.key] = item.value.literalString;
                } else if (item.value.path) {
                  const path = this.#processor.resolvePath(
                    item.value.path,
                    evt.detail.dataContextPath
                  );
                  const value = this.#processor.getData(
                    evt.detail.sourceComponent,
                    path,
                    surfaceId
                  );
                  context[item.key] = value;
                }
              }
            }

            const message: v0_8.Types.A2UIClientEventMessage = {
              userAction: {
                name: evt.detail.action.name,
                surfaceId,
                sourceComponentId: target.id,
                timestamp: new Date().toISOString(),
                context,
              },
            };

            await this.#sendAndProcessMessage(message);
          }}
              .surfaceId=${surfaceId}
              .surface=${surface}
              .processor=${this.#processor}
            ></a2-uisurface>`;
      }
    )}
    </section>`;
  }

  async #sendAndProcessMessage(request) {
    const messages = await this.#sendMessage(request);

    console.log(messages);

    this.#lastMessages = messages;
    this.#processor.clearSurfaces();
    this.#processor.processMessages(messages);
  }

  snackbar(
    message: string | HTMLTemplateResult,
    type: SnackType,
    actions: SnackbarAction[] = [],
    persistent = false,
    id = globalThis.crypto.randomUUID(),
    replaceAll = false
  ) {
    if (!this.#snackbar) {
      this.#pendingSnackbarMessages.push({
        message: {
          id,
          message,
          type,
          persistent,
          actions,
        },
        replaceAll,
      });
      return;
    }

    return this.#snackbar.show(
      {
        id,
        message,
        type,
        persistent,
        actions,
      },
      replaceAll
    );
  }

  unsnackbar(id?: SnackbarUUID) {
    if (!this.#snackbar) {
      return;
    }

    this.#snackbar.hide(id);
  }
}

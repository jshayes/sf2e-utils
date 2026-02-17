import { moduleId } from "../../../constants";
import { DicePresetManagerApp } from "../applications/dicePresetManagerApp";
import { FLAG_KEY } from "../constants";
import { applyPreset, loadDiceForUser } from "../utils";

function randomElement<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function asHTMLElement(value: unknown): HTMLElement | null {
  if (value instanceof HTMLElement) return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "0" in value &&
    (value as { 0?: unknown })[0] instanceof HTMLElement
  ) {
    return (value as { 0: HTMLElement })[0];
  }

  return null;
}

function injectPresetButton(root: HTMLElement): void {
  const configRoot = root.matches("#dice-config.dice-so-nice")
    ? root
    : root.querySelector<HTMLElement>("#dice-config.dice-so-nice");
  if (!configRoot) return;

  if (configRoot.querySelector("[data-action='open-sf2e-dice-presets']")) {
    return;
  }

  const header = configRoot.querySelector<HTMLElement>(".window-header");
  if (!header) return;

  const button = document.createElement("button");
  button.classList.add("header-control", "icon", "fa-solid", "fa-dice");
  button.dataset.action = "open-sf2e-dice-presets";
  button.dataset.tooltip = "Open Presets Manager";
  button.title = "Dice Presets";
  const closeButton = header.querySelector<HTMLElement>(
    '[data-action="close"]',
  );
  if (closeButton) {
    closeButton.insertAdjacentElement("beforebegin", button);
  } else {
    header.append(button);
  }

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void new DicePresetManagerApp().render({ force: true });
  });
}

export function registerDiceSoNiceHooks(): void {
  Hooks.on("diceSoNiceRollStart", async (_, options) => {
    if (options.user.id === game.user.id) {
      const presets = Object.values(
        game.user.getFlag(moduleId, FLAG_KEY) ?? {},
      ).filter((x) => x.enabled);

      if (presets.length) {
        const preset = randomElement(presets);
        await applyPreset(preset);
      }
    }

    await loadDiceForUser(options.user);
  });

  Hooks.on("renderDiceConfig", (_app, element) => {
    const root = asHTMLElement(element);
    if (!root) return;
    injectPresetButton(root);
  });
}

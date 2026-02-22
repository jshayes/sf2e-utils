import { HooksManager } from "../../../helpers/hooks";

const hooks = new HooksManager();

function stylePauseFigure(figure: HTMLElement): void {
  figure.style.height = "90px";
  figure.style.top = "0";

  const image = figure.querySelector<HTMLImageElement>("img");
  if (image) {
    image.style.height = "50px";
  }

  const caption = figure.querySelector<HTMLElement>("figcaption");
  if (caption) {
    caption.style.fontSize = "var(--font-size-12)";
  }
}

export function registerPauseTweaksHooks(): void {
  hooks.on("renderGamePause", (_app, html: HTMLElement) => {
    if (!game.user.isGM) return;
    stylePauseFigure(html);
  });
}

export function unregisterPauseTweaksHooks(): void {
  hooks.off();
}

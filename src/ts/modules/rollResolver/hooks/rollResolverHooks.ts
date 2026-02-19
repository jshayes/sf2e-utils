let getHeaderControlsRollResolverHook: number;
export function registerRollResolverHooks() {
  getHeaderControlsRollResolverHook = Hooks.on(
    "getHeaderControlsRollResolver",
    (_, controls: foundry.applications.ApplicationHeaderControlsEntry[]) => {
      controls.push({
        icon: "fa-solid fa-dice",
        label: "Roll All",
        action: "roll-all",
        onClick: () => {
          const closeButtons = Array.from(
            document.querySelectorAll(
              '.roll-resolver header [data-action="close"]',
            ),
          ).filter((el): el is HTMLElement => el instanceof HTMLElement);

          closeButtons.forEach((btn) => btn.click());
        },
      });
    },
  );
}

export function unregisterRollResolverHooks() {
  Hooks.off("getHeaderControlsRollResolver", getHeaderControlsRollResolverHook);
}

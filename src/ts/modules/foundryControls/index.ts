import { moduleId } from "../../constants";
import { upperCaseFirst } from "../../helpers";

const registeredActionIds = new Set<string>();

const controls = [
  "tokens",
  "templates",
  "tiles",
  "drawings",
  "walls",
  "lighting",
  "sounds",
  "regions",
  "notes",
];

function activateControl(controlName: string, toolIndex = 0): boolean {
  if (!ui.controls) return false;
  if (!ui.controls.controls[controlName]) return false;

  const control = ui.controls.controls[controlName];
  const tools = Object.values(control.tools).sort((a, b) => a.order - b.order);

  if (toolIndex > tools.length) toolIndex = 0;

  void ui.controls.activate({
    control: controlName,
    tool: tools[toolIndex].name,
  });

  return true;
}

function activateTool(index: number) {
  if (!ui.controls.control) return false;
  return activateControl(ui.controls.control.name, index);
}

function registerOrUpdateKeybinding(
  actionId: string,
  name: string,
  hint: string,
  onDown: () => boolean,
): void {
  const keybindId = `${moduleId}.${actionId}`;
  const existingAction = game.keybindings.actions.get(keybindId);
  if (existingAction) {
    existingAction.onDown = onDown;
    game.keybindings.initialize();
    registeredActionIds.add(actionId);
    return;
  }

  game.keybindings.register(moduleId, actionId, {
    name,
    hint,
    editable: [],
    onDown,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
  registeredActionIds.add(actionId);
}

function registerMainControlKeybindings(): void {
  for (const control of controls) {
    const actionId = `activateControl_${control}`;
    const label = upperCaseFirst(control);
    registerOrUpdateKeybinding(
      actionId,
      `Controls: ${label}`,
      `Activate the ${label} control set.`,
      () => activateControl(control),
    );
  }
}

function registerToolKeybindings(): void {
  for (let i = 0; i < 12; i++) {
    const slot = i + 1;
    const actionId = `activateTool_${slot}`;
    registerOrUpdateKeybinding(
      actionId,
      `Controls: Tool ${slot}`,
      `Activate tool ${slot}.`,
      () => activateTool(i),
    );
  }
}

function registerFoundryControlKeybindings(): void {
  registerMainControlKeybindings();
  registerToolKeybindings();
}

export function registerFoundryControlsModule(): void {
  registerFoundryControlKeybindings();
}

export function unregisterFoundryControlsModule(): void {}

type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
interface Options {
  diceTypes?: DiceType[];
  silent?: boolean;
}

const SETTING_KEY = "diceConfiguration";
const allTypes: DiceType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

type DiceConfiguration = Record<string, string>;
type DiceFulfillmentConfig = {
  defaultMethod?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceDiceConfiguration(value: unknown): DiceConfiguration {
  if (!isRecord(value)) return {};

  const output: DiceConfiguration = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      output[key] = entry;
    }
  }
  return output;
}

function getManualMethod() {
  return "manual";
}

function getDefaultMethod(): string {
  const diceConfig = CONFIG?.Dice as typeof CONFIG.Dice & {
    fulfillment?: DiceFulfillmentConfig;
  };
  return diceConfig.fulfillment?.defaultMethod ?? "digital";
}

function getDiceConfigurationSetting(): DiceConfiguration {
  return coerceDiceConfiguration(game.settings.get("core", SETTING_KEY));
}

export function getCurrentDiceRollSetting() {
  const cfg = getDiceConfigurationSetting();

  const manualMethod = getManualMethod();
  const defaultMethod = getDefaultMethod();

  const diceKeys = Object.keys(cfg).filter((k) => typeof cfg[k] === "string");
  if (!diceKeys.length) return null;

  const enableManual = diceKeys.some((k) => cfg[k] !== manualMethod);
  return enableManual ? defaultMethod : manualMethod;
}

export async function setDiceRollsTo(
  method: string,
  options: Options = { silent: false },
) {
  const cfg = foundry.utils.deepClone(getDiceConfigurationSetting());
  const diceKeys = Object.keys(cfg).filter((k) => typeof cfg[k] === "string");
  if (!diceKeys.length) {
    return;
  }
  const diceTypes = new Set<string>(options.diceTypes ?? allTypes);
  for (const k of diceKeys) {
    if (diceTypes.has(k)) {
      cfg[k] = method;
    }
  }

  await game.settings.set("core", SETTING_KEY, cfg);
  if (!options.silent) {
    ui.notifications.info(
      `Dice fulfillment set to "${method}" for ${diceTypes.size} dice type(s).`,
    );
  }
}

export async function setDiceRollsToManual(options?: Options) {
  await setDiceRollsTo(getManualMethod(), options);
}

export async function setDiceRollsToDefault(
  options: Options = { silent: false },
) {
  await setDiceRollsTo(getDefaultMethod(), options);
}

export async function toggleManualDice(options?: Options) {
  if (getCurrentDiceRollSetting() === getManualMethod()) {
    await setDiceRollsToDefault(options);
  } else {
    await setDiceRollsToManual(options);
  }
}

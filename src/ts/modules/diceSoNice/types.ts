export interface AppearanceScope {
  [key: string]: string;
  system: string;
}

export interface Appearance {
  global: AppearanceScope;
  [key: string]: AppearanceScope;
}

export interface DicePreset {
  enabled: boolean;
  appearance: Appearance;
}

export interface DicePresetFlags {
  [key: string]: DicePreset;
}

export interface Die {
  options: {
    appearance?: AppearanceScope;
  };
  [key: string]: unknown;
}

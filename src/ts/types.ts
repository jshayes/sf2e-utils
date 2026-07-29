import { Module } from "foundry-pf2e/foundry/client/packages/_module.mjs";
import * as helpers from "./helpers";
import * as macros from "./macros";
import { moduleMacros } from "./modules";

export interface Sf2eUtilsApi {
  helpers: typeof helpers;
  macros: typeof macros & typeof moduleMacros;
}

export interface MyModule extends Module {
  api: Sf2eUtilsApi;
}

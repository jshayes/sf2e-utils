import { Module } from "foundry-pf2e/foundry/client/packages/_module.mjs";
import * as helpers from "./helpers";
import * as macros from "./macros";

export interface Sf2eUtilsApi {
  helpers: typeof helpers;
  macros: typeof macros;
}

export interface MyModule extends Module {
  api: Sf2eUtilsApi;
}

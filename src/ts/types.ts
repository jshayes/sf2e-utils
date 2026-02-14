import { Module } from "foundry-pf2e/foundry/client/packages/_module.mjs";
import DogBrowser from "./apps/dogBrowser";

export interface MyModule extends Module {
  dogBrowser: DogBrowser;
}

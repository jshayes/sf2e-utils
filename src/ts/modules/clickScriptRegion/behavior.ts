import { moduleId } from "../../constants";

export const clickScriptRegionBehaviorType = `${moduleId}.clickScript`;

export class ClickScriptRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {
  static override defineSchema() {
    return {
      source: new foundry.data.fields.JavaScriptField<true, false, true>({
        required: true,
        nullable: false,
        initial: "",
        async: true,
        label: "SF2E_UTILS.ClickScriptRegion.Source.Label",
        hint: "SF2E_UTILS.ClickScriptRegion.Source.Hint",
      }),
    };
  }
}

import { getRegionOpacity } from "./settings";

type RegionMeshLike = PIXI.Container & {
  region?: { isPreview?: boolean };
  shader?: { constructor?: { name?: string } };
};

type RegionMeshPrototype = {
  updateTransform(this: RegionMeshLike): void;
};

let originalUpdateTransform: RegionMeshPrototype["updateTransform"] | undefined;

function getRegionMeshPrototype(): RegionMeshPrototype {
  return foundry.canvas.placeables.regions.RegionMesh
    .prototype as unknown as RegionMeshPrototype;
}

function isExistingRegionHighlight(mesh: RegionMeshLike): boolean {
  return (
    !mesh.region?.isPreview &&
    mesh.shader?.constructor?.name === "HighlightRegionShader"
  );
}

export function registerRegionMeshOpacityPatch(): void {
  if (originalUpdateTransform) return;

  const prototype = getRegionMeshPrototype();
  const original = prototype.updateTransform;
  originalUpdateTransform = original;

  prototype.updateTransform =
    function updateTransformWithRegionOpacity(): void {
      const alpha = this.alpha;
      if (isExistingRegionHighlight(this)) {
        this.alpha *= getRegionOpacity();
      }

      try {
        original.call(this);
      } finally {
        this.alpha = alpha;
      }
    };
}

export function unregisterRegionMeshOpacityPatch(): void {
  if (!originalUpdateTransform) return;

  getRegionMeshPrototype().updateTransform = originalUpdateTransform;
  originalUpdateTransform = undefined;
}

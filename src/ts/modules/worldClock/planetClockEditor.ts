import type { PlanetClockDefinition } from "./planetClocks";
import { getPlanetClocks, savePlanetClocks } from "./planetClockStore";

type PlanetClockFormElements = HTMLFormControlsCollection & {
  planetName?: HTMLInputElement;
  gravity?: HTMLInputElement;
  atmosphere?: HTMLInputElement;
  dayLengthHours?: HTMLInputElement;
  dayLengthMinutes?: HTMLInputElement;
  epoch?: HTMLInputElement;
};

function escapeAttribute(value: string | number | undefined): string {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function parseNonNegativeInteger(value: string): number {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export async function openPlanetClockEditor(
  existing?: PlanetClockDefinition,
): Promise<void> {
  if (!game.user.isGM) return;

  const result = (await foundry.applications.api.DialogV2.prompt({
    window: { title: existing ? `Edit ${existing.name}` : "Add Planet" },
    content: `
      <div class="form-group">
        <label>Name</label>
        <div class="form-fields">
          <input name="planetName" type="text" value="${escapeAttribute(existing?.name)}" required />
        </div>
      </div>
      <div class="form-group">
        <label>Gravity</label>
        <div class="form-fields">
          <input name="gravity" type="text" value="${escapeAttribute(existing?.gravity)}" />
        </div>
      </div>
      <div class="form-group">
        <label>Atmosphere</label>
        <div class="form-fields">
          <input name="atmosphere" type="text" value="${escapeAttribute(existing?.atmosphere)}" />
        </div>
      </div>
      <div class="form-group">
        <label>Day Length</label>
        <div class="form-fields">
          <input name="dayLengthHours" type="number" min="0" step="1" value="${escapeAttribute(existing?.dayLength?.hours ?? 0)}" aria-label="Day length hours" />
          <span>hours</span>
          <input name="dayLengthMinutes" type="number" min="0" step="1" value="${escapeAttribute(existing?.dayLength?.minutes ?? 0)}" aria-label="Day length minutes" />
          <span>minutes</span>
        </div>
        <p class="hint">Use zero hours and minutes for a planet without a day/night cycle.</p>
      </div>
      <div class="form-group">
        <label>Epoch</label>
        <div class="form-fields">
          <input name="epoch" type="number" step="1" value="${escapeAttribute(existing?.epoch)}" placeholder="0" />
        </div>
        <p class="hint">Unix timestamp, in seconds, when local time was midnight.</p>
      </div>
    `,
    ok: {
      label: existing ? "Save Changes" : "Add Planet",
      icon: "fa-solid fa-floppy-disk",
      callback: (_event: Event, button: unknown): Omit<PlanetClockDefinition, "id"> | null => {
        const form = (button as { form?: HTMLFormElement }).form;
        const elements = form?.elements as PlanetClockFormElements | undefined;
        const name = String(elements?.planetName?.value ?? "").trim();
        if (!name) {
          ui.notifications.error("A planet name is required.");
          return null;
        }

        const gravity = String(elements?.gravity?.value ?? "").trim();
        const atmosphere = String(elements?.atmosphere?.value ?? "").trim();
        const epochValue = String(elements?.epoch?.value ?? "").trim();

        return {
          name,
          gravity: gravity || undefined,
          atmosphere: atmosphere || undefined,
          dayLength: {
            hours: parseNonNegativeInteger(elements?.dayLengthHours?.value ?? "0"),
            minutes: parseNonNegativeInteger(elements?.dayLengthMinutes?.value ?? "0"),
          },
          epoch: epochValue ? Number(epochValue) : undefined,
        };
      },
    },
    rejectClose: false,
  })) as Omit<PlanetClockDefinition, "id"> | null;

  if (!result) return;

  const clocks = getPlanetClocks();
  if (existing) {
    const index = clocks.findIndex((clock) => clock.id === existing.id);
    if (index === -1) return;
    clocks[index] = { id: existing.id, ...result };
  } else {
    clocks.push({ id: foundry.utils.randomID(), ...result });
  }

  await savePlanetClocks(clocks);
}

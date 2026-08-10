import {
  createDefaultLocation,
  getPlanetLocations,
  type PlanetClockDefinition,
  type PlanetClockLocation,
} from "./planetClocks";
import { getPlanetClocks, savePlanetClocks } from "./planetClockStore";

type PlanetClockFormElements = HTMLFormControlsCollection & {
  planetName?: HTMLInputElement;
  gravity?: HTMLInputElement;
  atmosphere?: HTMLInputElement;
  dayLengthHours?: HTMLInputElement;
  dayLengthMinutes?: HTMLInputElement;
  epoch?: HTMLInputElement;
};

type LocationFormElements = HTMLFormControlsCollection & {
  locationId?: HTMLInputElement;
  locationName?: HTMLInputElement;
  offsetDirection?: HTMLSelectElement;
  offsetHours?: HTMLInputElement;
  offsetMinutes?: HTMLInputElement;
  locationGravity?: HTMLInputElement;
  locationAtmosphere?: HTMLInputElement;
};

function escapeAttribute(value: string | number | undefined): string {
  return foundry.utils.escapeHTML(String(value ?? ""));
}

function parseNonNegativeInteger(value: string): number {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function formatOffset(location: PlanetClockLocation): string {
  const totalOffsetMinutes =
    location.offset.hours * 60 + location.offset.minutes;
  const absoluteOffset = Math.abs(totalOffsetMinutes);
  const sign = totalOffsetMinutes < 0 ? "−" : "+";
  return `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, "0")}:${String(absoluteOffset % 60).padStart(2, "0")}`;
}

function locationRowHtml(location: PlanetClockLocation): string {
  const overrides = [
    location.gravity ? `Gravity: ${escapeAttribute(location.gravity)}` : "",
    location.atmosphere
      ? `Atmosphere: ${escapeAttribute(location.atmosphere)}`
      : "",
  ].filter(Boolean);

  return `
    <div class="planet-clock-location-row" data-location-row>
      <input name="locationId" type="hidden" value="${escapeAttribute(location.id)}" />
      <input name="locationName" type="hidden" value="${escapeAttribute(location.name)}" />
      <input name="offsetHours" type="hidden" value="${location.offset.hours}" />
      <input name="offsetMinutes" type="hidden" value="${location.offset.minutes}" />
      <input name="locationGravity" type="hidden" value="${escapeAttribute(location.gravity)}" />
      <input name="locationAtmosphere" type="hidden" value="${escapeAttribute(location.atmosphere)}" />
      <div class="planet-clock-location-details">
        <strong>${escapeAttribute(location.name)}</strong>
        <span>Offset ${formatOffset(location)}${overrides.length ? ` · ${overrides.join(" · ")}` : ""}</span>
      </div>
      <div class="planet-clock-location-actions">
        <button type="button" data-edit-location aria-label="Edit ${escapeAttribute(location.name)}" data-tooltip="Edit ${escapeAttribute(location.name)}">
          <i class="fa-solid fa-pen-to-square"></i>
          Edit
        </button>
        <button type="button" class="icon" data-remove-location aria-label="Remove ${escapeAttribute(location.name)}" data-tooltip="Remove ${escapeAttribute(location.name)}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

function readLocationRow(row: HTMLElement): PlanetClockLocation {
  const value = (name: string): string =>
    row.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? "";
  return {
    id: value("locationId"),
    name: value("locationName"),
    offset: {
      hours: Number.parseInt(value("offsetHours"), 10) || 0,
      minutes: Number.parseInt(value("offsetMinutes"), 10) || 0,
    },
    gravity: value("locationGravity") || undefined,
    atmosphere: value("locationAtmosphere") || undefined,
  };
}

async function openLocationEditor(
  existing?: PlanetClockLocation,
): Promise<PlanetClockLocation | null> {
  const totalOffsetMinutes = existing
    ? existing.offset.hours * 60 + existing.offset.minutes
    : 0;
  const absoluteOffset = Math.abs(totalOffsetMinutes);
  const direction = totalOffsetMinutes < 0 ? "-1" : "1";

  return (await foundry.applications.api.DialogV2.prompt({
    window: { title: existing ? `Edit ${existing.name}` : "Add Location" },
    position: { width: 500 },
    content: `
      <div class="planet-clock-location-editor">
      <div class="form-group">
        <label>Name</label>
        <div class="form-fields">
          <input name="locationName" type="text" value="${escapeAttribute(existing?.name)}" required autofocus />
        </div>
      </div>
      <div class="form-group">
        <label>Time Offset</label>
        <div class="form-fields">
          <select name="offsetDirection" aria-label="Offset direction">
            <option value="1"${direction === "1" ? " selected" : ""}>+</option>
            <option value="-1"${direction === "-1" ? " selected" : ""}>&minus;</option>
          </select>
          <input name="offsetHours" type="number" min="0" step="1" value="${Math.floor(absoluteOffset / 60)}" aria-label="Offset hours" />
          <span>hours</span>
          <input name="offsetMinutes" type="number" min="0" max="59" step="1" value="${absoluteOffset % 60}" aria-label="Offset minutes" />
          <span>minutes</span>
        </div>
      </div>
      <div class="form-group">
        <label>Gravity Override</label>
        <div class="form-fields">
          <input name="locationGravity" type="text" value="${escapeAttribute(existing?.gravity)}" placeholder="Use planet gravity" />
        </div>
      </div>
      <div class="form-group">
        <label>Atmosphere Override</label>
        <div class="form-fields">
          <input name="locationAtmosphere" type="text" value="${escapeAttribute(existing?.atmosphere)}" placeholder="Use planet atmosphere" />
        </div>
      </div>
      <p class="hint">The offset is relative to the planet clock. Empty condition overrides use the planet's values.</p>
      </div>
    `,
    ok: {
      label: existing ? "Save Changes" : "Add Location",
      icon: "fa-solid fa-floppy-disk",
      callback: (_event: Event, button: unknown): PlanetClockLocation | null => {
        const form = (button as { form?: HTMLFormElement }).form;
        const elements = form?.elements as LocationFormElements | undefined;
        const name = String(elements?.locationName?.value ?? "").trim();
        if (!name) {
          ui.notifications.error("A location name is required.");
          return null;
        }

        const direction = elements?.offsetDirection?.value === "-1" ? -1 : 1;
        const hours = parseNonNegativeInteger(
          elements?.offsetHours?.value ?? "0",
        );
        const minutes = Math.min(
          59,
          parseNonNegativeInteger(elements?.offsetMinutes?.value ?? "0"),
        );
        const gravity = String(
          elements?.locationGravity?.value ?? "",
        ).trim();
        const atmosphere = String(
          elements?.locationAtmosphere?.value ?? "",
        ).trim();

        return {
          id: existing?.id ?? foundry.utils.randomID(),
          name,
          offset: { hours: direction * hours, minutes: direction * minutes },
          gravity: gravity || undefined,
          atmosphere: atmosphere || undefined,
        };
      },
    },
    modal: true,
    rejectClose: false,
  })) as PlanetClockLocation | null;
}

function readLocations(form: HTMLFormElement | undefined): PlanetClockLocation[] {
  if (!form) return [];
  return Array.from(
    form.querySelectorAll<HTMLElement>("[data-location-row]"),
    readLocationRow,
  );
}

export async function openPlanetClockEditor(
  existing?: PlanetClockDefinition,
): Promise<void> {
  if (!game.user.isGM) return;

  const locations = existing
    ? getPlanetLocations(existing)
    : [createDefaultLocation()];

  const result = (await foundry.applications.api.DialogV2.prompt({
    window: { title: existing ? `Edit ${existing.name}` : "Add Planet" },
    position: { width: 600 },
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
      <section class="planet-clock-editor-locations">
        <div class="planet-clock-editor-locations-header">
          <h3>Locations</h3>
          <button type="button" data-add-location>
            <i class="fa-solid fa-plus"></i>
            Add Location
          </button>
        </div>
        <div class="planet-clock-location-list" data-location-list>
          ${locations.map(locationRowHtml).join("")}
        </div>
      </section>
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
        const locations = readLocations(form);
        if (!locations.length) {
          ui.notifications.error("At least one location is required.");
          return null;
        }

        return {
          name,
          gravity: gravity || undefined,
          atmosphere: atmosphere || undefined,
          dayLength: {
            hours: parseNonNegativeInteger(elements?.dayLengthHours?.value ?? "0"),
            minutes: parseNonNegativeInteger(elements?.dayLengthMinutes?.value ?? "0"),
          },
          epoch: epochValue ? Number(epochValue) : undefined,
          locations,
        };
      },
    },
    render: (_event: Event, dialog: { element?: HTMLElement | null }) => {
      const root = dialog.element;
      const list = root?.querySelector<HTMLElement>("[data-location-list]");
      const addButton = root?.querySelector<HTMLButtonElement>(
        "[data-add-location]",
      );
      if (!list || !addButton) return;

      const updateRemoveButtons = (): void => {
        const rows = list.querySelectorAll("[data-location-row]");
        for (const button of Array.from(
          list.querySelectorAll<HTMLButtonElement>("[data-remove-location]"),
        )) {
          button.disabled = rows.length <= 1;
        }
      };
      const attachRowButtons = (row: HTMLElement): void => {
        row
          .querySelector<HTMLButtonElement>("[data-edit-location]")
          ?.addEventListener("click", async () => {
            const location = await openLocationEditor(readLocationRow(row));
            if (!location) return;

            row.insertAdjacentHTML("afterend", locationRowHtml(location));
            const replacement = row.nextElementSibling;
            row.remove();
            if (replacement instanceof HTMLElement) {
              attachRowButtons(replacement);
            }
            updateRemoveButtons();
          });
        row
          .querySelector<HTMLButtonElement>("[data-remove-location]")
          ?.addEventListener("click", () => {
            if (list.querySelectorAll("[data-location-row]").length <= 1) {
              return;
            }
            row.remove();
            updateRemoveButtons();
          });
      };

      for (const row of Array.from(
        list.querySelectorAll<HTMLElement>("[data-location-row]"),
      )) {
        attachRowButtons(row);
      }
      addButton.addEventListener("click", async () => {
        const location = await openLocationEditor();
        if (!location) return;

        list.insertAdjacentHTML("beforeend", locationRowHtml(location));
        const row = list.lastElementChild;
        if (row instanceof HTMLElement) {
          attachRowButtons(row);
        }
        updateRemoveButtons();
      });
      updateRemoveButtons();
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

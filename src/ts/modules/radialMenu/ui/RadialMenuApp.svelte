<script lang="ts">
    import { moduleId } from "../../../constants";
    import { flagKey } from "../constants";
    import "./RadialMenuApp.css";

    type Macro = foundry.documents.Macro;
    type Folder = foundry.documents.Folder;
    type MacroSlot = {
        image: string;
        label: string;
        folder: foundry.documents.Folder;
        macros: Macro[];
    };

    type MacroRadialMenu = MacroSlot[];

    type InnerSlot = {
        id: string;
        key: string;
        label: string;
        image: string;
        angle: number;
        x: number;
        y: number;
        folder: Folder;
        macros: Macro[];
    };

    type OuterMacroSlot = {
        id: string;
        folder: Folder;
        macro: Macro;
        x: number;
        y: number;
        index: number;
        ringIndex: number;
    };

    const slotsPerWheel = 24;
    const innerRadius = 160;
    const outerRingSpacing = 58;
    const outerRingBaseRadius = 230;
    const maxOuterRings = 4;

    function polarToCartesian(radius: number, angle: number) {
        return {
            x: Math.cos(angle - Math.PI / 2) * radius,
            y: Math.sin(angle - Math.PI / 2) * radius,
        };
    }

    function buildInnerSlots(slots: MacroRadialMenu): InnerSlot[] {
        return slots.map((slot, index) => {
            const angle = (Math.PI * 2 * index) / slots.length;
            const { x, y } = polarToCartesian(innerRadius, angle);

            return {
                id: String(index),
                key: String(index),
                label: slot.label || `${index + 1}`,
                image: slot.image,
                angle,
                x,
                y,
                folder: slot.folder,
                macros: slot.macros,
            };
        });
    }

    function buildOuterMacroSlots(
        macros: Macro[],
        anchorAngle: number,
    ): OuterMacroSlot[] {
        if (macros.length === 0) {
            return [];
        }

        return [...macros]
            .sort((a, b) => {
                const aFolder = a.folder as Folder;
                const bFolder = b.folder as Folder;

                if (aFolder.id !== bFolder.id)
                    return aFolder.sort - bFolder.sort;

                if (aFolder.sorting === "m") return a.sort - b.sort;
                return a.name.localeCompare(b.name);
            })
            .slice(0, slotsPerWheel * maxOuterRings)
            .map((macro, index) => {
                const ringIndex = Math.floor(index / slotsPerWheel);
                const positionInRing = index % slotsPerWheel;
                const itemsInRing = Math.min(
                    slotsPerWheel,
                    macros.length - ringIndex * slotsPerWheel,
                );
                const angleStep = (Math.PI * 2) / slotsPerWheel;
                const angleOffset = ((itemsInRing - 1) / 2) * angleStep;
                const angle =
                    anchorAngle + positionInRing * angleStep - angleOffset;
                const radius =
                    outerRingBaseRadius + ringIndex * outerRingSpacing;
                const { x, y } = polarToCartesian(radius, angle);

                return {
                    id: macro.id,
                    macro,
                    folder: macro.folder as Folder,
                    x,
                    y,
                    index,
                    ringIndex,
                };
            });
    }

    function isFolderParentOf(
        element: Macro | foundry.documents.BaseFolder,
        folder: Folder,
    ) {
        if (!element.folder) return false;

        const elementFolder = element.folder;
        if (elementFolder.id === folder.id) return true;

        if (elementFolder instanceof foundry.documents.BaseFolder)
            return isFolderParentOf(elementFolder, folder);

        return false;
    }

    function getMacrosForFolder(folder: Folder) {
        return game.macros.filter((x) => isFolderParentOf(x, folder));
    }

    function getSlots(): MacroSlot[] {
        const configuredSlots = game.user.getFlag(moduleId, flagKey);
        if (!Array.isArray(configuredSlots) || configuredSlots.length === 0)
            return [];

        return configuredSlots
            .map((slot) => {
                const folder = game.folders.get(slot.folder);
                if (!folder) return;

                const macros = getMacrosForFolder(folder);

                return {
                    image: slot.image,
                    label: folder.name,
                    folder,
                    macros,
                };
            })
            .filter(<T,>(x: T | undefined): x is T => !!x);
    }

    const macroWheel = $derived(getSlots());

    const innerSlots = buildInnerSlots(macroWheel);
    let activeInnerSlotId = $state<string | null>(null);
    let tooltipText = $state<string | null>(null);
    let tooltipX = $state(0);
    let tooltipY = $state(0);

    let { title = "Radial Menu", onClose = () => {} } = $props<{
        title?: string;
        onClose?: () => void;
    }>();

    const activeInnerSlot = $derived.by(() => {
        if (!activeInnerSlotId) {
            return null;
        }

        return innerSlots.find((slot) => slot.id === activeInnerSlotId) ?? null;
    });

    const outerMacroSlots = $derived.by(() => {
        if (!activeInnerSlot) {
            return [];
        }

        return buildOuterMacroSlots(
            activeInnerSlot.macros,
            activeInnerSlot.angle,
        );
    });

    function handleInnerSlotEnter(slotId: string): void {
        activeInnerSlotId = slotId;
    }

    function showTooltip(label: string, event: MouseEvent): void {
        tooltipText = label;
        tooltipX = event.clientX;
        tooltipY = event.clientY;
    }

    function moveTooltip(event: MouseEvent): void {
        if (!tooltipText) return;
        tooltipX = event.clientX;
        tooltipY = event.clientY;
    }

    function hideTooltip(): void {
        tooltipText = null;
    }

    async function handleMacroClick(macro: Macro): Promise<void> {
        await macro.execute();
    }

    function handleStageLeave(event: MouseEvent): void {
        const nextTarget = event.relatedTarget;
        const currentTarget = event.currentTarget;

        if (
            !(currentTarget instanceof Node) ||
            !(nextTarget instanceof Node) ||
            !currentTarget.contains(nextTarget)
        ) {
            activeInnerSlotId = null;
        }
    }

    function getFanoutDelay(slots: OuterMacroSlot[], index: number) {
        const ringNumber = Math.floor(index / slotsPerWheel);
        const ringIndex = index % slotsPerWheel;
        const ringSlots = Math.min(
            slotsPerWheel,
            slots.length - slotsPerWheel * ringNumber,
        );

        const dist = Math.abs(ringIndex - ringSlots / 2);

        return dist * 12 + ringNumber * 12;
    }
</script>

<div
    role="button"
    tabindex="0"
    onkeypress={() => {}}
    class="radial-menu-shell"
    aria-label={title}
    onclick={onClose}
>
    <div
        class="radial-menu-stage"
        onmouseleave={handleStageLeave}
        role="button"
        tabindex="0"
    >
        <div class="radial-menu-ring radial-menu-ring-inner">
            {#each innerSlots as slot (slot.id)}
                <button
                    type="button"
                    class:selected={activeInnerSlotId === slot.id}
                    class="radial-menu-slot radial-menu-slot-inner"
                    style={`
                        --slot-x: ${slot.x}px;
                        --slot-y: ${slot.y}px;
                        --background-colour: ${(slot.folder.color?.r ?? 0) * 255}
                        ${(slot.folder.color?.g ?? 0) * 255}
                        ${(slot.folder.color?.b ?? 0) * 255};
                    `}
                    onmouseenter={(event) => {
                        handleInnerSlotEnter(slot.id);
                        showTooltip(slot.label, event);
                    }}
                    onmousemove={moveTooltip}
                    onmouseleave={hideTooltip}
                    onclick={(event) => {
                        event.stopPropagation();
                        handleInnerSlotEnter(slot.id);
                    }}
                >
                    {#if slot.image}
                        <img
                            src={slot.image}
                            alt=""
                            class="radial-menu-slot-image"
                        />
                    {:else}
                        <span>{slot.label}</span>
                    {/if}
                </button>
            {/each}
        </div>

        {#if activeInnerSlot && outerMacroSlots.length > 0}
            {#key activeInnerSlot.id}
                <div
                    class="radial-menu-ring radial-menu-ring-outer"
                    class:radial-menu-ring-outer-double={outerMacroSlots.some(
                        (macro) => macro.ringIndex === 1,
                    )}
                >
                    {#each outerMacroSlots as macro (macro.id)}
                        <button
                            type="button"
                            class={`radial-menu-slot radial-menu-slot-outer radial-menu-slot-outer-${macro.ringIndex + 1}`}
                            style={`
                                --slot-x: ${macro.x}px;
                                --slot-y: ${macro.y}px;
                                --origin-x: ${activeInnerSlot.x}px;
                                --origin-y: ${activeInnerSlot.y}px;
                                --fan-delay: ${getFanoutDelay(outerMacroSlots, macro.index)}ms;
                                --background-colour: ${(macro.folder.color?.r ?? 0) * 255}
                                ${(macro.folder.color?.g ?? 0) * 255}
                                ${(macro.folder.color?.b ?? 0) * 255};
                            `}
                            onmouseenter={(event) => {
                                showTooltip(macro.macro.name, event);
                            }}
                            onmousemove={moveTooltip}
                            onmouseleave={hideTooltip}
                            onclick={(event) => {
                                event.stopPropagation();
                                handleMacroClick(macro.macro);
                            }}
                        >
                            {#if macro.macro.img}
                                <img
                                    src={macro.macro.img}
                                    alt=""
                                    class="radial-menu-slot-image"
                                />
                            {:else}
                                <span>{macro.macro.name}</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {/key}
        {/if}
    </div>

    {#if tooltipText}
        <div
            class="radial-menu-tooltip"
            style={`left: ${tooltipX}px; top: ${tooltipY}px;`}
        >
            {tooltipText}
        </div>
    {/if}
</div>

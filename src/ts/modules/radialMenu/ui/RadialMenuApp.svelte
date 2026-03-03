<script lang="ts">
    import "./RadialMenuApp.css";

    type Macro = {
        id: string;
        label: string;
        image?: string;
    };

    type MacroSlot = {
        image: string;
        label: string;
        macros: Macro[];
    };

    type MacroWheel = {
        slot1?: MacroSlot;
        slot2?: MacroSlot;
        slot3?: MacroSlot;
        slot4?: MacroSlot;
        slot5?: MacroSlot;
        slot6?: MacroSlot;
        slot7?: MacroSlot;
        slot8?: MacroSlot;
        slot9?: MacroSlot;
        slot10?: MacroSlot;
        slot11?: MacroSlot;
        slot12?: MacroSlot;
        slot13?: MacroSlot;
        slot14?: MacroSlot;
    };

    type InnerSlot = {
        id: string;
        key: string;
        label: string;
        image: string;
        angle: number;
        x: number;
        y: number;
        macros: Macro[];
    };

    type OuterMacroSlot = {
        id: string;
        label: string;
        image?: string;
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

    const macroWheel: MacroWheel = {
        slot1: {
            image: "",
            label: "Actions",
            macros: Array.from({ length: 10 }, (_, index) => ({
                id: `action-${index + 1}`,
                label: `Action ${index + 1}`,
            })),
        },
        slot3: {
            image: "",
            label: "Effects",
            macros: Array.from({ length: 80 }, (_, index) => ({
                id: `effect-${index + 1}`,
                label: `E${index + 1}`,
            })),
        },
        slot6: {
            image: "",
            label: "Spells",
            macros: Array.from({ length: 7 }, (_, index) => ({
                id: `spell-${index + 1}`,
                label: `Spell ${index + 1}`,
            })),
        },
        slot10: {
            image: "",
            label: "Utility",
            macros: Array.from({ length: 5 }, (_, index) => ({
                id: `utility-${index + 1}`,
                label: `Tool ${index + 1}`,
            })),
        },
        slot11: {
            image: "",
            label: "Utility",
            macros: Array.from({ length: 5 }, (_, index) => ({
                id: `utility-${index + 1}`,
                label: `Tool ${index + 1}`,
            })),
        },
        slot12: {
            image: "",
            label: "Utility",
            macros: Array.from({ length: 5 }, (_, index) => ({
                id: `utility-${index + 1}`,
                label: `Tool ${index + 1}`,
            })),
        },
    };

    function polarToCartesian(radius: number, angle: number) {
        return {
            x: Math.cos(angle - Math.PI / 2) * radius,
            y: Math.sin(angle - Math.PI / 2) * radius,
        };
    }

    function buildInnerSlots(wheel: MacroWheel): InnerSlot[] {
        const slots = Object.entries(wheel);
        return slots.map(([key, slot], index) => {
            const angle = (Math.PI * 2 * index) / slots.length;
            const { x, y } = polarToCartesian(innerRadius, angle);

            return {
                id: key,
                key,
                label: slot.label || `${index + 1}`,
                image: slot.image,
                angle,
                x,
                y,
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

        return macros
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
                    label: macro.label,
                    image: macro.image,
                    x,
                    y,
                    index,
                    ringIndex,
                };
            });
    }

    const innerSlots = buildInnerSlots(macroWheel);
    let activeInnerSlotId = $state<string | null>(null);

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

    function handleMacroClick(macro: Macro): void {
        console.log("macro clicked", macro);
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
                    style={`--slot-x: ${slot.x}px; --slot-y: ${slot.y}px;`}
                    onmouseenter={() => handleInnerSlotEnter(slot.id)}
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
                    {/if}
                    <span>{slot.label}</span>
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
                            `}
                            onclick={(event) => {
                                event.stopPropagation();
                                handleMacroClick({
                                    id: macro.id,
                                    label: macro.label,
                                    image: macro.image,
                                });
                            }}
                        >
                            {#if macro.image}
                                <img
                                    src={macro.image}
                                    alt=""
                                    class="radial-menu-slot-image"
                                />
                            {/if}
                            <span>{macro.label}</span>
                        </button>
                    {/each}
                </div>
            {/key}
        {/if}
    </div>
</div>

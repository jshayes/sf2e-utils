<script lang="ts">
    import "./RadialMenuApp.css";

    type Macro = string;

    type Slot = {
        content: Slot[] | Macro;
    };

    const s: Slot[] = [
        {
            content: [
                {
                    content: [
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                        { content: "inner test2" },
                    ],
                },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        {
            content: [
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
                { content: "inner test2" },
            ],
        },
        { content: "test" },
    ];

    type RadialSlot = {
        id: string;
        label: string;
        angle: number;
        x: number;
        y: number;
        slot: Slot;
    };

    type Layer = {
        id: number;
        slots: RadialSlot[];
        state: "opening" | "opened" | "closing" | "collapsed" | "hidden";
    };

    function buildSlots(slots: Slot[], startingAngle = 0): RadialSlot[] {
        const count = slots.length;
        const radius = 160;
        return slots.map((slot, index) => {
            const angle = (Math.PI * 2 * index) / count + startingAngle;
            return {
                id: `slot-${index + 1}`,
                label: `${index + 1}`,
                angle,
                x: Math.cos(angle - Math.PI / 2) * radius,
                y: Math.sin(angle - Math.PI / 2) * radius,
                slot,
            };
        });
    }

    function buildOuterSlots(slots: Slot[], startingAngle = 0): RadialSlot[] {
        const count = slots.length;
        const radius = 160;
        return slots.map((slot, index) => {
            const angleShift = (Math.PI * 2 * (count / 2 - 0.5)) / 14;
            const angle =
                (Math.PI * 2 * index) / 14 + startingAngle - angleShift;
            console.log({ angleShift, angle });
            return {
                id: `slot-${index + 1}`,
                label: `${index + 1}`,
                angle,
                x: Math.cos(angle - Math.PI / 2) * radius,
                y: Math.sin(angle - Math.PI / 2) * radius,
                slot,
            };
        });
    }

    // const slots = buildSlots(14, 160);
    const slots = buildSlots(s);
    const closeAnimationMs = 360;
    let selectedSlotId = $state<string | null>(null);

    const layers = $state<Layer[]>([{ id: 1, slots, state: "opened" }]);

    let { title = "Radial Menu", onClose = () => {} } = $props<{
        title?: string;
        onClose?: () => void;
    }>();

    async function handleReplaceOuterLayer(slot: RadialSlot) {
        if (layers.length <= 1) return;

        if (typeof slot.slot.content === "string") return;

        const closingLayer = layers[layers.length - 1];
        closingLayer.state = "closing";
        setTimeout(() => {
            const closingIndex = layers.indexOf(closingLayer);

            if (closingIndex !== -1) {
                layers.splice(closingIndex, 1);
            }
        }, closeAnimationMs);
        layers.push({
            id: Math.random(),
            slots: buildOuterSlots(slot.slot.content, slot.angle),
            state: "opening",
        });
        requestAnimationFrame(() => {
            layers[layers.length - 1].state = "opened";
        });
    }

    async function handleSlotClick(
        layer: Layer,
        slot: RadialSlot,
    ): Promise<void> {
        if (layer.state === "collapsed") {
            await handleReplaceOuterLayer(slot);
            return;
        }

        selectedSlotId = slot.id;

        if (typeof slot.slot.content === "string") {
            return;
        }

        console.log(slot);
        layer.state = "collapsed";
        const nextLayer: Layer = {
            id: Math.random(),
            slots: buildOuterSlots(slot.slot.content, slot.angle),
            state: "opening",
        };

        if (layers.length > 1) {
            const layerToHide = layers[layers.length - 2];
            layerToHide.state = "hidden";
        }

        layers.push(nextLayer);

        requestAnimationFrame(() => {
            layers[layers.length - 1].state = "opened";
        });
    }

    function handleGoBack() {
        if (layers.length <= 1) return;

        selectedSlotId = null;
        const closingLayer = layers[layers.length - 1];
        const reopeningLayer = layers[layers.length - 2];

        if (closingLayer.state === "closing") return;

        closingLayer.state = "closing";
        reopeningLayer.state = "opened";

        if (layers.length > 2) {
            const layerToUnHide = layers[layers.length - 3];
            layerToUnHide.state = "collapsed";
        }

        setTimeout(() => {
            const closingIndex = layers.indexOf(closingLayer);

            if (closingIndex !== -1) {
                layers.splice(closingIndex, 1);
            }
        }, closeAnimationMs);
    }

    function handleShellContextMenu(event: MouseEvent): void {
        event.preventDefault();
        handleGoBack();
    }
</script>

<div
    role="button"
    tabindex="0"
    onkeypress={() => {}}
    class="radial-menu-shell"
    onclick={onClose}
    oncontextmenu={handleShellContextMenu}
>
    <div class="radial-menu-stage">
        {#each layers as layer (layer.id)}
            <div
                class="radial-menu-ring"
                class:radial-menu-ring-collapsing={layer.state === "collapsed"}
                class:radial-menu-ring-closing={layer.state === "closing"}
                class:radial-menu-ring-hidden={layer.state === "hidden"}
                class:radial-menu-ring-opening={layer.state === "opening"}
            >
                {#each layer.slots as slot (slot.id)}
                    <button
                        type="button"
                        class:selected={selectedSlotId === slot.id}
                        class="radial-menu-slot"
                        style={`--slot-x: ${slot.x}px; --slot-y: ${slot.y}px;`}
                        onclick={(event) => {
                            event.stopPropagation();
                            handleSlotClick(layer, slot);
                        }}
                    >
                        {slot.label}
                    </button>
                {/each}
            </div>
        {/each}
    </div>
</div>

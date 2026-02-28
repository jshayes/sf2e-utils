<script lang="ts">
  import "./RadialMenuApp.css";

  type RadialSlot = {
    id: string;
    label: string;
    x: number;
    y: number;
  };

  function buildSlots(count: number, radius: number): RadialSlot[] {
    return Array.from({ length: count }, (_, index) => {
      const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
      return {
        id: `slot-${index + 1}`,
        label: `${index + 1}`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }

  const slots = buildSlots(14, 160);

  let {
    title = "Radial Menu",
    onClose = () => {},
  } = $props<{
    title?: string;
    onClose?: () => void;
  }>();
</script>

<div class="radial-menu-shell">
  <div class="radial-menu-stage">
    <div class="radial-menu-center">Menu</div>

    {#each slots as slot (slot.id)}
      <button
        type="button"
        class="radial-menu-slot"
        style={`--slot-x: ${slot.x}px; --slot-y: ${slot.y}px;`}
      >
        {slot.label}
      </button>
    {/each}
  </div>
</div>

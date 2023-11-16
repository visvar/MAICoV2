<script>
  import { Layer } from "svelte-canvas";
  import { spring } from "svelte/motion";
  import * as glutil from "../../util/glyphutil.js";
  import { axisselect, brushselection } from "../../stores/stores.js";

  export let x = 0,
    y = 0,
    r = 3,
    fill = "red",
    stroke = null,
    strokeWidth = 1,
    opacity = 1;

  $: render = ({ context }) => {
    context.globalAlpha = opacity;
    context.fillStyle = fill;
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();

    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = strokeWidth;
      context.beginPath();
      context.arc(x, y, r + strokeWidth / 2, 0, 2 * Math.PI);
      context.stroke();
    }
  };
</script>

<Layer {render} />

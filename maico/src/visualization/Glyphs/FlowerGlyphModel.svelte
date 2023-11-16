<script>
  import * as gu from "../../util/glyphutil";
  import { onMount } from "svelte";
  import * as mvlib from "musicvis-lib";
  import { modelpointsavg, tooltipSel } from "../../stores/stores.js";
  import { averageOfGlyphs } from "../../util/glyphutil";
  import { getColor } from "../../util/visutil";

  export let w = 0,
    h = 0,
    model;

  let path = null;

  let canvas;

  let r = 0;
  let context;

  onMount(() => {
    context = canvas.getContext("2d");
    render();
  });

  $: $modelpointsavg, render();

  function render() {
    if (canvas !== undefined) {
      context = canvas.getContext("2d");
      if (
        $modelpointsavg !== null &&
        $modelpointsavg[model.name] !== null &&
        context !== undefined
      ) {
        r = (w - 2) / 2;
        context.clearRect(0, 0, canvas.width, canvas.height);
        const data = $modelpointsavg[model.name][2];
        path = data.starglyph.data;
        const fill = getColor({ model: model }, 0);
        const x = w / 2;
        const y = h / 2;
        const scale = r / 10;
        // color
        context.fillStyle = fill;
        // flower
        context.beginPath();
        // these values control the width of the flower petal
        const amax = 3 * scale;
        const bmax = 5 * scale;
        const angleStep = 360 / path.length;
        for (let i = 0; i < path.length; i++) {
          const angle = angleStep * i;
          let scaled = path[i].value;
          let a = amax * scaled;
          let b = bmax * scaled;
          context.save();
          context.translate(x, y);
          context.rotate((angle * Math.PI) / 180);
          context.translate(-x, -y);
          context.moveTo(x, y);
          context.bezierCurveTo(
            x - a,
            y - a,
            x - b,
            y - r * scaled,
            x,
            y - r * scaled
          );
          context.bezierCurveTo(x + b, y - r * scaled, x + a, y - a, x, y);
          context.restore();
        }
        context.fill();
        // enclosing circle
        context.strokeStyle = "grey";
        context.fillStyle = "grey";
        mvlib.Canvas.drawCircle(context, x, y, r);
        const radmid = r <= 6 ? 0 : r <= 9 ? 1 : 2;
        mvlib.Canvas.drawFilledCircle(context, x, y, radmid);
      }
    }
  }
</script>

<canvas
  bind:this={canvas}
  width={w}
  height={h}
  on:click={(e) =>
    $tooltipSel !== null && $tooltipSel.data === model
      ? tooltipSel.set(null)
      : tooltipSel.set({ number: 2, data: model })}
/>

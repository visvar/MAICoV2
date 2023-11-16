<script>
  import { Layer } from "svelte-canvas";

  // @ts-ignore
  import * as mvlib from "musicvis-lib";
  import { outercircle } from "../../stores/stores";

  export let x = 0,
    y = 0,
    r = 10,
    fill = "red",
    information,
    opacity = 1,
    drawbounds;

  let path;

  $: render = ({ context }) => {
    path = information;
    const scale = r / 10;
    // color
    context.globalAlpha = opacity;
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
    if (drawbounds) {
      mvlib.Canvas.drawCircle(context, x, y, r);
    }
    const radmid = r <= 6 ? 0 : r <= 9 ? 1 : 2;
    mvlib.Canvas.drawFilledCircle(context, x, y, radmid);
  };
</script>

<Layer {render} />

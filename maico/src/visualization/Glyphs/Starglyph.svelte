<script>
  import { Layer } from "svelte-canvas";
  import { spring } from "svelte/motion";

  // @ts-ignore
  import * as mvlib from "musicvis-lib";
  import { scaleLinear } from "d3-scale";
  import * as d3 from "d3";
  import * as muutil from "../../util/musicutil";

  export let x = 0,
    y = 0,
    r = 10,
    fill = "red",
    information,
    opacity = 1;

  let path;

  $: render = ({ context }) => {
    path = information;
    const scale = r / 10;
    // color
    context.globalAlpha = opacity;
    context.fillStyle = fill;
    context.beginPath();
    context.moveTo(x + scale * path[0].x, y + scale * path[0].y);
    for (let i = 1; i < path.length; i++) {
      context.lineTo(x + scale * path[i].x, y + scale * path[i].y);
    }
    //context.stroke()
    context.fill();
    context.strokeStyle = "grey";
    context.fillStyle = "grey";
    mvlib.Canvas.drawCircle(context, x, y, r);
    const radmid = r <= 6 ? 0 : r <= 9 ? 1 : 2;
    mvlib.Canvas.drawFilledCircle(context, x, y, radmid);
  };
</script>

<Layer {render} />

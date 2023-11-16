<script>
  import { Layer } from "svelte-canvas";
  import { spring } from "svelte/motion";

  // @ts-ignore
  import * as mvlib from "musicvis-lib";
  import * as d3 from "d3";
  import * as muutil from "../../util/musicutil.js";
  import * as glutil from "../../util/glyphutil.js";

  export let x = 0,
    y = 0,
    r = 10,
    fill = "grey",
    information,
    opacity = 1;

  let barsize = r / 13;

  $: scaleY = d3
    .scaleLinear()
    .domain([0, information.histInterval.max])
    .range([y, y - r])
    .nice();
  $: scaleX = d3
    .scaleLinear()
    .domain([12, 24])
    .range([x - r, x + r - barsize - 1])
    .nice();

  $: render = ({ context }) => {
    context.globalAlpha = opacity;
    context.strokeStyle = fill;
    context.fillStyle = "none";
    //context.strokeOpacity = 0.3
    context.lineWidth = 0.5;
    mvlib.Canvas.drawLine(context, scaleX(12), y, scaleX(24) + barsize, y);
    mvlib.Canvas.drawRoundedRect(
      context,
      scaleX(12) - 1,
      scaleY(information.histInterval.max) - 1,
      r * 2 + 2,
      r * 2 + 2,
      0
    );
    context.stroke();
    //context.fill()

    context.lineWidth = 1;
    information.histInterval.data.forEach((occ, i) => {
      if (occ > 0) {
        const height = scaleY(occ) - y;
        if (i === 12) {
          const tx = scaleX(24 - i);
          const ty = y - height;
          mvlib.Canvas.drawRoundedRect(context, tx, ty, barsize, height, 0);
          context.fillStyle = glutil.histogramColorScale(i);
          //context.strokeStyle = v(colorscale(i))
          //context.strokeOpacity = 1
          context.fill();
          //context.stroke()
        }
        const tx = i >= 12 ? scaleX(i) : scaleX(24 - i);
        const ty = i >= 12 ? y : y - height;
        mvlib.Canvas.drawRoundedRect(context, tx, ty, barsize, height, 0);
        context.fillStyle = glutil.histogramColorScale(i);
        //context.strokeStyle = v(colorscale(i))
        //context.strokeOpacity = 1
        context.fill();
        //context.stroke()
      }
    });
  };
</script>

<Layer {render} />

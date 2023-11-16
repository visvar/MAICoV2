<script>
    import * as gu from "../../util/glyphutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import { modelpointsavg, tooltipSel } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor } from "../../util/visutil";
    import * as d3 from "d3";

    export let w = 0,
        h = 0,
        model;

    let canvas;

    let radius = 0;
    let context;
    const margin = 2;

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
                context.clearRect(0, 0, canvas.width, canvas.height);
                const information = $modelpointsavg[model.name][2];
                const scaley = d3
                    .scaleLinear()
                    .domain(information.pianoroll.yextent)
                    .range([h - margin, margin])
                    .nice();
                const scalex = d3
                    .scaleLinear()
                    .domain(information.pianoroll.xextent)
                    .range([margin, w - margin])
                    .nice();
                const height =
                    scaley(information.pianoroll.yextent[1] - 1) -
                    scaley(information.pianoroll.yextent[1]);
                const s = d3
                    .scaleLinear()
                    .domain([0, information.pianoroll.maxocc])
                    .range([0, (height * 0.95) / 2]);
                radius = w / 2;
                const fill = getColor({ model: model }, 0);
                context.fillStyle = fill;
                context.strokeStyle = fill;
                mvlib.Canvas.drawRoundedRect(
                    context,
                    margin,
                    margin,
                    w - margin,
                    h - margin,
                    0
                );
                context.stroke();
                context.fill();

                let area = d3
                    .area()
                    .y0(function (d) {
                        return scaley(d.pitch) - s(d.occ);
                    })
                    .y1(function (d) {
                        return scaley(d.pitch) + s(d.occ);
                    })
                    .x(function (d) {
                        return scalex(d.start);
                    })
                    .curve(d3.curveMonotoneX)
                    .context(context);

                information.pianoroll.data.forEach((a, i) => {
                    context.beginPath();
                    if (area !== null) area(a);
                    context.fillStyle =
                        gu.getColorLightness(fill) < 50 ? "white" : "black";
                    context.fill();
                });
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
            : tooltipSel.set({ number: 3, data: model })}
/>

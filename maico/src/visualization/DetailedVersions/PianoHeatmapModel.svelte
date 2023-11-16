<script>
    import * as gu from "../../util/glyphutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import { modelpointsavg, tooltipSel } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor, drawAxis } from "../../util/visutil";
    import * as d3 from "d3";

    export let width = 0,
        height = 0,
        data;

    let canvas;

    let context;
    const margin = 10;
    const offset = 10;

    onMount(() => {
        context = canvas.getContext("2d");
        render();
    });

    $: data, render();

    function render() {
        if (canvas !== undefined) {
            context = canvas.getContext("2d");
            if (
                $modelpointsavg !== null &&
                $modelpointsavg[data.name] !== null &&
                context !== undefined
            ) {
                context.fillStyle = "white";
                context.clearRect(0, 0, canvas.width, canvas.height);
                const information = $modelpointsavg[data.name][2];
                const scaley = d3
                    .scaleLinear()
                    .domain(information.pianoroll.yextent)
                    .range([height - margin, margin + offset])
                    .nice();

                const scalex = d3
                    .scaleLinear()
                    .domain(information.pianoroll.xextent)
                    .range([margin + offset, width - margin])
                    .nice();
                const height1 =
                    scaley(information.pianoroll.yextent[1] - 1) -
                    scaley(information.pianoroll.yextent[1]);
                const s = d3
                    .scaleLinear()
                    .domain([0, information.pianoroll.maxocc])
                    .range([0, (height1 * 0.95) / 2]);
                const fill = getColor({ model: data }, 0);
                context.fillStyle = fill;
                context.strokeStyle = fill;

                context.rect(
                    scalex(information.pianoroll.xextent[0]),
                    scaley(information.pianoroll.yextent[1]),
                    scalex(information.pianoroll.xextent[1] - 1) -
                        scalex(information.pianoroll.xextent[0]),
                    scaley(information.pianoroll.yextent[0]) -
                        scaley(information.pianoroll.yextent[1])
                );

                //context.stroke();
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
                context.fillStyle = "black";
                drawAxis(
                    context,
                    "x",
                    scaley(information.pianoroll.yextent[0]),
                    information.pianoroll.xextent[1] - 1,
                    scalex,
                    offset
                );
                drawAxis(
                    context,
                    "y",
                    height - 2 * margin - offset,
                    information.pianoroll.yextent,
                    scaley,
                    offset
                );
            }
        }
    }
</script>

<canvas
    bind:this={canvas}
    {width}
    {height}
    on:click={(e) => tooltipSel.set(null)}
/>

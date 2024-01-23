<script>
    import * as gu from "../../util/glyphutil";
    import * as visutil from "../../util/visutil";
    import * as glutil from "../../util/glyphutil";
    import * as mvlib from "musicvis-lib";
    import { onMount } from "svelte";
    import {
        currentcolor,
        modelpointsavg,
        selectedBaseKeys,
        tooltipSel,
    } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor, drawAxis, drawAxisHisto } from "../../util/visutil";
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
    $: $currentcolor, render();

    function render() {
        if (canvas !== undefined) {
            context = canvas.getContext("2d");
            if (data !== null && context !== undefined) {
                context.fillStyle = "white";
                context.clearRect(0, 0, canvas.width, canvas.height);

                let y = (height - offset) / 2;

                let barsize = (width - offset - 2 * margin - 5) / 13;
                const scaleY = d3
                    .scaleLinear()
                    .domain([0, data.histInterval.max])
                    .range([(height - offset) / 2, margin])
                    .nice();
                const scaleY2 = d3
                    .scaleLinear()
                    .domain([0, data.histInterval.max])
                    .range([(height - offset) / 2, height - offset - margin])
                    .nice();

                const scaleX = d3
                    .scaleLinear()
                    .domain([12, 24])
                    .range([offset + margin, width - margin - barsize - 1])
                    .nice();

                const fill = visutil.getColor(
                    data,
                    $currentcolor,
                    $selectedBaseKeys,
                );
                context.fillStyle = fill;
                context.strokeStyle = fill;

                mvlib.Canvas.drawLine(
                    context,
                    scaleX(12),
                    scaleY(0),
                    scaleX(24) + barsize,
                    scaleY(0),
                );
                mvlib.Canvas.drawRoundedRect(
                    context,
                    scaleX(12) - 1,
                    scaleY(data.histInterval.max) - 1,
                    width - offset - 2 * margin,
                    height - offset - 2 * margin,
                    0,
                );
                context.stroke();

                //context.stroke();
                data.histInterval.data.forEach((occ, i) => {
                    if (occ > 0) {
                        const height = scaleY(occ) - y;
                        if (i === 12) {
                            const tx = scaleX(24 - i);
                            const ty = y - height;
                            mvlib.Canvas.drawRoundedRect(
                                context,
                                tx,
                                ty,
                                barsize,
                                height,
                                0,
                            );
                            context.fillStyle = glutil.histogramColorScale(i);
                            //context.strokeStyle = v(colorscale(i))
                            //context.strokeOpacity = 1
                            context.fill();
                            //context.stroke()
                        }
                        const tx = i >= 12 ? scaleX(i) : scaleX(24 - i);
                        const ty = i >= 12 ? y : y - height;
                        mvlib.Canvas.drawRoundedRect(
                            context,
                            tx,
                            ty,
                            barsize,
                            height,
                            0,
                        );
                        context.fillStyle = glutil.histogramColorScale(i);
                        //context.strokeStyle = v(colorscale(i))
                        //context.strokeOpacity = 1
                        context.fill();
                        //context.stroke()
                    }
                });
                context.fillStyle = "black";
                drawAxisHisto(
                    context,
                    "x",
                    height -
                        2 * margin -
                        offset +
                        scaleY(data.histInterval.max) -
                        1,
                    13,
                    scaleX,
                    offset,
                );
                drawAxisHisto(
                    context,
                    "y",
                    height - 2 * margin - offset,
                    data.histInterval.max,
                    scaleY,
                    offset,
                );
                drawAxisHisto(
                    context,
                    "y",
                    height - 2 * margin - offset,
                    data.histInterval.max,
                    scaleY2,
                    offset,
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

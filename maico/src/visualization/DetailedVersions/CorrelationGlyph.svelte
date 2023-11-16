<script>
    // @ts-ignore
    import {
        correlationData,
        models,
        points,
        cluster,
        currentpoints,
        side,
        axisselect,
        brushClusterSwitch,
        clusterdata,
        representatives,
        clusterSelect,
        tooltipSel,
    } from "../../stores/stores.js";
    // @ts-ignore
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import { axisoptionsCor } from "../../stores/globalValues.js";
    import * as mvlib from "musicvis-lib";
    import * as visutil from "../../util/visutil.js";

    export let width = 200,
        height = 200,
        data;

    let canvas, ctx;

    const offset = 100;

    onMount(() => {
        ctx = canvas.getContext("2d");
        drawMatrix();
    });

    $: data, drawMatrix();

    function drawMatrix() {
        if (
            $correlationData !== undefined &&
            $correlationData !== null &&
            canvas !== undefined
        ) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const kw = (width - offset) / (axisoptionsCor.length + 1);
            const kh = (height - offset) / (axisoptionsCor.length + 1);
            const corscale = d3.scaleLinear().domain([-1, 1]).range([1, 0]);
            axisoptionsCor.forEach((data1, j) => {
                axisoptionsCor.forEach((data2, i) => {
                    if (j <= i) {
                        let correlation = visutil.correlationCoefficient(
                            $correlationData[data][i],
                            $correlationData[data][j],
                            $correlationData[data][i].length
                        ); // abhängig von data1, data2 => calc for this model => model.points
                        //if (i === 0) correlation = NaN;
                        // -> calc correlation for j to i (maybe calc all points for each option in advance)
                        ctx.fillStyle = isNaN(correlation)
                            ? visutil.divergingScale(corscale(0))
                            : visutil.divergingScale(corscale(correlation));
                        mvlib.Canvas.drawRoundedRect(
                            ctx,
                            kw / 2 + kw * i + offset,
                            kh / 2 + kh * j + offset,
                            kw,
                            kh,
                            0
                        );
                        mvlib.Canvas.drawRoundedRect(
                            ctx,
                            kw / 2 + kw * j + offset,
                            kh / 2 + kh * i + offset,
                            kw,
                            kh,
                            0
                        );
                        ctx.fill();
                        ctx.fillStyle = "black";
                    }
                });
                ctx.fillText(data1.label, 5, kh + kh * j + offset);
                ctx.fillText(
                    data1.shortLabel.slice(0, 1),
                    kw + kw * j + offset,
                    height - 5
                );
            });
            ctx.fillText("X", width - 20, 20);
        }
    }
</script>

<canvas
    bind:this={canvas}
    {width}
    {height}
    on:click={(e) => tooltipSel.set(null)}
/>

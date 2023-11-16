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

    export let w = 200,
        h = 200,
        index = 0;

    let canvas, ctx;

    onMount(() => {
        ctx = canvas.getContext("2d");
        drawMatrix();
    });

    $: $correlationData, drawMatrix();

    function drawMatrix() {
        if (
            $correlationData !== undefined &&
            $correlationData !== null &&
            canvas !== undefined
        ) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const kw = w / (axisoptionsCor.length + 1);
            const kh = h / (axisoptionsCor.length + 1);
            const corscale = d3.scaleLinear().domain([-1, 1]).range([1, 0]);
            axisoptionsCor.forEach((data1, j) => {
                axisoptionsCor.forEach((data2, i) => {
                    if (j <= i) {
                        let correlation = visutil.correlationCoefficient(
                            $correlationData[index][i],
                            $correlationData[index][j],
                            $correlationData[index][i].length
                        ); // abhängig von data1, data2 => calc for this model => model.points
                        //if (i === 0) correlation = NaN;
                        // -> calc correlation for j to i (maybe calc all points for each option in advance)
                        ctx.fillStyle = isNaN(correlation)
                            ? visutil.divergingScale(0.5)
                            : visutil.divergingScale(corscale(correlation));
                        mvlib.Canvas.drawRoundedRect(
                            ctx,
                            kw / 2 + kw * i,
                            kh / 2 + kh * j,
                            kw,
                            kh,
                            0
                        );
                        mvlib.Canvas.drawRoundedRect(
                            ctx,
                            kw / 2 + kw * j,
                            kh / 2 + kh * i,
                            kw,
                            kh,
                            0
                        );
                        ctx.fill();
                    }
                });
            });
        }
    }
</script>

<canvas
    bind:this={canvas}
    width={w}
    height={h}
    on:click={(e) =>
        $tooltipSel !== null && $tooltipSel.data === index
            ? tooltipSel.set(null)
            : tooltipSel.set({ number: 0, data: index })}
/>

<script>
    import * as gu from "../../util/glyphutil";
    import * as visutil from "../../util/visutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import {
        currentcolor,
        modelpointsavg,
        tooltipSel,
    } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor, drawAxis } from "../../util/visutil";
    import * as d3 from "d3";
    import { keysLookup } from "../../stores/globalValues";

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
                const melody = data.melody;

                const scalex = d3
                    .scaleLinear()
                    .domain([0, melody.totalQuantizedSteps])
                    .range([margin, width])
                    .nice();

                melody.notes.forEach((note, i) => {
                    context.fillStyle = gu.Starglyphcolor(note.pitch % 12);
                    const width =
                        scalex(note.quantizedEndStep) -
                        scalex(note.quantizedStartStep);
                    const tx = scalex(note.quantizedStartStep);
                    const ty = margin + offset;
                    mvlib.Canvas.drawRoundedRect(
                        context,
                        tx,
                        ty,
                        width,
                        height - 2 * margin - ty,
                        4
                    );
                    context.textAlign = "center";
                    context.fillText(
                        keysLookup[note.pitch % 12],
                        tx + width / 2,
                        margin
                    );
                    context.fill();
                });
                context.fillStyle = "black";
                drawAxis(
                    context,
                    "x",
                    height - margin - offset,
                    melody.totalQuantizedSteps,
                    scalex,
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

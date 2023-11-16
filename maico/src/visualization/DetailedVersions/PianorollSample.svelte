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
                const yextent = data.pianoroll.data;
                const scaley = d3
                    .scaleLinear()
                    .domain([yextent[0], yextent[1]])
                    .range([height - margin - offset, margin])
                    .nice();

                const scalex = d3
                    .scaleLinear()
                    .domain([0, melody.totalQuantizedSteps])
                    .range([margin + offset, width])
                    .nice();
                const height1 = scaley(yextent[1] - 1) - scaley(yextent[1]);
                const fill = visutil.getColor(data, $currentcolor);
                context.fillStyle = fill;
                context.strokeStyle = fill;

                context.rect(
                    scalex(0),
                    scaley(yextent[1]),
                    scalex(melody.totalQuantizedSteps) - scalex(0),
                    scaley(yextent[0]) - scaley(yextent[1])
                );

                //context.stroke();
                context.fill();
                context.strokeStyle = fill;
                melody.notes.forEach((note, i) => {
                    const width =
                        scalex(note.quantizedEndStep) -
                        scalex(note.quantizedStartStep);
                    const tx = scalex(note.quantizedStartStep);
                    const ty = scaley(note.pitch) - height1 / 2;
                    mvlib.Canvas.drawRoundedRect(
                        context,
                        tx,
                        ty,
                        width,
                        height1,
                        4
                    );
                    context.fillStyle =
                        gu.getColorLightness(fill) < 50 ? "white" : "black";
                    context.fill();
                });
                context.fillStyle = "black";
                drawAxis(
                    context,
                    "x",
                    scaley(yextent[0]),
                    melody.totalQuantizedSteps,
                    scalex,
                    offset
                );
                drawAxis(
                    context,
                    "y",
                    height - 2 * margin - offset,
                    yextent,
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

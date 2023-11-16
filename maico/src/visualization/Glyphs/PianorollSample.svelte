<script>
    import * as gu from "../../util/glyphutil";
    import * as mu from "../../util/musicutil";
    import * as visutil from "../../util/visutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import {
        currentcolor,
        modelpointsavg,
        primerSelected,
        tooltipSel,
    } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor, drawAxis } from "../../util/visutil";
    import * as d3 from "d3";

    export let width = 0,
        height = 0,
        melody,
        fill;

    let canvas;

    let context;
    const margin = 0;
    const offset = 0;

    onMount(() => {
        context = canvas.getContext("2d");
        render();
    });

    $: melody, render();
    $: $primerSelected, render();

    function render() {
        if (canvas !== undefined) {
            context = canvas.getContext("2d");
            if (
                melody !== undefined &&
                melody !== null &&
                context !== undefined
            ) {
                context.fillStyle = "white";
                context.clearRect(0, 0, canvas.width, canvas.height);
                let yextent = mu.getExtentOfMelody(melody, false);
                yextent = [yextent[0] - 2, yextent[1] + 2];
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
                        1
                    );
                    context.fillStyle =
                        gu.getColorLightness(fill) < 50 ? "white" : "black";
                    context.fill();
                });
            } else {
                context.fillStyle = "white";
                context.clearRect(0, 0, canvas.width, canvas.height);
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

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
    const bars = 40;

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
                const scaleY = d3
                    .scaleLinear()
                    .domain([yextent[0], yextent[1]])
                    .range([height - margin - offset, margin + bars])
                    .nice();

                const scaleX = d3
                    .scaleLinear()
                    .domain([0, melody.totalQuantizedSteps])
                    .range([margin + offset, width])
                    .nice();
                context.fillStyle = "white";
                context.strokeStyle = "grey";
                context.rect(
                    scaleX(0),
                    scaleY(yextent[1]),
                    scaleX(melody.totalQuantizedSteps) - scaleX(0),
                    scaleY(yextent[0]) - scaleY(yextent[1]),
                );
                context.stroke();
                context.fill();
                let voices = 0;
                if (data.isPolymix) {
                    voices += data.polyinfo.combinations.length;
                }
                let h = bars / (voices + 1);
                for (let i = 0; i <= voices; i++) {
                    let color = visutil.modelColor10(i);
                    context.fillStyle = color;
                    context.strokeStyle = color;

                    let notes = data.isPolymix
                        ? data.melody.notes.filter((n1) =>
                              n1?.trackID !== undefined
                                  ? n1.trackID === i
                                  : data?.melody?.indexing !== undefined
                                    ? data?.melody?.indexing[i].id === n1.meloID
                                    : n1.meloID === i,
                          )
                        : data.melody.notes;
                    //context.beginPath();
                    const line = [];
                    notes.forEach((note, j) => {
                        if (j === 0)
                            line.push([
                                scaleX(note.quantizedStartStep),
                                scaleY(note.pitch),
                            ]);
                        else
                            line.push([
                                scaleX(note.quantizedStartStep + 0.25),
                                scaleY(note.pitch),
                            ]);
                        if (j === notes.length - 1)
                            line.push([
                                scaleX(note.quantizedEndStep),
                                scaleY(note.pitch),
                            ]);
                        else
                            line.push([
                                scaleX(note.quantizedEndStep - 0.25),
                                scaleY(note.pitch),
                            ]);
                    });
                    //context.stroke();
                    const curve = d3.curveCatmullRom(context);
                    context.beginPath();
                    curve.lineStart();
                    for (const [x, y] of line) curve.point(x, y);
                    curve.lineEnd();
                    context.stroke();

                    notes.forEach((note, j) => {
                        mvlib.Canvas.drawRoundedRect(
                            context,
                            scaleX(note.quantizedStartStep),
                            margin + h * (voices - i),
                            scaleX(note.quantizedEndStep) -
                                scaleX(note.quantizedStartStep),
                            h,
                            0,
                        );
                        context.fill();
                        context.stroke();
                    });
                    
                }
                drawAxis(
                    context,
                    "x",
                    scaleY(yextent[0]),
                    melody.totalQuantizedSteps,
                    scaleX,
                    offset,
                );
                drawAxis(
                    context,
                    "y",
                    height - 2 * margin - offset,
                    yextent,
                    scaleY,
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

<script>
    import * as gu from "../../util/glyphutil";
    import * as visutil from "../../util/visutil";
    import * as glutil from "../../util/glyphutil";
    import * as mvlib from "musicvis-lib";
    import { onMount } from "svelte";
    import {
        currentcolor,
        modelpointsavg,
        tooltipSel,
    } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor, drawAxis, drawAxisHisto } from "../../util/visutil";
    import * as d3 from "d3";
    import { keysLookup } from "../../stores/globalValues";

    export let width = 0,
        height = 0,
        data,
        model;

    let canvas;

    let dat = [];

    let context;
    const margin = 2;
    const offset = 0;

    onMount(() => {
        context = canvas.getContext("2d");
        render();
    });

    $: data, render();

    function render() {
        if (canvas !== undefined) {
            context = canvas.getContext("2d");
            if (data !== null && context !== undefined) {
                context.fillStyle = "white";
                context.clearRect(0, 0, canvas.width, canvas.height);

                let occ = new Array(24).fill(0);

                dat = data
                    .filter((p) => model?.name === p[2]?.model?.name)
                    .map((d) => d[2]);

                if (dat.length > 0) {
                    dat.forEach((d) => {
                        let index =
                            keysLookup.indexOf(
                                d.additional.key.tonic.toUpperCase()
                            ) + 12;
                        if (d.additional.key.type.includes("minor"))
                            index = index - 12;
                        occ[index]++;
                    });

                    const max = Math.max(1, Math.max(...occ));

                    let y = (height - offset) / 2;

                    let barsize = (width - offset - 2 * margin - 1) / 12;
                    const scaleY = d3
                        .scaleLinear()
                        .domain([0, max])
                        .range([(height - offset) / 2, margin])
                        .nice();
                    const scaleY2 = d3
                        .scaleLinear()
                        .domain([0, max])
                        .range([
                            (height - offset) / 2,
                            height - offset - margin,
                        ])
                        .nice();

                    const scaleX = d3
                        .scaleLinear()
                        .domain([12, 23])
                        .range([offset + margin, width - margin - barsize - 1])
                        .nice();

                    const fill = "black";
                    context.fillStyle = fill;
                    context.strokeStyle = fill;

                    mvlib.Canvas.drawLine(
                        context,
                        scaleX(12),
                        scaleY(0),
                        scaleX(23) + barsize,
                        scaleY(0)
                    );
                    mvlib.Canvas.drawRoundedRect(
                        context,
                        scaleX(12) - 1,
                        scaleY(max) - 1,
                        width - offset - 2 * margin,
                        height - offset - 2 * margin,
                        0
                    );
                    context.stroke();

                    //context.stroke();
                    occ.forEach((occ1, i) => {
                        if (occ1 > 0) {
                            const height = scaleY(occ1) - y;
                            const tx = i >= 12 ? scaleX(i) : scaleX(i + 12);
                            const ty = i >= 12 ? y : y - height;
                            mvlib.Canvas.drawRoundedRect(
                                context,
                                tx,
                                ty,
                                barsize,
                                height,
                                0
                            );
                            context.fillStyle = gu.Starglyphcolor(
                                i >= 12 ? i - 12 : i
                            );
                            //context.strokeStyle = v(colorscale(i))
                            //context.strokeOpacity = 1
                            context.fill();
                            //context.stroke()
                        }
                    });
                    /*
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
                    offset
                );
                drawAxisHisto(
                    context,
                    "y",
                    height - 2 * margin - offset,
                    data.histInterval.max,
                    scaleY,
                    offset
                );
                drawAxisHisto(
                    context,
                    "y",
                    height - 2 * margin - offset,
                    data.histInterval.max,
                    scaleY2,
                    offset
                );
                */
                }
            }
        }
    }
</script>

<canvas
    bind:this={canvas}
    {width}
    {height}
    on:click={(e) =>
        $tooltipSel !== null && $tooltipSel.data === dat
            ? tooltipSel.set(null)
            : tooltipSel.set({ number: 4, data: dat })}
/>

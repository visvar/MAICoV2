<script>
    import * as gu from "../../util/glyphutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import { modelpointsavg, tooltipSel } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor } from "../../util/visutil";

    export let w = 0,
        h = 0,
        model;

    let path = null;

    let canvas;

    let radius = 0;
    let context;

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
                radius = (w - 2) / 2;
                context.clearRect(0, 0, canvas.width, canvas.height);
                const data = $modelpointsavg[model.name][2];
                path = data.starglyph.data;
                const fill = getColor({ model: model }, 0);
                const x = w / 2;
                const y = h / 2;
                const scale = radius / 10;
                // color
                context.fillStyle = fill;
                context.beginPath();
                context.moveTo(x + scale * path[0].x, y + scale * path[0].y);
                for (let i = 1; i < path.length; i++) {
                    context.lineTo(
                        x + scale * path[i].x,
                        y + scale * path[i].y
                    );
                }
                //context.stroke();
                context.fill();
                context.strokeStyle = "#999";
                context.fillStyle = "#999";
                mvlib.Canvas.drawCircle(context, x, y, radius);
                const radmid = radius <= 6 ? 0 : radius <= 9 ? 1 : 2;
                mvlib.Canvas.drawFilledCircle(context, x, y, radmid);
                context.stroke();

                /*
                context.fillStyle = "black";
                const ax = [
                    "numberNotes",
                    "meanLength",
                    "varianceJumps",
                    //"temperature",
                    "similarity",
                ];
                const axShort = ["n", "m", "v", "s"]; // "t",
                context.fillText(
                    axShort[0],
                    x +
                        scale * path[0].x +
                        (path[0].x / Math.abs(path[0].x) - 0.8) * 1.5 * scale,
                    y +
                        scale * path[0].y +
                        (path[0].y / Math.abs(path[0].y) + 0.8) * 1.5 * scale
                );
                for (let i = 1; i < path.length; i++) {
                    context.fillText(
                        axShort[i],
                        x +
                            scale * path[i].x +
                            (path[i].x / Math.abs(path[i].x) - 0.8) *
                                1.5 *
                                scale,
                        y +
                            scale * path[i].y +
                            (path[i].y / Math.abs(path[i].y) + 0.8) *
                                1.5 *
                                scale
                    );
                }
                */
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
            : tooltipSel.set({ number: 2, data: model })}
/>

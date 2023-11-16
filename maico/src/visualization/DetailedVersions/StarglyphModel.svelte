<script>
    import * as gu from "../../util/glyphutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import { modelpointsavg, tooltipSel } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor } from "../../util/visutil";

    export let width = 0,
        height = 0,
        data,
        mode = 0;

    let path = null;

    let canvas;

    const margin = 30;

    let radius = 0;
    let context;

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
                radius = (width - 2 * margin - 2) / 2;
                context.clearRect(0, 0, canvas.width, canvas.height);
                const mod = $modelpointsavg[data.name][2];
                path =
                    mode === 0 ? mod.starglyph.data : mod.starglyphRhythm.data;
                const fill = getColor({ model: data }, 0);
                const x = width / 2;
                const y = height / 2;
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

                context.fillStyle = "black";

                let ax = [
                    [
                        "variance of jumps between notes",
                        width / 2,
                        height - margin / 2,
                    ],
                    ["similarity to primer", 0, height / 2 - margin / 2],
                    ["number of notes", width / 2, margin - 3],
                    //"temperature",
                    ["mean length of notes", 0, -height / 2 + margin / 2],
                ];
                if (mode === 1) {
                    ax = [
                        [
                            "percentage of pauses",
                            width / 2,
                            height - margin / 2,
                        ],
                        ["count rhythmic change", 0, height / 2 - margin / 2],
                        ["number of notes", width / 2, margin - 3],
                        ["count off-beat notes", 0, -height / 2 + margin / 2],
                    ];
                }
                ax.forEach((d, i) => {
                    if (i === 1) {
                        context.save();
                        context.translate(canvas.width / 2, canvas.height / 2);
                        context.rotate(Math.PI / 2);
                        context.textAlign = "center";
                        context.fillText(ax[i][0], ax[i][1], ax[i][2]);
                        context.restore();
                    } else if (i === 3) {
                        context.save();
                        context.translate(canvas.width / 2, canvas.height / 2);
                        context.rotate(Math.PI / 2);
                        context.textAlign = "center";
                        context.fillText(ax[i][0], ax[i][1], ax[i][2]);
                        context.restore();
                    } else {
                        context.textAlign = "center";
                        context.fillText(ax[i][0], ax[i][1], ax[i][2]);
                    }
                });
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

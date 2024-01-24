<script>
    import * as gu from "../../util/glyphutil";
    import * as visutil from "../../util/visutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import {
        currentcolor,
        modelpointsavg,
        selectedBaseKeys,
        tooltipSel,
    } from "../../stores/stores.js";
    import { averageOfGlyphs } from "../../util/glyphutil";
    import { getColor } from "../../util/visutil";

    export let width = 0,
        height = 0,
        data,
        mode;

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
    $: $currentcolor, render();

    function render() {
        if (canvas !== undefined) {
            context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            if (
                $modelpointsavg !== null &&
                $modelpointsavg[data.name] !== null &&
                context !== undefined
            ) {
                radius = (width - 2 * margin - 2) / 2;
                context.clearRect(0, 0, canvas.width, canvas.height);
                console.log(mode, data);
                path =
                    mode === 0
                        ? data.starglyph.data
                        : data.starglyphRhythm.data;
                const fill = visutil.getColor(
                    data,
                    $currentcolor,
                    $selectedBaseKeys,
                );
                const x = width / 2;
                const y = height / 2;
                const scale = radius / 10;
                // color
                context.fillStyle = fill;

                context.beginPath();
                // these values control the width of the flower petal
                const amax = 3 * scale;
                const bmax = 5 * scale;
                const angleStep = 360 / path.length; // TODO: multiply by normalized value to show
                for (let i = 0; i < path.length; i++) {
                    const angle = angleStep * i;
                    let scaled = path[i].value;
                    let a = amax * scaled;
                    let b = bmax * scaled;
                    context.save();
                    context.translate(x, y);
                    context.rotate((angle * Math.PI) / 180);
                    context.translate(-x, -y);
                    context.moveTo(x, y);
                    context.bezierCurveTo(
                        x - a,
                        y - a,
                        x - b,
                        y - radius * scaled,
                        x,
                        y - radius * scaled,
                    );
                    context.bezierCurveTo(
                        x + b,
                        y - radius * scaled,
                        x + a,
                        y - a,
                        x,
                        y,
                    );
                    context.restore();
                }
                context.fill();
                context.strokeStyle = "#999";
                context.fillStyle = "#999";
                mvlib.Canvas.drawCircle(context, x, y, radius);
                const radmid = radius <= 6 ? 0 : radius <= 9 ? 1 : 2;
                mvlib.Canvas.drawFilledCircle(context, x, y, radmid);
                context.stroke();

                context.fillStyle = "black";
                context.font = `20px Verdana`;
                let ax = [
                    [
                        "variance of jumps between notes",
                        width / 2,
                        height - margin / 2 + 3,
                    ],
                    ["distance to primer", 0, height / 2 - margin / 2 + 3],
                    ["number of notes", width / 2, margin - 5],
                    //"temperature",
                    ["mean length of notes", 0, -height / 2 + margin / 2 + 3],
                ];
                if (mode === 1) {
                    ax = [
                        [
                            "percentage of non-silence",
                            width / 2,
                            height - margin / 2 + 3,
                        ],
                        [
                            "count off-beat notes",
                            0,
                            height / 2 - margin / 2 + 3,
                        ],
                        ["number of notes", width / 2, margin - 5],
                        ["rhythmic changes", 0, -height / 2 + margin / 2 + 3],
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

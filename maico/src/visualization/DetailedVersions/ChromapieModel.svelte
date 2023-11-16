<script>
    import * as gu from "../../util/glyphutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import { tooltipSel } from "../../stores/stores";
    import { keysLookup } from "../../stores/globalValues";

    export let width, height, data;

    let lastend = Math.PI * 2 * 0.75;
    let offrotate = Math.PI * 2 * 0.75;
    let length = 0;
    let canvas;

    const margin = 20;

    let radius = 0;
    let context;

    onMount(() => {
        context = canvas.getContext("2d");
        render();
    });

    $: data, render();

    function render() {
        if (
            data !== null &&
            data?.melodies?.length > 0 &&
            context !== undefined
        ) {
            radius = width / 2 - margin;
            context.clearRect(0, 0, canvas.width, canvas.height);
            let flatten = [];
            data.melodies.forEach(
                (mel) => (flatten = flatten.concat(mel.notes))
            );
            let d = gu.calcDataPie({ notes: flatten });
            length = d.length;
            let occ = d.occ;
            if (length > 1)
                for (let i = 0; i < occ.length; i++) {
                    if (occ[i] > 0) {
                        context.fillStyle = gu.Starglyphcolor(i);
                        context.beginPath();
                        context.moveTo(radius + margin, radius + margin);
                        // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
                        context.arc(
                            radius + margin,
                            radius + margin,
                            radius,
                            lastend,
                            (lastend + Math.PI * 2 * (occ[i] / length)) %
                                (Math.PI * 2),
                            false
                        );
                        context.lineTo(radius + margin, radius + margin);
                        context.fill();
                        let x =
                            radius +
                            margin +
                            (radius + margin / 2) *
                                Math.sin(
                                    (lastend -
                                        offrotate +
                                        Math.PI * 2 * (occ[i] / (2 * length))) %
                                        (Math.PI * 2)
                                );
                        let y =
                            radius +
                            margin +
                            (radius + margin / 2) *
                                -Math.cos(
                                    (lastend -
                                        offrotate +
                                        Math.PI * 2 * (occ[i] / (2 * length))) %
                                        (Math.PI * 2)
                                );
                        context.textAlign = "center";

                        context.fillText(keysLookup[i], x, y);
                        lastend =
                            (lastend + Math.PI * 2 * (occ[i] / length)) %
                            (Math.PI * 2);
                    }
                }
            else
                for (let i = 0; i < 2; i++) {
                    context.fillStyle = gu.Starglyphcolor(occ.indexOf(1));
                    context.beginPath();
                    context.moveTo(radius, radius);
                    // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
                    context.arc(
                        radius,
                        radius,
                        radius,
                        0,
                        Math.PI % (Math.PI * 2),
                        false
                    );
                    context.lineTo(radius, radius);
                    context.fill();
                    context.arc(
                        radius,
                        radius,
                        radius,
                        Math.PI,
                        0 % (Math.PI * 2),
                        false
                    );
                    context.lineTo(radius, radius);
                    context.fill();
                    context.fillText(keysLookup[data.indexOf(1)], 5, 5);
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

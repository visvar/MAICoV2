<script>
    import * as gu from "../../util/glyphutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import { tooltipSel } from "../../stores/stores";

    export let w, h, information;

    let lastend = Math.PI * 2 * 0.75;
    let length = 0;
    let canvas;

    let radius = 0;
    let context;

    onMount(() => {
        context = canvas.getContext("2d");
        render();
    });

    $: information, render();

    function render() {
        if (
            information !== null &&
            information?.melodies?.length > 0 &&
            context !== undefined
        ) {
            radius = w / 2;
            context.clearRect(0, 0, canvas.width, canvas.height);
            let flatten = [];
            information.melodies.forEach(
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
                        context.moveTo(radius, radius);
                        // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
                        context.arc(
                            radius,
                            radius,
                            radius,
                            lastend,
                            (lastend + Math.PI * 2 * (occ[i] / length)) %
                                (Math.PI * 2),
                            false
                        );
                        context.lineTo(radius, radius);
                        context.fill();
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
                }
        }
    }
</script>

<canvas
    bind:this={canvas}
    width={w}
    height={h}
    on:click={(e) =>
        $tooltipSel !== null && $tooltipSel.data === information
            ? tooltipSel.set(null)
            : tooltipSel.set({ number: 1, data: information })}
/>

<script>
    import * as gu from "../../util/glyphutil";
    import { onMount } from "svelte";
    import * as mvlib from "musicvis-lib";
    import { tooltipSel } from "../../stores/stores";
    import { keysLookup } from "../../stores/globalValues";
    import { divergingScale } from "../../util/visutil";
    import * as d3 from 'd3'
    // @ts-ignore
    import * as math from "mathjs";

    function Fraction(num) {
        let t = math.fraction(math.number(num));
        return num !== 1 ? math.format(t, { fraction: "ratio" }) : num;
    }

    export let width,
        height,
        data,
        mode = 0;

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
        if (data !== null && context !== undefined) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            let occ =
                mode === 0
                    ? data.chromapie.data.occ
                    : data.rhythm.rhythmDistribution;
            let numNotes =
                mode === 0
                    ? data.chromapie.data.length
                    : data.rhythm.rhythmDistribution.filter((p) => p > 0)
                          .length;
            radius = width / 2 - margin;
            const powscaleshort = d3.scaleLinear().domain([0, 3]).range([1,0.5])
            const powscalelong = d3.scalePow().exponent(0.25).domain([3, 15]).range([0.5,0])
            if (occ.filter((o) => o > 0).length > 1) {
                mode === 1 ? (numNotes = 1) : null;
                for (let i = 0; i < occ.length; i++) {
                    if (occ[i] > 0) {
                        context.fillStyle =
                            mode === 0
                                ? gu.Starglyphcolor(i)
                                : i<=4?divergingScale(powscaleshort(i)):divergingScale(powscalelong(i))//(1 - (i/8));
                        context.beginPath();
                        context.moveTo(radius + margin, radius + margin);
                        // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
                        context.arc(
                            radius + margin,
                            radius + margin,
                            radius,
                            lastend,
                            (lastend + Math.PI * 2 * (occ[i] / numNotes)) %
                                (Math.PI * 2),
                            false
                        );
                        context.lineTo(radius + margin, radius + margin);
                        context.fill();
                        let x =
                            radius +
                            margin +
                            (radius + 5 + margin / 2) *
                                Math.sin(
                                    (lastend -
                                        offrotate +
                                        Math.PI *
                                            2 *
                                            (occ[i] / (2 * numNotes))) %
                                        (Math.PI * 2)
                                );
                        let y =
                            radius +
                            margin +
                            (radius + 5 + margin / 2) *
                                -Math.cos(
                                    (lastend -
                                        offrotate +
                                        Math.PI *
                                            2 *
                                            (occ[i] / (2 * numNotes))) %
                                        (Math.PI * 2)
                                );
                        if (mode === 1) context.fillStyle = "black";
                        context.textAlign = "center";
                        context.textBaseline = "middle";
                        context.font = `15px Verdana`;
                        mode === 0
                            ? context.fillText(keysLookup[i], x, y)
                            : context.fillText(Fraction((i + 1) / 16), x, y);
                        lastend =
                            (lastend + Math.PI * 2 * (occ[i] / numNotes)) %
                            (Math.PI * 2);
                    }
                }
                if (occ.reduce((a, b) => a + b) < 1) {
                    //context.fillStyle = "black";
                    context.beginPath();
                    context.moveTo(radius + margin, radius + margin);
                    context.arc(
                        radius + margin,
                        radius + margin,
                        radius,
                        lastend,
                        Math.PI * 2 * 0.75,
                        false
                    );
                    context.lineTo(radius + margin, radius + margin);
                    context.fill();
                    context.textAlign = "center";
                    context.fillText("Pause", 150, 15);
                    lastend = Math.PI * 2 * 0.75;
                }
            } else {
                for (let i = 0; i < 2; i++) {
                    context.fillStyle =
                        mode === 0
                            ? gu.Starglyphcolor(occ.indexOf(Math.max(...occ)))
                            : divergingScale(
                                  1 - occ.indexOf(Math.max(...occ)) / 8
                              );
                    context.beginPath();
                    context.moveTo(radius + margin, radius + margin);
                    // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
                    context.arc(
                        radius + margin,
                        radius + margin,
                        radius,
                        0,
                        Math.PI % (Math.PI * 2),
                        false
                    );
                    context.lineTo(radius + margin, radius + margin);
                    context.fill();
                    context.arc(
                        radius + margin,
                        radius + margin,
                        radius,
                        Math.PI,
                        0 % (Math.PI * 2),
                        false
                    );
                    context.lineTo(radius + margin, radius + margin);
                    context.fill();
                    if (mode === 1) context.fillStyle = "black";
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.font = `20px Verdana`;
                    mode === 0
                        ? context.fillText(
                              keysLookup[occ.indexOf(Math.max(...occ))],
                              30,
                              30
                          )
                        : context.fillText(
                              Fraction(occ.indexOf(Math.max(...occ)) + 1 / 16),
                              30,
                              30
                          );
                }
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

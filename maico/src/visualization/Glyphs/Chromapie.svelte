<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";
    import * as gu from "../../util/glyphutil";

    export let x = 0,
        y = 0,
        r = 10,
        information,
        opacity = 1;

    let lastend = Math.PI * 2 * 0.75;
    let numNotes = 0;

    $: render = ({ context }) => {
        context.globalAlpha = opacity;
        let data = information.chromapie.data.occ;
        numNotes = information.chromapie.data.length;
        const scale = 1; //r/10
        if (data.filter((o) => o > 0).length > 1)
            for (let i = 0; i < data.length; i++) {
                context.fillStyle = gu.Starglyphcolor(i);
                context.beginPath();
                context.moveTo(x, y);
                // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
                context.arc(
                    x,
                    y,
                    r * scale,
                    lastend,
                    (lastend + Math.PI * 2 * (data[i] / numNotes)) %
                        (Math.PI * 2),
                    false
                );
                context.lineTo(x, y);
                context.fill();
                lastend =
                    (lastend + Math.PI * 2 * (data[i] / numNotes)) %
                    (Math.PI * 2);
            }
        else
            for (let i = 0; i < 2; i++) {
                context.fillStyle = gu.Starglyphcolor(
                    data.indexOf(Math.max(...data))
                );
                context.beginPath();
                context.moveTo(x, y);
                // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
                context.arc(x, y, r * scale, 0, Math.PI % (Math.PI * 2), false);
                context.lineTo(x, y);
                context.fill();
                context.arc(x, y, r * scale, Math.PI, 0 % (Math.PI * 2), false);
                context.lineTo(x, y);
                context.fill();
            }
    };
</script>

<Layer {render} />

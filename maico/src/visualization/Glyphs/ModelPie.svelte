<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";
    import * as gu from "../../util/glyphutil";
    import { getColor } from "../../util/visutil";

    export let x = 0,
        y = 0,
        r = 10,
        information;

    let lastend = Math.PI * 2 * 0.75;
    let numNotes = 0;

    $: render = ({ context }) => {
        let data = information.modelpie.occ;
        let modelnames = information.modelpie.modelnames;
        numNotes = information.modelpie.length;
        const scale = 1; //r/10
        if (
            information.chromapie.data.length > 1 &&
            Math.max(...data) !== numNotes
        )
            for (let i = 0; i < data.length; i++) {
                context.fillStyle = getColor(
                    { model: { name: modelnames[i] } },
                    0
                );
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
                const index = data.indexOf(Math.max(...data));
                context.fillStyle = getColor(
                    { model: { name: modelnames[index] } },
                    0
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

<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";
    import * as gu from "../../util/glyphutil";
    import * as mvlib from "musicvis-lib";

    export let x = 0,
        y = 0,
        r = 10,
        information,
        opacity;

    let lastend = Math.PI * 2 * 0.75;
    let numNotes = 0;

    function rearrarcheFor5Circle(data, major) {
        let temp = new Array(data.length);
        let index = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
        if (!major) index = [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2];

        data.forEach((d, i) => {
            temp[index[i]] = d;
        });

        return [temp, index];
    }

    $: render = ({ context }) => {
        context.globalAlpha = opacity;
        let data = information.chromapie.data.occ;
        let temp = rearrarcheFor5Circle(data, information.chromapie.major);
        data = temp[0];
        const index = temp[1];
        numNotes = information.chromapie.data.length;
        const scale = 1; //r/10
        if (information.chromapie.data.length > 1)
            for (let i = 0; i < data.length; i++) {
                context.fillStyle = gu.Starglyphcolor(index[i]);
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
                context.fillStyle = gu.Starglyphcolor(data.indexOf(1));
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
        if (information.chromapie.major === null) {
            context.strokeStyle = "grey";
            context.fillStyle = "grey";
        } else {
            context.strokeStyle = information.chromapie.major
                ? "white"
                : "black";
            context.fillStyle = information.chromapie.major ? "white" : "black";
        }
        const radmid = r <= 6 ? 0 : r <= 9 ? 1 : 2;
        mvlib.Canvas.drawFilledCircle(context, x, y, radmid);
    };
</script>

<Layer {render} />

<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";
    import * as gu from "../../util/glyphutil";
    import { divergingScale } from "../../util/visutil";
    import * as d3 from 'd3'

    export let x = 0,
        y = 0,
        r = 10,
        information;

    $: render = ({ context }) => {
        const scale = 1; //r/10
        // Red = 1 = short notes to 0 Blue = long notes
        context.fillStyle = divergingScale(information.melody.notes.length / 16)
        context.beginPath();
        context.moveTo(x, y);
        // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
        context.arc(
            x,
            y,
            r * scale,
            Math.PI * 0.5, // Math.PI * 2 * 0.75
            // angle = AnteilAnMelodie * 360
            // radian = angle * PI / 180
            Math.PI * 1.5,
            false
            );
        context.lineTo(x, y);
        context.fill();
        // complexity
        let c = d3.hsl(0, 0, 0.5)
        c.l = 1 - information.rhythm.complexity
        context.fillStyle = c.toString()
        context.beginPath();
        context.moveTo(x, y);
        context.arc(
            x,
            y,
            r * scale,
            Math.PI * 1.5,
            Math.PI * 2.5,
            false
        );
        context.lineTo(x, y);
        context.fill();
    };
</script>

<Layer {render} />

<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";

    // @ts-ignore
    import * as mvlib from "musicvis-lib";
    import * as d3 from "d3";
    import * as muutil from "../../util/musicutil.js";
    import * as glutil from "../../util/glyphutil.js";

    export let x = 0,
        y = 0,
        r = 10,
        fill = "red",
        information,
        opacity = 1;

    $: scaleY = d3
        .scaleLinear()
        .domain(information.pianoroll.data)
        .range([y + r, y - r])
        .nice();
    $: scaleX = d3
        .scaleLinear()
        .domain([0, information.melody.totalQuantizedSteps])
        .range([x - r, x + r])
        .nice();
    $: height =
        scaleY(information.pianoroll.data[0] + 1) -
        scaleY(information.pianoroll.data[0]);

    $: render = ({ context }) => {
        context.globalAlpha = opacity;
        const scale = r / 10;
        context.fillStyle = fill;
        context.strokeStyle = fill;
        mvlib.Canvas.drawRoundedRect(
            context,
            scaleX(0) - 1,
            scaleY(information.pianoroll.data[1]) - 1,
            r * 2 + 2,
            r * 2 + 2,
            0
        );
        context.stroke();
        context.fill();
        context.fillStyle =
            glutil.getColorLightness(fill) < 50 ? "white" : "black";
        information.melody.notes.forEach((note) => {
            const width =
                scaleX(note.quantizedEndStep) - scaleX(note.quantizedStartStep);
            const tx = scaleX(note.quantizedStartStep);
            const ty = scaleY(note.pitch);
            mvlib.Canvas.drawRoundedRect(context, tx, ty, width, height, 0);
            context.fill();
        });
    };
</script>

<Layer {render} />

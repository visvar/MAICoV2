<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";
    import * as tonal from "tonal";

    // @ts-ignore
    import * as mvlib from "musicvis-lib";
    import * as d3 from "d3";
    import * as muutil from "../../util/musicutil.js";
    import * as glutil from "../../util/glyphutil.js";
    import * as vutil from "../../util/visutil";
    import { getScaleofMelody, getKeyfromScale } from "../../util/musicutil";
    import { getMaxOcc } from "../../util/glyphutil";

    export let x = 0,
        y = 0,
        r = 10,
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
        context.fillStyle = "white";
        context.strokeStyle = "white";
        mvlib.Canvas.drawRoundedRect(
            context,
            scaleX(0) - 1,
            scaleY(information.pianoroll.data[1]) - 1,
            r * 2 + 1,
            r * 2 + 1,
            0
        );
        context.stroke();
        context.fill();
        information.melody.notes.forEach((note) => {
            context.fillStyle = glutil.colormap12[note.pitch % 12];
            const width =
                scaleX(note.quantizedEndStep) - scaleX(note.quantizedStartStep);
            const tx = scaleX(note.quantizedStartStep);
            mvlib.Canvas.drawRoundedRect(
                context,
                tx,
                scaleY(information.pianoroll.data[1]) - 1,
                width,
                r * 2 + 1,
                0
            );
            context.fill();
        });
    };
</script>

<Layer {render} />

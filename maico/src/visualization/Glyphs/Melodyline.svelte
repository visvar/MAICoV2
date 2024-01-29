<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";

    // @ts-ignore
    import * as mvlib from "musicvis-lib";
    import * as d3 from "d3";
    import * as muutil from "../../util/musicutil.js";
    import * as glutil from "../../util/glyphutil.js";
    import { modelColor10, melodyColor } from "../../util/visutil.js";

    export let x = 0,
        y = 0,
        r = 10,
        information,
        opacity = 1;

    $: scaleY = d3
        .scaleLinear()
        .domain(information.pianoroll.data)
        .range([y + r, y - r / 2])
        .nice();
    $: scaleX = d3
        .scaleLinear()
        .domain([0, information.melody.totalQuantizedSteps])
        .range([x - r, x + r])
        .nice();

    $: render = ({ context }) => {
        context.globalAlpha = opacity;
        context.fillStyle = "white";
        context.strokeStyle = "grey";
        mvlib.Canvas.drawRoundedRect(
            context,
            scaleX(0) - 1,
            scaleY(information.pianoroll.data[1]) - 1,
            r * 2 + 2,
            r * 2 + 2,
            0,
        );
        context.stroke();
        context.fill();
        let voices = 0;
        if (information.isPolymix) {
            voices += information.polyinfo.combinations.length;
        }
        let height = r / 2 / (voices + 1);
        for (let i = 0; i <= voices; i++) {
            let color = modelColor10(i);
            context.fillStyle = color;
            context.strokeStyle = color;
            let notes = information.isPolymix
                ? information.melody.notes.filter((n1) =>
                    n1?.trackID !== undefined?n1.trackID === i:
                      information?.melody?.indexing !== undefined
                          ? information?.melody?.indexing[i].id === n1.meloID
                          : n1.meloID === i,
                  )
                : information.melody.notes;
            const line = [];
            notes.forEach((note, j) => {
                /*
                if(j === 0)
                    context.moveTo(scaleX(note.quantizedStartStep), scaleY(note.pitch));
                else
                    context.lineTo(scaleX(note.quantizedStartStep), scaleY(note.pitch));
                context.lineTo(scaleX(note.quantizedEndStep), scaleY(note.pitch));

                context.stroke(); 
                */
                if (j === 0)
                    line.push([
                        scaleX(note.quantizedStartStep),
                        scaleY(note.pitch),
                    ]);
                else
                    line.push([
                        scaleX(note.quantizedStartStep + 0.25),
                        scaleY(note.pitch),
                    ]);
                if (j === notes.length - 1)
                    line.push([
                        scaleX(note.quantizedEndStep),
                        scaleY(note.pitch),
                    ]);
                else
                    line.push([
                        scaleX(note.quantizedEndStep - 0.25),
                        scaleY(note.pitch),
                    ]);
            });
            //context.stroke();
            const curve = d3.curveCatmullRom(context);
            context.beginPath();
            curve.lineStart();
            for (const [x, y] of line) curve.point(x, y);
            curve.lineEnd();
            context.stroke();
            notes.forEach((note, j) => {
                mvlib.Canvas.drawRoundedRect(
                    context,
                    scaleX(note.quantizedStartStep),
                    y - r - 2 + height * (voices - i),
                    scaleX(note.quantizedEndStep) -
                        scaleX(note.quantizedStartStep),
                    height,
                    0,
                );
                context.fill();
                context.stroke();
            });
        }
    };
</script>

<Layer {render} />

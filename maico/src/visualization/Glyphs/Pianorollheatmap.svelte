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
        information;

    $: scaley = d3
        .scaleLinear()
        .domain(information.pianoroll.yextent)
        .range([y + r, y - r])
        .nice();
    $: scalex = d3
        .scaleLinear()
        .domain(information.pianoroll.xextent)
        .range([x - r, x + r])
        .nice();
    $: height =
        scaley(information.pianoroll.yextent[1] - 1) -
        scaley(information.pianoroll.yextent[1]);
    $: s = d3
        .scaleLinear()
        .domain([0, information.pianoroll.maxocc])
        .range([0, (height * 0.95) / 2]);

    $: render = ({ context }) => {
        const scale = r / 10;

        context.fillStyle = fill;
        context.strokeStyle = fill;
        mvlib.Canvas.drawRoundedRect(
            context,
            scalex(0) - 1,
            scaley(
                information.pianoroll.data[
                    information.pianoroll.data.length - 1
                ][0].pitch
            ) - 1,
            r * 2 + 1,
            r * 2 + 1,
            0
        );
        context.stroke();
        context.fill();

        let area = d3
            .area()
            .y0(function (d) {
                return scaley(d.pitch) - s(d.occ);
            })
            .y1(function (d) {
                return scaley(d.pitch) + s(d.occ);
            })
            .x(function (d) {
                return scalex(d.start);
            })
            .curve(d3.curveMonotoneX)
            .context(context);

        information.pianoroll.data.forEach((a, i) => {
            context.beginPath();
            if (area !== null) area(a);
            context.fillStyle =
                glutil.getColorLightness(fill) < 50 ? "white" : "black";
            context.fill();
        });
    };
</script>

<Layer {render} />

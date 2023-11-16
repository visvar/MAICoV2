<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";
    import * as glutil from "../../util/glyphutil.js";
    import { axisselect, brushselection } from "../../stores/stores.js";
    import * as mvlib from "musicvis-lib";

    export let x = 0,
        y = 0,
        fill = "#333",
        r = 20,
        blur = 10,
        round = true;

    const radius = spring(r, { stiffness: 0.15, damping: 0.3 });

    $: radius.set(r);

    $: render = ({ context }) => {
        context.fillStyle = "white";
        context.strokeWidth = 0.1;
        context.shadowBlur = blur;
        context.shadowColor = fill;
        context.beginPath();
        if (round) context.arc(x, y, $radius, 0, 2 * Math.PI);
        else
            mvlib.Canvas.drawRoundedRect(
                context,
                x - $radius,
                y - $radius,
                2 * $radius,
                2 * $radius,
                0
            );
        context.fill();
        context.shadowBlur = 0;
        context.shadowColor = "none";
    };
</script>

<Layer {render} />

<script>
    import { Layer } from "svelte-canvas";

    export let x = 0,
        y = 0,
        mode = "";

    let lastend = Math.PI * 2 * 0.75;
    let numNotes = 0;

    $: render = ({ context }) => {
        if (mode === "eye") {
            const width = context.measureText("👁️");
            context.fillText("👁️", x - width.width / 2, y);
        } else if (mode === "ear") {
            const width = context.measureText("👂");
            context.fillText("👂", x - width.width / 2, y);
        } else if (mode === "thumbsup") {
            const width = context.measureText("👍");
            context.fillText("👍", x - width.width / 2, y);
        } else if (mode === "thumbsdown") {
            const width = context.measureText("👎");
            context.fillText("👎", x - width.width / 2, y);
        }
    };
</script>

<Layer {render} />

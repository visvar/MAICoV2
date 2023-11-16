<script>
    import { Layer } from "svelte-canvas";
    import { spring } from "svelte/motion";
    import * as gu from "../../util/glyphutil";
    import { divergingScale } from "../../util/visutil";
    import * as d3 from 'd3';

    export let x = 0,
        y = 0,
        r = 10,
        information;

    let lastend = 0;


    $: render = ({ context }) => {
        // note coloring starts at the top (north)
        lastend =  Math.PI * 1.5
        const scale = 1; //r/10
        const powscaleshort = d3.scaleLinear().domain([0, 3]).range([1,0.5])
        const powscalelong = d3.scalePow().exponent(0.25).domain([4, 16]).range([0.5,0])
        for(let i = 0; i<information.rhythm.rhythmDistribution.length; i++){
            if(information.rhythm.rhythmDistribution[i] > 0){
                // Red = 1 = short notes to 0 Blue = long notes
                context.fillStyle = i<=4?divergingScale(powscaleshort(i)):divergingScale(powscalelong(i))//(1 - (i/8))
                context.beginPath();
                context.moveTo(x, y);
                // Arc Parameters: x, y, radius, startingAngle (radians), endingAngle (radians), antiClockwise (boolean)
                context.arc(
                    x,
                    y,
                    r * scale,
                    lastend,
                    // angle = AnteilAnMelodie * 360
                    // radian = angle * PI / 180
                   lastend + (information.rhythm.rhythmDistribution[i] * Math.PI * 2),
                    false
                );
                context.lineTo(x, y);
                context.fill();
                lastend = lastend + (information.rhythm.rhythmDistribution[i] * Math.PI * 2);
            }
        };
        if(lastend< 3.5 * Math.PI){
            context.fillStyle = "#000000"
                context.beginPath();
                context.moveTo(x, y);
                context.arc(
                    x,
                    y,
                    r * scale,
                    lastend,
                   Math.PI * 3.5,
                    false
                );
                context.lineTo(x, y);
                context.fill();
        }
    };
</script>

<Layer {render} />

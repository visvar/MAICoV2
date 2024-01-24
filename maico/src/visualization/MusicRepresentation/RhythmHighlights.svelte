<script>
    import * as d3 from "d3";
    import * as muutil from "../../util/musicutil.js";
    import * as visutil from "../../util/visutil.js";
    import { onMount } from "svelte";
    import {
        currentcolor,
        colors,
        selectedBaseKeys,
    } from "../../stores/stores.js";
    import * as glutil from "../../util/glyphutil.js";

    const margin = { top: 5, right: 10, bottom: 10, left: 25 };

    export let melody, h, w, index, length;

    let svg;

    $: height =
        length > 4
            ? Math.min(480, (h - 2 * margin.top - margin.bottom) / 4)
            : Math.min(480, (h - 2 * margin.top - margin.bottom) / length);
    let width = w;

    let fill = "black";

    $: x = d3
        .scaleLinear()
        .domain([0, melody.melody.totalQuantizedSteps])
        .range([margin.left, w - margin.right]);

    $: extend = [0, 50];
    $: y = d3
        .scaleLinear()
        .domain(extend)
        .range([height - margin.bottom, margin.top]);

    onMount(() => {
        // create the main SVG element
        svg = d3.select("#svgRhythm" + index).style("fill", "darkgrey");

        fill = visutil.getColor(melody, $currentcolor, $selectedBaseKeys);

        drawRhythmHighlights();
    });

    $: melody, drawRhythmHighlights();
    $: $currentcolor, changeColor();

    function changeColor() {
        if (svg !== undefined) {
            console.log(melody);
            svg.selectAll("rect").attr(
                "fill",
                visutil.getColor(melody, $currentcolor, $selectedBaseKeys),
            );
        }
    }

    function drawRhythmHighlights() {
        if (svg !== undefined) {
            svg.selectAll("*").remove();

            fill = visutil.getColor(melody, $currentcolor, $selectedBaseKeys);

            function yAxis(g) {
                g.attr("transform", `translate(${margin.left},${0})`).call(
                    d3
                        .axisLeft(y)
                        .ticks(extend[1] - extend[0])
                        .tickFormat((t) => {
                            if (t % 25 === 0) {
                                return t;
                            }
                        })
                        .tickSize(1),
                );
            }

            svg.append("g").call(yAxis);

            svg.append("g")
                .selectAll("rect")
                .data(melody.rhythm.beatComplexity)
                .enter()
                .append("rect")
                .attr("transform", `translate(0,0)`)
                // .attr('stroke-width', 0.9 / h)
                .attr("stroke-width", 1) // .attr('stroke', 'black')
                .attr("height", (d) => y(0) - y(Math.min(d, 50)))
                .attr("width", x(4) - x(0) - 2)
                .attr("x", (d, i) => x(i * 4) + 1)
                .attr("y", (d) => y(Math.min(d, 50)))
                .attr("fill", fill)
                .attr("rx", 3)
                .attr("opacity", 0.7);
        }
    }
</script>

<svg id={"svgRhythm" + index} {width} {height}></svg>

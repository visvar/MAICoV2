<script>
    // @ts-nocheck

    import * as d3 from "d3";
    // @ts-ignore
    import * as muutil from "../../util/musicutil.js";
    import * as visutil from "../../util/visutil.js";
    import { onMount } from "svelte";
    import {
        currentcolor,
        colors,
        rate,
        filterextents,
        importedSession,
    } from "../../stores/stores.js";
    import { keysLookup, oktaveLookup } from "../../stores/globalValues.js";
    import * as glutil from "../../util/glyphutil.js";

    const margin = { top: 20, right: 10, bottom: 20, left: 25 };

    export let h,
        w,
        length = 32,
        extent = [35, 106],
        filtervalues = $filterextents;

    let svg;

    let height = h;
    let width = w;

    let drawupper = true;

    let filtertemp = [];

    $: x = d3
        .scaleLinear()
        .domain([0, length])
        .range([margin.left, w - margin.right]);

    $: notewidth = x(1) - x(0);

    $: y = d3
        .scaleLinear()
        .domain(extent)
        .range([height - margin.bottom, margin.top]);

    $: length, init();

    onMount(() => {
        init();
    });

    importedSession.subscribe((v) => {
        if (v !== 0) init2();
    });

    function init2() {
        // create the main SVG element
        svg = d3.select("#svgFilter").style("fill", "grey");
        for (let i = 0; i <= length; i++) {
            filtertemp[i] = [extent[0], extent[1]];
        }
        for (let i = 0; i < $filterextents.length; i++) {
            filtertemp[i] = [$filterextents[i][0], $filterextents[i][1]];
        }
        drawPianoRoll();
    }

    function init() {
        // create the main SVG element
        svg = d3.select("#svgFilter").style("fill", "grey");
        for (let i = 0; i <= length; i++) {
            filtertemp[i] = [extent[0], extent[1]];
        }
        for (let i = 0; i < filtervalues.length; i++) {
            filtertemp[i] = [filtervalues[i][0], filtervalues[i][1]];
        }
        drawPianoRoll();
    }

    function drawPianoRoll() {
        if (
            svg !== undefined &&
            filtervalues !== undefined &&
            filtervalues.length > 0
        ) {
            svg.selectAll("*").remove();

            svg.call(
                d3
                    .drag()
                    .on("start", (d, i) => svgdragstart(d, i, svg))
                    .on("drag", (d, i) => svgdrag(d, i, svg))
                    .on("end", (d, i) => svgdragend(d, i, svg))
            );

            let noteheight = y(extent[0]) - y(extent[0] + 1);

            const xticks = [];
            for (let t = 0; t <= length; t++) {
                if (t % 16 === 0) {
                    xticks.push(t);
                }
            }

            function xAxis(g) {
                g.attr("transform", `translate(${0},${margin.top})`).call(
                    d3
                        .axisTop(x)
                        .tickValues(xticks)
                        .tickSize(-height + margin.bottom + margin.top)
                        .tickFormat((t) => {
                            return Math.round(t / 16);
                        })
                );
            }

            function yAxis(g) {
                g.attr("transform", `translate(${margin.left},${0})`)
                    .style("font", "11px times")
                    .call(
                        d3
                            .axisLeft(y)
                            .ticks(extent[1] - extent[0])
                            .tickFormat((t) => {
                                if (
                                    t % 12 === 0 ||
                                    t % 12 === 4 ||
                                    t % 12 === 7
                                ) {
                                    return oktaveLookup[t].label;
                                }
                            })
                            .tickSize(2)
                    );
            }

            svg.append("g")
                .call(xAxis)
                .call((g) => {
                    g.selectAll("line")
                        .attr("opacity", 0.1)
                        .attr("stroke", "#111");
                });
            svg.append("g").call(yAxis);

            let filtg = svg.append("g");

            /*
            makeSlider(
                svg,
                margin.left,
                height - margin.bottom + 5,
                width - margin.left - margin.right,
                height - 5
            );
            makeSlider(svg, 5, margin.top, 15, height - margin.bottom);
            */

            for (let i = 0; i < length; i++) {
                filtg
                    .append("circle")
                    .attr("id", "upper" + i)
                    .attr("cx", x(i))
                    .attr("cy", y(filtertemp[i][1]))
                    .attr("r", Math.max(1, notewidth / 3))
                    .attr("fill", "red")
                    .attr("opacity", 0.3);

                filtg
                    .append("circle")
                    .attr("id", "lower" + i)
                    .attr("cx", x(i))
                    .attr("cy", y(filtertemp[i][0]))
                    .attr("r", Math.max(1, notewidth / 3))
                    .attr("fill", "blue")
                    .attr("opacity", 0.3);
            }
        }
    }
    //code for svg slider? maybe slider defined in function for recusive. do extent for each step

    function svgdragstart(d, i, svg) {
        svgdrag(d, i, svg);
    }

    function svgdrag(d, i, svg) {
        drawupper = d.sourceEvent.altKey ? false : true;
        let val = [
            Math.round(x.invert(d.sourceEvent.offsetX)), //+ notewidth / 2,
            Math.max(
                extent[0],
                Math.min(extent[1], Math.round(y.invert(d.sourceEvent.offsetY)))
            ),
        ];
        // check for lower or upper
        // check if under or above the other
        // if good -> set value of that point.
        if (val[0] < filtertemp.length && val[0] >= 0) {
            if (drawupper) {
                if (filtertemp[val[0]][0] < val[1]) {
                    svg.select("#upper" + val[0]).attr("cy", y(val[1]));
                    filtertemp[val[0]][1] = val[1];
                } else if (val[1] > extent[0]) {
                    svg.select("#upper" + val[0]).attr("cy", y(val[1]));
                    svg.select("#lower" + val[0]).attr("cy", y(val[1] - 1));
                    filtertemp[val[0]][1] = val[1];
                    filtertemp[val[0]][0] = val[1] - 1;
                }
            } else {
                if (filtertemp[val[0]][1] > val[1]) {
                    svg.select("#lower" + val[0]).attr("cy", y(val[1]));
                    filtertemp[val[0]][0] = val[1];
                } else if (val[1] < extent[1]) {
                    svg.select("#lower" + val[0]).attr("cy", y(val[1]));
                    svg.select("#upper" + val[0]).attr("cy", y(val[1] + 1));
                    filtertemp[val[0]][0] = val[1];
                    filtertemp[val[0]][1] = val[1] + 1;
                }
            }
        }
    }
    function svgdragend(d, i, svg) {
        filtertemp.forEach((v, index) => {
            svg.select("#lower" + index).attr("cy", y(v[0]));
            svg.select("#upper" + index).attr("cy", y(v[1]));
        });
        filterextents.set(filtertemp);
    }
</script>

<svg id={"svgFilter"} class={"context"} {width} {height} />

<style>
    .context {
        cursor: pointer;
    }
</style>

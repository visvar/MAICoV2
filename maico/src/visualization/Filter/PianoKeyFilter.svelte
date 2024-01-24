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
        selectedKeys,
        selectedBaseKeys,
        importedSession,
    } from "../../stores/stores.js";
    import { keysLookup } from "../../stores/globalValues.js";
    import * as glutil from "../../util/glyphutil.js";

    const margin = { top: 20, right: 10, bottom: 20, left: 25 };

    export let h, w;

    let svg;

    let height = h;
    let width = w;

    $: x = d3
        .scaleLinear()
        .domain([0, 12])
        .range([margin.left, w - margin.right]);

    $: y = d3
        .scaleLinear()
        .domain([0, 1, 2])
        .range([
            height - margin.bottom,
            (height - margin.bottom) * 0.8,
            margin.top,
        ]);

    onMount(() => {
        // create the main SVG element
        svg = d3.select("#svgKeyFilter").style("fill", "grey");

        drawPianoRoll();
    });

    importedSession.subscribe((v) => {
        if (v !== 0) drawPianoRoll();
    });

    function drawPianoRoll() {
        if (svg !== undefined) {
            svg.selectAll("*").remove();

            svg.append("g")
                .selectAll("rect")
                .data(keysLookup)
                .enter()
                .append("rect")
                .attr("id", (k, i) =>
                    k.includes("#") ? "idKey" + k[0] + "s" : "idKey" + k
                )
                .attr("x", (k, i) => x(i))
                .attr("y", (k, i) => y(2))
                .attr("rx", 1)
                .attr("ry", 1)
                .attr("height", (k, i) =>
                    k.includes("#") ? y(1) - y(2) : y(0) - y(2)
                )
                .attr("width", x(1) - x(0))
                .attr("fill", (k, i) => {
                    if ($selectedKeys[keysLookup.indexOf(k)]) {
                        if ($selectedBaseKeys === keysLookup.indexOf(k))
                            return "orange";
                        return k.includes("#") ? "darkblue" : "lightblue";
                    } else {
                        return k.includes("#") ? "black" : "lightgrey";
                    }
                })
                .attr("opacity", 0.7)
                .on("click", (d, k, i) => {
                    $selectedKeys[keysLookup.indexOf(k)] =
                        !$selectedKeys[keysLookup.indexOf(k)];
                    let selector = k.includes("#")
                        ? "#idKey" + k[0] + "s"
                        : "#idKey" + k;
                    if ($selectedBaseKeys === keysLookup.indexOf(k))
                        $selectedBaseKeys = -1;
                    svg.select(selector).attr("fill", () => {
                        if ($selectedKeys[keysLookup.indexOf(k)]) {
                            return k.includes("#") ? "darkblue" : "lightblue";
                        } else {
                            return k.includes("#") ? "black" : "lightgrey";
                        }
                    });
                })
                .on("contextmenu", (d, k, i) => {
                    d.preventDefault();
                    
                    const old = $selectedBaseKeys;
                    $selectedBaseKeys =
                        $selectedBaseKeys === keysLookup.indexOf(k)
                            ? -1
                            : keysLookup.indexOf(k);
                    let selector = k.includes("#")
                        ? "#idKey" + k[0] + "s"
                        : "#idKey" + k;
                    svg.select(selector).attr("fill", () => {
                        if ($selectedBaseKeys === keysLookup.indexOf(k)) {
                            return "orange";
                        } else {
                            return k.includes("#")
                                ? "darkblue"
                                : "lightblue";
                        }
                    });
                    if (old !== -1) {
                        selector = keysLookup[old].includes("#")
                            ? "#idKey" + keysLookup[old][0] + "s"
                            : "#idKey" + keysLookup[old];

                        svg.select(selector).attr("fill", () => {
                            return $selectedKeys[old] ? keysLookup[old].includes("#")
                                ? "darkblue"
                                : "lightblue" : keysLookup[old].includes("#") ? "black" : "lightgrey";
                        });
                    }
                    
                });
            svg.append("g")
                .selectAll("text")
                .data(keysLookup)
                .enter()
                .append("text")
                .attr("x", (k, i) => x(i + 0.5))
                .attr("y", (k, i) => y(2))
                .attr("dy", "-.25em")
                .style("font", "11px times")
                .style("text-anchor", "middle")
                .text((k, i) => k);
        }
    }
</script>

<svg id={"svgKeyFilter"} class={"context"} {width} {height} />

<style>
    .context {
        cursor: pointer;
    }
</style>

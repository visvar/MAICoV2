<script>
    import {
        // @ts-ignore
        vorcolorselect,
        // @ts-ignore
        clusterdata,
        // @ts-ignore
        currentcolor,
        currentpoints,
        // @ts-ignore
        glyphselect,
        axisselect,
        points,
        side,
        // @ts-ignore
        brushselection,
        // @ts-ignore
        meloselected,
        // @ts-ignore
        representatives,
        // @ts-ignore
        brushClusterSwitch,
        // @ts-ignore
        clipPadding,
        // @ts-ignore
        repSwitch,
        // @ts-ignore
        seen,
        // @ts-ignore
        rate,
        // @ts-ignore
        selectedBaseKeys,
        // @ts-ignore
        exclude,
        hilbert,
    } from "../stores/stores.js";
    // @ts-ignore
    import { get } from "svelte/store";

    // @ts-ignore
    import { Canvas } from "svelte-canvas";
    // @ts-ignore
    import { extent } from "d3-array";
    // @ts-ignore
    import { scaleLinear } from "d3-scale";
    // @ts-ignore
    import { voronoi } from "d3-voronoi";

    import * as visutil from "../util/visutil.js";
    import { ForceEdgeBundling } from "./util/ForceEdgeBundling.js";
    // @ts-ignore
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import { all, forEach } from "mathjs";

    export let opacity = 0.2;

    const margin = { top: 25, right: 25, bottom: 25, left: 25 };

    let svg;

    $: x =
        $points !== undefined
            ? scaleLinear()
                  .domain(
                      visutil.makeextentBigger(
                          extent(
                              $points.map(
                                  // @ts-ignore
                                  (value) => value[0][$axisselect[0].value],
                              ),
                          ),
                      ),
                  )
                  .range([margin.left, $side - margin.right])
                  .nice()
            : scaleLinear()
                  .domain([-1, 1])
                  .range([margin.left, $side - margin.right])
                  .nice();

    $: y =
        $points !== undefined
            ? scaleLinear()
                  .domain(
                      visutil.makeextentBigger(
                          extent(
                              $points.map(
                                  // @ts-ignore
                                  (value) => value[1][$axisselect[1].value],
                              ),
                          ),
                      ),
                  )
                  .range([$side - margin.bottom, margin.top])
                  .nice()
            : scaleLinear()
                  .domain([-1, 1])
                  .range([$side - margin.bottom, margin.top])
                  .nice();

    // @ts-ignore
    $: $currentpoints, calcCurrentEdges();

    $: $axisselect, calcCurrentEdges();

    onMount(() => {
        calcCurrentEdges();
    });

    $: allEdges = [];
    $: node_data = {};

    function calcCurrentEdges() {
        let edges = [];
        let nodes = {};
        $currentpoints.forEach((v, index) => {
            if (v[2]?.isPolymix) {
                nodes[index] = {
                    x: x(v[0][$axisselect[0].value]),
                    y: y(v[1][$axisselect[1].value]),
                };
                for (let i = index + 1; i < $currentpoints.length; i++) {
                    let w = $currentpoints[i];
                    if (w[2]?.isPolymix) {
                        //console.log(w[2], v[2], w[2]?.polyinfo.basemelody === v[2]?.polyinfo.basemelody ,w[2]?.polyinfo.combinations?.includes(v[2].polyinfo.basemelody), v[2]?.polyinfo.combinations?.includes(w[2].polyinfo.basemelody),v[2]?.polyinfo.combinations?.filter(element => w[2].polyinfo.combinations.includes(element)).length > 0)
                        if (
                            w[2].polyinfo.basemelody ===
                                v[2].polyinfo.basemelody ||
                            w[2].polyinfo.combinations.includes(
                                v[2].polyinfo.basemelody,
                            ) ||
                            v[2].polyinfo.combinations.includes(
                                w[2].polyinfo.basemelody,
                            ) ||
                            v[2].polyinfo.combinations.filter((element) =>
                                w[2].polyinfo.combinations.includes(element),
                            ).length > 0
                        ) {
                            // @ts-ignore
                            let a1 = [
                                ...v[2].polyinfo.combinations,
                                v[2].polyinfo.basemelody,
                            ];
                            let a2 = [
                                ...w[2].polyinfo.combinations,
                                w[2].polyinfo.basemelody,
                            ];
                            edges.push({
                                p1: v,
                                p2: w,
                                x1: x(v[0][$axisselect[0].value]),
                                x2: x(w[0][$axisselect[0].value]),
                                y1: y(v[1][$axisselect[1].value]),
                                y2: y(w[1][$axisselect[1].value]),
                                source: index,
                                target: i,
                                commonMelody: a1.filter((x) => a2.includes(x)),
                            });
                        }
                    }
                }
            }
        });
        node_data = nodes;
        coloring = calcColorsFromEdges(edges);
        allEdges = edges;
    }

    // @ts-ignore
    //$:allEdges, drawEdges()

    $: allEdges, edgeBundling(node_data, allEdges);

    let maximum = 0;

    let coloring = [];

    let selectedges = null;

    function calcColorsFromEdges(edges) {
        let occedge = {};
        // id, occ, ranking
        let ranking = {};
        let max = 0;
        edges.forEach((e) => {
            if (!occedge[e.source]) {
                occedge[e.source] = 1;
            } else {
                occedge[e.source] += 1;
                if (occedge[e.source] > max) max = occedge[e.source];
            }
            if (!occedge[e.target]) {
                occedge[e.target] = 1;
            } else {
                occedge[e.target] += 1;
                if (occedge[e.target] > max) max = occedge[e.target];
            }
            if (!ranking[e.commonMelody]) {
                ranking[e.commonMelody] = {
                    commonMelody: e.commonMelody,
                    occ: 1,
                };
            } else {
                ranking[e.commonMelody].occ += 1;
            }
        });

        let rankarray = [];

        for (let key in ranking) {
            rankarray.push(ranking[key]);
        }
        rankarray = rankarray.sort((a, b) => b.occ - a.occ);
        rankarray.forEach((v, i) => (v.rank = i));

        maximum = max;
        return [occedge, ranking, rankarray];
    }

    function getColor(index, color) {
        if (false) {
            let colors = color[0];
            let e = allEdges[index];
            let scale = d3.scaleLinear().domain([1, maximum]);
            let value =
                colors[e.source] > colors[e.target]
                    ? colors[e.source]
                    : colors[e.target];
            return visutil.divergingTimbreScale(scale(value));
        } else {
            let colors = color[1];
            let e = allEdges[index];
            let value = colors[e.commonMelody].rank;
            return value < 9
                ? visutil.modelColor10(value % 10)
                : d3.schemePaired[(value - 9) % 12];
        }
    }

    // @ts-ignore
    function edgeBundling(node_data, edge_data) {
        console.log(coloring);
        let fbundling = ForceEdgeBundling()
            .step_size(0.2)
            // @ts-ignore
            .compatibility_threshold(0.25)
            // @ts-ignore
            .nodes(node_data)
            // @ts-ignore
            .edges(edge_data);

        let results = fbundling();

        let d3line = d3
            .line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            //.curve(d3.curveBundle);
            .curve(d3.curveBasis);
        //.curve(d3.curveNatural)
        //.curve(d3.curveCardinal)
        //.curve(d3.curveCatmullRom.alpha(0.3))

        svg = d3.select("#edgesSvg");
        svg.selectAll("*").remove();

        //results.forEach(function(edge_subpoint_data){
        // for each of the arrays in the results
        // draw a line between the subdivions points for that edge
        selectedges = svg
            .append("g")
            .selectAll("path")
            .data(results)
            .enter()
            .append("path")
            .attr("d", (d) => d3line(d))
            .attr(
                "id",
                (d, i) =>
                    "p" +
                    allEdges[i].p1[2].index +
                    "_" +
                    allEdges[i].p2[2].index,
            )
            .style("stroke-width", 1)
            .style("stroke", (d, i) => getColor(i, coloring))
            .style("fill", "none")
            .style("stroke-opacity", 0.1); //use opacity as blending
        //});

        selection();
    }

    function drawEdges() {
        if (allEdges.length > 0) {
            svg = d3.select("#edgesSvg");
            if (svg !== undefined && svg !== null) {
                svg.selectAll("*").remove();
                svg.append("g")
                    .selectAll("line")
                    .data(allEdges)
                    .enter()
                    .append("line")
                    .attr("stroke-width", 1)
                    .attr("stroke", "black")
                    .attr("opacity", opacity)
                    .attr("x1", (d) => d.x1)
                    .attr("x2", (d) => d.x2)
                    .attr("y1", (d) => d.y1)
                    .attr("y2", (d) => d.y2);
            }
        }
    }

    $: $meloselected, selection();

    let previousIDs = [];

    function selection() {
        if (previousIDs.length !== 0) {
            previousIDs.forEach((v) => {
                d3.select("#p" + v)
                    .style("stroke-width", 1)
                    .style("stroke-opacity", 0.1);
            });
            previousIDs = [];
        }
        if (false) {
            if ($meloselected !== null) {
                $meloselected.forEach((ms) => {
                    previousIDs = previousIDs.concat(
                        allEdges
                            .filter(
                                (e) =>
                                    e.p1[2].index ===
                                        $meloselected[0][2].index ||
                                    e.p2[2].index === $meloselected[0][2].index,
                            )
                            .map((v) => v.p1[2].index + "_" + v.p2[2].index),
                    );
                });
                previousIDs.forEach((v) => {
                    let e = d3
                        .select("#p" + v)
                        .style("stroke-width", 2)
                        .style("stroke-opacity", 0.5);
                });
            }
        } else {
            if ($meloselected !== null) {
                $meloselected.forEach((ms) => {
                    previousIDs = previousIDs.concat(
                        allEdges
                            .filter(
                                (e) =>
                                    e.commonMelody.includes(
                                        ms[2].polyinfo.basemelody,
                                    ) ||
                                    e.commonMelody.filter((x) =>
                                        ms[2].polyinfo.combinations.includes(x),
                                    ).length > 0,
                            )
                            .map((v) => v.p1[2].index + "_" + v.p2[2].index),
                    );
                });
                previousIDs.forEach((v) => {
                    d3.select("#p" + v)
                        .style("stroke-width", 2)
                        .style("stroke-opacity", 0.5);
                });
            }
        }
    }

    /*
    function newPolygons() {
        if ($currentpoints.length > 3) {
            polygons = []
            svg = d3.select("#edgesSvg");
            if (
                svg !== undefined &&
                svg !== null &&
                polygons !== null &&
                polygons.length > 0 &&
                $currentpoints !== null
            ) {
                const thispoints = $currentpoints.map((p) => [
                    x(p[0][$axisselect[0].value]),
                    y(p[1][$axisselect[1].value]),
                ]);

                let tightHull = d3.polygonHull(thispoints); //returns an array of vertices

                var centerPoint = d3.polygonCentroid(tightHull);

                var expandedHull = tightHull.map(function (vertex) {
                    //Create a new array of vertices, each of which is the result
                    //of running this function on the corresponding vertex of the
                    //original hull.
                    //Each vertex is of the form [x,y]

                    var vector = [
                        vertex[0] - centerPoint[0],
                        vertex[1] - centerPoint[1],
                    ];
                    //the vector representing the line from center to this point

                    var vectorLength = Math.sqrt(
                        vector[0] * vector[0] + vector[1] * vector[1],
                    );
                    //Pythagorus' theorem to get the length of the line

                    var normalizedVector = [
                        vector[0] / vectorLength,
                        vector[1] / vectorLength,
                    ];
                    //the vector scaled down to length 1, but with the same angle
                    //as the original vector

                    return [
                        vertex[0] + normalizedVector[0] * $clipPadding,
                        vertex[1] + normalizedVector[1] * $clipPadding,
                        vertex[0] + normalizedVector[0] * ($clipPadding + 20),
                        vertex[1] + normalizedVector[1] * ($clipPadding + 20),
                    ];
                    //use the normalized vector to adjust the vertex point away from
                    //the center point by a distance of `padding`
                });

                const line = d3.line().curve(d3.curveLinearClosed);

                svg.selectAll("*").remove();
                const defs = svg.append("defs");
                const filter = defs
                    .append("filter")
                    .attr("id", "filterblur")
                    .append("feGaussianBlur")
                    .attr("stdDeviation", 6);

                const mask = defs.append("mask").attr("id", "mask");

                vorpol = svg.append("g");

                mask.append("path")
                    .attr("d", line(expandedHull.map((v) => [v[0], v[1]])))
                    .attr("fill", "white")
                    .attr("filter", "url(#filterblur)");

                vorpol
                    .selectAll("path")
                    .data(polygons)
                    .enter()
                    .append("path")
                    .attr("class", "blurpoly")
                    .attr("id", (d, i) => "poly" + i)
                    .attr("d", (d) => {
                        return d ? "M" + d.join("L") + "Z" : null;
                    })
                    .attr("fill", (d, i) => visutil.getFillForVoronoi(d))
                    .attr("opacity", opacity)
                    .attr("mask", "url(#mask)");
            }
        }
    }
    */
</script>

<svg id="edgesSvg" bind:this={svg} width={$side} height={$side} />

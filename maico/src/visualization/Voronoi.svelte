<script>
    import {
        vorcolorselect,
        clusterdata,
        currentcolor,
        currentpoints,
        glyphselect,
        axisselect,
        points,
        side,
        brushselection,
        meloselected,
        representatives,
        brushClusterSwitch,
        clipPadding,
        repSwitch,
        seen,
        rate,
        selectedBaseKeys,
        exclude,
    } from "../stores/stores.js";
    import { get } from "svelte/store";

    import { Canvas } from "svelte-canvas";
    import { extent } from "d3-array";
    import { scaleLinear } from "d3-scale";
    import { voronoi } from "d3-voronoi";

    import * as visutil from "../util/visutil.js";
    import * as d3 from "d3";

    export let opacity = 0.2;

    const margin = { top: 25, right: 25, bottom: 25, left: 25 };

    let svg;

    let polygons;

    let vorpol;

    $: x =
        $points !== undefined
            ? scaleLinear()
                  .domain(
                      visutil.makeextentBigger(
                          extent(
                              $points.map(
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

    $: thisvoronoi =
        $currentpoints !== undefined
            ? voronoi()
                  .x((d) => {
                      return x(d[0][$axisselect[0].value]);
                  })
                  .y((d) => {
                      return y(d[1][$axisselect[1].value]);
                  })
                  .extent([
                      [margin.left, margin.top],
                      [$side - margin.right, $side - margin.bottom],
                  ])
            : null;

    $: thisvoronoi, newPolygons();
    $: $side, newPolygons();
    $: $clipPadding, newPolygons();
    $: $brushClusterSwitch, newColor();
    $: $vorcolorselect, newColor();
    $: $seen, newColor();
    $: $rate, newColor();
    $: $selectedBaseKeys, newColor();
    $: opacity, newOpacity();
    $: $axisselect, newPolygons();

    function newPolygons() {
        if ($currentpoints.length > 3) {
            polygons = thisvoronoi($currentpoints).polygons();
            svg = d3.select("#voronoiSvg");
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

                /*
            svg.append("clipPath")
                .attr("id", "clip1") // <-- we need to use the ID of clipPath
                .attr("class", "clip1")
                .append("path")
                .attr("d", line(expandedHull.map((v) => [v[0], v[1]])));
*/

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

    /**
     * Fades into new colors
     */
    function newColor() {
        if (vorpol) {
            polygons.forEach((e, i) => {
                vorpol
                    .select("#poly" + i)
                    .transition()
                    .duration(500)
                    .attr("fill", (d, i) => visutil.getFillForVoronoi(d));
            });
        }
    }

    /**
     * Fades into new opacity
     */
    function newOpacity() {
        vorpol
            ?.selectAll(".blurpoly")
            .transition()
            .duration(100)
            .attr("opacity", opacity);
    }
</script>

<svg id="voronoiSvg" bind:this={svg} width={$side} height={$side} />

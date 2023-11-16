<script>
    // @ts-ignore
    import { correlationData, axisselect } from "../stores/stores.js";
    // @ts-ignore
    import * as d3 from "d3";
    import { onMount } from "svelte";
    import { axisoptions, axisoptionsCor } from "../stores/globalValues.js";
    import * as visutil from "../util/visutil.js";
    import * as glutil from "../util/glyphutil.js";
    import ColorLegend from "../colorlegends/ColorLegend.svelte";

    export let w, h;

    let colorByMagnitude = false;

    let svg, select1, select2;

    let hover = -1;

    onMount(() => {
        svg = d3.select("#correlationSVG").append("g");
        drawMatrix();
    });

    $: $correlationData, drawMatrix();
    $: $axisselect, recolor();

    function drawMatrix() {
        if (svg !== undefined && svg !== null && axisoptionsCor !== undefined) {
            svg.selectAll("*").remove();
            const colorScale = colorByMagnitude
                ? visutil.divergingScaleSymmetric
                : visutil.divergingScale;
            const a1 = $axisselect[0].value;
            const a2 = $axisselect[1].value;
            const a3 = $axisselect[2];
            select1 = "axis" + a1 + a2;
            select2 = "axis" + a2 + a1;
            const kw = (w - 100) / (axisoptionsCor.length + 1);
            const kh = h / (axisoptionsCor.length + 1);

            let corData = null;

            if ($correlationData !== null) {
                corData = new Array(axisoptionsCor.length).fill([]);
                $correlationData.forEach((cd) => {
                    cd.forEach((d, i) => {
                        corData[i] = corData[i].concat(d);
                    });
                });
            }

            const corscale = d3.scaleLinear().domain([-1, 1]).range([1, 0]);

            // add text to the left form 0 to 80

            svg.append("g")
                .selectAll("text")
                .data(axisoptionsCor)
                .enter()
                .append("text")
                .attr("x", (d, i) => 80 + kw / 4 + kw * i)
                .attr("y", 0)
                .attr("dy", "1.3em") //kh*0.75)
                .text((d) => d.shortLabel.slice(0, 1));

            // cells
            // -> calc correlation for j to i (maybe calc all points for each option in advance)
            for (let j = 0; j < axisoptionsCor.length; j++) {
                svg.append("g")
                    .selectAll("rect")
                    .data(axisoptionsCor)
                    .enter()
                    .append("rect")
                    .attr("x", (d, i) => 80 + kw * i)
                    .attr("y", (d, i) => kh + kh * j)
                    .attr("height", kh - 1)
                    .attr("width", kw - 1)
                    .attr("rx", 4)
                    .attr(
                        "id",
                        (d, i) => "axis" + i + j // i < j ? : "axis" + j + i
                    )
                    /*.attr("fill-opacity", (d, i) =>
                        (a1 === j && a2 === i) || (a1 === j && a2 === i)
                            ? 1
                            : 0.7
                    ) // store select for removing when changed
                    */
                    .attr("fill", (d, i) =>
                        corData === null
                            ? colorScale(corscale(0))
                            : colorScale(
                                  corscale(
                                      visutil.correlationCoefficient(
                                          corData[i],
                                          corData[j],
                                          corData[i].length
                                      )
                                  )
                              )
                    )
                    .attr("stroke-width", (d, i) =>
                        !a3 &&
                        //((a1 === j && a2 === i) ||
                        a1 === j &&
                        a2 === i
                            ? //)
                              1
                            : 0
                    )
                    .attr("stroke", "#333")
                    .style("cursor", "pointer")
                    .on("click", (e, d, i) => {
                        if (d.value != axisoptionsCor[j].value)
                            axisselect.updateAxis(d, 0, axisoptionsCor[j], 1);
                    })
                    .append("title")
                    .text(
                        (d, i) =>
                            `${axisoptionsCor[j].label} - ${axisoptionsCor[i].label}`
                    );

                // text for values
                svg.append("g")
                    .selectAll("text")
                    .data(axisoptionsCor)
                    .enter()
                    .append("text")
                    .attr("x", (d, i) => 80 + kw * i + kw / 2)
                    .attr("y", kh + kh * j + (kh * 2) / 3)
                    .attr("fill", (d, i) =>
                        glutil.getColorLightness(
                            corData === null
                                ? colorScale(corscale(0))
                                : colorScale(
                                      corscale(
                                          visutil.correlationCoefficient(
                                              corData[i],
                                              corData[j],
                                              corData[i].length
                                          )
                                      )
                                  )
                        ) < 50
                            ? "white"
                            : "black"
                    )
                    .style("text-anchor", "middle")
                    .style("vertical-align", "bottom")
                    .style("font-size", kh * 0.4)
                    .style("user-select", "none")
                    .text((d, i) => {
                        if (corData !== null) {
                            const cor = visutil.correlationCoefficient(
                                corData[i],
                                corData[j],
                                corData[i].length
                            );
                            return isNaN(cor) || i === j
                                ? ""
                                : // : Math.abs(cor).toFixed(1);
                                  cor.toFixed(1);
                        } else {
                            return "";
                        }
                    });
            }

            svg.append("g")
                .selectAll("rect")
                .data(axisoptionsCor)
                .enter()
                .append("rect")
                .attr("id", (d) => "axisrect" + d.value)
                .attr("x", 5)
                .attr("y", (d, i) => kh + i * kh)
                .attr("width", 75)
                .attr("height", kh)
                .attr("fill", "white")
                .on("mouseover", (d, i) => {
                    d3.select("#axisrect" + i.value).attr("width", 200);
                    d3.select("#axistext" + i.value).text((d, i) => d.label);
                })
                .on("mouseout", (d, i) => {
                    d3.select("#axisrect" + i.value).attr("width", 75);
                    d3.select("#axistext" + i.value).text(
                        (d, i) => d.shortLabel
                    );
                });
            // short label
            svg.append("g")
                .selectAll("text")
                .data(axisoptionsCor)
                .enter()
                .append("text")
                .attr("id", (d, i) => "axistext" + d.value)
                .attr("x", 10)
                .attr("y", (d, i) => kh + i * kh)
                .attr("dy", "1.3em") //kh*0.75)
                .text((d, i) => {
                    return d.shortLabel;
                });
        }
    }

    function recolor() {
        if (svg !== undefined) {
            // g => select rect with old select and transition then new select set and recolor
            svg.selectAll("#" + select1).attr("stroke-width", 0);
            svg.selectAll("#" + select2).attr("stroke-width", 0);
            if (!$axisselect[2]) {
                const a1 = $axisselect[0].value - 4;
                const a2 = $axisselect[1].value - 4;

                select1 = "axis" + a1 + a2;
                select2 = "axis" + a2 + a1;

                svg.selectAll("#" + select1).attr("stroke-width", 1);
                svg.selectAll("#" + select2).attr("stroke-width", 0.3);
            }
        }
    }
</script>

<main>
    <svg id="correlationSVG" width={w} height={h} />
    <div class="legendContainer">
        <button
            title="Toggle between coloring by value or magnitude"
            on:click={() => {
                colorByMagnitude = !colorByMagnitude;
                drawMatrix();
            }}
        >
            color
        </button>
        {#if !colorByMagnitude}
            <ColorLegend
                title="correlation coefficient"
                tickFormat={(d) => d}
                color={d3.scaleDiverging([-1, 0, 1], (d) =>
                    visutil.divergingScale(1 - d)
                )}
                width={w - 100}
                tickSize={0}
            />
        {:else}
            <ColorLegend
                title="correlation coefficient"
                tickFormat={(d) => d}
                color={d3.scaleDiverging(
                    [-1, 0, 1],
                    visutil.divergingScaleSymmetric
                )}
                width={w - 100}
                tickSize={0}
            />
        {/if}
    </div>
</main>

<style>
    main {
        display: grid;
        justify-items: center;
        grid-template-rows: auto auto;
    }

    .legendContainer {
        width: 90%;
        display: grid;
        grid-template-columns: 45px auto;
        gap: 10px;
    }

    .legendContainer button {
        height: 35px;
        padding: 1px 2px;
    }
</style>

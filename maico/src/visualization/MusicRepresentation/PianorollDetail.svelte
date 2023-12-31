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
        exportList,
        bpm
    } from "../../stores/stores.js";
    import { keysLookup, oktaveLookup } from "../../stores/globalValues.js";
    import * as glutil from "../../util/glyphutil.js";
    import { melodies } from "@magenta/music";
    import { log } from "../../util/fileutil.js";

    const margin = { top: 20, right: 10, bottom: 10, left: 25 };

    export let melody, h, w, length, index;

    let svg;

    let primer = false;
    let altkey = false;
    let playbackline;

    const scalemode = false;

    $: shownmelody = melody.melody;

    $: height =
        length > 4
            ? Math.min(480, (h - 2 * margin.top - margin.bottom) / 4)
            : Math.min(480, (h - 2 * margin.top - margin.bottom) / length);
    let width = w;

    let fill = visutil.getColor(melody, $currentcolor);

    $: x = d3
        .scaleLinear()
        .domain([0, shownmelody.totalQuantizedSteps])
        .range([margin.left, w - margin.right]);

    $: extend = muutil.getExtentOfMelody(melody.melody, true, melody?.isPrimer);
    $: y = d3
        .scaleLinear()
        .domain(extend)
        .range([height - margin.bottom, margin.top]);

    onMount(() => {
        // create the main SVG element
        svg = d3.select("#svgPRoll" + index).style("fill", "darkgrey");
        drawPianoRoll();
    });

    $: melody,
        (d) => {
            shownmelody = d.melody;
            drawPianoRoll();
        };
    $: $currentcolor, changeColor();
    $: shownmelody, drawPianoRoll();

    function selectOption(option) {
        log("rating changed", { melody:melody.melody, user:melody.userspecific, rating:option})
        if (melody.userspecific.rate === option) {
            melody.userspecific.rate = 0;
            rate.setOpt(option, melody, false);
        } else {
            melody.userspecific.rate = option;
            rate.setOpt(option, melody, true);
        }
    }

    function exportChange(melody, add) {
        !add ? exportList.addMelo(melody) : exportList.deleteMelo(melody);
        return !add;
    }

    function changeColor() {
        if (svg !== undefined) {
            console.log(melody);
            svg.selectAll("rect").attr(
                "fill",
                visutil.getColor(melody, $currentcolor)
            );
        }
    }

    function listenToMelody(e) {
        e.preventDefault();

        if (playbackline === undefined) playbackline = svg.append("line");

        playbackline
            .attr("x1", x(0))
            .attr("y1", y(extend[0]))
            .attr("x2", x(0))
            .attr("y2", y(extend[1]))
            .attr("stroke", "blue");

        muutil.playMelody(
            shownmelody.notes,
            false,
            playbackline,
            x(shownmelody.totalQuantizedSteps),
            ((60000) / ($bpm * 4)) * (shownmelody.totalQuantizedSteps ), // if 120 bpm but we only use that
            x(0),
            melody,
            { melody:melody.melody, user:melody.userspecific}
        );
    }

    function drawPianoRoll() {
        if (svg !== undefined) {
            svg.selectAll("*").remove();

            let noteheight = y(extend[1] - 1) - y(extend[1]);
            const xticks = [];
            for (let t = 0; t <= shownmelody.totalQuantizedSteps; t++) {
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
                            .ticks(extend[1] - extend[0])
                            .tickFormat((t) => {
                                if (
                                    t % 12 === 0 ||
                                    t % 12 === 2 ||
                                    t % 12 === 4 ||
                                    t % 12 === 7 ||
                                    t % 12 === 9
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

            playbackline = svg.append("line").attr("stroke", "blue");

            svg.append("g")
                .selectAll("rect")
                .data(shownmelody.notes)
                .enter()
                .append("rect")
                .attr(
                    "transform",
                    `translate(0,${-(y(extend[0]) - y(extend[0] + 1)) / 2})`
                )
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("stroke-width", 0.9 / h)
                .attr("stroke", "black")
                .attr("height", noteheight * 0.8)
                .attr(
                    "width",
                    (d) => x(d.quantizedEndStep) - x(d.quantizedStartStep)
                )
                .attr("x", (d) => x(d.quantizedStartStep))
                .attr("y", (d) => y(d.pitch) + noteheight * 0.1)
                .attr("fill", (d) => {
                    if (!primer) return fill;
                    /*fill === "grey"
                            ? fill
                            : melody.additional.outScaleNotes.outScale.has(
                                  d.pitch
                              )
                            ? "red"
                            : "green";*/ else
                        return fill; /*shownmelody.inScale.includes(d.pitch % 12)
                            ? "green"
                            : "red";*/
                })
                .attr("opacity", 0.7);
        }
    }
</script>

<div class="infocontainer">
    <div
        class="info"
        style:background-color={$colors[0].scale({ model: melody.model })}
        style:color={glutil.getColorLightness(
            $colors[0].scale({ model: melody.model })
        ) < 50
            ? "white"
            : "black"}
    >
        {melody.model.name.slice(0, 8)} <br />
        {melody.mvaesim !== undefined ? "VaeSim: " + melody.mvaesim : ""}
    </div>
    <div
        class="info"
        style:background-color={$colors[1].scale({
            temperature: melody.temperature,
        })}
        style:color={glutil.getColorLightness(
            $colors[1].scale({ temperature: melody.temperature })
        ) < 50
            ? "white"
            : "black"}
    >
        Temp: {melody.temperature} <br /> ID: {melody.index}
    </div>
    {#if melody?.melody?.primer !== undefined}
        <div
            class="info"
            style:background-color={"white"}
            style:color={"black"}
        >
            <label>
                <input
                    type="checkbox"
                    bind:checked={primer}
                    on:change={(e) => {
                        if (
                            e.target.checked &&
                            melody?.melody?.primer !== undefined
                        ) {
                            shownmelody = melody.melody.primer;
                        } else {
                            shownmelody = melody.melody;
                        }
                    }}
                />
                {#if melody?.isPrimer}
                    this is Primer {melody.primerindex}
                {:else}
                    show Primer {melody.primerindex}
                {/if}
            </label>
        </div>
    {/if}
    <div class="liked">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="option {melody.userspecific.rate === 1 ? 'selected' : ''}"
            on:click={() => selectOption(1)}
        >
            👍
        </div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="option {melody.userspecific.rate === -1 ? 'selected' : ''}"
            on:click={() => selectOption(-1)}
        >
            👎
        </div>
    </div>
    <div class="liked">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="option {melody.userspecific.export ? 'selected' : ''}"
            on:click={() => {
                melody.userspecific.export = exportChange(
                    melody,
                    melody.userspecific.export
                );
            }}
        >
            📁
        </div>
        {#if melody.userspecific.seen === 2}
            <div class="option">👂</div>{/if}
    </div>
</div>
<!-- svelte-ignore a11y-no-static-element-interactions -->
<svg
    id={"svgPRoll" + index}
    class={"context"}
    {width}
    {height}
    on:contextmenu|preventDefault={listenToMelody}
/>

<style>
    .infocontainer {
        display: flex;
        justify-content: space-between;
    }
    .info {
        margin: 0 2px;
        padding: 0px 2px;
        border-radius: 5px;
    }
    .context {
        cursor: alias;
    }
    .option {
        display: inline-block;
        padding: 10px;
        cursor: pointer;
    }
    .liked .selected {
        background-color: rgb(197, 230, 242);
        border-radius: 50%;
        text-shadow: 0 0 10px white;
    }
</style>

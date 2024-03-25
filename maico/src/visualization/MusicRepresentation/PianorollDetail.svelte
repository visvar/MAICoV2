<script>
    // @ts-nocheck

    import * as d3 from "d3";
    // @ts-ignore
    import * as muutil from "../../util/musicutil.js";
    import * as visutil from "../../util/visutil.js";
    import { onMount } from "svelte";
    import Select from "svelte-select";
    import {
        currentcolor,
        colors,
        rate,
        exportList,
        bpm,
        polyoptions,
        emotionbased,
        selectedBaseKeys,
        exclude,
        currentpoints,
        excludePoly,
    } from "../../stores/stores.js";
    import { keysLookup, oktaveLookup } from "../../stores/globalValues.js";
    import * as glutil from "../../util/glyphutil.js";
    import { melodies } from "@magenta/music";
    import { log } from "../../util/fileutil.js";
    import { forEach } from "mathjs";

    const margin = { top: 20, right: 10, bottom: 10, left: 25 };

    export let melody, h, w, length, index;

    let svg;

    let primer = false;
    let line = true;
    let altkey = false;
    let playbackline;

    const scalemode = false;

    const polyOptionsSelect = [
        { label: "Diff", value: 0 },
        { label: ">4 5th", value: 1 },
    ];

    let polyselected = { label: "Diff", value: 0 };

    $: shownmelody = melody.melody;

    $: height =
        length > 4
            ? Math.min(480, (h - 2 * margin.top - margin.bottom) / 4)
            : Math.min(480, (h - 2 * margin.top - margin.bottom) / length);
    let width = w;

    let fill = visutil.getColor(melody, $currentcolor, $selectedBaseKeys);

    $: x = d3
        .scaleLinear()
        .domain([0, shownmelody.totalQuantizedSteps])
        .range([margin.left, w - margin.right]);

    $: extend = muutil.getExtentOfMelody(
        melody.melody,
        true,
        melody?.isPrimer,
        melody?.isPolymix,
    );
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
    $: $selectedBaseKeys, changeKeyColor();
    $: shownmelody, drawPianoRoll();
    $: line, drawPianoRoll();

    function selectOption(option) {
        log("rating changed", {
            melody: melody.melody,
            user: melody.userspecific,
            rating: option,
        });
        if (melody.userspecific.rate === option) {
            melody.userspecific.rate = 0;
            rate.setOpt(option, melody, false);
        } else {
            melody.userspecific.rate = option;
            rate.setOpt(option, melody, true);
        }
    }

    function exportChange(melody, add) {
        log(!add ? "added toExport:" : "removed Export:", {
            melody,
        });
        !add ? exportList.addMelo(melody) : exportList.deleteMelo(melody);
        return !add;
    }

    function changeColor() {
        if (svg !== undefined) {
            console.log(melody);
            svg.selectAll("rect").attr(
                "fill",
                visutil.getColor(melody, $currentcolor, $selectedBaseKeys),
            );
        }
    }

    function changeKeyColor() {
        if (svg !== undefined ) {
            shownmelody.notes.forEach((d) => {
                svg.selectAll("#p"+d.pitch+d.quantizedStartStep).attr(
                "fill", d => {
                if (!primer && d?.meloID !== undefined){
                        return visutil.modelColor10(
                            d?.trackID !== undefined
                                ? d.trackID
                                : shownmelody.indexing.filter(
                                      (n) => n.id === d.meloID,
                                  )[0].meloID,
                        );
                    /*fill === "grey"
                            ? fill
                            : melody.additional.outScaleNotes.outScale.has(
                                  d.pitch
                              )
                            ? "red"
                            : "green";*/ 
                }else if($selectedBaseKeys !== -1 && !primer){
                    let bd = muutil.isBright(d.pitch, $selectedBaseKeys)
                    if(bd === 0)
                        return "lightgrey"
                    return (bd && melody.timbre[$selectedBaseKeys] >= 0.5) || (!bd && melody.timbre[$selectedBaseKeys] <= 0.5) || (bd === -6) ? "ligthgrey":  "steelblue"
                            
                }else{
                    return fill; /*shownmelody.inScale.includes(d.pitch % 12)
                        ? "green"
                        : "red";*/
                }
                }
            );
                
            })
            
        }
    }

    function excludeAllMelodies(c) {
        let temp = [];
        temp = $currentpoints.filter(
            (p) =>
                p[2].polyinfo.basemelody === c ||
                p[2].polyinfo.combinations.includes(c),
        );
        console.log(temp);
        excludePoly.set($excludePoly.concat(temp.map((p) => p[2].index)));
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
            (60000 / ($bpm * 4)) * shownmelody.totalQuantizedSteps, // if 120 bpm but we only use that
            x(0),
            melody,
            { melody: melody.melody, user: melody.userspecific },
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
                        }),
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
                            .tickSize(0),
                    );
            }

            function pianoRollBackground(g) {
                for (let t = extend[0] + 1; t < extend[1]; t++) {
                    if (
                        t % 12 === 1 ||
                        t % 12 === 3 ||
                        t % 12 === 6 ||
                        t % 12 === 8 ||
                        t % 12 === 10
                    ) {
                        g.append("rect")
                            .attr(
                                "transform",
                                `translate(0,${
                                    -(y(extend[0]) - y(extend[0] + 1)) / 2
                                })`,
                            )
                            .attr("rx", 0)
                            .attr("ry", 0)
                            .attr("height", noteheight)
                            .attr(
                                "width",
                                x(shownmelody.totalQuantizedSteps) - x(0),
                            )
                            .attr("x", x(0))
                            .attr("y", y(t) + noteheight * 0.1)
                            .attr("fill", "grey")
                            .attr("opacity", 0.2);
                    } else if (t % 12 === 4 || t % 12 === 11) {
                        g.append("line")
                            .attr(
                                "transform",
                                `translate(0,${
                                    -(y(extend[0]) - y(extend[0] + 1)) / 2
                                })`,
                            )
                            .attr("x1", x(0))
                            .attr("y1", y(t) + noteheight * 0.1)
                            .attr("x2", x(shownmelody.totalQuantizedSteps))
                            .attr("y2", y(t) + noteheight * 0.1)
                            .attr("stroke", "grey")
                            .attr("opacity", 0.2);
                    }
                }
                extend;
                noteheight;
            }

            svg.append("g")
                .call(xAxis)
                .call((g) => {
                    g.selectAll("line")
                        .attr("opacity", 0.1)
                        .attr("stroke", "#111");
                });
            svg.append("g").call(yAxis);

            svg.append("g").call(pianoRollBackground);

            playbackline = svg.append("line").attr("stroke", "blue");

            //console.log(muutil.calcIntervals(shownmelody));

            //context.beginPath();
            if (line) {
                const lines = [];
                const colorsline = [];
                if (melody.isPolymix) {
                    let voices = melody.polyinfo.combinations.length;
                    for (let i = 0; i <= voices; i++) {
                        let line = [];
                        let tempnotes = shownmelody.notes.filter((n1) =>
                            n1?.trackID !== undefined
                                ? n1.trackID === i
                                : shownmelody?.indexing !== undefined
                                  ? shownmelody?.indexing[i].id === n1.meloID
                                  : n1.meloID === i,
                        );
                        tempnotes.forEach((note, j) => {
                            if (j === 0)
                                line.push([
                                    x(note.quantizedStartStep),
                                    y(note.pitch),
                                ]);
                            else
                                line.push([
                                    x(note.quantizedStartStep + 0.25),
                                    y(note.pitch),
                                ]);
                            if (j === tempnotes.length - 1)
                                line.push([
                                    x(note.quantizedEndStep),
                                    y(note.pitch),
                                ]);
                            else
                                line.push([
                                    x(note.quantizedEndStep - 0.25),
                                    y(note.pitch),
                                ]);
                        });
                        lines.push(line);
                        colorsline.push(visutil.modelColor10(i));
                        //context.stroke();
                    }
                } else {
                    let line = [];
                    shownmelody.notes.forEach((note, j) => {
                        if (j === 0)
                            line.push([
                                x(note.quantizedStartStep),
                                y(note.pitch),
                            ]);
                        else
                            line.push([
                                x(note.quantizedStartStep + 0.25),
                                y(note.pitch),
                            ]);
                        if (j === shownmelody.notes.length - 1)
                            line.push([
                                x(note.quantizedEndStep),
                                y(note.pitch),
                            ]);
                        else
                            line.push([
                                x(note.quantizedEndStep - 0.25),
                                y(note.pitch),
                            ]);
                    });
                    lines.push(line);
                    colorsline.push(fill);
                }
                const curve = d3
                    .line()
                    .x((d) => d[0])
                    .y((d) => d[1])
                    .curve(d3.curveCatmullRom);

                svg.append("g")
                    .selectAll("path")
                    .data(lines)
                    .enter()
                    .append("path")
                    .attr("d", (d, i) => curve(d))
                    .style("stroke", (d, i) => {
                        return colorsline[i];
                    })
                    .style("fill", "none")
                    .style("stroke-width", 2)
                    .style("opacity", 0.35);
            }

            svg.append("g")
                .selectAll("rect")
                .data(shownmelody.notes)
                .enter()
                .append("rect")
                .attr(
                    "transform",
                    `translate(0,${-(y(extend[0]) - y(extend[0] + 1)) / 2})`,
                )
                .attr("id", d => "p"+d.pitch+d.quantizedStartStep)
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("stroke-width", 0.9 / h)
                .attr("stroke", "black")
                .attr("height", noteheight)
                .attr(
                    "width",
                    (d) => x(d.quantizedEndStep) - x(d.quantizedStartStep),
                )
                .attr("x", (d) => x(d.quantizedStartStep))
                .attr("y", (d) => y(d.pitch) + noteheight * 0.1)
                .attr("fill", (d) => {
                    if (!primer && d.meloID !== undefined){
                        return visutil.modelColor10(
                            d?.trackID !== undefined
                                ? d.trackID
                                : shownmelody.indexing.filter(
                                      (n) => n.id === d.meloID,
                                  )[0].meloID,
                        );
                    /*fill === "grey"
                            ? fill
                            : melody.additional.outScaleNotes.outScale.has(
                                  d.pitch
                              )
                            ? "red"
                            : "green";*/ 
                    }else if($selectedBaseKeys !== -1 && !primer){
                        let bd = muutil.isBright(d.pitch, $selectedBaseKeys)
                        if(bd === 0)
                        return "lightgrey"
                    return (bd && melody.timbre[$selectedBaseKeys] >= 0.5) || (!bd && melody.timbre[$selectedBaseKeys] <= 0.5) || (bd === -6) ? "ligthgrey":  "steelblue"
                    }else{
                        return fill; /*shownmelody.inScale.includes(d.pitch % 12)
                            ? "green"
                            : "red";*/
                    }
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
            $colors[0].scale({ model: melody.model }),
        ) < 50
            ? "white"
            : "black"}
    >
        {#if melody.model.name === "poly"}
            {melody.model.name.slice(0, 8)} <br />
            Melodies:
            <br />
            <div
                style:display="inline-block"
                style:color={visutil.modelColor10(
                    melody.melody.indexing.filter(
                        (t) => t.meloID === melody.polyinfo.basemelody,
                    )[0].trackID,
                )}
            >
                {melody.polyinfo.basemelody}
            </div>
            ,
            {#each melody.polyinfo.combinations as c, i}
                <div
                    style:display="inline-block"
                    style:color={visutil.modelColor10(
                        melody.melody.indexing.filter((t) => t.meloID === c)[0]
                            .trackID,
                    )}
                >
                    {c}
                </div>
                {#if i !== melody.polyinfo.combinations.length - 1}
                    ,
                {/if}
            {/each}
        {:else}
            {melody.model.name.slice(0, 8)} <br />
            ID: {melody.index}
        {/if}
    </div>
    <div
        class="info"
        style:background-color={$colors[1].scale({
            temperature: melody.temperature,
        })}
        style:color={glutil.getColorLightness(
            $colors[1].scale({ temperature: melody.temperature }),
        ) < 50
            ? "white"
            : "black"}
    >
        {#if melody.temperature !== undefined}
            Temp: {melody.temperature} <br />
        {/if}
        {#if melody.model.name === "poly"}
            ID: {melody.index}
        {:else}
            {melody.mvaesim !== undefined ? "VaeSim: " + melody.mvaesim : ""}
        {/if}
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
                    primer <!--{melody.primerindex}-->
                {:else}
                    primer <!--{melody.primerindex}-->
                {/if}
            </label>
            <div>
                <label>
                    <input type="checkbox" bind:checked={line} />
                    mel-line
                </label>
            </div>
        </div>
    {:else if melody?.polyinfo?.basemelody}
        <label>
            <input type="checkbox" bind:checked={line} />
            mel-line
        </label>
        <div>
            Exclude:
            <br />
            <div
                on:click={() => excludeAllMelodies(melody.polyinfo.basemelody)}
                style:display="inline-block"
                style:color={visutil.modelColor10(
                    melody.melody.indexing.filter(
                        (t) => t.meloID === melody.polyinfo.basemelody,
                    )[0].trackID,
                )}
            >
                {melody?.polyinfo?.basemelody}
            </div>
            ,
            {#each melody.polyinfo.combinations as c, i}
                <div
                    on:click={() => excludeAllMelodies(c)}
                    style:display="inline-block"
                    style:color={visutil.modelColor10(
                        melody.melody.indexing.filter((t) => t.meloID === c)[0]
                            .trackID,
                    )}
                >
                    {c}
                </div>
                {#if i !== melody.polyinfo.combinations.length - 1}
                    ,
                {/if}
            {/each}
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
        <br>
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
                selectOption(1);
                melody.userspecific.export = exportChange(
                    melody,
                    melody.userspecific.export,
                );
            }}
        >
            📁
        </div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        {#if melody.userspecific.seen === 2}
            <div class="option">👂</div>{/if}
    </div>
    {#if !melody?.isPolymix}
        <div class="liked">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                class="option"
                on:click={() => {
                    polyoptions.set(
                        muutil.findPolyMelodies(4, melody, polyselected.value),
                    );
                    emotionbased.set({ label: "Polyoptions", value: 2 });
                }}
            >
                🎼🎛️
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <Select
                class="select"
                id="selectpoly"
                items={polyOptionsSelect}
                bind:value={polyselected}
                clearable={false}
            />
        </div>
    {/if}
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
        padding: 2px;
        cursor: pointer;
    }
    .liked .selected {
        background-color: rgb(197, 230, 242);
        border-radius: 50%;
        text-shadow: 0 0 10px white;
    }
</style>

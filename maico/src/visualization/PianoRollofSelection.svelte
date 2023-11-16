<script>
    import {
        currentpoints,
        models,
        glyphselect,
        axisselect,
        points,
        side,
        brushselection,
        meloselected,
        brushClusterSwitch,
        selectedClusterData,
    } from "../stores/stores.js";
    import { get } from "svelte/store";

    import { extent } from "d3-array";
    import { scaleLinear } from "d3-scale";

    import Pianoroll from "./MusicRepresentation/PianorollDetail.svelte";
    import RhythmHighlights from "./MusicRepresentation/RhythmHighlights.svelte";
    import ClusterInfo from "./MusicRepresentation/ClusterInfo.svelte";

    import * as moutil from "../util/modelutil.js";
    import * as muutil from "../util/musicutil.js";
    import * as drutil from "../util/drutil.js";
    import * as glutil from "../util/glyphutil.js";
    import * as visutil from "../util/visutil.js";
    import { brush, selection } from "d3";
    import * as d3 from "d3";
    import ColorLegend from "../colorlegends/ColorLegend.svelte";

    const margin = { top: 10, right: 10, bottom: 25, left: 25 };

    const notescale = ["green", "red"];
    const legend = ["Note is in scale", "Note is out of scale"];

    let w;
    $: h = 0;

    $: h4 = (h - 100 - margin.top - margin.bottom) / 4;
</script>

{#if !$brushClusterSwitch}
    <h2>Selected Samples</h2>
    {#if $meloselected !== null}
        <div class="colorContainer">
            <ColorLegend
                title="Notecolor legend"
                color={d3.scaleOrdinal([0, 1], notescale)}
                tickFormat={(d) => {
                    return legend[d];
                }}
                tickSize={0}
                width={370}
            />
        </div>
    {/if}
    <div class="list" bind:clientWidth={w} bind:clientHeight={h}>
        {#if $meloselected !== null}
            {#each $meloselected as data, index}
                <div>
                    <Pianoroll
                        melody={data[2]}
                        length={$meloselected.length}
                        {w}
                        h={h * 0.75}
                        {index}
                    />
                    <RhythmHighlights
                        melody={data[2]}
                        length={$meloselected.length}
                        {w}
                        h={h * 0.2}
                        {index}
                    />
                </div>
            {/each}
        {/if}
    </div>
{:else}
    <!--<h2>Selected Clusters</h2>-->
    <div class="list" bind:clientWidth={w} bind:clientHeight={h}>
        <h7>Occurrences of Key</h7>
        <ClusterInfo mode={"key"} {w} h={h4} />
        <h7>Occurrences of Models</h7>
        <ClusterInfo mode={"model"} {w} h={h4} />
        <h7>Piano roll density</h7>
        <ClusterInfo mode={"piano"} {w} h={h4} />
        <h7>Occurrences of harmonic notes</h7>
        <ClusterInfo mode={"harmonic"} {w} h={h4} />
    </div>
{/if}

<style>
    .list {
        height: 95vh;
        overflow-y: auto;
        text-align: center;
        margin-top: 5px;
    }
    .list::-webkit-scrollbar {
        display: none;
    }
    h2 {
        font-size: 16px;
        margin: 18px 0 5px 0;
        color: #444;
    }
    .colorContainer {
        width: 90%;
        margin-left: 10px;
        justify-items: center;
    }
</style>

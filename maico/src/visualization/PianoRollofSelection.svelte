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
        filterextents,
        heatmapinfo,
        progress,
        exclude,
        exportList,
        rate,
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
    import Pianoheatmap from "./MusicRepresentation/Pianoheatmap.svelte";
    import { log } from "../util/fileutil.js";

    const margin = { top: 10, right: 10, bottom: 25, left: 25 };

    const notescale = ["green", "red"];
    const legend = ["Note is in scale", "Note is out of scale"];

    let w;
    let globalcontrol = [false, false, false];
    $: $meloselected === null, (globalcontrol = [false, false, false]);

    function setRating(i, h) {
        if (i < 2) {
            $meloselected.forEach((p) => selectOption(i === 0 ? 1 : -1, p[2]));
        } else if (i === 2) {
            $meloselected.forEach(
                (p) => {
                    p[2].userspecific.export = exportChange(p[2], !h)
                }
            );
        }
    }

    function selectOption(option, melody) {
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

    $: h = 0;

    $: h100 = h - 200;

    $: h4 = (h - 100 - margin.top - margin.bottom) / 4;
</script>

{#if !$brushClusterSwitch}
    <div bind:clientWidth={w} bind:clientHeight={h}>
        {#if $meloselected !== null && false}
            <h2>Selected Samples</h2>
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
        <div class="global">
            {#if $meloselected !== null}
                <div class="float">
                    <p class="option">All Selected: </p> 
                    <button
                        class="option"
                        on:click={() => {
                            exclude.set(
                                $exclude.concat(
                                    $meloselected.map((p) => p[2].index),
                                ),
                            );
                        }}>Exclude</button
                    >
                    <div class="liked">
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="option {globalcontrol[0] ? 'selected' : ''}"
                            on:click={() => {
                                globalcontrol[0] = !globalcontrol[0];
                                globalcontrol[1] = false;
                                setRating(0);
                            }}
                        >
                            👍
                        </div>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="option {globalcontrol[1] ? 'selected' : ''}"
                            on:click={() => {
                                globalcontrol[1] = !globalcontrol[1];
                                globalcontrol[0] = false;
                                setRating(1);
                            }}
                        >
                            👎
                        </div>

                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="option {globalcontrol[2] ? 'selected' : ''}"
                            on:click={() => {
                                globalcontrol[2] = !globalcontrol[2];
                                globalcontrol[0] = true;
                                setRating(2, globalcontrol[2]);
                            }}
                        >
                            📁
                        </div>
                    </div>
                </div>
            {:else}
                <button
                    on:click={() => {
                        exclude.set([]);
                    }}>Clear Exclude</button
                >
            {/if}
        </div>
        <div class="list" style="height={h100}px">
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
            {#if $meloselected === null && $heatmapinfo !== null && $filterextents !== null && $progress === 100}
                <Pianoheatmap {w} h={h * 0.75} />
            {/if}
        </div>
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
        height: 90vh;
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
    .float {
        align-items: center;
        justify-content: center;
        display: flex;
    }
    .global {
        background-color: aquamarine;
        align-items: center;
        justify-content: center;
        display: flex;
    }
    .option {
        background-color: rgb(110, 224, 186);
        display: inline-block;
        padding: 10px;
        cursor: pointer;
        margin-left: 5px;
        margin-right: 5px;
    }
    .liked .selected {
        background-color: rgb(197, 230, 242);
        border-radius: 50%;
        text-shadow: 0 0 10px white;
    }
</style>

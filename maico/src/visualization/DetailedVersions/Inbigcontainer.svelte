<script>
    import { glyphselect, tooltipSel } from "../../stores/stores";
    import Chromapie from "../DetailedVersions/ChromapieSample.svelte";
    import ChromapieM from "../DetailedVersions/ChromapieModel.svelte";
    import CorrelationGlyph from "../DetailedVersions/CorrelationGlyph.svelte";
    import PianoHeatmapModel from "../DetailedVersions/PianoHeatmapModel.svelte";
    import PianorollSample from "../DetailedVersions/PianorollSample.svelte";
    import ColorGraphSample from "../DetailedVersions/ColorGraphSample.svelte";
    import StarglyphModel from "../DetailedVersions/StarglyphModel.svelte";
    import Starglyph from "../DetailedVersions/StarglyphSample.svelte";
    import HistogramIntSample from "../DetailedVersions/HistogramIntSample.svelte";
    import HistogramKeyModel from "./HistogramKeyModel.svelte";
    import FlowerSample from "./FlowerSample.svelte";

    const width = 350;
    const height = 350;

    // index={$tooltipSel.data} as input for Correlation Glyph
    // on:click={tooltipSel.set(null)}
</script>

{#if $tooltipSel !== null}
    {#if $tooltipSel.number === 0}
        <div class="box">
            <CorrelationGlyph {width} {height} data={$tooltipSel.data} />
        </div>
    {:else if $tooltipSel.number === 1}
        <div class="box">
            <ChromapieM {width} {height} data={$tooltipSel.data} />
        </div>
    {:else if $tooltipSel.number === 2}
        <div class="box">
            <StarglyphModel {width} {height} data={$tooltipSel.data} />
        </div>
    {:else if $tooltipSel.number === 3}
        <div class="box">
            <PianoHeatmapModel {width} {height} data={$tooltipSel.data} />
        </div>
    {:else if $tooltipSel.number === 4}
        <div class="box">
            <HistogramKeyModel {width} {height} data={$tooltipSel.data} />
        </div>
    {:else if $tooltipSel.number === -1}
        {#if $glyphselect.value === 1}
            <div class="box">
                <FlowerSample
                    {width}
                    {height}
                    data={$tooltipSel.data}
                    mode={0}
                />
            </div>
        {:else if $glyphselect.value === 2}
            <div class="box">
                <Chromapie {width} {height} data={$tooltipSel.data} />
            </div>
        {:else if $glyphselect.value === 3}
            <div class="box">
                <PianorollSample {width} {height} data={$tooltipSel.data} />
            </div>
        {:else if $glyphselect.value === 4}
            <div class="box">
                <HistogramIntSample {width} {height} data={$tooltipSel.data} />
            </div>
        {:else if $glyphselect.value === 5}
            <!-- FivecirclePie-->
        {:else if $glyphselect.value === 6}
            <div class="box">
                <ColorGraphSample {width} {height} data={$tooltipSel.data} />
            </div>
        {:else if $glyphselect.value === 7}
            <div class="box">
                <Chromapie {width} {height} data={$tooltipSel.data} mode={1} />
            </div>
        {:else if $glyphselect.value === 8}
            <div class="box">
                <FlowerSample
                    {width}
                    {height}
                    data={$tooltipSel.data}
                    mode={1}
                />
            </div>
        {/if}
    {/if}
{/if}

<style>
    .box {
        fill: white;
        background-color: white;
        box-shadow: 0px 0 10px #3b3b3b;
    }
</style>

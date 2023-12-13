<script>
    import * as d3 from "d3";
    import * as muutil from "../../util/musicutil.js";
    import {
    filterextents,
        heatmapinfo,
        progress
    } from "../../stores/stores.js";
    import { onMount } from "svelte";

    import { PianorollHeatmap, PianorollHeatmapFilter } from "./PianorollDensity.js";

    export let h, w;

    const margin = { top: 20, right: 10, bottom: 10, left: 25 };

    let svg;

    let info;

    let height = h;
    let width = w;

    onMount(() => {
        // create the main SVG element
        svg = d3.select("#svgheatmap");
        drawInformation($heatmapinfo, $filterextents);
    });

    heatmapinfo.subscribe((n) => drawInformation(n, $filterextents));
    $: $filterextents, drawInformation($heatmapinfo, $filterextents);

    function drawInformation(info, filter) {

        if(info === null || $progress !== 100)
            return
        // key distribution
        if (info !== null && info[1] !== 0) {
            if (svg !== null && svg !== undefined) 
                svg.selectAll("*").remove();
            const xDomain = [
                0,
                info[0][0].length- 1
            ];
            const minPitch = Math.min(info[2][0],
                ...filter.map((d, i) => d[0])
            )-1;
            const maxPitch = Math.max(info[2][1],
                ...filter.map((d, i) => d[1])
            )+1;

            const maxocc = info[1];
            PianorollHeatmap(
                info,
                svg,
                height,
                width,
                xDomain,
                [minPitch, maxPitch],
                maxocc
            );

            PianorollHeatmapFilter(
                filter,
                svg,
                height,
                width,
                xDomain,
                [minPitch, maxPitch],
                maxocc
            );
            
    }


}
</script>

<svg bind:this={svg} id={"svgheatmap"} {width} {height} />
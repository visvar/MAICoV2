<script>
    import * as d3 from "d3";
    import * as muutil from "../../util/musicutil.js";
    import {
        selectedClusterData,
        colors,
        currentcolor,
    } from "../../stores/stores.js";
    import { onMount } from "svelte";
    import { StackedBarChart } from "../util/Stackedbarchart.js";
    import { BarChart } from "../util/Barchart.js";

    import { calcInformation } from "../../util/glyphutil.js";
    import { PianorollDensity } from "./PianorollDensity.js";

    const margin = { top: 20, right: 10, bottom: 10, left: 25 };

    export let h, w, mode;

    let svg;

    let info;

    let height = h;
    let width = w;

    onMount(() => {
        // create the main SVG element
        svg = d3.select("#svgClInfo" + mode);
        drawInformation(mode);
    });

    $: $selectedClusterData, drawInformation(mode);

    function drawInformation(mode) {
        info = $selectedClusterData;

        // key distribution
        if ($selectedClusterData.length === 0 || info.hullpoints === null) {
            if (svg !== null && svg !== undefined) svg.selectAll("*").remove();
        } else if (mode === "key" && info.hullpoints !== null) {
            // allgemeineDomain für alle
            // filter(onlyUnique)
            const keyDomain = info
                .map((c) => c.clusterData.keydist.map((k) => k.name))
                .flat()
                .filter(onlyUnique);
            const valDomain = [
                0,
                Math.max(
                    ...info.map((c) =>
                        Math.max(...c.clusterData.keydist.map((k) => k.occ))
                    )
                ),
            ];
            const modDomain = info
                .map((c) => c.clusterData.moddist.map((k) => k.name))
                .flat()
                .filter(onlyUnique);
            StackedBarChart($selectedClusterData, {
                svg: svg,
                height: height,
                width: width,
                xDomain: valDomain,
                yDomain: keyDomain,
                zDomain: modDomain,
                colors: (d) => $colors[0].scale({ model: { name: d.key } }),
            });
        } else if (mode === "model" && info.hullpoints !== null) {
            const valDomain = [
                0,
                Math.max(
                    ...info.map((c) =>
                        Math.max(...c.clusterData.moddist.map((k) => k.occ))
                    )
                ),
            ];
            const modDomain = info
                .map((c) => c.clusterData.moddist.map((k) => k.name))
                .flat()
                .filter(onlyUnique);
            BarChart($selectedClusterData, {
                mode: "m",
                svg: svg,
                height: height,
                width: width,
                xDomain: valDomain,
                yDomain: modDomain,
                colors: (d) => $colors[0].scale({ model: { name: d.name } }),
            });
        } else if (mode === "harmonic" && info.hullpoints !== null) {
            let valDomain = [0, 0];
            if (
                info[0]?.clusterData?.harmdist !== null &&
                info[0]?.clusterData?.harmdist !== 0
            )
                valDomain = [
                    0,
                    Math.max(
                        ...info.map((c) => Math.max(...c.clusterData.harmdist))
                    ),
                ];
            const modDomain = ["Tonic", "Dom", "SubDom", "Harm", "notHarm"];

            BarChart($selectedClusterData, {
                mode: "h",
                svg: svg,
                height: height,
                width: width,
                xDomain: valDomain,
                // @ts-ignore
                yDomain: modDomain,
                colors: (d) => "#888",
            });
        } else if (mode === "piano" && info.hullpoints !== null) {
            const xDomain = [
                0,
                Math.max(
                    ...info.map(
                        (d, i) => d?.clusterData?.pheatmap[0][0]?.length
                    )
                ) - 1,
            ];
            const minPitch = Math.min(
                ...info.map((d, i) => d?.clusterData?.pheatmap[0][0][0].pitch)
            );
            const pitchLength = Math.max(
                ...info.map((d, i) => d.clusterData.pheatmap[0].length)
            );
            const maxocc = Math.max(
                ...info.map((d, i) => d.clusterData.pheatmap[1])
            );
            PianorollDensity(
                $selectedClusterData,
                svg,
                height,
                width,
                xDomain,
                [minPitch, minPitch + pitchLength],
                maxocc
            );
        }

        // histogram of model and key (maybe later hover one key and see which models ... ) (color? stacked barchart)
        // piano heatmap ? hannes also for glyph ??
        // harmonic distribution also histogram + percentage inscale ? text or some bar

        // then if 2 or 3 selected
        // do comparison => all in on of these charts
    }

    function onlyUnique(v, i, a) {
        return a.indexOf(v) === i;
    }
</script>

<svg bind:this={svg} id={"svgClInfo" + mode} {width} {height} />

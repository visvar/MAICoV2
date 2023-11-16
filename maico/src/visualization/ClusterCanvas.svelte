<script>
    // @ts-ignore
    import {
        points,
        cluster,
        currentpoints,
        side,
        axisselect,
        brushClusterSwitch,
        clusterdata,
        representatives,
        clusterSelect,
        repsize,
    } from "../stores/stores.js";
    // @ts-ignore
    import * as d3 from "d3";
    import { onMount } from "svelte";

    import { getAxisScale } from "../util/visutil.js";
    import * as muutil from "../util/musicutil.js";
    import * as visutil from "../util/visutil.js";
    import * as mvlib from "musicvis-lib";

    export let opacity = 0.1;

    let canvas;

    let oldSelection = [null, 0];

    let axis = null;

    const maxultcluster = 2; // soehow 3 does not work in info

    onMount(() => {
        drawHulls();
    });

    //$: $cluster, updateHull()
    //$: $currentpoints, updateHull()

    $: $clusterdata, drawHulls();
    $: $clusterSelect, drawHulls();
    $: $side, drawHulls();
    $: opacity, drawHulls();

    function checkRep(e) {
        let select = null;
        $representatives.forEach((cr) =>
            cr.representatives?.forEach((r) => {
                if (r !== null) {
                    if (
                        visutil.hitDetection(
                            r,
                            e.offsetX,
                            e.offsetY,
                            $repsize * 45
                        )
                    ) {
                        let selecttemp = $clusterdata.filter(
                            (hull) => hull.clusterindex === cr.clusterindex
                        );
                        select = [[selecttemp[0], selecttemp[0].clusterindex]];
                    }
                }
            })
        );
        return select;
    }

    function selectCluster(e) {
        if (axis !== null && axis.length === 2) {
            const x = axis[0];
            // @ts-ignore
            const y = axis[1];
            let point = [x.invert(e.offsetX), y.invert(e.offsetY)];

            let select =
                e.ctrlKey && $clusterSelect !== null ? $clusterSelect : [];
            $clusterdata.forEach((hull, index) => {
                if (hull.hullpoints !== null) {
                    if (d3.polygonContains(hull.hullpoints, point))
                        select.push([hull, index]);
                }
            });

            if (select.length === 0) {
                let sel = checkRep(e);
                if (sel === null) {
                    oldSelection = [null, 0];
                    clusterSelect.set(null);
                } else {
                    oldSelection = [sel.map((s) => s[1]), 0];
                    clusterSelect.set(sel);
                }
                return null;
            } else if (select.length === 1) {
                oldSelection = [select.map((s) => s[1]), 0];
                clusterSelect.set(select);
                return null;
            } else if (e.ctrlKey) {
                let sel = checkRep(e);
                if (sel !== null && sel !== undefined && sel.length > 0)
                    sel.forEach((s) => {
                        select.push(s);
                    });
                select.length > maxultcluster
                    ? (select = select.slice(-maxultcluster))
                    : null;
                oldSelection = [select.map((s) => s[1]), 0];
                clusterSelect.set(select);
                if (sel !== null) return null;
            }
            // check for representative hit of selected clusters
            let rep = $representatives.filter(
                (rep) =>
                    select.filter(
                        (sel) => rep.clusterindex === sel[0].clusterindex
                    ).length === 1
            );

            /// here problem with adding undefined to select
            rep.forEach((cr) =>
                cr.representatives.forEach((r) => {
                    console.log(
                        visutil.hitDetection(
                            r,
                            e.offsetX,
                            e.offsetY,
                            $repsize * 45
                        )
                    );
                    if (
                        visutil.hitDetection(
                            r,
                            e.offsetX,
                            e.offsetY,
                            $repsize * 45
                        )
                    ) {
                        if (e.ctrlKey)
                            select = $clusterdata.filter(
                                (hull) => hull.clusterindex === cr.clusterindex
                            );
                        select = [[select[0], select[0][1]]];
                    }
                })
            );

            if (!e.ctrlKey && select.length > 1) {
                const sw =
                    JSON.stringify(select.map((s) => s[1])) ===
                    JSON.stringify(oldSelection[0]);
                if (sw) {
                    oldSelection = [
                        oldSelection[0],
                        (oldSelection[1] + 1) % oldSelection[0].length,
                    ];
                    clusterSelect.set([select[oldSelection[1]]]);
                } else {
                    oldSelection = [select.map((s) => s[1]), 0];
                    clusterSelect.set([select[0]]);
                }
            } else {
                select.length > maxultcluster
                    ? (select = select.slice(-maxultcluster))
                    : null;
                oldSelection = [select.map((s) => s[1]), 0];
                clusterSelect.set(select);
            }
        }
    }

    /**
     * Draws all hulls
     */
    function drawHulls() {
        if (canvas !== undefined && canvas !== null) {
            // @ts-ignore
            const ctx = canvas.getContext("2d");
            axis = getAxisScale();
            if (axis.length === 2) {
                const x = axis[0];
                // @ts-ignore
                const y = axis[1];
                // @ts-ignore
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                $clusterdata.forEach((hull, i) => {
                    if (
                        hull.hullpoints !== null &&
                        hull.hullpoints.length > 1 &&
                        hull.color !== null
                    ) {
                        drawCurvyLineAroundPolygon(hull, i, ctx, x, y);
                    }
                });
            }
        }
    }

    /**
     * Draws a single hull
     * @param hull
     * @param index
     * @param ctx
     * @param x
     * @param y
     */
    function drawCurvyLineAroundPolygon(hull, index, ctx, x, y) {
        ctx.strokeStyle = hull.color;
        ctx.fillStyle = hull.color;

        // Create a path generator
        const line = d3
            .line()
            .x((d) => x(d[0]))
            .y((d) => y(d[1]))
            .context(ctx)
            .curve(d3.curveCatmullRomClosed.alpha(0.5));
        // Draw the curvy line
        ctx.beginPath();
        line(hull.hullpoints);
        ctx.globalAlpha =
            $clusterSelect === null ||
            $clusterSelect.filter((cs) => cs[1] === index).length > 0
                ? 1
                : 0.2;
        ctx.stroke();
        ctx.globalAlpha =
            $clusterSelect === null ||
            $clusterSelect.filter((cs) => cs[1] === index).length > 0
                ? opacity * 1.5
                : opacity / 3;
        ctx.fill();
    }
</script>

<canvas
    id="clusterCanvas"
    bind:this={canvas}
    on:click={selectCluster}
    width={$side}
    height={$side}
    on:contextmenu={(e) => {
        e.preventDefault();
        muutil.playMelody(e, true);
    }}
/>

<script>
  import {
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
    repSwitch,
    glyphsize,
    repsize,
    glyphinclude,
    similarityweight,
    vorcolorselect,
    modeactive,
    seen,
    pointcolorselect,
    rate,
    seenratemode,
    outercircle,
    filtersim,
    filternumbernotes,
    filterinscale,
    filtervarint,
    seenfilter,
    listenfilter,
    tufilter,
    tdfilter,
    expfilter,
    modelselected,
    selectedBaseKeys,
  } from "../stores/stores.js";
  import { get } from "svelte/store";

  import { Canvas } from "svelte-canvas";
  import { extent } from "d3-array";
  import { scaleLinear } from "d3-scale";

  import Point from "./Glyphs/Point.svelte";
  import Starglyph from "./Glyphs/Starglyph.svelte";
  import Flowerglyph from "./Glyphs/FlowerGlyph.svelte";
  import Chromapie from "./Glyphs/Chromapie.svelte";
  import Fivecirclepie from "./Glyphs/Chromapie5Circle.svelte";
  import Pianoroll from "./Glyphs/Pianoroll.svelte";
  import Pianorollheatmap from "./Glyphs/Pianorollheatmap.svelte";
  import HistogramInterval from "./Glyphs/HistogramInterval.svelte";
  import Melodyline from "./Glyphs/Melodyline.svelte";
  import ColorGraph from "./Glyphs/ColorGraph.svelte";
  import Axis from "./util/Axis.svelte";
  import Line from "./util/Line.svelte";
  import Halo from "./util/Halo.svelte";

  import * as moutil from "../util/modelutil.js";
  import * as muutil from "../util/musicutil.js";
  import * as drutil from "../util/drutil.js";
  import * as glutil from "../util/glyphutil.js";
  import * as visutil from "../util/visutil.js";
  import { log } from "../util/fileutil.js";
  import * as d3 from "d3";
  import DonutForValue from "./Glyphs/DonutForValue.svelte";
  import ModelPie from "./Glyphs/ModelPie.svelte";
  import RhythmPie from "./Glyphs/RhythmPie.svelte";
  import ComplexityPie from "./Glyphs/ComplexityPie.svelte";
  import Emoji from "./Emojis/Emoji.svelte";
  import MelodylineIntervals from "./Glyphs/MelodylineIntervals.svelte";

  export let opacity;

  const margin = { top: 25, right: 25, bottom: 25, left: 25 };
  const marginaxis = { top: 25, right: 25, bottom: 25, left: 25 };

  let currentaxis = [{ value: 0 }, { value: 0 }];
  axisselect.subscribe((v) => {
    log("axis changed: ", { v });
    currentaxis = v;
  });

  let selectedSize = 30;

  $: x =
    $points !== undefined
      ? scaleLinear()
          .domain(
            visutil.makeextentBigger(
              extent($points.map((value) => value[0][currentaxis[0].value])),
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
              extent($points.map((value) => value[1][currentaxis[1].value])),
            ),
          )
          .range([$side - margin.bottom, margin.top])
          .nice()
      : scaleLinear()
          .domain([-1, 1])
          .range([$side - margin.bottom, margin.top])
          .nice();

  brushselection.subscribe((value) => {
    meloselected.set(visutil.getSelectedMelodies(x, y, $currentpoints));
  });
  currentpoints.subscribe((value) => {
    meloselected.set(visutil.getSelectedMelodies(x, y, value));
  });

  seen.subscribe((v) => {
    if ($currentcolor === 5) {
      pointcolorselect.set({ value: 0, label: "Model" });
      pointcolorselect.set({ value: 5, label: "Seen" });
    }
  });

  rate.subscribe((v) => {
    if ($currentcolor === 6) {
      pointcolorselect.set({ value: 0, label: "Model" });
      pointcolorselect.set({ value: 6, label: "Rate" });
    }
  });

  selectedBaseKeys.subscribe((v) => log("selected Basekey changed: ", { v }));

  // if colors etc change log it -> also glyphs;
  // set selected melodies in function log
  glyphselect.subscribe((v) => log("glyph changed: ", { v }));
  pointcolorselect.subscribe((v) => log("pointcolor changed: ", { v }));
  vorcolorselect.subscribe((v) => log("voronoicolor changed: ", { v }));
  //  filtersim.subscribe((v)=>log("filtersim: " ,{v}))
  //  filternumbernotes.subscribe((v)=>log("filter number of notes: " ,{v}))
  //  filtervarint.subscribe((v)=>log("filter variance: " ,{v}))
  seenfilter.subscribe((v) => log("filter seen: ", { v }));
  listenfilter.subscribe((v) => log("filter listened: ", { v }));
  tufilter.subscribe((v) => log("filter like: ", { v }));
  tdfilter.subscribe((v) => log("filter dislike: ", { v }));
  expfilter.subscribe((v) => log("filter export: ", { v }));
  axisselect.subscribe((v) => log("axis selected: ", { v }));
  /**
   * <DonutForValue
          x={x(data[0][currentaxis[0].value])}
          y={y(data[1][currentaxis[1].value])}
          r={visutil.isBrushed(
            x(data[0][currentaxis[0].value]),
            y(data[1][currentaxis[1].value]),
            $brushselection
          )
            ? 15
            : 10}
          percent={0.4}
          round={true}
        />
  */
</script>

{#if true}
  <Canvas
    width={$side}
    height={$side}
    style="cursor: pointer, position: absolute; top: 0; left: 0;"
  >
    {#if $axisselect[2] === 0}
      <Axis type="x" scale={x} tickNumber={10} margin={marginaxis} />
      <Axis type="y" scale={y} tickNumber={10} margin={marginaxis} />
    {/if}
    {#if $currentpoints !== undefined}
      {#each $currentpoints as data, indexBla}
        {#if $glyphselect.value === 0 || ($brushClusterSwitch && !$glyphinclude)}
          <Point
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * 24
              : $glyphsize * 15}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * 24
                : $glyphsize * 15}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={true}
            />
          {/if}
        {:else if $glyphselect.value === 1}
          <Flowerglyph
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2].starglyph.data}
            drawbounds={$outercircle}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={true}
            />
          {/if}
        {:else if $glyphselect.value === 2}
          <Chromapie
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2]}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={true}
            />
          {/if}
        {:else if $glyphselect.value === 3}
          <Pianoroll
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2]}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={false}
            />
          {/if}
        {:else if $glyphselect.value === 4}
          <HistogramInterval
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2]}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={false}
            />
          {/if}
        {:else if $glyphselect.value === 5}
          <Fivecirclepie
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2]}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={true}
            />
          {/if}
        {:else if $glyphselect.value === 6}
          <ColorGraph
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2]}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={false}
            />
          {/if}
        {:else if $glyphselect.value === 7}
          <RhythmPie
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2]}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={true}
            />
          {/if}
        {:else if $glyphselect.value === 8}
          <Flowerglyph
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2].starglyphRhythm.data}
            drawbounds={$outercircle}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={true}
            />
          {/if}
        {:else if $glyphselect.value === 9}
          <Melodyline
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2]}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={true}
            />
          {/if}
        {:else if $glyphselect.value === 10}
          <MelodylineIntervals
            {opacity}
            x={x(data[0][currentaxis[0].value])}
            y={y(data[1][currentaxis[1].value])}
            r={visutil.isBrushed(
              x(data[0][currentaxis[0].value]),
              y(data[1][currentaxis[1].value]),
              $brushselection,
            )
              ? $glyphsize * selectedSize
              : $glyphsize * 30}
            information={data[2]}
          />
          {#if ($currentcolor === 2 || $vorcolorselect.value === 2) && $modeactive}
            <DonutForValue
              x={x(data[0][currentaxis[0].value])}
              y={y(data[1][currentaxis[1].value])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              percent={data[2]?.additional?.key?.type !== undefined
                ? data[2]?.additional?.key?.type.includes("major")
                  ? 1
                  : 0.5
                : 0}
              round={true}
            />
          {/if}
        {/if}
        {#if $seenratemode}
          {#if data[2].userspecific.seen !== 0}
            {console.log(data[2])}
            <Emoji
              mode={data[2].userspecific.seen === 1 ? "eye" : "ear"}
              x={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? x(data[0][currentaxis[0].value]) - $glyphsize * selectedSize
                : x(data[0][currentaxis[0].value]) - $glyphsize * 30}
              y={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? y(data[1][currentaxis[1].value]) - $glyphsize * selectedSize
                : y(data[1][currentaxis[1].value]) - $glyphsize * 30}
            />
          {/if}
          {#if data[2].userspecific.rate !== 0}
            <Emoji
              mode={data[2].userspecific.rate === 1 ? "thumbsup" : "thumbsdown"}
              x={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? x(data[0][currentaxis[0].value]) + $glyphsize * selectedSize
                : x(data[0][currentaxis[0].value]) + $glyphsize * 30}
              y={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? y(data[1][currentaxis[1].value]) - $glyphsize * selectedSize
                : y(data[1][currentaxis[1].value]) - $glyphsize * 30}
            />
          {/if}
        {/if}
      {/each}
    {/if}
    {#if $brushClusterSwitch}
      {#if $representatives !== undefined && $representatives !== null}
        {#each $representatives as repcl}
          {#if repcl?.representatives !== null}
            {#each repcl?.representatives as data}
              {#if !$repSwitch}
                <Line
                  x1={x(data[2].repposition[0][currentaxis[0].value])}
                  y1={y(data[2].repposition[1][currentaxis[1].value])}
                  x2={x(data[0][currentaxis[0].value])}
                  y2={y(data[1][currentaxis[1].value])}
                  stroke={"#333"}
                  strokeWidth={1}
                  opacity={0.25}
                />
              {/if}
              {#if $glyphselect.value <= 2}
                <Halo
                  x={x(data[2].repposition[0][currentaxis[0].value])}
                  y={y(data[2].repposition[1][currentaxis[1].value])}
                  fill={data[2].repcolor}
                  r={$repsize * selectedSize}
                  blur={data[2].deviationHalo * 50}
                  round={true}
                />
              {:else}
                <Halo
                  x={x(data[2].repposition[0][currentaxis[0].value])}
                  y={y(data[2].repposition[1][currentaxis[1].value])}
                  fill={data[2].repcolor}
                  r={$repsize * selectedSize}
                  blur={data[2].deviationHalo * 50}
                  round={false}
                />
              {/if}
              {#if $glyphselect.value === 0}
                <ModelPie
                  x={x(data[2].repposition[0][currentaxis[0].value])}
                  y={y(data[2].repposition[1][currentaxis[1].value])}
                  r={$repsize * selectedSize}
                  information={data[2]}
                />
              {:else if $glyphselect.value === 1}
                <Starglyph
                  x={x(data[2].repposition[0][currentaxis[0].value])}
                  y={y(data[2].repposition[1][currentaxis[1].value])}
                  fill={data[2].repcolor}
                  r={$repsize * selectedSize}
                  information={data[2].starglyph.data}
                />
              {:else if $glyphselect.value === 2}
                <Chromapie
                  x={x(data[2].repposition[0][currentaxis[0].value])}
                  y={y(data[2].repposition[1][currentaxis[1].value])}
                  r={$repsize * selectedSize}
                  information={data[2]}
                />
              {:else if $glyphselect.value === 3}
                {#if $repSwitch}
                  <Pianorollheatmap
                    x={x(data[2].repposition[0][currentaxis[0].value])}
                    y={y(data[2].repposition[1][currentaxis[1].value])}
                    fill={data[2].repcolor}
                    r={$repsize * selectedSize}
                    information={data[2]}
                  />
                {:else}
                  <Pianoroll
                    x={x(data[2].repposition[0][currentaxis[0].value])}
                    y={y(data[2].repposition[1][currentaxis[1].value])}
                    fill={visutil.getColor(
                      data[2],
                      $currentcolor,
                      $selectedBaseKeys,
                    )}
                    r={$repsize * selectedSize}
                    information={data[2]}
                  />
                {/if}
              {:else if $glyphselect.value === 4}
                <HistogramInterval
                  x={x(data[2].repposition[0][currentaxis[0].value])}
                  y={y(data[2].repposition[1][currentaxis[1].value])}
                  fill={data[2].repcolor}
                  r={$repsize * selectedSize}
                  information={data[2]}
                />
              {:else if $glyphselect.value === 6 && !$repSwitch}
                <ColorGraph
                  x={x(data[2].repposition[0][currentaxis[0].value])}
                  y={y(data[2].repposition[1][currentaxis[1].value])}
                  r={$repsize * selectedSize}
                  information={data[2]}
                />
              {/if}
            {/each}
          {/if}
        {/each}
      {/if}
    {/if}
  </Canvas>
{:else if $currentpoints !== undefined}
  {#each $currentpoints as data, index}
    {#if [83, 702, 93, 580, 55, 406, 596].filter((p) => p === index).length > 0}
      <!--83,702,93,580,55,406, 596 -->
      <Canvas
        width={890}
        height={210}
        style="position: absolute; top: {[
          83, 702, 93, 580, 55, 406, 596,
        ].indexOf(index) *
          100 +
          40}px"
      >
        <Pianoroll
          {opacity}
          x={105}
          y={105}
          fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
          r={30}
          information={data[2]}
        />
        <ColorGraph {opacity} x={215} y={105} r={30} information={data[2]} />
        <Flowerglyph
          {opacity}
          x={325}
          y={105}
          fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
          r={30}
          information={data[2].starglyph.data}
          drawbounds={$outercircle}
        />
        <Flowerglyph
          {opacity}
          x={435}
          y={105}
          fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
          r={30}
          information={data[2].starglyphRhythm.data}
          drawbounds={$outercircle}
        />
        <Chromapie {opacity} x={545} y={105} r={30} information={data[2]} />
        <RhythmPie x={655} y={105} r={30} information={data[2]} />
        <HistogramInterval
          {opacity}
          x={765}
          y={105}
          fill={visutil.getColor(data[2], $currentcolor, $selectedBaseKeys)}
          r={30}
          information={data[2]}
        />
      </Canvas>
    {/if}
  {/each}
{/if}

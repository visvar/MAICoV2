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
    qcorder,
    weightTimbre,
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
  import { keysLookup } from "../stores/globalValues.js";
  import { orderQuintenzirkel } from "../util/musicutil.js";

  export let opacity;

  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const marginaxis = { top: 25, right: 25, bottom: 25, left: 30 };

  let currentaxis = [{ value: 0 }, { value: 0 }];
  axisselect.subscribe((v) => {
    log("axis changed: ", { v });
    currentaxis = v;
  });

  let selectedSize = 30;

  function formatValue(v){
    return Math.round(v*20)/20
  }

  $: selectorBaseKey = $weightTimbre?$selectedBaseKeys+12:$selectedBaseKeys

  $: showpoints = $selectedBaseKeys !== -1 ?
  $currentpoints.sort((a,b) => {
    if(formatValue(a[2].timbre[selectorBaseKey]) > formatValue(b[2].timbre[selectorBaseKey]))
      return 1
    else if(formatValue(a[2].timbre[selectorBaseKey]) < formatValue(b[2].timbre[selectorBaseKey]))
      return -1
    else 
      return a[2].melody.notes.length - b[2].melody.notes.length
  }).map(p => [...p,formatValue(p[2].timbre[selectorBaseKey])] ):[]

  $: $selectedBaseKeys, () => {
    showpoints = $selectedBaseKeys !== -1 ?$currentpoints.sort((a,b) => {
    if(a[2].timbre[selectorBaseKey] > b[2].timbre[selectorBaseKey])
      return 1
    else if(a[2].timbre[selectorBaseKey] < b[2].timbre[selectorBaseKey])
      return -1
    else 
      return a[2].melody.notes.length - b[2].melody.notes.length
  }).map(p => [...p,formatValue(p[2].timbre[selectorBaseKey])] ):[]
  }

  function calcCounter(points){
      if(points.length === 0){
        counter = {}
        indexes = {}
      }else{
        counter = {}
        indexes = {}
        let i = 0
        points.map(p => p[3]).forEach(ele => {
          if (counter[ele]) {
              counter[ele] += 1;
          } else {
              counter[ele] = 1;
          }
          if (indexes[ele] === undefined) {
              indexes[ele] = i;
          }
          i++
        })
      }
  }

  $: showpoints, calcCounter(showpoints)

  $: counter = {}

  $: indexes = {}

  let maxsame = 0
  
  $: counter, maxsame = Math.max(...Object.values(counter))

  $: ordering = $weightTimbre?
  $qcorder
    ? orderQuintenzirkel([12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23])
    : [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]:
    $qcorder
    ? orderQuintenzirkel([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  $: x = scaleLinear()
    .domain([0, 11])
    .range([margin.left, $side - margin.right])
    .nice();

  $: x2 = scaleLinear()
    .domain([0, maxsame])
    .range([margin.left, $side - margin.right])
    .nice();

  $: y = scaleLinear()
    .domain([0, 1])
    .range([$side - margin.bottom, margin.top])
    .nice();

  brushselection.subscribe((value) => {
    // need different selection calculation
    meloselected.set(
      $selectedBaseKeys === -1?visutil.getTimbreSelectedMelodies(x, y, $currentpoints, ordering):
        visutil.getTimbreKeySelectedMelodies(x2, y, $currentpoints, showpoints, indexes, maxsame),
    );
  });
  currentpoints.subscribe((value) => {
    // same
    meloselected.set(visutil.getTimbreSelectedMelodies(x, y, value, ordering));
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
    {#if $selectedBaseKeys === -1}
      <Axis
        type="x"
        scale={x}
        tickFormat={(t) =>
          $qcorder ? orderQuintenzirkel(keysLookup)[t] : keysLookup[t]}
        tickNumber={10}
        margin={marginaxis}
      />
    {:else}
      <Axis
      type="x"
      scale={x2}
      tickFormat={(t) =>
        t===0||(t+1)%5 === 0?t+1:""}
      tickNumber={10}
      margin={marginaxis}
      titleLabel={"ASC Number of Notes       Rootnote: "+keysLookup[$selectedBaseKeys%12]}
    />
    {/if}
    <Axis
      type="y"
      scale={y}
      tickFormat={(t) => (t === 0 ? "Dark" : t === 1 ? "Bright" : "")}
      tickNumber={2}
      margin={marginaxis}
    />
    {#if $currentpoints !== undefined}
      {#if $selectedBaseKeys === -1}
        {#each $currentpoints as data, indexBla}
          {#each ordering as basekey, indexkey}
            {#if indexkey !== 11}
              <Line
                x1={x(indexkey)}
                x2={x(indexkey + 1)}
                y1={y(data[2].timbre[basekey])}
                y2={y(data[2].timbre[ordering[indexkey + 1]])}
                stroke={"blue"}
                opacity={0.1}
              ></Line>
            {/if}
          {/each}
        {/each}
        {#each $currentpoints as data, indexBla}
          {#each ordering as basekey, indexkey}
            {#if $glyphselect.value === 0 || ($brushClusterSwitch && !$glyphinclude)}
              <Point
                {opacity}
                x={x(indexkey)}
                y={y(data[2].timbre[basekey])}
                fill={visutil.getColor(data[2], 7, basekey)}
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
                  x={x(data[2].timbre)}
                  y={y(indexkey)}
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
                x={x(indexkey)}
                y={y(data[2].timbre[basekey])}
                fill={visutil.getColor(data[2], 7, basekey)}
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
                  x={x(data[2].timbre)}
                  y={y(data[2].timbre[indexkey])}
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
                x={x(indexkey)}
                y={y(data[2].timbre[indexkey])}
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
                  x={x(data[2].timbre)}
                  y={y(data[2].timbre[indexkey])}
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
                x={x(indexkey)}
                y={y(data[2].timbre[basekey])}
                fill={visutil.getColor(data[2], 7, basekey)}
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
                  x={x(data[2].timbre)}
                  y={y(data[2].timbre[indexkey])}
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
                x={x(indexkey)}
                y={y(data[2].timbre[basekey])}
                fill={visutil.getColor(data[2], 7, basekey)}
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
                x={x(indexkey)}
                y={y(data[2].timbre[indexkey])}
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
                x={x(indexkey)}
                y={y(data[2].timbre[indexkey])}
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
                x={x(indexkey)}
                y={y(data[2].timbre[indexkey])}
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
                x={x(indexkey)}
                y={y(data[2].timbre[basekey])}
                fill={visutil.getColor(data[2], 7, basekey)}
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
                x={x(indexkey)}
                y={y(data[2].timbre[indexkey])}
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
                x={x(indexkey)}
                y={y(data[2].timbre[indexkey])}
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
                  mode={data[2].userspecific.rate === 1
                    ? "thumbsup"
                    : "thumbsdown"}
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
        {/each}
      {:else}
        {#each showpoints as data, index}
          {#if $glyphselect.value === 0 || ($brushClusterSwitch && !$glyphinclude)}
            <Point
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              fill={visutil.getColor(data[2], 7, selectorBaseKey)}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * 24
                : $glyphsize * 15}
            />
          {:else if $glyphselect.value === 1}
            <Flowerglyph
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              fill={visutil.getColor(data[2], 7, selectorBaseKey)}
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
          {:else if $glyphselect.value === 2}
            <Chromapie
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data[2]}
            />
          {:else if $glyphselect.value === 3}
            <Pianoroll
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              fill={visutil.getColor(data[2], 7, selectorBaseKey)}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data[2]}
            />
          {:else if $glyphselect.value === 4}
            <HistogramInterval
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              fill={visutil.getColor(data[2], 7, selectorBaseKey)}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data[2]}
            />
          {:else if $glyphselect.value === 5}
            <Fivecirclepie
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data[2]}
            />
          {:else if $glyphselect.value === 6}
            <ColorGraph
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data[2]}
            />
          {:else if $glyphselect.value === 7}
            <RhythmPie
            x={x2(index - indexes[data[3]])}
            y={y(data[3])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data[2]}
            />
          {:else if $glyphselect.value === 8}
            <Flowerglyph
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              fill={visutil.getColor(data[2], 7, selectorBaseKey)}
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
          {:else if $glyphselect.value === 9}
            <Melodyline
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data[2]}
            />
          {:else if $glyphselect.value === 10}
            <MelodylineIntervals
              {opacity}
              x={x2(index - indexes[data[3]])}
              y={y(data[3])}
              r={visutil.isBrushed(
                x(data[0][currentaxis[0].value]),
                y(data[1][currentaxis[1].value]),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data[2]}
            />
          {/if}
        {/each}
      {/if}
    {/if}
  </Canvas>
{/if}

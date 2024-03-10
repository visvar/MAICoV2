<script>
// @ts-nocheck

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
    exportList,
    exportmetric,
    sortedexport,
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
    import Text from "./util/Text.svelte";

  export let opacity;

  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const marginaxis = { top: 25, right: 25, bottom: 25, left: 30 };

  let currentaxis = [{ value: 0, label: "DR" }, { value: 0, label: "DR" }, 0];

  axisselect.subscribe((v) => {
    log("axis changed: ", { v });
    currentaxis = v;
  });

  let selectedSize = 30;


  $: showpoints = 
  $exportList.sort((a,b) => {
    if($exportmetric.value === 0 && a.index < b.index)
      return -1
    else if($exportmetric.value === 1 && $sortedexport.indexOf(a.index)!== -1 && $sortedexport.indexOf(b.index)=== -1){
      return -1
    }
    else if($exportmetric.value === 1 &&$sortedexport.indexOf(a.index) !== -1&&$sortedexport.indexOf(b.index)!==-1&& $sortedexport.indexOf(b.index) > $sortedexport.indexOf(a.index)){
      return -1
    }
    else if($exportmetric.value === 2 && a.timbre[$selectedBaseKeys] > b.timbre[$selectedBaseKeys])
      return -1
    else if($exportmetric.value === 3 && a.timbre[$selectedBaseKeys] < b.timbre[$selectedBaseKeys])
      return -1
    else if($exportmetric.value === 4 && a.melody.notes.length < b.melody.notes.length)
      return -1
    else 
      return 1
  })

  $: $sortedexport, () => {
    showpoints = 
    $exportList.sort((a,b) => {
      if($exportmetric.value === 0)
        return 1
      else if($exportmetric.value === 1 && $sortedexport.indexOf(a.index)!== -1 && $sortedexport.indexOf(b.index)=== -1){
        return -1
      }
      else if($exportmetric.value === 1 &&$sortedexport.indexOf(a.index) !== -1&&$sortedexport.indexOf(b.index)!==-1&& $sortedexport.indexOf(b.index) > $sortedexport.indexOf(a.index)){
        return -1
      }
      else if($exportmetric.value === 2 && a.timbre[$selectedBaseKeys] > b.timbre[$selectedBaseKeys])
        return -1
      else if($exportmetric.value === 3 && a.timbre[$selectedBaseKeys] < b.timbre[$selectedBaseKeys])
        return -1
      else if($exportmetric.value === 4 && a.melody.notes.length < b.melody.notes.length)
        return -1
      else 
        return 1
    })
    exportList.set(showpoints)
}

  /*
  $: $selectedBaseKeys, () => {
    if($exportmetric.value === 2)
      showpoints = $exportList.sort((a,b) => {
        if($exportmetric.value === 0)
          return 1
        else if($exportmetric.value === 1 && $sortedexport.indexOf(b.index)=== undefined && $sortedexport.indexOf(b.index)!== undefined){
          return -1
        }
        else if($exportmetric.value === 1 &&$sortedexport.indexOf(b.index) !== undefined&&$sortedexport.indexOf(b.index)!==undefined&& $sortedexport.indexOf(b.index) > $sortedexport.indexOf(b.index)){
          return -1
        }
        else if($exportmetric.value === 2 && a.timbre[$selectedBaseKeys] > b.timbre[$selectedBaseKeys])
          return -1
        else if(a.melody.notes.length < b.melody.notes.length)
          return -1
        else 
          return 1
      })
  }

  $: $exportmetric, () => {
      showpoints = $exportList.sort((a,b) => {
        if($exportmetric.value === 0)
          return 1
          else if($exportmetric.value === 1 && $sortedexport.indexOf(b.index)=== undefined && $sortedexport.indexOf(b.index)!== undefined){
          return -1
        }
        else if($exportmetric.value === 1 &&$sortedexport.indexOf(b.index) !== undefined&&$sortedexport.indexOf(b.index)!==undefined&& $sortedexport.indexOf(b.index) > $sortedexport.indexOf(b.index)){
          return -1
        }
        else if($exportmetric.value === 2 && a.timbre[$selectedBaseKeys] > b.timbre[$selectedBaseKeys])
          return -1
        else if(a.melody.notes.length < b.melody.notes.length)
          return -1
        else 
          return 1
      })
  }

  applyOrderexport.subscribe(() => {
      showpoints = $exportList.sort((a,b) => {
        if($exportmetric.value === 0)
          return 1
        else if($exportmetric.value === 1 && $sortedexport.indexOf(b.index)=== undefined && $sortedexport.indexOf(b.index)!== undefined){
          return -1
        }
        else if($exportmetric.value === 1 &&$sortedexport.indexOf(b.index) !== undefined&&$sortedexport.indexOf(b.index)!==undefined&& $sortedexport.indexOf(b.index) > $sortedexport.indexOf(b.index)){
          return -1
        }
        else if($exportmetric.value === 2 && a.timbre[$selectedBaseKeys] > b.timbre[$selectedBaseKeys])
          return -1
        else if(a.melody.notes.length < b.melody.notes.length)
          return -1
        else 
          return 1
      })
  })
  */

  $: showpoints, () => exportList.set(showpoints)

  $: length = Math.min(10, showpoints.length)

  $: x = scaleLinear()
    .domain([-1, length])
    .range([margin.left, $side - margin.right])
    .nice();

  $: y = scaleLinear()
    .domain([Math.floor(showpoints.length / 10) + 1, -1])
    .range([$side - margin.bottom, margin.top])
    .nice();
/*
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
  */

  brushselection.subscribe((value) => {
    // need different selection calculation
    let selected = visutil.getExportSelectedMelodies(x, y, showpoints)
    meloselected.set(
      selected
    );
    if($exportmetric.value === 1 && selected !== null && selected?.length === 1){
      let ind = $sortedexport.indexOf(selected[0][2].index)
      if(ind === -1){
        sortedexport.set([...$sortedexport, selected[0][2].index])
      }else{
        $sortedexport.splice(ind,1)
        sortedexport.set([...$sortedexport, selected[0][2].index])
      }
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
    <Axis
      type="x"
      scale={x}
      tickFormat={(t) =>
        t===0||(t+1)%5 === 0?t+1:""}
      tickNumber={10}
      margin={marginaxis}
      titleLabel={"Left to Right then next row"}
    />
    <Axis
      type="y"
      scale={y}
      tickFormat={(t) => t >= 0?t*length:""}
      tickNumber={2}
      margin={marginaxis}
    />
    {#if $exportList !== undefined}
      {#each showpoints as data, index}
          {#if $exportmetric.value === 1 && $sortedexport.indexOf(data.index) !== -1}
            <Text
              x={x(index%10)}
              y={y(Math.floor(index/10))-($glyphsize * selectedSize)-10}
              text={$sortedexport.indexOf(data.index)}
            />
          {/if}
          {#if $glyphselect.value === 0 || ($brushClusterSwitch && !$glyphinclude)}
            <Point
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              fill={visutil.getColor(data, $currentcolor, $selectedBaseKeys)}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * 24
                : $glyphsize * 15}
            />
          {:else if $glyphselect.value === 1}
            <Flowerglyph
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              fill={visutil.getColor(data, $currentcolor, $selectedBaseKeys)}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data.starglyph.data}
              drawbounds={$outercircle}
            />
          {:else if $glyphselect.value === 2}
            <Chromapie
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data}
            />
          {:else if $glyphselect.value === 3}
            <Pianoroll
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              fill={visutil.getColor(data, $currentcolor, $selectedBaseKeys)}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data}
            />
          {:else if $glyphselect.value === 4}
            <HistogramInterval
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              fill={visutil.getColor(data, $currentcolor, $selectedBaseKeys)}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data}
            />
          {:else if $glyphselect.value === 5}
            <Fivecirclepie
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data}
            />
          {:else if $glyphselect.value === 6}
            <ColorGraph
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data}
            />
          {:else if $glyphselect.value === 7}
            <RhythmPie
            x={x(index%10)}
              y={y(Math.floor(index/10))}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data}
            />
          {:else if $glyphselect.value === 8}
            <Flowerglyph
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              fill={visutil.getColor(data, $currentcolor, $selectedBaseKeys)}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data.starglyphRhythm.data}
              drawbounds={$outercircle}
            />
          {:else if $glyphselect.value === 9}
            <Melodyline
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data}
            />
          {:else if $glyphselect.value === 10}
            <MelodylineIntervals
              {opacity}
              x={x(index%10)}
              y={y(Math.floor(index/10))}
              r={visutil.isBrushed(
                x(index%10),
                y(Math.floor(index/10)),
                $brushselection,
              )
                ? $glyphsize * selectedSize
                : $glyphsize * 30}
              information={data}
            />
          {/if}
        {/each}
      {/if}
  </Canvas>
{/if}

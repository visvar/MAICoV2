<script>
  import {
    models,
    points,
    side,
    brushselection,
    cluster,
    clusterslicer,
    brushClusterSwitch,
    clusterrepresentative,
    clusterrep,
    distMatrix,
    grid,
    glyphsize,
    DRumap,
    repsize,
    recompute,
    similarityweight,
    clipPadding,
    lensmode,
    tooltipSel,
    glyphselect,
    keydetectselect,
    emotionbased,
    filternumbernotes,
    filtervarint,
    selectkey,
    keymode,
    primerkey,
    outercircle,
    primerList,
  } from "../stores/stores.js";
  // @ts-ignore
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  // @ts-ignore
  import { select, brush, interpolateViridis, scaleLinear } from "d3";

  import Voronoi from "./Voronoi.svelte";
  import ScatterplotCanvas from "./ScatterplotCanvas.svelte";
  import ClusterCanvas from "./ClusterCanvas.svelte";

  import * as moutil from "../util/modelutil.js";
  import * as muutil from "../util/musicutil.js";
  import * as drutil from "../util/drutil.js";
  import * as glutil from "../util/glyphutil.js";
  import * as visutil from "../util/visutil.js";

  // @ts-ignore
  // const margin = { top: 10, right: 10, bottom: 25, left: 25 };

  let pointarray = [];

  let showControls = true;
  let opacityVoronoi = 0.1;
  let opacityClusterHull = 0.1;
  let opacityGlyph = 1;

  let svg;
  let brushselect;
  let brushGroup;
  onMount(() => {
    newBrush(false);

    side.subscribe((val) => {
      updateExtent(val);
    });

    muutil.playMelody([], false);
  });

  function brushHandler(event) {
    brushselection.set(event.selection);
  }

  function updateExtent(val) {
    svg.attr("width", val).attr("height", val);
    brushselect.extent([
      [0, 0],
      [val, val],
    ]);
    brushGroup.call(brushselect);
  }

  function newBrush(a) {
    svg = select("#svg").attr("x", 0);
    if (!a && svg !== undefined) {
      // create a group element for the brush
      brushGroup = svg.append("g").attr("class", "brush");

      // create the brush
      brushselect = brush()
        .extent([
          [0, 0],
          [$side, $side],
        ])
        // @ts-ignore
        .on("end", brushHandler);

      // add the brush to the brush group
      brushGroup.call(brushselect);
    }
  }

  $: $models, testMeloPoints();
  $: $primerList, testMeloPoints();
  //$: $distMatrix, calcClusters();
  //$: $clusterslicer, calcClusters();
  //$: $distMatrix, calcRepresentative();
  //$: $clusterrepresentative, calcRepresentative();
  $: $recompute, testMeloPoints();
  $: $keydetectselect, recalcKeyInfo();
  $: $keymode, recalcKeyInfo();
  $: $selectkey, recalcKeyInfo();
  $: $primerkey, recalcKeyInfo();
  $: $emotionbased, testMeloPoints();

  similarityweight.subscribe((v) => {
    testMeloPoints();
  });

  let flatten;

  async function calcClusters() {
    if ($distMatrix !== undefined) {
      let clusters = visutil.getColorsViaClusteringFromDistances(
        $distMatrix,
        interpolateViridis,
        $clusterslicer
      );
      // clusters => [index of cluster, color of cluster]
      cluster.setCluster(clusters[0], clusters[1]);
    }
  }

  async function calcRepresentative() {
    if ($distMatrix !== undefined) {
      let clusterrepArrays = visutil.getColorsViaClusteringFromDistances(
        $distMatrix,
        interpolateViridis,
        $clusterrepresentative
      );
      clusterrep.setClusterRep(clusterrepArrays[0], clusterrepArrays[1]);
    }
  }

  async function recalcKeyInfo() {
    let temp = $points;

    if (temp?.length > 0) {
      if ($emotionbased) {
        testMeloPoints();
      } else {
        temp
          .map((d) => d[2])
          .forEach((d, i) => {
            const scale = muutil.getScaleofMelody(
              d.melody,
              d.chromapie.data.occ,
              $keydetectselect.value === 2,
              $keydetectselect.value === 1,
              $selectkey,
              $keymode,
              $primerkey
            );
            const key = muutil.getKeyfromScale(scale[0]);
            const harmonicInfo = muutil.getHarmonics(
              d.melody,
              key,
              d.model.name
            );

            (d.additional.altscales = scale[1](
              (d.additional.harmonicInfo = harmonicInfo[0])
            )),
              (d.additional.outScaleNotes = harmonicInfo[1]),
              (d.additional.harmonicScore = muutil.getHarmonicScore(
                d.melody,
                harmonicInfo[0]
              )),
              (d.additional.key = key);
            d.visdata[0][8] = muutil.getInScalePercent(harmonicInfo[0]);
            d.visdata[1][8] = muutil.getInScalePercent(harmonicInfo[0]);
          });
        points.set(temp);
      }
    }
  }

  // calculate other information as well and encode them in points as well
  // do this for selected glyph or all selected glyphs directly in an object ==> [x, y, {temperature:0.5, model: 'basic_rnn', Starglyph:{the data for this}, Histogram:{data for histo}, ...}]
  async function testMeloPoints() {
    flatten = await moutil.flattenAllMelodies();
    let matrix = drutil.distanceMatrix(
      flatten.map((melo, i) => melo[0]),
      $similarityweight
    );
    distMatrix.set(matrix);
    /*let emotionfeatures = muutil.calcEmotion(
      flatten.map((melo, i) => melo[0])
    );
    $emotionbased.value ? (matrix = emotionfeatures) : null;
    */
    let mdspoints =
      flatten.length < 3
        ? new Array(flatten.length).fill([0.1, 0.1])
        : undefined;
    let umappoints =
      flatten.length < 3
        ? new Array(flatten.length).fill([0.1, 0.1])
        : undefined;
    let mdsgpoints =
      flatten.length < 3
        ? new Array(flatten.length).fill([0.1, 0.1])
        : undefined;
    let umapgpoints =
      flatten.length < 3
        ? new Array(flatten.length).fill([0.1, 0.1])
        : undefined;
    if (flatten.length >= 3) {
      mdspoints = await drutil.getPoints(matrix, false, false); //$emotionbased.value);
      umappoints = await drutil.getPoints(matrix, true, false); //$emotionbased.value);
      mdsgpoints = drutil.gridify(mdspoints, 0); // 0 hilbert, 1 gosper ???, 2 dgrid (does not work)
      umapgpoints = drutil.gridify(umappoints, 0);
    }

    if (
      mdspoints !== undefined &&
      umappoints !== undefined &&
      mdsgpoints !== undefined &&
      umapgpoints !== undefined
    ) {
      let nnfilter = [1000, 0];
      let intfilter = [1000, 0];
      pointarray = [];
      //currently global max
      const maxvalues = muutil.calcGlyphMax(flatten.map((melo, i) => melo[0]));
      const histdata = glutil.calcHistoGlyphData(flatten);

      const maxRhythmValues = muutil.calcRhythmMax(
        flatten.map((melo, i) => melo[0])
      );
      const rhytmicComplexities = maxRhythmValues.complexities;

      let information = undefined;
      let varInt = undefined;

      flatten.forEach((melo, index) => {
        if (index >= $primerList.length) {
          const sim = muutil.ourDistanceFunction(
            melo[0],
            melo[0].primer,
            1,
            0.5
          );
          varInt = muutil.calcVariance(melo[0].notes);

          const chromadata = glutil.calcDataPie(melo[0]);

          const countRhyhtmChange = muutil.computeRhythmChange(melo[0]);
          // let countSyncope = muutil.computeSyncope(melo[0]);
          const countOffBeat = muutil.computeOffBeat(melo[0]);
          const pauses = muutil.computePauses(melo[0]);

          information = {
            isPrimer: false,
            melody: melo[0],
            temperature: melo[1].temperature,
            primerindex:
              melo[0]?.primer?.id !== undefined ? melo[0]?.primer?.id : 0,
            model: melo[1].model,
            index: index,
            // DR, Temperature, SimilarityPrimer, VarianceIntervals, NumberOfNotes
            visdata: [
              [
                mdspoints[index][0],
                mdsgpoints[index][0],
                umappoints[index][0],
                umapgpoints[index][0],
                melo[1].temperature,
                1 - sim,
                varInt,
                melo[0].notes.length,
              ],
              [
                mdspoints[index][1],
                mdsgpoints[index][1],
                umappoints[index][1],
                umapgpoints[index][1],
                melo[1].temperature,
                1 - sim,
                varInt,
                melo[0].notes.length,
              ],
            ],
            starglyph: {
              data: glutil.calcPolygonStar(melo[0], maxvalues, 0),
              maxvalues: maxvalues,
            },
            /*
            emotionfeatures: {
              isDur: emotionfeatures[index][0],
              isMoll: emotionfeatures[index][1],
              rythmComplexity: emotionfeatures[index][2],
              numberNotes: emotionfeatures[index][3],
              melodyRange: emotionfeatures[index][4],
              avgIntervals: emotionfeatures[index][5],
              numberCleanIntervals: emotionfeatures[index][6],
              numberUncleanPureIntervals: emotionfeatures[index][7],
              avgHighNotes: emotionfeatures[index][8],
              incMelody: emotionfeatures[index][9],
              decMelody: emotionfeatures[index][10],
            },
            */
            chromapie: { data: glutil.calcDataPie(melo[0]), major: true },
            pianoroll: { data: glutil.calcMinMaxForRoll(melo[0]) },
            histInterval: {
              data: histdata[index],
              max: glutil.getMaxOcc(histdata),
            },
            rhythm: {
              rhythmDistribution: muutil.computeRhythmDistribution(melo[0]),
              rhythmChanges: countRhyhtmChange,
              // syncopeCount: countSyncope,
              offBeatCount: countOffBeat,
              pauses: pauses,
              complexity: muutil.computeRhythmicComplexity(
                countOffBeat,
                countRhyhtmChange,
                pauses,
                melo[0]
              ),
              percentagePause: muutil.percentagePauses(melo[0]),
              beatComplexity: muutil.computeBeatComplexity(melo[0]),
            },
            starglyphRhythm: {
              data: glutil.calcPolygonStar(
                [
                  melo[0],
                  countOffBeat,
                  muutil.percentagePauses(melo[0]),
                  countRhyhtmChange,
                ],
                maxRhythmValues,
                1
              ),
              maxvalues: maxRhythmValues,
            },
            additional: {
              pace: muutil.calcPaceMelody(melo[0]),
              isPolyphonic: muutil.isPolyphonic(melo[0]),
              percentagePause: muutil.percentagePauses(melo[0]),
              similarityprimer: 1 - sim,
            },
            userspecific: {
              seen: 0,
              rate: 0,
              export: false,
            },
          };
          let temppoints = [
            information.visdata[0],
            information.visdata[1],
            information,
          ];

          pointarray.push(temppoints);
        } else {
          varInt = muutil.calcVariance(melo[0].notes);

          const countRhyhtmChange = muutil.computeRhythmChange(melo[0]);
          // let countSyncope = muutil.computeSyncope(melo[0]);
          const countOffBeat = muutil.computeOffBeat(melo[0]);
          const pauses = muutil.computePauses(melo[0]);

          information = {
            isPrimer: true,
            melody: melo[0],
            temperature: undefined,
            primerindex: undefined,
            model: { name: "primer" },
            index: index,
            // DR, Temperature, SimilarityPrimer, VarianceIntervals, NumberOfNotes
            visdata: [
              [
                mdspoints[index][0],
                mdsgpoints[index][0],
                umappoints[index][0],
                umapgpoints[index][0],
                0,
                1,
                varInt,
                melo[0].notes.length,
              ],
              [
                mdspoints[index][1],
                mdsgpoints[index][1],
                umappoints[index][1],
                umapgpoints[index][1],
                0,
                1,
                varInt,
                melo[0].notes.length,
              ],
            ],
            starglyph: {
              data: glutil.calcPolygonStar(melo[0], maxvalues, 0),
              maxvalues: maxvalues,
            },
            /*
            emotionfeatures: {
              isDur: emotionfeatures[index][0],
              isMoll: emotionfeatures[index][1],
              rythmComplexity: emotionfeatures[index][2],
              numberNotes: emotionfeatures[index][3],
              melodyRange: emotionfeatures[index][4],
              avgIntervals: emotionfeatures[index][5],
              numberCleanIntervals: emotionfeatures[index][6],
              numberUncleanPureIntervals: emotionfeatures[index][7],
              avgHighNotes: emotionfeatures[index][8],
              incMelody: emotionfeatures[index][9],
              decMelody: emotionfeatures[index][10],
            },*/
            chromapie: { data: glutil.calcDataPie(melo[0]), major: true },
            pianoroll: { data: glutil.calcMinMaxForRoll(melo[0]) },
            histInterval: {
              data: histdata[index],
              max: glutil.getMaxOcc(histdata),
            },
            rhythm: {
              rhythmDistribution: muutil.computeRhythmDistribution(melo[0]),
              rhythmChanges: countRhyhtmChange,
              // syncopeCount: countSyncope,
              offBeatCount: countOffBeat,
              pauses: pauses,
              complexity: muutil.computeRhythmicComplexity(
                countOffBeat,
                countRhyhtmChange,
                pauses,
                melo[0]
              ),
              percentagePause: muutil.percentagePauses(melo[0]),
              beatComplexity: muutil.computeBeatComplexity(melo[0]),
            },
            starglyphRhythm: {
              data: glutil.calcPolygonStar(
                [
                  melo[0],
                  countOffBeat,
                  muutil.percentagePauses(melo[0]),
                  countRhyhtmChange,
                ],
                maxRhythmValues,
                1
              ),
              maxvalues: maxRhythmValues,
            },
            additional: {
              pace: muutil.calcPaceMelody(melo[0]),
              isPolyphonic: muutil.isPolyphonic(melo[0]),
              percentagePause: muutil.percentagePauses(melo[0]),
              similarityprimer: 1,
            },
            userspecific: {
              seen: 0,
              rate: 0,
              export: false,
            },
          };
          let temppoints = [
            information.visdata[0],
            information.visdata[1],
            information,
          ];

          pointarray.push(temppoints);
        }

        // extents of metrics for filter
        if (information.melody.notes.length < nnfilter[0])
          nnfilter[0] = information.melody.notes.length;
        if (information.melody.notes.length > nnfilter[1])
          nnfilter[1] = information.melody.notes.length;
        if (varInt > intfilter[1]) intfilter[1] = varInt;
        if (varInt < intfilter[0]) intfilter[0] = varInt;
      });
      updateFilterExtent(filternumbernotes, nnfilter);
      updateFilterExtent(filtervarint, intfilter);
      visutil.calcAllColorScales(pointarray);
      points.set(pointarray);
      //calcClusters();
    }
  }

  function updateFilterExtent(store, filterv) {
    store.set([filterv, filterv]);
  }

  //flatten={flatten} in scatterplot not needed
</script>

<div id="container">
  <div class="canvas">
    <Voronoi opacity={opacityVoronoi} />
  </div>
  <div class="canvas">
    <ScatterplotCanvas opacity={opacityGlyph} />
  </div>
  <div class="canvas">
    <svg
      id="svg"
      width={$side}
      height={$side}
      on:contextmenu|preventDefault={(e) => {
        e.preventDefault();
        muutil.playMelody(e, true);
      }}
    />
  </div>
  {#if $brushClusterSwitch}
    <div class="canvas">
      <ClusterCanvas opacity={opacityClusterHull} />
    </div>
  {/if}
  {#if $lensmode}
    <div class="canvas">
      <canvas
        id="lens"
        width={$side}
        height={$side}
        on:click|preventDefault={(e) => {
          e.preventDefault();
          const element = visutil.glyphInBig(e);
          if (
            $glyphselect.value === 0 ||
            element === null ||
            ($tooltipSel !== null && $tooltipSel.data === element[2])
          ) {
            tooltipSel.set(null);
          } else {
            tooltipSel.set({ number: -1, data: element[2] });
          }
        }}
      />
    </div>
  {/if}
  <div class="control">
    <button
      title="Toggle controls"
      on:click={() => (showControls = !showControls)}
      class="toggleButton"
    >
      {showControls ? "X" : "···"}
    </button>
    {#if showControls}
      <div>
        <label>
          glyph opacity
          <input
            type="range"
            bind:value={opacityGlyph}
            min="0"
            max="1"
            step="0.05"
          />
        </label>
        <label>
          background opacity
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.05"
            bind:value={opacityVoronoi}
          />
        </label>
        <label>
          cluster hull opacity
          <input
            type="range"
            min="0"
            max="0.4"
            step="0.025"
            bind:value={opacityClusterHull}
          />
        </label>
        <label>
          glyph size
          <input
            type="range"
            bind:value={$glyphsize}
            min="0.2"
            max="2"
            step="0.05"
          />
        </label>
        <label>
          representative size
          <input
            type="range"
            bind:value={$repsize}
            min="0.2"
            max="2"
            step="0.05"
          />
        </label>
        <label>
          clip padding
          <input
            type="range"
            min="10"
            max="250"
            step="5"
            bind:value={$clipPadding}
          />
        </label>
        <label class="labelcheck">
          show bounds
          <input type="checkbox" bind:checked={$outercircle} />
        </label>
      </div>
    {/if}
  </div>
</div>

<style>
  #container {
    position: relative;
    width: 100%;
  }

  #svg {
    position: absolute;
  }
  .canvas {
    position: absolute;
  }

  #lens {
    cursor: help;
    position: absolute;
  }

  .control {
    position: absolute;
    right: 10px;
    top: 10px;
    text-align: right;
    padding: 10px;
    border: 1px solid #88888866;
    background: #ffffff44;
    border-radius: 5px;
  }

  .control .toggleButton,
  .control .toggleButton:focus {
    background: none;
    border: none;
    appearance: none;
    outline: none;
  }

  .control label {
    display: block;
  }

  .labelcheck {
    margin-right: 112px;
  }
</style>

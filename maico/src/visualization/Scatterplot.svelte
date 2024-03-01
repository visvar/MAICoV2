<script>
  // @ts-nocheck

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
    heatmapinfo,
    polyoptions,
    numpoly,
    exportList,
    exportcleared,
    selectedBaseKeys,
    drpoints,
    hilbert,
    axisselect,
    edgeBundlingPoly,
  } from "../stores/stores.js";
  // @ts-ignore
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  // @ts-ignore
  import { select, brush, interpolateViridis, scaleLinear } from "d3";

  import Voronoi from "./Voronoi.svelte";
  import EdgeBundling from "./EdgeBundling.svelte";
  import ScatterplotCanvas from "./ScatterplotCanvas.svelte";
  import TimbreCanvas from "./TimbreCanvas.svelte";
  import ExportCanvas from "./ExportCanvas.svelte";
  import ClusterCanvas from "./ClusterCanvas.svelte";

  import * as moutil from "../util/modelutil.js";
  import * as muutil from "../util/musicutil.js";
  import * as drutil from "../util/drutil.js";
  import * as glutil from "../util/glyphutil.js";
  import * as visutil from "../util/visutil.js";
  import { log } from "../util/fileutil.js";

  // @ts-ignore
  // const margin = { top: 10, right: 10, bottom: 25, left: 25 };

  let pointarray = [];

  let showControls = true;
  let opacityVoronoi = 0.1;
  let opacityClusterHull = 0.1;
  let opacityGlyph = 1;

  let gridmethod = 0;

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
    if (
      ($brushselection === null && event.selection !== null) ||
      ($brushselection !== null && event.selection !== null)
    )
      brushselection.set(event.selection);
    else if ($brushselection === null && event.selection === null) {
      brushselection.set([
        [event.sourceEvent.offsetX - 30, event.sourceEvent.offsetY - 30],
        [event.sourceEvent.offsetX + 30, event.sourceEvent.offsetY + 30],
      ]);
    } else {
      brushselection.set(null);
    }
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
  $: $polyoptions, meloPointsNew();
  $: $numpoly, meloPointsNew();

  $: $glyphsize, newgrid();
  $: $grid, newgrid();
  $: $hilbert, newgrid();

  //$: $selectedBaseKeys, testMeloPoints();

  exportcleared.subscribe((n) => {
    if (n !== 0)
      //points.set(
      $points.forEach((p) => (p[2].userspecific.export = false));
    //);
  });

  similarityweight.subscribe((v) => {
    testMeloPoints();
  });

  let flatten;

  async function calcClusters() {
    if ($distMatrix !== undefined) {
      let clusters = visutil.getColorsViaClusteringFromDistances(
        $distMatrix,
        interpolateViridis,
        $clusterslicer,
      );
      // clusters => [index of cluster, color of cluster]
      cluster.setCluster(clusters[0], clusters[1]);
    }
  }

  async function newgrid() {
    let gridmethod = $grid ? 2 : 0;
    if (
      drpoints === undefined ||
      $points === undefined ||
      drpoints[0]?.length === 0 ||
      $points?.length < 3
    )
      return null;
    let mdsgpoints = await drutil.gridify($drpoints[0], gridmethod); // 0 hilbert, 1 gosper ???, 2 dgrid (does not work)
    let umapgpoints = await drutil.gridify($drpoints[1], gridmethod);
    //points.set(pointarray);
    let temp = $points;
    temp.forEach((p, index) => {
      p[0][1] = mdsgpoints[index][0];
      p[0][3] = umapgpoints[index][0];
      p[1][1] = mdsgpoints[index][1];
      p[1][3] = umapgpoints[index][1];
      p[2].visdata[0][1] = mdsgpoints[index][0];
      p[2].visdata[0][3] = umapgpoints[index][0];
      p[2].visdata[1][1] = mdsgpoints[index][1];
      p[2].visdata[1][3] = umapgpoints[index][1];
    });
    points.set(temp);
    //get points => manipulate gridified set points
  }

  async function calcRepresentative() {
    if ($distMatrix !== undefined) {
      let clusterrepArrays = visutil.getColorsViaClusteringFromDistances(
        $distMatrix,
        interpolateViridis,
        $clusterrepresentative,
      );
      clusterrep.setClusterRep(clusterrepArrays[0], clusterrepArrays[1]);
    }
  }

  async function recalcKeyInfo() {
    let temp = $points;

    if (temp?.length > 0) {
      if ($emotionbased.value === 1) {
        testMeloPoints();
      } else if ($emotionbased.value === 0) {
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
              $primerkey,
            );
            const key = muutil.getKeyfromScale(scale[0]);
            const harmonicInfo = muutil.getHarmonics(
              d.melody,
              key,
              d.model.name,
            );

            (d.additional.altscales = scale[1](
              (d.additional.harmonicInfo = harmonicInfo[0]),
            )),
              (d.additional.outScaleNotes = harmonicInfo[1]),
              (d.additional.harmonicScore = muutil.getHarmonicScore(
                d.melody,
                harmonicInfo[0],
              )),
              (d.additional.key = key);
            d.visdata[0][8] = muutil.getInScalePercent(harmonicInfo[0]);
            d.visdata[1][8] = muutil.getInScalePercent(harmonicInfo[0]);
          });
        points.set(temp);
      } else if ($emotionbased.value === 2) {
      }
    }
  }

  // calculate other information as well and encode them in points as well
  // do this for selected glyph or all selected glyphs directly in an object ==> [x, y, {temperature:0.5, model: 'basic_rnn', Starglyph:{the data for this}, Histogram:{data for histo}, ...}]
  async function testMeloPoints() {
    if ($emotionbased.value === 2 && $polyoptions.length > 0) {
      meloPointsNew();
      return null;
    }
    let gridmethod = $grid ? 2 : 0;
    flatten = await moutil.flattenAllMelodies();

    if (flatten.length === 0) return null;

    let matrix = drutil.distanceMatrix(
      flatten.map((melo, i) => melo[0]),
      $similarityweight,
    );
    distMatrix.set(matrix);
    /*let emotionfeatures = muutil.calcEmotion(
      flatten.map((melo, i) => melo[0])
    );
    $emotionbased.value ? (matrix = emotionfeatures) : null;
    */
    let p = new Array();
    for (let i = 0; i < flatten.length; i++) {
      p.push([0.1 * i, 0.1 * i]);
    }
    let mdspoints = flatten.length < 3 ? p : undefined;
    let umappoints = flatten.length < 3 ? p : undefined;
    let mdsgpoints = flatten.length < 3 ? p : undefined;
    let umapgpoints = flatten.length < 3 ? p : undefined;
    if (flatten.length >= 3) {
      mdspoints = await drutil.getPoints(matrix, false, false); //$emotionbased.value);
      umappoints = await drutil.getPoints(matrix, true, false); //$emotionbased.value);
      mdsgpoints = drutil.gridify(mdspoints, gridmethod); // 0 hilbert, 1 gosper ???, 2 dgrid (does not work)
      umapgpoints = drutil.gridify(umappoints, gridmethod);
    }

    if (
      mdspoints !== undefined &&
      umappoints !== undefined &&
      mdsgpoints !== undefined &&
      umapgpoints !== undefined
    ) {
      drpoints.set([mdspoints, umappoints]);
      let nnfilter = [1000, 0];
      let intfilter = [1000, 0];
      pointarray = [];
      //currently global max
      const maxvalues = muutil.calcGlyphMax(flatten.map((melo, i) => melo[0]));
      const histdata = glutil.calcHistoGlyphData(flatten);

      const maxRhythmValues = muutil.calcRhythmMax(
        flatten.map((melo, i) => melo[0]),
      );
      const rhytmicComplexities = maxRhythmValues.complexities;

      let information = undefined;
      let varInt = undefined;

      heatmapinfo.set(
        glutil.calcPianoHeatmap(
          flatten.filter((v, i) => i >= $primerList.length).map((p) => p[0]),
        ),
      );

      flatten.forEach((melo, index) => {
        if (index < mdspoints.length) {
          if (index >= $primerList.length) {
            const sim = muutil.ourDistanceFunction(
              melo[0],
              melo[0].primer,
              1,
              0.5,
            );
            varInt = muutil.calcVariance(melo[0].notes);

            const chromadata = glutil.calcDataPie(melo[0]);

            melo[0].array = muutil.calcArrayforMelo(melo[0]);

            const countRhyhtmChange = muutil.computeRhythmChange(melo[0]);
            // let countSyncope = muutil.computeSyncope(melo[0]);
            const countOffBeat = muutil.computeOffBeat(melo[0]);
            const pauses = muutil.computePauses(melo[0]);
            information = {
              isPrimer: false,
              isPolymix: false,
              melody: melo[0],
              temperature: melo[1].temperature,
              timbre: muutil.calcAllTimbre(melo[0]),
              mvaesim: melo[0].mvaesim,
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
                  melo[0],
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
                  1,
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
              isPolymix: false,
              melody: melo[0],
              temperature: undefined,
              timbre: muutil.calcAllTimbre(melo[0]),
              mvaesim: undefined,
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
                  melo[0],
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
                  1,
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
        } else {
          console.log(index, "failed");
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

  async function meloPointsNew() {
    let gridmethod = $grid ? 2 : 0;
    flatten = $polyoptions[$numpoly - 2].map((n) => [
      n,
      { model: null, temperature: null },
    ]);
    if (flatten.length === 0 || $emotionbased.value !== 2) {
      if (flatten.length === 0 && $emotionbased.value === 2) points.set([]);
      return null;
    }
    let matrix = drutil.distanceMatrix(
      flatten.map((melo, i) => melo[0]),
      $similarityweight,
    );
    distMatrix.set(matrix);
    /*let emotionfeatures = muutil.calcEmotion(
      flatten.map((melo, i) => melo[0])
    );
    $emotionbased.value ? (matrix = emotionfeatures) : null;
    */
    let p = [];
    if (flatten.length < 3)
      for (let l = 0; l < flatten.length; l++) p.push([0.1 * l, 0.1 * l]);
    let mdspoints = flatten.length < 3 ? p : undefined;
    let umappoints = flatten.length < 3 ? p : undefined;
    let mdsgpoints = flatten.length < 3 ? p : undefined;
    let umapgpoints = flatten.length < 3 ? p : undefined;
    if (flatten.length >= 3) {
      mdspoints = await drutil.getPoints(matrix, false, false); //$emotionbased.value);
      umappoints = await drutil.getPoints(matrix, true, false); //$emotionbased.value);
      mdsgpoints = drutil.gridify(mdspoints, gridmethod); // 0 hilbert, 1 gosper ???, 2 dgrid (does not work)
      umapgpoints = drutil.gridify(umappoints, gridmethod);
    }
    if (
      mdspoints !== undefined &&
      umappoints !== undefined &&
      mdsgpoints !== undefined &&
      umapgpoints !== undefined
    ) {
      drpoints.set([mdspoints, umappoints]);
      let nnfilter = [1000, 0];
      let intfilter = [1000, 0];
      pointarray = [];
      //currently global max
      const maxvalues = muutil.calcGlyphMax(flatten.map((melo, i) => melo[0]));
      const histdata = glutil.calcHistoGlyphData(flatten);

      const maxRhythmValues = muutil.calcRhythmMax(
        flatten.map((melo, i) => melo[0]),
      );
      const rhytmicComplexities = maxRhythmValues.complexities;

      let information = undefined;
      let varInt = undefined;

      flatten.forEach((melo, index) => {
        if (index < mdspoints.length) {
          varInt = muutil.calcVariance(melo[0].notes);

          const countRhyhtmChange = muutil.computeRhythmChange(melo[0]);
          // let countSyncope = muutil.computeSyncope(melo[0]);
          const countOffBeat = muutil.computeOffBeat(melo[0]);
          const pauses = muutil.computePauses(melo[0]);

          if (
            melo[0]?.indexing === undefined &&
            melo[0]?.notes[0]?.meloID !== undefined
          ) {
            let current = [
              {
                meloID: melo[0].basemelody,
                trackID: 0,
                meanpitch: muutil.meanpitch({
                  notes: melo[0].notes.filter((n) => n.meloID === 0),
                }),
              },
            ];

            for (let bc = 1; bc <= melo[0].combinations.length; bc++) {
              current = muutil.calcIndexing(current, {
                index: melo[0].combinations[bc - 1],
                melody: {
                  notes: melo[0].notes.filter((n) => n.meloID === bc),
                },
              });
            }
            melo[0].notes.forEach((n) => {
              let nmelo =
                n.meloID === 0
                  ? melo[0].basemelody
                  : melo[0].combinations[n.meloID - 1];
              n.meloID = nmelo;
              n.trackID = current.filter((t) => t.meloID === nmelo)[0].trackID;
            });
            melo[0].indexing = current;
          } else if (melo[0]?.notes[0]?.trackID === undefined) {
            let current = melo[0].indexing;
            melo[0].notes.forEach((n) => {
              let nmelo =
                n.meloID === 0
                  ? melo[0].basemelody
                  : melo[0].combinations[n.meloID - 1];
              n.meloID = nmelo;
              n.trackID = current.filter((t) => t.meloID === nmelo)[0]?.trackID;
            });
          }

          information = {
            isPrimer: false,
            isPolymix: true,
            polyinfo: {
              basemelody: melo[0].basemelody,
              combinations: melo[0].combinations,
            },
            melody: melo[0],
            temperature: undefined,
            timbre: muutil.calcAllTimbre(melo[0]),
            mvaesim: undefined,
            primerindex: undefined,
            model: { name: "poly" },
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
                melo[0],
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
                1,
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
        } else {
          console.log(index, "failed");
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
  {#if $axisselect[0].label !== "Timbre" && $axisselect[0].label !== "Export"}
    <div class="canvas">
      <Voronoi opacity={opacityVoronoi} />
    </div>
  {/if}
  {#if $edgeBundlingPoly && $axisselect[0].label !== "Timbre"}
    <div class="canvas">
      <EdgeBundling opacity={opacityVoronoi} />
    </div>
  {/if}
  <div class="canvas">
    {#if $axisselect[0].label !== "Timbre" && $axisselect[0].label !== "Export"}
      <ScatterplotCanvas opacity={opacityGlyph} />
    {:else if $axisselect[0].label === "Export"}
      <ExportCanvas opacity={opacityGlyph} />
    {:else}
      <TimbreCanvas opacity={opacityGlyph} />
    {/if}
  </div>
  <div class="canvas">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
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
            on:mouseup={log("opacity glyph changed", opacityGlyph)}
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
            on:mouseup={log("opacity voronoi changed", opacityVoronoi)}
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
            on:mouseup={log("glyphsize changed", $glyphsize)}
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

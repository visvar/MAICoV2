<script>
  // @ts-nocheck

  import * as mu from "./util/modelutil.js";
  import * as glutil from "./util/glyphutil.js";
  import * as flutil from "./util/fileutil.js";

  // @ts-ignore
  import {
    pointcolorselect,
    vorcolorselect,
    currentcolor,
    colors,
    clusterrepresentative,
    clusterslicer,
    models,
    glyphselect,
    axisselect,
    side,
    modelselected,
    brushClusterSwitch,
    repSwitch,
    selectedClusterData,
    grid,
    glyphsize,
    points,
    currentpoints,
    glyphmodelselect,
    DRumap,
    somethingChanged,
    recompute,
    glyphinclude,
    similarityweight,
    clusterSelect,
    tooltipSel,
    lensmode,
    modeactive,
    keydetectselect,
    emotionbased,
    seen,
    rate,
    seenratemode,
    filtersim,
    qcorder,
    filternumbernotes,
    filterinscale,
    filtervarint,
    filterkey,
    selectkey,
    keymode,
    seenfilter,
    listenfilter,
    tufilter,
    tdfilter,
    primerkey,
    bpm,
    exportList,
    primerList,
    primerSelected,
    primerTodelete,
    filterextents,
    samplingstatus,
    expfilter,
    strangers,
    adjustMode,
    progress,
    mvaesim,
    playclick,
    selectedKeys,
    numpoly,
    polyoptions,
    actionlog,
    hilbert,
    brushselection,
    weightTimbre,
    edgeBundlingPoly,
    importedSession,
    exportmetric,
    sortedexport,
  } from "./stores/stores.js";

  import { genlength, iter } from "./stores/devStores.js";

  import { Progressbar } from "flowbite-svelte";

  import Scatterplot from "./visualization/Scatterplot.svelte";
  import PianoRollofSelection from "./visualization/PianoRollofSelection.svelte";
  import CorrelationMatrix from "./visualization/CorrelationMatrix.svelte";
  import CorrelationGlyph from "./visualization/Glyphs/CorrelationGlyph.svelte";
  import Chromapie from "./visualization/Glyphs/ChromapieModel.svelte";
  import Select from "svelte-select";
  import ColorLegend from "./colorlegends/ColorLegend.svelte";
  import InBigContainer from "./visualization/DetailedVersions/Inbigcontainer.svelte";
  import PianorollSample from "./visualization/Glyphs/PianorollSample.svelte";

  import * as mutil from "./util/musicutil.js";
  import * as gu from "./util/glyphutil.js";
  import * as visutil from "./util/visutil.js";
  import * as d3 from "d3";

  import { allPrimer, keysLookup } from "./stores/globalValues.js";
  import PianoHeatmapModel from "./visualization/Glyphs/PianoHeatmapModel.svelte";
  import HistogramKeyModel from "./visualization/Glyphs/HistogramKeyModel.svelte";
  import DoubleRangeSlider from "./visualization/util/DoubleRangeSlider.svelte";
  import FlowerGlyphModel from "./visualization/Glyphs/FlowerGlyphModel.svelte";
  import PianorollFilter from "./visualization/Filter/PianorollFilter.svelte";
  import PianoKeyFilter from "./visualization/Filter/PianoKeyFilter.svelte";
  import { onMount, onDestroy } from "svelte";
  import { sineOut } from "svelte/easing";

  import db from "./firebase.js";
  import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
  } from "firebase/auth";
  import { getStorage, ref, uploadBytes } from "firebase/storage";
  import { axisoptionsCor } from "./stores/globalValues.js";

  let user1 = null;
  let uniqueID = flutil.makeid(3);

  const file = "test";

  //addEventListener("beforeunload", (event) => {});
  //onbeforeunload = (event) => {};

  onDestroy(() => {
    console.log("the component is being destroyed");
    uploadLogDataFiles();
  });

  actionlog.subscribe(() => {
    uploadLogDataFiles();
  });

  function uploadLogDataFiles() {
    let log = flutil.getLogs();
    //log = [file, name]
    uploadFiles(user1, log[0], log[1]);
    let dataset = flutil.getDataset();
    uploadFiles(user1, dataset[0], dataset[1]);
  }

  //uploadFiles(user1, json)
  function uploadFiles(user, json, name) {
    if (user !== null) {
      const storageRef = ref(db, user1.uid);
      const fileRef = ref(storageRef, "Session_" + uniqueID + "_" + name);
      uploadBytes(fileRef, json).then(() => {
        console.log("Uploaded:" + name);
      });
    }
  }

  console.log(import.meta.env.PROD, import.meta.env.MODE);
  //only in production
  if (import.meta.env.PROD || import.meta.env.MODE === "production") {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      console.log(user);
      user1 = user;
      signInAnonymously(auth);
    });
  }
  //signInAnonymously(auth);

  const glyphoptions = [
    { label: "Points", value: 0 },
    { label: "Pianoroll", value: 3 },
    { label: "Melodyline", value: 9 },
    { label: "MelodylineInt", value: 10 },
    { label: "Chromapie", value: 2 },
    { label: "IntervalHisto", value: 4 },
    { label: "Flowerglyph", value: 1 },
    //{ label: "Chromapie5th", value: 5 },
    { label: "RhythmPie", value: 7 },
    { label: "FlowerComplexity", value: 8 },
    { label: "ChromaRoll", value: 6 },
  ];

  const polyOptionsSelect = [
    { label: "Diff", value: 0 },
    { label: ">4 5th", value: 1 },
  ];

  let polyselected = { label: "Diff", value: 0 };

  let polyvoices = { label: "2 Voices", value: 2 };

  let layoutsel = { label: "Similarity", value: 1 };

  importedSession.subscribe((v) => {
    if (v > 0) {
      if ($axisselect[2] === 1 || $axisselect[2])
        layoutsel = { label: "Similarity", value: 1 };
      else if ($axisselect[2] === 2) layoutsel = { label: "Timbre", value: 2 };
      else layoutsel = { label: "Correlation", value: 0 };
    }
  });

  const glyphmodeloptions = [
    { label: "Correlation", value: 0 },
    { label: "Chromapie", value: 1 },
    { label: "Flowerglyph", value: 2 },
    { label: "Pianoroll", value: 3 },
    { label: "KeyHistogram", value: 4 },
  ];

  const keydetectoptions = [
    { label: "Temperley adapted", value: 0 },
    { label: "Krumhansl-Schmuckler", value: 1 },
    { label: "Tonaljs w/ first note", value: 2 },
  ];

  const vorcoloroptions = [
    { label: "Temperature", value: 0 },
    { label: "Cluster", value: 1 },
    { label: "Model", value: 3 },
    { label: "Primer", value: 4 },
    { label: "Rhythm", value: 5 },
    { label: "Seen", value: 6 },
    { label: "Rate", value: 7 },
    { label: "Timbre", value: 8 },
    { label: "hasPrimer", value: 9 },
    { label: "None", value: 10 },
  ];

  const pointcoloroptions = [
    { label: "Model", value: 0 },
    { label: "Temperature", value: 1 },
    { label: "Primer", value: 3 },
    { label: "Rhythm", value: 4 }, // was 3
    { label: "Seen", value: 5 },
    { label: "Rate", value: 6 },
    { label: "Timbre", value: 7 },
    { label: "hasPrimer", value: 8 },
  ];

  //TODO: find other axis and insert,
  // -> calculate them in Scatter and use values
  const axisoptions = [
    { label: "DR", value: 0 },
    { label: "Temperature", value: 4 },
    { label: "SimilarityPrimer", value: 5 },
    { label: "VarianceIntervals", value: 6 },
    { label: "NumberOfNotes", value: 7 },
  ];

  const exportoptions = [
    { label: "seperate Files", value: 0 },
    { label: "seperate Tracks", value: 1 },
    { label: "successively", value: 2 },
  ];
  let exportmode = { label: "successively", value: 2 };

  // maybe for selection
  let modeltemp = [];

  let simval = 0.5;

  let oldmodelselected = null;

  let dataset = false;
  let poly = false;
  let clustering = false;
  let visualization = false;
  let calculation = false;
  let filter = false;
  let layout = false;
  let modeldesc = false;

  let lastid = 0;

  let lengthtemp = 64;

  $: genlength, (lengthtemp = $genlength);

  let selectkeyrange = 0;

  models.subscribe((value) => {
    modeltemp = value;
  });
  models.subscribe((value) => {
    let selecttemp = {};
    value.forEach((model) => (selecttemp[model.name] = true));
    modelselected.set(selecttemp);
    oldmodelselected = { ...selecttemp };
  });

  $: width = 600;
  $: height = 600;
  $: width, height, setSide(width, height);

  $: $primerList,
    () => {
      primerTodelete.set(0);
    };

  function setSide(width, height) {
    const min = Math.min(width, height);
    side.set(min);
  }

  function Simadjust(value) {
    similarityweight.set(value);
  }

  function setFilters(mode) {
    if (mode === 0) {
      seenfilter.set($seenfilter === 1 ? -1 : $seenfilter + 1);
    } else if (mode === 1) {
      tufilter.set(!$tufilter);
    } else if (mode === 2) {
      tdfilter.set(!$tdfilter);
    } else if (mode === 3) {
      listenfilter.set($listenfilter === 2 ? -2 : $listenfilter + 2);
    } else if (mode === 4) {
      expfilter.set(!$expfilter);
    }
  }

  async function progressAnimation(n, m) {
    if (n === 0) {
      polyoptions.set([[], [], []]);
      return null;
    }
    //if ($emotionbased.value === 2) return null;
    let i = 0;
    progress.set(0);
    let points = [];
    try {
      points = JSON.parse(JSON.stringify($currentpoints)).map((m) => m[2]);
    } catch (e) {
      try {
        let curmin = 0;
        let steps = 100;
        while ($currentpoints.length > curmin) {
          points = points.concat(
            JSON.parse(JSON.stringify($currentpoints.slice(curmin, steps))).map(
              (m) => m[2],
            ),
          );
          curmin = steps;
          steps = Math.min($currentpoints.length, steps + 100);
          console.log(steps);
        }
      } catch (e) {
        console.log(e);
      }
    }
    //progress.set(0)
    let combined = [];
    for (let r = 1; r < 4; r++) combined.push([]);
    //setTimeout(() => {
    let intervalID = setInterval(() => {
      i++;
      if ($progress >= 100) {
        clearInterval(intervalID);
      } else {
        progress.set((i / n) * 100);
        console.log("poly", (i / n) * 100);
        combined = mutil.findAllPolyMelodiesExtern(
          4,
          polyselected.value,
          points,
          combined,
          i,
        );
      }
    }, 10); //this sets the speed of the animation
    //}, 0);
  }

  /**
   * <button on:click={() => mu.exportModelJson('basic_rnn')}>export model 'basic_rnn' as Json</button>
   *
   */

  onMount(async () => {
    mu.addModel();
  });

  let progressval = 100;

  $: $progress,
    (v) => {
      progressval = v;
      console.log(progressval);
    };

  progress.subscribe((v) => {
    progressval = v;
  });
</script>

<main>
  <div class="relative">
    <div class="tooltip" id="inBig">
      <InBigContainer />
    </div>
  </div>
  <div class="container container1">
    <div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div on:click={() => (dataset = !dataset)}>
        <h1 class="mb-4 text-3xl font-bold">Import/Export</h1>
      </div>
      {#if dataset}
        <div
          class="my-4"
          id="progressbar"
          onbeforeunload={() => {
            console.log("destroy");
            uploadLogDataFiles();
          }}
        >
          <Progressbar
            animate
            tweenDuration={500}
            progress={$progress}
            easing={sineOut}
            size="h-4"
            color="blue"
            labelInside
            class="mb-8"
          />
        </div>
        <div on:click={() => (poly = !poly)}>
          <h1 class="mb-4 text-l font-bold">Polyphony</h1>
        </div>
        {#if poly}
          <button
            on:click={() => {
              flutil.log("generate poly ", polyselected.value);
              progressAnimation($currentpoints.length, polyselected.value);
            }}
          >
            generate 🎼🎛️
          </button>
          <div class="select">
            <Select
              class="select"
              id="selectpoly"
              items={polyOptionsSelect}
              bind:value={polyselected}
              clearable={false}
            />
          </div>
        {/if}
        <h5 class="mb-4 text-l font-bold">Import Midi as Primer</h5>
        <input
          class="block w-full mb-5 text-xs text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          type="file"
          accept=".mid"
          on:change={(e) => (lastid = flutil.importMidi(e, primerList, lastid))}
        />
        <button
          on:click={() => {
            flutil.log("primer clear");
            primerList.clear();
          }}
        >
          clear primer list
        </button>
        <button
          on:click={() => {
            flutil.log("delete primer", { primerList: $primerTodelete });
            primerList.deleteMelo($primerSelected);
          }}
        >
          Delete Primer selected below
        </button>
        <div class="filter1">
          <Select
            class="select"
            id="selmidi"
            items={$primerList.map((p, i) => {
              return { label: p.id, value: i };
            })}
            bind:value={$primerTodelete}
            clearable={false}
          />
          <!--
          <input
            type="range"
            bind:value={$primerTodelete}
            min="0"
            max={Math.max(0, $primerList.length - 1)}
            step="1"
            width="50%"
          />
          -->
          <PianorollSample
            width={50}
            height={50}
            melody={$primerSelected}
            fill="grey"
          />
        </div>
        <button
          on:click={() => {
            flutil.log(
              "generate with mvaesim and length for iterations from list ",
              { $mvaesim, lengthtemp, $iter, $primerList },
            );
            flutil.log("strangers; adjust mode; filterextent; keys:", {
              $strangers,
              $adjustMode,
              $filterextents,
              $selectedKeys,
            });
            mu.requestModels($primerList);
          }}>Generate from Models</button
        >
        <div class="label">iterations of 15 samples per model</div>
        <div class="filter">
          <input type="range" bind:value={$iter} min="1" max="25" step="1" />
          <span>
            {$iter}
          </span>
        </div>
        <div class="label">mvae Similarity</div>
        <div class="filter">
          <input
            type="range"
            bind:value={$mvaesim}
            min="0.7"
            max="1"
            step="0.01"
          />
          <span>
            {$mvaesim}
          </span>
        </div>
        <div class="label">melody length</div>
        <div class="filter">
          <input
            type="range"
            bind:value={lengthtemp}
            min="16"
            max="128"
            step="1"
            on:mouseup={(e) => {
              genlength.set(lengthtemp);
            }}
          />
          <span>
            {lengthtemp} 16th
          </span>
        </div>
        <div>
          <PianorollFilter
            h={250}
            w={250}
            length={$genlength}
            filtervalues={$filterextents}
          />
        </div>
        <div>
          <PianoKeyFilter h={250} w={250} />
        </div>
        <div class="label">allow tonality strangers</div>
        <div class="filter">
          <input
            type="range"
            bind:value={$strangers}
            min="0"
            max="12"
            step="1"
          />
          <span>
            {$strangers}
          </span>
        </div>
        <div>
          <input
            type="checkbox"
            bind:checked={$adjustMode}
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          /> Allow to oktave and move notes
        </div>
        <button
          on:click={() => {
            mutil.adjustMelodiesToFilters();
          }}
        >
          Adjust Melodies to Filters
        </button>

        <div>-</div>
        <div class="select">
          <label for="selmidi">Format to export as MIDI</label>
          <Select
            class="select"
            id="selmidi"
            items={exportoptions}
            bind:value={exportmode}
            clearable={false}
          />
        </div>
        <button
          on:click={() => {
            flutil.log("writeToMidi with bpm and store to mode", {
              $exportList,
              $bpm,
              exportmode,
            });
            flutil.writeToMidi($exportList, $bpm, exportmode.value);
          }}
        >
          export to Midi
        </button>
        <button
          on:click={() => {
            exportList.clear();
          }}
        >
          clear export List
        </button>
        <button
          on:click={() => {
            flutil.writeLogs();
            mu.exportModelJson();
          }}
        >
          export Logs
        </button>
        <h5 class="mb-4 text-l font-bold">Session</h5>
        <button
          on:click={() => document.querySelector("#datasetFiles").click()}
        >
          open session
        </button>
        <input
          style="display: none"
          type="file"
          id="datasetFiles"
          on:change={(event) => {
            flutil.log("import dataset");
            mu.uploadDatasetFile(event);
          }}
        />
        <!-- {/if} -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- <div on:click={() => (devmode = !devmode)}>
        <h1>Inference</h1>
      </div>
      $primerList
      {#if devmode} -->
        <button
          on:click={() => {
            flutil.log("export dataset");
            mu.exportModelJson();
          }}
        >
          export session
        </button>
      {/if}
    </div>
    
    <div>
      <div on:click={() => (clustering = !clustering)}>
        <h1 class="mb-4 text-3xl font-bold">Clustering</h1>
      </div>
      {#if clustering}
        <button on:click={() => brushClusterSwitch.switch()}>
          cluster on: {$brushClusterSwitch}; selected: {$selectedClusterData.length}
        </button>
        <button on:click={() => repSwitch.switch()}>
          rep mce: {!$repSwitch}
        </button>
        <label>
          <input
            type="checkbox"
            bind:checked={$glyphinclude}
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          show representative and point glyphs at same time
        </label>
        <div class="filters">
          <div class="label">cluster threshold</div>
          <div class="filter">
            <input
              type="range"
              bind:value={$clusterslicer}
              max="1"
              step="0.01"
            />
            <span>
              {$clusterslicer.toFixed(2)}
            </span>
          </div>
          <div class="label">theshold for representatives</div>
          <div class="filter">
            <input
              type="range"
              bind:value={$clusterrepresentative}
              max="1"
              step="0.01"
            />
            <span>
              {$clusterrepresentative.toFixed(2)}
            </span>
          </div>
        </div>
      {/if}
    </div>
    

    <div class="select">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div on:click={() => (visualization = !visualization)}>
        <h1 class="mb-4 text-3xl font-bold">Visualization</h1>
      </div>
      {#if visualization}
        <label for="selectvorcolor">point color</label>
        <Select
          class="select"
          id="selectvorcolor"
          items={pointcoloroptions}
          bind:value={$pointcolorselect}
          clearable={false}
        />
        <label for="selectvorcolor">background color</label>
        <Select
          class="select"
          id="selectvorcolor"
          items={vorcoloroptions}
          bind:value={$vorcolorselect}
          clearable={false}
        />
        <label for="selectglyph">glyph type</label>
        <Select
          class="select"
          id="selectglyph"
          items={glyphoptions}
          bind:value={$glyphselect}
          clearable={false}
        />

        {#if $currentcolor === 2 || $vorcolorselect.value === 2}
          <label>
            <input
              type="checkbox"
              bind:checked={$modeactive}
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            Donut: Major=full, Minor=half
          </label>
        {/if}

        <div class="colorContainer">
          {#if $currentcolor === 2 || $vorcolorselect.value === 2 || $glyphselect.value === 2 || $glyphselect.value === 6}
            <ColorLegend
              title="Key legend"
              color={d3.scaleOrdinal(
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                gu.colormap12,
              )}
              tickFormat={(d) => {
                const keys = [
                  "C",
                  "C#",
                  "D",
                  "D#",
                  "E",
                  "F",
                  "F#",
                  "G",
                  "G#",
                  "A",
                  "A#",
                  "B",
                ];
                return keys[d];
              }}
              tickSize={0}
              width={250}
            />
          {/if}
          {#if $currentcolor === 1 || $vorcolorselect.value === 0}
            <ColorLegend
              title="Temperature legend"
              color={d3.scaleDiverging([0.2, 0.9, 1.6], (d) =>
                d3.interpolateRdYlBu(1 - d),
              )}
              tickFormat={(d) => d}
              tickValues={[0.2, 0.45, 0.7, 0.9, 1.1, 1.35, 1.6]}
              tickSize={0}
              width={250}
            />
          {/if}
          {#if $currentcolor === 4 || $vorcolorselect.value === 5}
            <ColorLegend
              title="Rhythm Complexity"
              color={d3.scaleDiverging([0, 0.5, 1], visutil.divergingScale)}
              tickFormat={(d) => {
                const t = ["low", "medium", "high"];
                return t[d * 2];
              }}
              tickValues={[0, 0.5, 1]}
              tickSize={0}
              width={250}
            />
          {/if}
          {#if $glyphselect.value === 4}
            <ColorLegend
              title="Interval legend"
              color={d3.scaleDiverging([0, 12, 24], (d) =>
                gu.histogramColorLegend(d),
              )}
              tickFormat={(d) => d - 12}
              tickSize={0}
              tickValues={[0, 4, 8, 12, 16, 20, 24]}
              width={250}
            />
          {/if}
          {#if $glyphselect.value === 7}
            <ColorLegend
              title="note tick length"
              color={d3.scaleSequentialQuantile(
                [0, 1, 2, 3, 4],
                visutil.divergingScale,
              )}
              tickFormat={(d) => {
                const keys = [16, 8, 4, 2, 1];
                return keys[d];
              }}
              tickSize={0}
              width={250}
            />
          {/if}
          {#if $currentcolor === 7 || $vorcolorselect.value === 8}
            <ColorLegend
              title="timbre"
              color={d3.scaleSequentialQuantile(
                [0, 1],
                visutil.divergingTimbreScale,
              )}
              tickFormat={(d) => {
                if (d === 0) return "dark";
                if (d === 1) return "bright";
              }}
              tickValues={[0, 0.5, 1]}
              tickSize={0}
              width={250}
            />
          {/if}
        </div>

        <label>
          <input
            type="checkbox"
            bind:checked={$lensmode}
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          Lens mode
        </label>
        <label>
          <input
            type="checkbox"
            bind:checked={$seenratemode}
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          Seen/Rate
        </label>
        <div>
          <label>
            <input
              type="checkbox"
              bind:checked={$edgeBundlingPoly}
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            Edges for Poly
          </label>
        </div>
      {/if}
    </div>

    <div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div on:click={() => (filter = !filter)}>
        <h1 class="mb-4 text-3xl font-bold">Filter</h1>
      </div>
      {#if filter}
        <div class="filtercontainer">
          <div class="doubleslider">
            <DoubleRangeSlider
              title={"Similarity to Primer"}
              values={filtersim}
              change={(value) => {
                flutil.log("filter similarity to primer", { value });
              }}
            />
          </div>
          <div class="doubleslider">
            <DoubleRangeSlider
              title={"Number of Notes"}
              values={filternumbernotes}
              change={(value) => {
                flutil.log("filter number of notes", { value });
              }}
            />
          </div>
          <div class="doubleslider">
            <DoubleRangeSlider
              title={"Variance of Intervals"}
              values={filtervarint}
              change={(value) => {
                flutil.log("filter variance of intervals", { value });
              }}
            />
          </div>
          <div class="filterButtons">
            <div
              class="option {$seenfilter === 1
                ? 'selected'
                : $seenfilter === -1
                  ? 'falseselected'
                  : ''}"
              on:click={() => setFilters(0)}
            >
              👁️
            </div>
            <div
              class="option {$listenfilter === 2
                ? 'selected'
                : $listenfilter === -2
                  ? 'falseselected'
                  : ''}"
              on:click={() => setFilters(3)}
            >
              👂
            </div>
            <div
              class="option {$tufilter ? 'selected' : ''}"
              on:click={() => setFilters(1)}
            >
              👍
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
              class="option {$tdfilter ? 'falseselected' : ''}"
              on:click={() => setFilters(2)}
            >
              👎
            </div>
            <div
              class="option {$expfilter ? 'selected' : ''}"
              on:click={() => setFilters(4)}
            >
              📁
            </div>
          </div>
        </div>
      {/if}
    </div>
    <div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div on:click={() => (calculation = !calculation)}>
        <h1 class="mb-4 text-3xl font-bold">Features & Metrics</h1>
      </div>
      {#if calculation}
        Similarity
        <div class="label">Rhythm - Melody</div>
        <div class="filter">
          <input
            type="range"
            bind:value={simval}
            min="0"
            max="1"
            step="0.05"
            on:change={() => Simadjust(simval)}
          />
          <span>
            {simval.toFixed(2)}
          </span>
        </div>
        Geschwindigkeit
        <div class="filter">
          <input type="range" bind:value={$bpm} min="60" max="180" step="1" />
          <span>
            BPM: {$bpm}
          </span>
        </div>
        <div
          class="option {$playclick ? 'selected' : ''}"
          on:click={() => playclick.set(!$playclick)}
        >
          Play with click
        </div>
      {/if}
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div on:click={() => (layout = !layout)}>
      <h1 class="mb-4 text-3xl font-bold">Layout & Axes</h1>
    </div>
    {#if layout}
      <div>
        <!--
        <div class="select">
          <label for="selDR">DR method</label>
          <Select
            class="select"
            id="selDR"
            items={[
              { label: "MDS", value: false },
              { label: "UMAP", value: true },
            ]}
            bind:value={$DRumap}
            on:change={() => {
              if ($axisselect[2]) {
                axisselect.updateAxis(true, 1);
              }
            }}
            clearable={false}
          />
        </div>
        -->
        <div class="select">
          <label for="selmetric">Metric-based</label>
          <Select
            class="select"
            id="selmetric"
            items={[
              { label: "Monophonic", value: 0 },
              //{ label: "Emotion", value: 1 },
              { label: "Polyoptions", value: 2 },
            ]}
            bind:value={$emotionbased}
            clearable={false}
          />
          {#if $emotionbased.value === 2}
            <Select
              class="select"
              id="selmetric"
              items={[
                { label: "2 Voices", value: 2 },
                { label: "3 Voices", value: 3 },
                { label: "4 Voices", value: 4 },
              ]}
              bind:value={polyvoices}
              on:change={(v) => {
                numpoly.set(v.detail.value);
              }}
              clearable={false}
            />
            <!--
            <div class="filter">
              <input
                type="range"
                bind:value={$numpoly}
                min="2"
                max="4"
                step="1"
              />
              <span>
                Poly {$numpoly}
              </span>
            </div>
            -->
          {/if}
        </div>
        <div class="select">
          <Select
            class="select"
            id="selmetric"
            items={[
              { label: "Correlation", value: 0 },
              { label: "Similarity", value: 1 },
              { label: "Timbre", value: 2 },
              { label: "Export", value: 3 },
            ]}
            bind:value={layoutsel}
            on:change={(v) => {
              if (v.detail.value > 0)
                axisselect.updateAxis(true, v.detail.value);
              else {
                axisselect.updateAxis(axisoptions[1], 0, axisoptions[2], 1);
              }
            }}
            clearable={false}
          />
        </div>
        {#if $axisselect[2] === 1 || $axisselect[2] === true}
          <!--
        <label>
          <input
            type="checkbox"
            checked={$axisselect[2] === 1 || $axisselect[2]}
            on:change={(e) => {
              if (e.target.checked) {
                axisselect.updateAxis(true, 1);
              } else {
                axisselect.updateAxis(axisoptions[0], 2);
              }
            }}
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          use metric-based layout
        </label>
        <div />
        -->
          <div>
            <label>
              <input
                type="checkbox"
                bind:checked={$grid}
                on:change={() => {
                  if ($axisselect[2] === 1) {
                    axisselect.updateAxis(true, 1);
                  }
                  $hilbert = false;
                }}
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              use grid
            </label>
            <div>
              <label>
                <input
                  type="checkbox"
                  bind:checked={$hilbert}
                  on:change={() => {
                    if ($axisselect[2] === 1) {
                      axisselect.updateAxis(true, 1);
                    }
                    $grid = false;
                  }}
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                use hilbert
              </label>
            </div>
          </div>
        {/if}
      </div>
      {#if $axisselect[2] === 2}
        <div>
          <!--
        <input
          type="checkbox"
          checked={$axisselect[2] === 2}
          on:change={(e) => {
            brushselection.set(null);
            if (e.target.checked) {
              axisselect.updateAxis(true, 2);
            } else {
              axisselect.updateAxis(axisoptions[0], 2);
            }
          }}
          class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        Timbre layout
        -->
          <input
            type="checkbox"
            bind:checked={$qcorder}
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          order Co5th
          <div>
            <input
              type="checkbox"
              bind:checked={$weightTimbre}
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            weighted
          </div>
        </div>
      {/if}
      {#if $axisselect[2] === 0}
        <div>
          <CorrelationMatrix w={280} h={200} />
        </div>
      {/if}
      {#if $axisselect[2] === 3}
        <div class="select">
          <Select
            class="select"
            id="selexpmetric"
            items={[
              { label: "ID asc", value: 0 },
              { label: "Sort by Selecting Single", value: 1 },
              { label: "Timbre L->D", value: 2 },
              { label: "Timbre D->L", value: 3 },
              { label: "NumberofNotes asc", value: 4 },
            ]}
            bind:value={$exportmetric}
            clearable={false}
          />
        </div>
        {#if $exportmetric.value === 1}
          <button
            class="warning"
            on:click={() => {
              sortedexport.set([]);
            }}
          >
            Reset sorting in Export
          </button>
        {/if}
      {/if}
    {/if}
    <div>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div on:click={() => (modeldesc = !modeldesc)}>
        <h1 class="mb-4 text-3xl font-bold">Model Description</h1>
      </div>
      {#if modeldesc}
        <div class="select">
          <label for="selectglyphm">glyph type model</label>
          <Select
            class="select"
            id="selectglyphm"
            items={glyphmodeloptions}
            bind:value={$glyphmodelselect}
            clearable={false}
          />
        </div>
        {#if $glyphmodelselect.value === 1 || $glyphmodelselect.value === 4}
          <div class="colorContainer">
            <ColorLegend
              title="Key legend"
              color={d3.scaleOrdinal(
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                gu.colormap12,
              )}
              tickFormat={(d) => {
                const keys = [
                  "C",
                  "C#",
                  "D",
                  "D#",
                  "E",
                  "F",
                  "F#",
                  "G",
                  "G#",
                  "A",
                  "A#",
                  "B",
                ];
                return keys[d];
              }}
              tickSize={0}
              width={250}
            />
          </div>
        {/if}
        {#if $somethingChanged}
          <button
            class="warning"
            on:click={() => {
              recompute.set(!$recompute);
              // function for recomputation but seperate function as in scatterplot -> adjust only positions (calc additional distMatrix for computation) -> have to be currentpoints probably
              somethingChanged.set(false);

              oldmodelselected = { ...$modelselected };
            }}
          >
            Recompute Selected Data
          </button>
        {/if}
        <div class="parButton">
          <button
            class="innerButton"
            on:click={() => {
              flutil.log("all model selected -> all true", {});
              modelselected.set(
                Object.fromEntries(
                  Object.entries($modelselected).map((entry) => [
                    entry[0],
                    true,
                  ]),
                ),
              );
              if (
                oldmodelselected !== null &&
                Object.values($modelselected).filter(
                  (d, i) => d !== Object.values(oldmodelselected)[i],
                ).length > 0
              ) {
                somethingChanged.set(true);
              } else {
                somethingChanged.set(false);
              }
            }}
          >
            select all
          </button>
          <button
            class="innerButton"
            on:click={() => {
              flutil.log("no model selected -> all false", {});
              modelselected.set(
                Object.fromEntries(
                  Object.entries($modelselected).map((entry) => [
                    entry[0],
                    false,
                  ]),
                ),
              );
              if (
                oldmodelselected !== null &&
                Object.values($modelselected).filter(
                  (d, i) => d !== Object.values(oldmodelselected)[i],
                ).length > 0
              ) {
                somethingChanged.set(true);
              } else {
                somethingChanged.set(false);
              }
            }}
          >
            select none
          </button>
        </div>
        sum melodies: {$points !== undefined ? $points?.length : 0} - sum selected:
        {$currentpoints !== undefined ? $currentpoints?.length : 0}
        <div class="list">
          {#each modeltemp as model, index}
            <div class="modelrep">
              <div class="labelModel">
                <label
                  style:background-color={$colors[0].scale({ model: model })}
                  style:color={($currentcolor === 0 ||
                    $vorcolorselect.value === 3) &&
                  glutil.getColorLightness($colors[0].scale({ model: model })) <
                    50
                    ? "white"
                    : "black"}
                >
                  {#if $modelselected !== null && $modelselected[index] !== null}
                    <input
                      type="checkbox"
                      bind:checked={$modelselected[model.name]}
                      on:change={() => {
                        if (
                          oldmodelselected !== null &&
                          Object.values($modelselected).filter(
                            (d, i) => d !== Object.values(oldmodelselected)[i],
                          ).length > 0
                        ) {
                          clusterSelect.set(null);
                          somethingChanged.set(true);
                        } else {
                          clusterSelect.set(null);
                          somethingChanged.set(false);
                        }
                        const modelselect = Object.values($modelselected);
                        flutil.log(
                          "modelselection: " + model.name + " changed",
                          { modelselect },
                        );
                      }}
                      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <!--//track changes so if everything is back do not calc-->
                  {/if}
                  {model.name} - {model.melodies?.length > 0
                    ? model.melodies?.length
                    : 0}
                  <br /> 👁️: {$seen?.filter(
                    (p) =>
                      p[2].model.name === model.name &&
                      p[2].userspecific.seen >= 1,
                  ).length} 👂: {$seen?.filter(
                    (p) =>
                      p[2].model.name === model.name &&
                      p[2].userspecific.seen === 2,
                  ).length} 👍: {$rate[model.name] === undefined
                    ? 0
                    : $rate[model.name]?.filter(
                        (p) => p.userspecific.rate === 1,
                      ).length} 👎: {$rate[model.name] === undefined
                    ? 0
                    : $rate[model.name]?.filter(
                        (p) => p.userspecific.rate === -1,
                      ).length}
                </label>
              </div>
              {#if $glyphmodelselect.value === 0}
                <CorrelationGlyph w={50} h={50} {index} />
              {:else if $glyphmodelselect.value === 1}
                <Chromapie w={50} h={50} information={model} />
              {:else if $glyphmodelselect.value === 2}
                <FlowerGlyphModel w={50} h={50} {model} />
              {:else if $glyphmodelselect.value === 3}
                <PianoHeatmapModel w={50} h={50} {model} />
              {:else if $glyphmodelselect.value === 4}
                <HistogramKeyModel
                  width={50}
                  height={50}
                  data={$currentpoints}
                  {model}
                />
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <div
    class="container container2"
    bind:clientHeight={height}
    bind:clientWidth={width}
  >
    <Scatterplot />
  </div>

  <div class="container container3">
    <PianoRollofSelection {height} />
  </div>
</main>

<style>
  h1 {
    font-size: 16px;
    margin: 18px 0 5px 0;
    color: #444;
    cursor: pointer;
  }

  .option {
    margin: 0 0px;
    display: inline-block;
    padding: 10px;
    cursor: pointer;
  }
  .selected {
    background-color: rgb(197, 238, 242);
    border-radius: 50%;
    text-shadow: 0 0 10px white;
  }

  .falseselected {
    background-color: rgb(242, 197, 197);
    border-radius: 50%;
    text-shadow: 0 0 10px white;
  }
  button,
  label,
  div {
    user-select: none;
  }
  .filtercontainer {
    /*height: 300px;*/
    overflow: auto;
    overflow-x: hidden;
    margin: 0px 10px;
  }
  .doubleslider {
    height: 50px;
    display: block;
  }

  .innerButton {
    display: block;
    cursor: pointer;
    padding: 5px;
    margin: 5px 5%;
    background-color: #e3e3e3;
    width: 40%;
  }

  .tooltip {
    position: absolute;
    padding: 5px;
    margin: 5px 5%;
    z-index: 1;
  }

  .relative {
    position: relative;
  }

  .parButton {
    display: flex;
  }

  button {
    display: block;
    cursor: pointer;
    padding: 5px;
    margin: 5px 5%;
    background-color: #e3e3e3;
    width: 90%;
  }

  .warning {
    display: block;
    cursor: pointer;
    padding: 5px;
    margin: 5px 5%;
    background-color: #c97800;
    width: 90%;
  }

  .container {
    height: 98vh;
    margin: 3px 7px;
    box-shadow: #aaa 0 0 7px;
    border-radius: 5px;
  }

  .container1 {
    width: 300px;
    float: left;
    overflow-y: scroll;
    position: relative;
  }
  .container2 {
    /* width: 1000px; */
    width: 98vh;
    float: left;
    text-align: center;
    display: flex;
  }
  .container3 {
    width: 400px;
    float: left;
    padding: 0 10px;
  }

  .list {
    max-height: 300px;
    overflow-y: auto;
    margin: 10px 10px;
  }

  .filterButtons {
    margin: 10px;
  }

  .select {
    --item-active-background: #c7c7c7;
    --margin: 5px 5%;
    --border: 1px solid #c7c7c7;
    --height: 28px;
    --width: 90%;
  }
  .filter {
    text-align: center;
    place-items: center;
    height: 40px;
    margin: 0 10px;
    display: grid;
    grid-template-columns: auto 30px;
    gap: 10px;
    justify-items: center;
  }
  .filter1 {
    text-align: center;
    place-items: center;
    height: 60px;
    margin: 0 15px;
    display: grid;
    grid-template-columns: auto 30px;
    gap: 20px;
    justify-items: center;
  }
  .filter1 input {
    width: 100%;
  }

  .filter input {
    width: 100%;
  }

  .modelrep {
    vertical-align: middle;
    display: flex;
    justify-content: space-between;
    margin-bottom: 2px;
  }
  .labelModel {
    align-self: center;
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .labelModel label {
    padding: 1px 5px;
    border-radius: 5px;
  }

  .colorContainer {
    width: 90%;
    margin-left: 10px;
    justify-items: center;
  }
</style>

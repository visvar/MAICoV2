import { get } from 'svelte/store'
import * as midiutil from '../util/midiutil'
import * as mutil from "../util/musicutil.js";
import * as mu from "../util/modelutil.js";
import * as gu from "../util/glyphutil.js";
import * as visutil from "../util/visutil.js";
import { genlength, iter, recording, selectedMeloColors } from './devStores'
import { modelselected, primerList, currentpoints, mvaesim, opacityVoronoi, pointcolorselect, vorcolorselect, glyphselect, glyphsize, emotionbased, numpoly, axisselect, grid, hilbert, meloselected, player } from './stores'
import * as d3 from 'd3';
import { controlColor } from '../util/midiutil';

// maybe as array when use multiple, maybe as store
export const allPrimer = [{
  notes: [
    { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4 },
    { pitch: 60, quantizedStartStep: 4, quantizedEndStep: 8 },
    { pitch: 67, quantizedStartStep: 8, quantizedEndStep: 12 },
    { pitch: 67, quantizedStartStep: 12, quantizedEndStep: 16 },
    { pitch: 69, quantizedStartStep: 16, quantizedEndStep: 20 },
    { pitch: 69, quantizedStartStep: 20, quantizedEndStep: 24 },
    { pitch: 67, quantizedStartStep: 24, quantizedEndStep: 32 },
    { pitch: 65, quantizedStartStep: 32, quantizedEndStep: 36 },
    { pitch: 65, quantizedStartStep: 36, quantizedEndStep: 40 },
    { pitch: 64, quantizedStartStep: 40, quantizedEndStep: 44 },
    { pitch: 64, quantizedStartStep: 44, quantizedEndStep: 48 },
    { pitch: 62, quantizedStartStep: 48, quantizedEndStep: 52 },
    { pitch: 62, quantizedStartStep: 52, quantizedEndStep: 56 },
    { pitch: 60, quantizedStartStep: 56, quantizedEndStep: 64 }
  ],
  totalTime: 8,
  totalQuantizedSteps: 64,
  index: 0,
  key: { tonic: "C", type: "major" },
  inScale: [0, 2, 4, 5, 7, 9, 11]
}, {
  notes: [
    { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4 },
    { pitch: 60, quantizedStartStep: 4, quantizedEndStep: 8 },
    { pitch: 65, quantizedStartStep: 8, quantizedEndStep: 12 },
    { pitch: 67, quantizedStartStep: 12, quantizedEndStep: 16 },
    { pitch: 71, quantizedStartStep: 16, quantizedEndStep: 20 },
    { pitch: 69, quantizedStartStep: 20, quantizedEndStep: 24 },
    { pitch: 67, quantizedStartStep: 24, quantizedEndStep: 32 },
    { pitch: 65, quantizedStartStep: 32, quantizedEndStep: 36 },
    { pitch: 65, quantizedStartStep: 36, quantizedEndStep: 40 },
    { pitch: 64, quantizedStartStep: 40, quantizedEndStep: 44 },
    { pitch: 62, quantizedStartStep: 44, quantizedEndStep: 48 },
    { pitch: 62, quantizedStartStep: 48, quantizedEndStep: 52 },
    { pitch: 64, quantizedStartStep: 52, quantizedEndStep: 56 },
    { pitch: 60, quantizedStartStep: 56, quantizedEndStep: 64 }
  ],
  totalTime: 8,
  totalQuantizedSteps: 64,
  index: 1,
  key: { tonic: "C", type: "major" },
  inScale: [0, 2, 4, 5, 7, 9, 11]
}, {
  notes: [
    { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 4 },
    { pitch: 60, quantizedStartStep: 4, quantizedEndStep: 8 },
    { pitch: 67, quantizedStartStep: 8, quantizedEndStep: 12 },
    { pitch: 67, quantizedStartStep: 12, quantizedEndStep: 16 },
    { pitch: 69, quantizedStartStep: 16, quantizedEndStep: 20 },
    { pitch: 69, quantizedStartStep: 20, quantizedEndStep: 24 },
    { pitch: 67, quantizedStartStep: 24, quantizedEndStep: 32 },
    { pitch: 67, quantizedStartStep: 32, quantizedEndStep: 36 },
    { pitch: 65, quantizedStartStep: 36, quantizedEndStep: 40 },
    { pitch: 64, quantizedStartStep: 40, quantizedEndStep: 44 },
    { pitch: 62, quantizedStartStep: 44, quantizedEndStep: 48 },
    { pitch: 62, quantizedStartStep: 48, quantizedEndStep: 52 },
    { pitch: 62, quantizedStartStep: 52, quantizedEndStep: 56 },
    { pitch: 62, quantizedStartStep: 56, quantizedEndStep: 64 }
  ],
  totalTime: 8,
  totalQuantizedSteps: 64,
  index: 2,
  key: { tonic: "C", type: "major" },
  inScale: [0, 2, 4, 5, 7, 9, 11]
}]

export const axisoptions = [{ label: 'DR', value: 0, shortLabel: 'DR' },
{ label: 'Temperature', value: 4, shortLabel: 'Temp' },
{ label: 'SimilarityPrimer', value: 5, shortLabel: 'SimPrim' },
{ label: 'VarianceIntervals', value: 6, shortLabel: 'VarInt' },
{ label: 'NumberOfNotes', value: 7, shortLabel: 'NumNot' }]

export const axisoptionsCor = [
  { label: 'Temperature', value: 4, shortLabel: 'Temp' },
  { label: 'Similarity to Primer', value: 5, shortLabel: 'SimPrim' },
  { label: 'Variance of Intervals', value: 6, shortLabel: 'VarInt' },
  { label: 'Number of Notes', value: 7, shortLabel: 'NumNot' }
]

export const keysLookup = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const oktaveLookup = [
  { pitch: 0, name: 'C', octave: -1, label: 'C-1', frequency: 8.176 },
  { pitch: 1, name: 'C#', octave: -1, label: 'C#-1', frequency: 8.662 },
  { pitch: 2, name: 'D', octave: -1, label: 'D-1', frequency: 9.177 },
  { pitch: 3, name: 'D#', octave: -1, label: 'D#-1', frequency: 9.723 },
  { pitch: 4, name: 'E', octave: -1, label: 'E-1', frequency: 10.301 },
  { pitch: 5, name: 'F', octave: -1, label: 'F-1', frequency: 10.913 },
  { pitch: 6, name: 'F#', octave: -1, label: 'F#-1', frequency: 11.562 },
  { pitch: 7, name: 'G', octave: -1, label: 'G-1', frequency: 12.25 },
  { pitch: 8, name: 'G#', octave: -1, label: 'G#-1', frequency: 12.978 },
  { pitch: 9, name: 'A', octave: -1, label: 'A-1', frequency: 13.75 },
  { pitch: 10, name: 'A#', octave: -1, label: 'A#-1', frequency: 14.568 },
  { pitch: 11, name: 'B', octave: -1, label: 'B-1', frequency: 15.434 },
  { pitch: 12, name: 'C', octave: 0, label: 'C0', frequency: 16.352 },
  { pitch: 13, name: 'C#', octave: 0, label: 'C#0', frequency: 17.324 },
  { pitch: 14, name: 'D', octave: 0, label: 'D0', frequency: 18.354 },
  { pitch: 15, name: 'D#', octave: 0, label: 'D#0', frequency: 19.445 },
  { pitch: 16, name: 'E', octave: 0, label: 'E0', frequency: 20.602 },
  { pitch: 17, name: 'F', octave: 0, label: 'F0', frequency: 21.827 },
  { pitch: 18, name: 'F#', octave: 0, label: 'F#0', frequency: 23.125 },
  { pitch: 19, name: 'G', octave: 0, label: 'G0', frequency: 24.5 },
  { pitch: 20, name: 'G#', octave: 0, label: 'G#0', frequency: 25.957 },
  { pitch: 21, name: 'A', octave: 0, label: 'A0', frequency: 27.5 },
  { pitch: 22, name: 'A#', octave: 0, label: 'A#0', frequency: 29.135 },
  { pitch: 23, name: 'B', octave: 0, label: 'B0', frequency: 30.868 },
  { pitch: 24, name: 'C', octave: 1, label: 'C1', frequency: 32.703 },
  { pitch: 25, name: 'C#', octave: 1, label: 'C#1', frequency: 34.648 },
  { pitch: 26, name: 'D', octave: 1, label: 'D1', frequency: 36.708 },
  { pitch: 27, name: 'D#', octave: 1, label: 'D#1', frequency: 38.891 },
  { pitch: 28, name: 'E', octave: 1, label: 'E1', frequency: 41.203 },
  { pitch: 29, name: 'F', octave: 1, label: 'F1', frequency: 43.654 },
  { pitch: 30, name: 'F#', octave: 1, label: 'F#1', frequency: 46.249 },
  { pitch: 31, name: 'G', octave: 1, label: 'G1', frequency: 48.999 },
  { pitch: 32, name: 'G#', octave: 1, label: 'G#1', frequency: 51.913 },
  { pitch: 33, name: 'A', octave: 1, label: 'A1', frequency: 55 },
  { pitch: 34, name: 'A#', octave: 1, label: 'A#1', frequency: 58.27 },
  { pitch: 35, name: 'B', octave: 1, label: 'B1', frequency: 61.735 },
  { pitch: 36, name: 'C', octave: 2, label: 'C2', frequency: 65.406 },
  { pitch: 37, name: 'C#', octave: 2, label: 'C#2', frequency: 69.296 },
  { pitch: 38, name: 'D', octave: 2, label: 'D2', frequency: 73.416 },
  { pitch: 39, name: 'D#', octave: 2, label: 'D#2', frequency: 77.782 },
  { pitch: 40, name: 'E', octave: 2, label: 'E2', frequency: 82.407 },
  { pitch: 41, name: 'F', octave: 2, label: 'F2', frequency: 87.307 },
  { pitch: 42, name: 'F#', octave: 2, label: 'F#2', frequency: 92.499 },
  { pitch: 43, name: 'G', octave: 2, label: 'G2', frequency: 97.999 },
  { pitch: 44, name: 'G#', octave: 2, label: 'G#2', frequency: 103.826 },
  { pitch: 45, name: 'A', octave: 2, label: 'A2', frequency: 110 },
  { pitch: 46, name: 'A#', octave: 2, label: 'A#2', frequency: 116.541 },
  { pitch: 47, name: 'B', octave: 2, label: 'B2', frequency: 123.471 },
  { pitch: 48, name: 'C', octave: 3, label: 'C3', frequency: 130.813 },
  { pitch: 49, name: 'C#', octave: 3, label: 'C#3', frequency: 138.591 },
  { pitch: 50, name: 'D', octave: 3, label: 'D3', frequency: 146.832 },
  { pitch: 51, name: 'D#', octave: 3, label: 'D#3', frequency: 155.563 },
  { pitch: 52, name: 'E', octave: 3, label: 'E3', frequency: 164.814 },
  { pitch: 53, name: 'F', octave: 3, label: 'F3', frequency: 174.614 },
  { pitch: 54, name: 'F#', octave: 3, label: 'F#3', frequency: 184.997 },
  { pitch: 55, name: 'G', octave: 3, label: 'G3', frequency: 195.998 },
  { pitch: 56, name: 'G#', octave: 3, label: 'G#3', frequency: 207.652 },
  { pitch: 57, name: 'A', octave: 3, label: 'A3', frequency: 220 },
  { pitch: 58, name: 'A#', octave: 3, label: 'A#3', frequency: 233.082 },
  { pitch: 59, name: 'B', octave: 3, label: 'B3', frequency: 246.942 },
  { pitch: 60, name: 'C', octave: 4, label: 'C4', frequency: 261.626 },
  { pitch: 61, name: 'C#', octave: 4, label: 'C#4', frequency: 277.183 },
  { pitch: 62, name: 'D', octave: 4, label: 'D4', frequency: 293.665 },
  { pitch: 63, name: 'D#', octave: 4, label: 'D#4', frequency: 311.127 },
  { pitch: 64, name: 'E', octave: 4, label: 'E4', frequency: 329.628 },
  { pitch: 65, name: 'F', octave: 4, label: 'F4', frequency: 349.228 },
  { pitch: 66, name: 'F#', octave: 4, label: 'F#4', frequency: 369.994 },
  { pitch: 67, name: 'G', octave: 4, label: 'G4', frequency: 391.995 },
  { pitch: 68, name: 'G#', octave: 4, label: 'G#4', frequency: 415.305 },
  { pitch: 69, name: 'A', octave: 4, label: 'A4', frequency: 440 },
  { pitch: 70, name: 'A#', octave: 4, label: 'A#4', frequency: 466.164 },
  { pitch: 71, name: 'B', octave: 4, label: 'B4', frequency: 493.883 },
  { pitch: 72, name: 'C', octave: 5, label: 'C5', frequency: 523.251 },
  { pitch: 73, name: 'C#', octave: 5, label: 'C#5', frequency: 554.365 },
  { pitch: 74, name: 'D', octave: 5, label: 'D5', frequency: 587.33 },
  { pitch: 75, name: 'D#', octave: 5, label: 'D#5', frequency: 622.254 },
  { pitch: 76, name: 'E', octave: 5, label: 'E5', frequency: 659.255 },
  { pitch: 77, name: 'F', octave: 5, label: 'F5', frequency: 698.456 },
  { pitch: 78, name: 'F#', octave: 5, label: 'F#5', frequency: 739.989 },
  { pitch: 79, name: 'G', octave: 5, label: 'G5', frequency: 783.991 },
  { pitch: 80, name: 'G#', octave: 5, label: 'G#5', frequency: 830.609 },
  { pitch: 81, name: 'A', octave: 5, label: 'A5', frequency: 880 },
  { pitch: 82, name: 'A#', octave: 5, label: 'A#5', frequency: 932.328 },
  { pitch: 83, name: 'B', octave: 5, label: 'B5', frequency: 987.767 },
  { pitch: 84, name: 'C', octave: 6, label: 'C6', frequency: 1046.502 },
  { pitch: 85, name: 'C#', octave: 6, label: 'C#6', frequency: 1108.731 },
  { pitch: 86, name: 'D', octave: 6, label: 'D6', frequency: 1174.659 },
  { pitch: 87, name: 'D#', octave: 6, label: 'D#6', frequency: 1244.508 },
  { pitch: 88, name: 'E', octave: 6, label: 'E6', frequency: 1318.51 },
  { pitch: 89, name: 'F', octave: 6, label: 'F6', frequency: 1396.913 },
  { pitch: 90, name: 'F#', octave: 6, label: 'F#6', frequency: 1479.978 },
  { pitch: 91, name: 'G', octave: 6, label: 'G6', frequency: 1567.982 },
  { pitch: 92, name: 'G#', octave: 6, label: 'G#6', frequency: 1661.219 },
  { pitch: 93, name: 'A', octave: 6, label: 'A6', frequency: 1760 },
  { pitch: 94, name: 'A#', octave: 6, label: 'A#6', frequency: 1864.655 },
  { pitch: 95, name: 'B', octave: 6, label: 'B6', frequency: 1975.533 },
  { pitch: 96, name: 'C', octave: 7, label: 'C7', frequency: 2093.005 },
  { pitch: 97, name: 'C#', octave: 7, label: 'C#7', frequency: 2217.461 },
  { pitch: 98, name: 'D', octave: 7, label: 'D7', frequency: 2349.318 },
  { pitch: 99, name: 'D#', octave: 7, label: 'D#7', frequency: 2489.016 },
  { pitch: 100, name: 'E', octave: 7, label: 'E7', frequency: 2637.02 },
  { pitch: 101, name: 'F', octave: 7, label: 'F7', frequency: 2793.826 },
  { pitch: 102, name: 'F#', octave: 7, label: 'F#7', frequency: 2959.955 },
  { pitch: 103, name: 'G', octave: 7, label: 'G7', frequency: 3135.963 },
  { pitch: 104, name: 'G#', octave: 7, label: 'G#7', frequency: 3322.438 },
  { pitch: 105, name: 'A', octave: 7, label: 'A7', frequency: 3520 },
  { pitch: 106, name: 'A#', octave: 7, label: 'A#7', frequency: 3729.31 },
  { pitch: 107, name: 'B', octave: 7, label: 'B7', frequency: 3951.066 },
  { pitch: 108, name: 'C', octave: 8, label: 'C8', frequency: 4186.009 },
  { pitch: 109, name: 'C#', octave: 8, label: 'C#8', frequency: 4434.922 },
  { pitch: 110, name: 'D', octave: 8, label: 'D8', frequency: 4698.636 },
  { pitch: 111, name: 'D#', octave: 8, label: 'D#8', frequency: 4978.032 },
  { pitch: 112, name: 'E', octave: 8, label: 'E8', frequency: 5274.041 },
  { pitch: 113, name: 'F', octave: 8, label: 'F8', frequency: 5587.652 },
  { pitch: 114, name: 'F#', octave: 8, label: 'F#8', frequency: 5919.911 },
  { pitch: 115, name: 'G', octave: 8, label: 'G8', frequency: 6271.927 },
  { pitch: 116, name: 'G#', octave: 8, label: 'G#8', frequency: 6644.875 },
  { pitch: 117, name: 'A', octave: 8, label: 'A8', frequency: 7040 },
  { pitch: 118, name: 'A#', octave: 8, label: 'A#8', frequency: 7458.62 },
  { pitch: 119, name: 'B', octave: 8, label: 'B8', frequency: 7902.133 },
  { pitch: 120, name: 'C', octave: 9, label: 'C9', frequency: 8372.018 },
  { pitch: 121, name: 'C#', octave: 9, label: 'C#9', frequency: 8869.844 },
  { pitch: 122, name: 'D', octave: 9, label: 'D9', frequency: 9397.273 },
  { pitch: 123, name: 'D#', octave: 9, label: 'D#9', frequency: 9956.063 },
  { pitch: 124, name: 'E', octave: 9, label: 'E9', frequency: 10548.08 },
  { pitch: 125, name: 'F', octave: 9, label: 'F9', frequency: 11175.3 },
  { pitch: 126, name: 'F#', octave: 9, label: 'F#9', frequency: 11839.82 },
  { pitch: 127, name: 'G', octave: 9, label: 'G9', frequency: 12543.85 }
]
//-6,-5 ... (index - 6), shift so basetone is at 0
export const quintcircle = [{ dur: "F#", moll: "D#" }, { dur: "C#", moll: "B" }, { dur: "G#", moll: "F" }, { dur: "D#", moll: "C" },
{ dur: "A#", moll: "G" }, { dur: "F", moll: "D" }, { dur: "C", moll: "A" },
{ dur: "G", moll: "E" }, { dur: "D", moll: "A" }, { dur: "A", moll: "F#" },
{ dur: "E", moll: "C#" }, { dur: "B", moll: "G#" }]

export const instrumentsSoundfont = [
  "acoustic grand piano",
  "bright acoustic piano",
  "electric grand piano",
  "honky-tonk piano",
  "electric piano 1",
  "electric piano 2",
  "harpsichord",
  "clavi",
  "celesta",
  "glockenspiel",
  "music box",
  "vibraphone",
  "marimba",
  "xylophone",
  "tubular bells",
  "dulcimer",
  "drawbar organ",
  "percussive organ",
  "rock organ",
  "church organ",
  "reed organ",
  "accordion",
  "harmonica",
  "tango accordion",
  "acoustic guitar (nylon)",
  "acoustic guitar (steel)",
  "electric guitar (jazz)",
  "electric guitar (clean)",
  "electric guitar (muted)",
  "overdriven guitar",
  "distortion guitar",
  "guitar harmonics",
  "acoustic bass",
  "electric bass (finger)",
  "electric bass (pick)",
  "fretless bass",
  "slap bass 1",
  "slap bass 2",
  "synth bass 1",
  "synth bass 2",
  "violin",
  "viola",
  "cello",
  "contrabass",
  "tremolo strings",
  "pizzicato strings",
  "orchestral harp",
  "timpani",
  "string ensemble 1",
  "string ensemble 2",
  "synthstrings 1",
  "synthstrings 2",
  "choir aahs",
  "voice oohs",
  "synth voice",
  "orchestra hit",
  "trumpet",
  "trombone",
  "tuba",
  "muted trumpet",
  "french horn",
  "brass section",
  "synthbrass 1",
  "synthbrass 2",
  "soprano sax",
  "alto sax",
  "tenor sax",
  "baritone sax",
  "oboe",
  "english horn",
  "bassoon",
  "clarinet",
  "piccolo",
  "flute",
  "recorder",
  "pan flute",
  "blown bottle",
  "shakuhachi",
  "whistle",
  "ocarina",
  "lead 1 (square)",
  "lead 2 (sawtooth)",
  "lead 3 (calliope)",
  "lead 4 (chiff)",
  "lead 5 (charang)",
  "lead 6 (voice)",
  "lead 7 (fifths)",
  "lead 8 (bass + lead)",
  "pad 1 (new age)",
  "pad 2 (warm)",
  "pad 3 (polysynth)",
  "pad 4 (choir)",
  "pad 5 (bowed)",
  "pad 6 (metallic)",
  "pad 7 (halo)",
  "pad 8 (sweep)",
  "fx 1 (rain)",
  "fx 2 (soundtrack)",
  "fx 3 (crystal)",
  "fx 4 (atmosphere)",
  "fx 5 (brightness)",
  "fx 6 (goblins)",
  "fx 7 (echoes)",
  "fx 8 (sci-fi)",
  "sitar",
  "banjo",
  "shamisen",
  "koto",
  "kalimba",
  "bag pipe",
  "fiddle",
  "shanai",
  "tinkle bell",
  "agogo",
  "steel drums",
  "woodblock",
  "taiko drum",
  "melodic tom",
  "synth drum",
  "reverse cymbal",
  "guitar fret noise",
  "breath noise",
  "seashore",
  "bird tweet",
  "telephone ring",
  "helicopter",
  "applause",
  "gunshot",
]
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

let padlighting = -1

export const midiMapping =
{
  "Launchkey Mini MK3 MIDI": [
    { message: [191, 117, 127], call: () => { midiutil.startRecording(get(recording)) }, action: 'Record midi' },
    { message: [191, 115, 127], call: () => { mutil.playExportArrangement(); }, action: 'Play Arrangement' },
    {
      message: [191, 104, 127], call: () => { mu.requestModels(get(primerList)); }, action: 'Generate'
    },
    {
      message: [191, 105, 127], call: () => { mutil.findAllPolyMelodies(4, 0,); }, action: 'Combine for Polyphonie'
    },
    {
      message: [176, 21], call: (e) => {
        let value = e
        let s = d3.scaleQuantize().domain([0, 127]).range([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        iter.set(s(value))
      }, action: 'Iterations'
    },
    {
      message: [176, 22], call: (e) => {
        let value = e
        let s = d3.scaleLinear().domain([0, 127]).range([0.5, 1])
        mvaesim.set(s(value))
      }, action: 'MVAE Similarity'
    },
    {
      message: [176, 23], call: (e) => {
        let value = e
        let s = d3.scaleLinear().domain([0, 127]).range([16, 128])
        genlength.set(Math.round(s(value)))
      }, action: 'Melody Length'
    },
    {
      message: [176, 24], call: (e) => {
        let value = e
        let s = d3.scaleLinear().domain([0, 127]).range([0, pointcoloroptions.length - 1])
        pointcolorselect.set(pointcoloroptions[Math.round(s(value))])
      }, action: 'Color Select'
    },
    {
      message: [176, 25], call: (e) => {
        let value = e
        let s = d3.scaleLinear().domain([0, 127]).range([0, vorcoloroptions.length - 1])
        vorcolorselect.set(vorcoloroptions[Math.round(s(value))])
      }, action: 'Backgroundcolor Select'
    },
    {
      message: [176, 26], call: (e) => {
        let value = e
        let s = d3.scaleLinear().domain([0, 127]).range([0, 0.5])
        opacityVoronoi.set(s(value))
      }, action: 'Background Opacity'
    },
    {
      message: [176, 27], call: (e) => {
        let value = e
        let s = d3.scaleLinear().domain([0, 127]).range([0, glyphoptions.length - 1])
        glyphselect.set(glyphoptions[Math.round(s(value))])
      }, action: 'Glyph'
    },
    {
      message: [176, 28], call: (e) => {
        let value = e
        let s = d3.scaleLinear().domain([0, 127]).range([0.2, 2])
        glyphsize.set(s(value))
      }, action: 'Glyphsize'
    },
    { message: [153, 40, 127], call: () => { emotionbased.set({ label: "Monophonic", value: 0 }) }, action: 'Monophonic' },
    { message: [153, 36, 127], call: () => { emotionbased.set({ label: "Polyoptions", value: 2 }) }, action: 'Polyphonic' },
    { message: [153, 37, 127], call: () => { numpoly.set(2) }, action: '2 Voices' },
    { message: [153, 38, 127], call: () => { numpoly.set(3) }, action: '3 Voices' },
    { message: [153, 39, 127], call: () => { numpoly.set(4) }, action: '4 Voices' },
    { message: [153, 48, 127], call: () => { axisselect.updateAxis(axisoptions[1], 0, axisoptions[2], 1) }, action: 'Correlation' },
    { message: [153, 49, 127], call: () => { axisselect.updateAxis(true, 1) }, action: 'Similarity' },
    { message: [153, 50, 127], call: () => { axisselect.updateAxis(true, 2) }, action: 'Timbre' },
    { message: [153, 51, 127], call: () => { axisselect.updateAxis(true, 3) }, action: 'Export' },
    {
      message: [153, 46, 127], call: () => {
        grid.set(!get(grid));
        if (get(axisselect)[2] === 1) {
          axisselect.updateAxis(true, 1);
        }; hilbert.set(false)
      }, action: 'Grid'
    },
    {
      message: [153, 47, 127], call: () => {
        hilbert.set(!get(hilbert));
        if (get(axisselect)[2] === 1) {
          axisselect.updateAxis(true, 1);
        }; grid.set(false)
      }, action: 'Hilbert'
    },
  ],
  "MIDIIN2 (LPMiniMK3 MIDI)": [
    {
      message: [144, 99, 127], call: () => {
        let entries = Object.entries(get(modelselected))
        if (!entries[0][1]) {
          controlColor(99, true, 1, 45)
        } else {
          controlColor(99, true, 3, 45)
        }
        entries[0][1] = !entries[0][1]
        modelselected.set(Object.fromEntries(entries));
      }, action: 'Model 1'
    },
    {
      message: [144, 95, 127], call: () => {
        let entries = Object.entries(get(modelselected))
        if (!entries[1][1]) {
          controlColor(95, true, 1, 9)
        } else {
          controlColor(95, true, 3, 9)
        }
        entries[1][1] = !entries[1][1]
        modelselected.set(Object.fromEntries(entries));
      }, action: 'Model 2'
    },
    {
      message: [144, 91, 127], call: () => {
        let entries = Object.entries(get(modelselected))
        if (!entries[2][1]) {
          controlColor(91, true, 1, 5)
        } else {
          controlColor(91, true, 3, 5)
        }
        entries[2][1] = !entries[2][1]
        modelselected.set(Object.fromEntries(entries));
      }, action: 'Model 3'
    },
    {
      message: [144, 87, 127], call: () => {
        let entries = Object.entries(get(modelselected))
        if (!entries[3][1]) {
          controlColor(87, true, 1, 33)
        } else {
          controlColor(87, true, 3, 33)
        }
        entries[3][1] = !entries[3][1]
        modelselected.set(Object.fromEntries(entries));
      }, action: 'Model 4'
    },
    {
      message: [144, 83, 127], call: () => {
        let entries = Object.entries(get(modelselected))
        if (!entries[4][1]) {
          controlColor(83, true, 1, 21)
        } else {
          controlColor(83, true, 3, 21)
        }
        entries[4][1] = !entries[4][1]
        modelselected.set(Object.fromEntries(entries));
      }, action: 'Model 5'
    },
    {
      message: [144, null, 127], call: (e) => {
        console.log(e)
        let value = null
        if (e < 70)
          value = e - 36
        if (value !== null && get(meloselected)?.length > value && get(selectedMeloColors)?.length > value) {
          let player1 = get(player)
          if (player1 !== null && player1 !== undefined) {
            if (!player1.isPlaying()) {
              padlighting = -1
            }
          }
          if (padlighting !== -1 && padlighting !== e) {
            mutil.playMelody(
              null,
              null,
              undefined,
              0,
              0, // if 120 bpm but we only use that
              0,
              null
            );
            controlColor(padlighting, true, 1, get(selectedMeloColors)[padlighting - 36])
            padlighting = e
            controlColor(e, true, 3, get(selectedMeloColors)[value]) //
            let melody = get(meloselected)[value][2]
            mutil.playMelody(
              melody.melody.notes,
              false,
              undefined,
              0,
              0, // if 120 bpm but we only use that
              0,
              melody,
              {
                melody: melody?.melody?.uniqueID,
                melodyID: melody?.uniqueID,
                user: melody?.userspecific,
              },
            );
          } else if (padlighting === -1) {
            padlighting = e
            controlColor(e, true, 3, get(selectedMeloColors)[value]) //
            let melody = get(meloselected)[value][2]

            mutil.playMelody(
              melody.melody.notes,
              false,
              undefined,
              0,
              0, // if 120 bpm but we only use that
              0,
              melody,
              {
                melody: melody?.melody?.uniqueID,
                melodyID: melody?.uniqueID,
                user: melody?.userspecific,
              },
            );
          } else {
            padlighting = -1
            controlColor(e, true, 1, get(selectedMeloColors)[value])
            mutil.playMelody(
              null,
              null,
              undefined,
              0,
              0, // if 120 bpm but we only use that
              0,
              null
            );
          }

        } else {
          console.log(get(meloselected), value)
        }

      }, action: 'Play Selected Melody by Index'
    }, //36 -> 98 ohne models
  ]
}

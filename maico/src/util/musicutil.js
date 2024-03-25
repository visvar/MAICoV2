import * as tonal from 'tonal'
import { models, player, currentpoints, axisselect, keydetectselect, seen, filterextents, selectedKeys, bpm, strangers, filterkey, playclick, points, progress, polyoptions, emotionbased, progressnew } from '../stores/stores.js'
import { get } from "svelte/store";
import * as mm from '@magenta/music'
import * as visutil from './visutil.js'
import * as glutil from './glyphutil.js'

import * as app from '../App.svelte'

import EventEmitter from 'eventemitter3';


let pbl, t, xe

const testChangeEvent = new EventEmitter();
function changePlay(newVal) {
  playline = newVal
  if (newVal)
    testChangeEvent.emit("play", pbl, t, xe)
}

let playline = false

export function pitchDiff(rec) {
  const recNew = []
  let prev = 0
  rec.forEach((note) => {
    prev !== 0
      ? recNew.push({
        // @ts-ignore
        pitch: note.pitch - prev.pitch,
        quantizedStartStep: note.quantizedStartStep,
        quantizedEndStep: note.quantizedEndStep
      })
      : recNew.push({
        pitch: note.pitch,
        quantizedStartStep: note.quantizedStartStep,
        quantizedEndStep: note.quantizedEndStep
      })
    prev = note
  })
  return recNew
}

export function calcEmotion(melos) {
  const matrix = Array.from({ length: melos.length }).map(() => Array.from({ length: 11 }))
  melos.forEach((e, i) => {
    const major = getMajorfromScale(getScaleofMelody(
      e,
      glutil.calcDataPie(e).occ,
      get(keydetectselect).value === 2,
      get(keydetectselect).value === 1
    ));
    matrix[i][0] = major !== null ? major ? 1 : 0 : 0.5         //isDur: emotionfeatures[index][0],
    matrix[i][1] = major !== null ? !major ? 1 : 0 : 0.5                      //isMoll: emotionfeatures[index][1],
    matrix[i][2] = computeRhythmicComplexity(computeOffBeat(e), computeRhythmChange(e), computePauses(e), e) //rythmComplexity: emotionfeatures[index][2],
    matrix[i][3] = e.notes.length         //numberNotes: emotionfeatures[index][3],
    matrix[i][4] = range(e)               //melodyRange: emotionfeatures[index][4],
    matrix[i][5] = avgIntervals(e)         //avgIntervals: emotionfeatures[index][5],
    const intervalcounts = calcIntervalsFeature(e)
    matrix[i][6] = intervalcounts[0]//numberCleanIntervals: emotionfeatures[index][6],
    matrix[i][7] = intervalcounts[1]//numberUncleanPureIntervals: emotionfeatures[index][7],
    matrix[i][8] = meanpitch(e)//avgHighNotes: emotionfeatures[index][8],
    const updir = updirection(e)
    matrix[i][9] = updirection !== null ? updirection ? 1 : 0 : 0.5//incMelody: emotionfeatures[index][9],
    matrix[i][10] = updirection !== null ? !updirection ? 1 : 0 : 0.5//decMelody: emotionfeatures[index][10]
  });
  for (let i = 2; i < 9; i++) {
    let vals = matrix.map(e => e[i])
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const scale = d3.scaleLinear().domain([min, max]).range([0, 1])
    matrix.forEach(e => e[i] = scale(e[i]))
  }
  return matrix
}

export function range(e) {
  return Math.max(...e.notes.map(n => n.pitch)) - Math.min(...e.notes.map(n => n.pitch))
}

export function updirection(melo) {
  let up = 0
  let lastnote = 0
  melo.notes.forEach((n, i) => {
    if (i === 0) {
      lastnote = n.pitch
    } else {
      if (n.pitch - lastnote > 0)
        up++
      else if (n.pitch - lastnote < 0)
        up--
      lastnote = n.pitch
    }
  })
  return up > 0 ? true : up < 0 ? false : null
}

export function calcIntervalsFeature(melo) {
  let clean = 0
  let unclean = 0
  let lastnote = 0
  melo.notes.forEach((n, i) => {
    if (i === 0) {
      lastnote = n.pitch
    } else {
      let interval = Math.abs(n.pitch - lastnote)
      if (interval % 12 === 5 || interval % 12 === 7 || interval % 12 === 0)
        clean++
      else
        unclean++
      //if (interval % 12 === 2 || interval % 12 === 4 || interval % 12 === 9 || interval % 12 === 11)
      //  unclean++
      lastnote = n.pitch
    }
  })
  return [clean / (melo.notes.length - 1), unclean / (melo.notes.length - 1)]
}

export function meanpitch(melo) {
  let add = 0
  melo.notes.forEach(n => {
    add += n.pitch
  })
  return add / melo.notes.length
}

export function avgIntervals(melo) {
  let addinterval = 0
  let lastnote = 0
  melo.notes.forEach((n, i) => {
    if (i === 0) {
      lastnote = n.pitch
    } else {
      addinterval += Math.abs(n.pitch - lastnote)
      lastnote = n.pitch
    }
  })
  return addinterval / melo.notes.length
}

// wight 0 = rhythm -> 1 = melody
export function ourDistanceFunction(recOld1, recOld2, timeBinSize, weight) {
  if (recOld1 === undefined)
    return 1
  if (recOld2 === undefined)
    recOld2 = allPrimer[0]
  const rec1 = pitchDiff(recOld1.notes)
  const rec2 = pitchDiff(recOld2.notes)
  let totalrhy = 0
  let totalmel = 0
  let rhythm = 0
  let melody = 0
  const maxStep = Math.max(recOld1.totalQuantizedSteps, recOld2.totalQuantizedSteps)
  for (let i = 0; i < maxStep; i = i + timeBinSize) {
    const rec1Temp = []
    const rec2Temp = []
    rec1.forEach((note) => {
      if (note.quantizedStartStep <= i && i < note.quantizedEndStep) {
        rec1Temp.push(note)
      }
    })
    rec2.forEach((note) => {
      if (note.quantizedStartStep <= i && i < note.quantizedEndStep) {
        rec2Temp.push(note)
      }
    })
    let rhythmNew = 0
    let once = false
    let note1
    let note2
    if (rec1Temp.length >= rec2Temp.length) {
      for (let j = 0; j < rec1Temp.length; j++) {
        once = false
        for (let k = 0; k < rec2Temp.length; k++) {
          if (!once) {
            note1 = rec1Temp[j].quantizedEndStep - rec1Temp[j].quantizedStartStep
            note2 = rec2Temp[k].quantizedEndStep - rec2Temp[k].quantizedStartStep
            if (note1 === note2) {
              rhythmNew++
              once = true
            }
          }
        }
      }
      if (rec1Temp.length !== 0) {
        rhythm += rhythmNew / rec1Temp.length
      }
      if (rec1Temp.length !== 0) {
        totalrhy++
      }
    } else {
      for (let j = 0; j < rec2Temp.length; j++) {
        once = false
        for (let k = 0; k < rec1Temp.length; k++) {
          if (!once) {
            note1 = rec1Temp[k].quantizedEndStep - rec1Temp[k].quantizedStartStep
            note2 = rec2Temp[j].quantizedEndStep - rec2Temp[j].quantizedStartStep
            if (note1 === note2) {
              rhythmNew++
              once = true
            }
          }
        }
      }
      if (rec2Temp.length !== 0) {
        rhythm += rhythmNew / rec2Temp.length
      }
      if (rec2Temp.length !== 0) {
        totalrhy++
      }
    }

    const maxLength = Math.max(rec1Temp.length, rec2Temp.length)

    let melodyNew = 0
    for (let j = 0; j < rec1Temp.length; j++) {
      for (let k = 0; k < rec2Temp.length; k++) {
        if (rec1Temp[j].pitch === rec2Temp[k].pitch) {
          melodyNew++
        }
      }
    }
    if (maxLength !== 0) {
      melody += melodyNew / maxLength
    }
    if (rec1Temp.length > 0 || rec2Temp.length > 0) { totalmel++ }
  }
  rhythm = rhythm / totalrhy
  melody = melody / totalmel
  return 1 - (rhythm * (1 - weight) + melody * weight)
}

// needs melody not array of notes
export function getMeanLength(melo) {
  let total = 0
  let lengths = 0
  melo.notes.forEach((d) => {
    lengths = lengths + d.quantizedEndStep - d.quantizedStartStep
    total++
  })
  return lengths !== 0 ? lengths / total : 1
}

import * as d3 from 'd3'
export function calcVariance(notes) {
  if (notes.length > 0) {
    const newnotes = pitchDiff(notes)
    newnotes[0].pitch = 0
    const variance = d3.variance(newnotes, d => d.pitch)
    return !isNaN(variance) ? variance : 0
  } else {
    return 0
  }
}


export function calcGlyphMax(melodies) {
  let maxl = 0
  let maxnum = 0
  let maxvar = 0
  melodies.forEach((mel, i) => {
    if (i !== 0) {
      if (maxl < getMeanLength(mel)) { maxl = getMeanLength(mel) }
      if (maxnum < mel.notes.length) { maxnum = mel.notes.length }
      if (maxvar < calcVariance(mel)) { maxvar = calcVariance(mel.notes) }
    }
  })
  return { maxl: maxl, maxnum: maxnum, maxvar: maxvar }
}


export function getExtentOfMelody(melody, mode, isPrimer, isPolymix) {
  let max = 0;
  let min = 128;
  melody?.notes.forEach(note => {
    note.pitch < min ? min = note.pitch : null
    note.pitch > max ? max = note.pitch : null
  })
  if (mode) {
    if (!isPrimer && !isPolymix)
      melody.primer.notes.forEach(note => {
        note.pitch < min ? min = note.pitch : null
        note.pitch > max ? max = note.pitch : null
      })
    max++
    min--
    while (max - min < 10) {
      max++
      min--
    }
  }
  return [min, max]
}

// pace of melody should represent how fast a melody is going
// only short notes should be fast => 1
// only longer notes (>1/2 notes) should be slow => 0.2
// pause there is no pace => 0
// but linearScale maybe not good because two notes in space of one should indicate double speed => exponential scale?
// what about short note + pause? => maybe also check about note length but overall feeling of pace might be slow with pauses
// -> new metric with pauses?

// other idea is to represent the pace as line or multiple per 8 steps
// monophonic currently

export function calcPaceMelody(mel) {
  let scale = d3.scalePow().exponent(2).domain([0, 1, 8]).range([0, 0.2, 1])
  let length = Math.ceil(mel.totalQuantizedSteps / 8)
  let paceArray = new Array(length).fill(0)
  for (let i = 1; i <= length; i++) {
    let currentnotes = mel.notes.filter((note) => (note.quantizedStartStep >= (i - 1) * 8 && note.quantizedEndStep <= i * 8) || (note.quantizedStartStep >= (i - 1) * 8 && note.quantizedStartStep < i * 8) || (note.quantizedEndStep > (i - 1) * 8 && note.quantizedEndStep <= i * 8))
    paceArray[i - 1] = scale(currentnotes.length)
  }
  return paceArray
}

export function getChordofMelody(mel) {
  let bnotes = mel.notes.map((n) => tonal.Note.fromMidi(n.pitch))
  let snotes = mel.notes.map((n) => tonal.Note.fromMidiSharps(n.pitch))

  let bchord = tonal.Chord.detect(bnotes)
  let schord = tonal.Chord.detect(snotes)

}

export function findKey(frequency, original) {
  //The base profiles for C major and C minor
  var major_profile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  var minor_profile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

  if (!original) {
    major_profile = [5, 2, 3.5, 2, 4.5, 4, 2, 4.5, 2, 3.5, 1.5, 4];
    minor_profile = [5, 2, 3.5, 4.5, 2, 4, 2, 4.5, 3.5, 2, 1.5, 4];

  }
  //rotates array right by one
  function rotate(array) {
    array.unshift(array.pop());
    return array;
  }

  var major_profiles = new Array(12);
  var minor_profiles = new Array(12);

  //Generate the full profile set from the base profiles by rotating
  major_profiles[0] = major_profile;
  minor_profiles[0] = minor_profile;
  for (var i = 1; i < 12; i++) {

    //deep copy previous array
    var previousMajor = new Array(12);
    var previousMinor = new Array(12);
    for (var a = 0; a < 12; a++) {
      previousMajor[a] = major_profiles[i - 1][a];
      previousMinor[a] = minor_profiles[i - 1][a];
    }

    //shift previous array
    var shiftedMajor = rotate(previousMajor);
    var shiftedMinor = rotate(previousMinor);

    //deep copy shifted array into profiles
    major_profiles[i] = new Array(12);
    minor_profiles[i] = new Array(12);
    for (var x = 0; x < 12; x++) {
      major_profiles[i][x] = shiftedMajor[x];
      minor_profiles[i][x] = shiftedMinor[x];
    }

  }


  //concatenate two arrays
  var joined = major_profiles.concat(minor_profiles);
  //console.log(joined);

  //find max correlation
  var maxIndex = 0;
  var maxCorrelation = -1;
  let alt = []
  var midiArray = frequency;
  for (var i = 0; i < 24; i++) {
    var data = new Array(joined[i], midiArray);

    //const correlation = visutil.pearsonCorrelation(data, 0, 1);
    const correlation = visutil.correlationCoefficient(data[0], data[1], data[0].length)
    if (correlation > maxCorrelation) {
      maxIndex = i;
      maxCorrelation = correlation;
      alt = []
    } else if (correlation === maxCorrelation) {
      alt.push(i)
    }
  }
  if (alt.length > 0) {
    alt.sort((a, b) => a % 12 - b % 12)
  }
  return [maxIndex, alt];
}


export function interpretKey(frequency, original) {
  let key = 0
  let found = []
  if (frequency.filter(x => x > 0).length === 1)
    key = frequency.indexOf(Math.max(...frequency))
  else {
    let f = findKey(frequency, original);
    key = f[0]
    found = f[1]
  }
  var noteName;
  switch (key) {
    case 0: noteName = "C4 major";
      break;
    case 1: noteName = "C#4 major";
      break;
    case 2: noteName = "D4 major";
      break;
    case 3: noteName = "D#4 major";
      break;
    case 4: noteName = "E4 major";
      break;
    case 5: noteName = "F4 major";
      break;
    case 6: noteName = "F#4 major";
      break;
    case 7: noteName = "G4 major";
      break;
    case 8: noteName = "G#4 major";
      break;
    case 9: noteName = "A4 major";
      break;
    case 10: noteName = "A#4 major";
      break;
    case 11: noteName = "B4 major";
      break;
    case 12: noteName = "C4 minor";
      break;
    case 13: noteName = "C#4 minor";
      break;
    case 14: noteName = "D4 minor";
      break;
    case 15: noteName = "D#4 minor";
      break;
    case 16: noteName = "E4 minor";
      break;
    case 17: noteName = "F4 minor";
      break;
    case 18: noteName = "F#4 minor";
      break;
    case 19: noteName = "G4 minor";
      break;
    case 20: noteName = "G#4 minor";
      break;
    case 21: noteName = "A4 minor";
      break;
    case 22: noteName = "A#4 minor";
      break;
    case 23: noteName = "B4 minor";
      break;
  }

  return [noteName, found];
}


// could add key at the end to get key information and scale and pentatonics etc
export function getScaleofMelody(mel, occurrence, tonaljs, krumhansl, set, setmode, primerkey) {
  if (!setmode) {
    if (tonaljs) {
      let bnotes = mel.notes.map((n) => tonal.Note.fromMidi(n.pitch))
      let snotes = mel.notes.map((n) => tonal.Note.fromMidiSharps(n.pitch))

      // anfangston im moment
      // könnte end ton aber schwierig da teilweise random
      // oder most occuring note oder weighted decision

      let bscale = tonal.Scale.detect(bnotes, { match: "fit" })
      let sscale = tonal.Scale.detect(snotes, { match: "fit" })


      let option = []
      bscale[0] === sscale[0] ? option = [bscale[0]] : option = [bscale[0], sscale[0]]
      option.forEach((opt, index) =>
        option[index] = tonal.Scale.get(opt)
      )

      //console.log(bscale, sscale, option)
      return [option[0], []]
    } else {
      // true for original krumhansl weight, false for updates from David Temperley
      let keys = interpretKey(occurrence, krumhansl)
      let scale = tonal.Scale.get(keys[0])
      scale.notes = scale.notes.map(d => tonal.Note.pitchClass(d))

      return [scale, keys[1]]
    }
  } else {
    if (primerkey) {

      let string = mel?.primer?.key !== undefined ? mel.primer.key.tonic + "4 " + mel.primer.key.type : "C4 major"
      let scale = tonal.Scale.get(string)
      return [scale, []]
    } else {
      let noteName = null
      switch (set) {
        case 0: noteName = "C4 major";
          break;
        case 1: noteName = "C#4 major";
          break;
        case 2: noteName = "D4 major";
          break;
        case 3: noteName = "D#4 major";
          break;
        case 4: noteName = "E4 major";
          break;
        case 5: noteName = "F4 major";
          break;
        case 6: noteName = "F#4 major";
          break;
        case 7: noteName = "G4 major";
          break;
        case 8: noteName = "G#4 major";
          break;
        case 9: noteName = "A4 major";
          break;
        case 10: noteName = "A#4 major";
          break;
        case 11: noteName = "B4 major";
          break;
        case 12: noteName = "C4 minor";
          break;
        case 13: noteName = "C#4 minor";
          break;
        case 14: noteName = "D4 minor";
          break;
        case 15: noteName = "D#4 minor";
          break;
        case 16: noteName = "E4 minor";
          break;
        case 17: noteName = "F4 minor";
          break;
        case 18: noteName = "F#4 minor";
          break;
        case 19: noteName = "G4 minor";
          break;
        case 20: noteName = "G#4 minor";
          break;
        case 21: noteName = "A4 minor";
          break;
        case 22: noteName = "A#4 minor";
          break;
        case 23: noteName = "B4 minor";
          break;
      }
      let scale = tonal.Scale.get(noteName)
      return [scale, []]
    }
  }
}

// what about bebop ...
export function getKeyfromScale(scale) {
  if (scale.type.includes('major'))
    return tonal.Key.majorKey(scale.tonic)
  else if (scale.type.includes('minor'))
    return tonal.Key.minorKey(scale.tonic)
  else
    return null
}

export function getMajorfromScale(data) {
  let scale = data
  if (Array.isArray(data))
    scale = data[0]
  if (scale.type.includes('major'))
    return true
  else if (scale.type.includes('minor'))
    return false
  else
    return null
}

// scale is maybe the information of key => can somewhat derive harmonic sounding 
// cannot use chordsHarmonics as it uses the chords and not single notes
export function getHarmonics(mel, scale, name) {
  if (scale === null || scale === undefined) {
    return [[0, 0, 0, 0, mel.notes.length], { outScale: [], key: false }]
  }
  let notes = scale.scale
  if (notes === null || notes === undefined)
    if (scale.natural !== null && scale.melodic !== undefined) {
      notes = scale?.natural?.scale
    } else
      return [[0, 0, 0, 0, mel.notes.length], { outScale: [], key: false }]

  function replace(d) {
    if (d.includes('b')) {
      if (d[0] === 'D') {
        return "C#"
      } else if (d[0] === 'E') {
        return "D#"
      } else if (d[0] === 'G') {
        return "F#"
      } else if (d[0] === 'A') {
        return "G#"
      } else if (d[0] === 'B') {
        return "A#"
      } else {
        return d
      }
    } else if (d.includes('##')) {
      if (d[0] === 'C') {
        return "D"
      } else if (d[0] === 'D') {
        return "E"
      } else if (d[0] === 'E') {
        return "F#"
      } else if (d[0] === 'F') {
        return "G"
      } else if (d[0] === 'G') {
        return "A"
      } else if (d[0] === 'A') {
        return "B"
      } else if (d[0] === 'B') {
        return "C#"
      } else {
        return d
      }
    } else {
      return d
    }
  }
  notes = notes.map((d) => replace(d))
  // numbers of tonic, dominant, subdominant, harmonic, outofscale
  let harmonics = [0, 0, 0, 0, 0]
  let outScale = new Set([])
  let outScaleNotes = { outScale: null, key: true }
  mel.notes.map(note1 => replace(tonal.Note.pitchClass(tonal.Note.fromMidi(note1.pitch)))).forEach((note, i) => {
    if (notes.includes(note)) {
      if (notes.indexOf(note) === 0)
        harmonics[0]++
      else if (notes.indexOf(note) === 4)
        harmonics[1]++
      else if (notes.indexOf(note) === 3)
        harmonics[2]++
      else
        harmonics[3]++
    } else {
      outScale.add(mel.notes[i].pitch)
      harmonics[4]++
    }
  })

  outScaleNotes.outScale = outScale
  return [harmonics, outScaleNotes]
}

export function getInScalePercent(harmonics) {
  return 1 - (harmonics[harmonics.length - 1] / harmonics.reduce((a, b) => a + b))
}


// calculate harmonic score
// maybe t,d,sd => perfect harmony; harmonics => medium harmonic; outScale => no harmonic 
//                  1                             0.8                         0
export function getHarmonicScore(mel, harmonic) {
  let score = 0
  harmonic.forEach((v, i) => {
    if (i < 3)
      score += v
    else if (i === 3)
      score += v * 0.8
    else if (i === 4)
      score += v * 0
  })
  return score / mel.notes.length
}

export function percentagePauses(mel) {
  let pauses = 0
  for (let i = 0; i < mel.totalQuantizedSteps; i++)
    mel.notes.filter((note) => note.quantizedStartStep < i + 0.5 && note.quantizedEndStep > i + 0.5).length !== 0 ? pauses++ : null
  return pauses / mel.totalQuantizedSteps
}

function playedSameTime(n1, n2) {
  if (n1.quantizedStartStep > n2.quantizedEndStep || n2.quantizedStartStep > n1.quantizedEndStep)
    return false
  else
    return true
}

export function isPolyphonic(mel) {
  let poly = []
  mel.notes.forEach((note) => {
    poly = mel.notes.filter(n => playedSameTime(n, note))
    if (poly.length > 0)
      return true
  })
  return false
}

import { getAxisScale } from '../util/visutil.js'
import { allPrimer, keysLookup, oktaveLookup, quintcircle } from '../stores/globalValues.js';
import { log } from './fileutil.js';

export function playMelody(e, event, playbackline, xend, time, reset, sample, logseq = {}) {
  let player1 = get(player)
  if (player1 === null || player1 === undefined) {
    player1 = new mm.Player(true)//SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus')
    player1.callbackObject = {
      run: (note) => {
        if (!playline)
          changePlay(true)
      },
      stop: () => {
        changePlay(false)
      }
    }
    //player1.loadAllSamples(1, false).then(() => { console.log('playerLoaded'); player.set(player1) })
    player.set(player1)
  } else if (player1.isPlaying()) {
    log("stopped listening", {})
    player1.stop()
    changePlay(false)
    playbackline.transition().attr("stroke", null).attr("x1", reset)
      .attr("x2", reset)
    return null
  }

  let notes = e
  let closest
  if (event) {
    let axis = getAxisScale()
    const x = axis[0]
    // @ts-ignore
    const y = axis[1]

    // get nearest melody
    // get axis -> invert -> compare to all vis data and get nearest

    const selx = x.invert(e.offsetX)
    const sely = y.invert(e.offsetY)

    const margin = [Math.abs(x.invert(50) - x.invert(100)), Math.abs(y.invert(50) - y.invert(100))]

    const curaxisx = get(axisselect)[0].value
    const curaxisy = get(axisselect)[1].value

    closest = get(currentpoints).reduce(function (prev, curr) {
      return (Math.abs(curr[0][curaxisx] - selx) + Math.abs(curr[1][curaxisy] - sely) < Math.abs(prev[0][curaxisx] - selx) + Math.abs(prev[1][curaxisy] - sely) ? curr : prev);
    });

    if (Math.abs(closest[0][curaxisx] - selx) < margin[0] && Math.abs(closest[1][curaxisy] - sely) < margin[1])
      notes = closest[2].melody.notes
    else
      notes = []

  }
  // sample holds the point so it is in seen already -> just edit seen
  if (sample !== undefined) {
    if (get(seen).filter(p1 => p1[2].index === sample.index).length === 0) {
      sample.userspecific.seen = 2
      seen.set(get(seen).push(sample))
    } else {
      sample.userspecific.seen = 2
      get(seen).filter(p1 => p1[2].index === sample.index)[0][2].userspecific.seen = 2
      seen.set(get(seen))
    }
  } else { //take closest as point -> maybe need to add to seen and value to 2
    /*if (get(seen).filter(p1 => p1[2].index === closest[2].index).length === 0) {
      closest[2].userspecific.seen = 2
      seen.set(get(seen).push(sample))
    } else {
      closest[2].userspecific.seen = 2
      get(seen).filter(p1 => p1[2].index === closest[2].index)[0].userspecific.seen = 2
      seen.set(get(seen))
    }
    */
  }

  // play melody
  if (player1 !== undefined && player1 !== null) {
    if (notes?.length > 0) {
      const seq = mm.sequences.createQuantizedNoteSequence(4, 120)
      seq.notes = notes
      log("listening", logseq)
      if (playbackline !== undefined)
        playbackline.transition().attr("stroke", "blue")

      player1.playClick = get(playclick)
      //player1.loadSamples(seq).then(() => {
      player1.start(seq, get(bpm)).then(() => playbackline?.transition()?.attr("stroke", null)?.attr("x1", reset)
        ?.attr("x2", reset))

      if (playbackline !== undefined) {
        pbl = playbackline
        t = time
        xe = xend
      }
      //})
    }
  }
}

testChangeEvent.on("play", (playbackline, time, xend) => {
  if (playline)
    playbackline.transition().duration(time).ease(d3.easeLinear).attr("x1", xend)
      .attr("x2", xend)
})


// Hannes

export function calcRhythmMax(melodies) {
  let maxOffBeat = 0
  let maxChange = 0
  let maxL = 0
  let maxPauses = 0
  let complexities = Array(melodies.length).fill(0)
  melodies.forEach((mel, i) => {
    const offBeat = computeOffBeat(mel)
    const change = computeRhythmChange(mel)
    const length = mel.notes.length
    const pauses = percentagePauses(mel)
    if (i !== 0) {
      if (maxOffBeat < offBeat) { maxOffBeat = offBeat }
      if (maxChange < change) { maxChange = change }
      if (maxL < length) { maxL = length }
      if (maxPauses < pauses) { maxPauses = pauses }
      complexities[i] = computeRhythmicComplexity(offBeat, change, pauses, mel)
    }
  })
  complexities.sort((a, b) => { return a - b })
  return { maxOffBeat: maxOffBeat, maxChange: maxChange, maxL: maxL, maxPauses: maxPauses, complexities: complexities }
}

// calculate distribution of note values 
export function computeRhythmDistribution(mel) {
  let rhythm = Array(mel.totalQuantizedSteps).fill(0)
  mel.notes.forEach((note) => {
    let duration = note.quantizedEndStep - note.quantizedStartStep
    rhythm[duration - 1] += duration
  });
  // Anteilig am Takt/der ganzen Melodie berechnen
  let totalMelodyLength = mel.totalQuantizedSteps;
  for (let i = 0; i < rhythm.length; i++) {
    rhythm[i] = rhythm[i] / totalMelodyLength;
  }
  return rhythm
}

export function computePauses(mel) {
  let pauses = Array(mel.totalQuantizedSteps).fill(0)
  let lastEndTime = 0
  mel.notes.forEach((note) => {
    if (note.quantizedStartStep != lastEndTime) {
      let duration = note.quantizedStartStep - lastEndTime
      pauses[duration - 1] += 1
    }
  });
  return pauses
}

// Beat Steps are 0,4,8,12
export function computeOffBeat(mel) {
  let offBeatCount = 0;
  mel.notes.forEach((note) => {
    let duration = note.quantizedEndStep - note.quantizedStartStep
    if (note.quantizedStartStep % duration != 0) {
      offBeatCount++;
    }
  });
  return offBeatCount
}

export function computeRhythmChange(mel) {
  let count = 0, durationLastNote = 0
  mel.notes.forEach((note) => {
    let duration = note.quantizedEndStep - note.quantizedStartStep;
    if (duration != durationLastNote) {
      count += 1;
      durationLastNote = duration;
    }
  });
  return count / mel.notes.length
}

export function computeSyncope(mel) {
  let lastEndTime = 0, snycopeCount = 0;
  let lastNoteWasUneven = false;
  mel.notes.forEach((note) => {

    let duration = note.quantizedEndStep - note.quantizedStartStep

    if (duration < 4) {
      if (note.quantizedStartStep % (duration) != 0 && duration % 3 != 0) {
        snycopeCount++;
      }
      if (lastNoteWasUneven && lastEndTime == note.quantizedStartStep) {
        snycopeCount++;
      }
    }
    lastNoteWasUneven = duration % 3 == 0 ? true : false
    lastEndTime = note.quantizedEndStep
  });
  return snycopeCount

}

export function computeBeatComplexity(mel) {
  let beatComplexity = Array(Math.ceil(mel.totalQuantizedSteps / 4)).fill(0)
  let lastDuration = 0;
  let complexity = 0;
  let beat = 0;
  let lastEnd = 0;
  mel.notes.forEach((note) => {
    let duration = note.quantizedEndStep - note.quantizedStartStep
    if (note.quantizedStartStep % duration != 0) {
      complexity += 10;
    }
    if (note.quantizedStartStep != lastEnd) {
      complexity += 2;
    }
    if (duration != lastDuration) {
      complexity += 20;
    }
    lastEnd = note.quantizedEndStep;
    lastDuration = duration;
    complexity++; //count of notes also relevant
    if (note.quantizedEndStep >= (beat + 1) * 4) {
      beatComplexity[beat] = complexity;
      beat = Math.floor(note.quantizedEndStep / 4);
      complexity = 0;
    }
  });
  return beatComplexity;

}


export function computeRhythmicComplexity(countOffBeat, countRhyhtmChange, pauses, mel) {
  // Gewichtung dass kurze Pausen höheren Schwierigkeitsgrad haben
  let pauseCount = 0
  for (let i = 0; i < pauses.length; i++) {
    if (i <= 2) {
      pauseCount += pauses[i] * 5
    } else if (i <= 6) {
      pauseCount += pauses[i] * 2
    } else {
      pauseCount += pauses[i]
    }
  }
  // Gewichtung 
  // offBeat: 10
  // rhythmChange: 20
  let complexity = countOffBeat * 10 + mel.notes.length + countRhyhtmChange * 20 + pauseCount
  return complexity / 200

}

export function passGenerateFilter(data, check, strangers) {
  let notes = data.notes
  let checkpassed = true
  let strangernum = 0
  if (check) {
    // filter with range
    let filter = get(filterextents)
    filter.forEach((v, i) => {
      let is = notes.filter(n => n.quantizedStartStep <= i && n.quantizedEndStep > i)
      if (is.length > 0) {
        if (is.filter(n => n.pitch < v[0] || n.pitch > v[1]).length > 0)
          checkpassed = false
      }
    })
    // filter with keys
    filter = get(selectedKeys)
    notes.forEach(n => {
      if (!filter[n.pitch % 12])
        strangernum++
      if (strangernum > strangers)
        checkpassed = false
    })
    return checkpassed
  } else {
    // maybe make mode that modifies the melody to fit the requirements (maybe after 5th round)
    let filter = get(filterextents)
    let is = []
    filter.forEach((v, i) => {
      is.push(notes.filter(n => n.quantizedStartStep <= i && n.quantizedEndStep > i).filter(n => n.pitch >= v[0] && n.pitch <= v[1]))
    })
    // filter with keys
    filter = get(selectedKeys)
    data.notes = is.filter(n => filter[n.pitch % 12])
    return data
  }
}

export function adaptMelodiesWithRules(data, steps, adjustMode) {
  let temp = []
  let strangernum = 0
  data.notes.forEach(n => {
    if (n.quantizedStartStep < steps) {
      let pitch = parseInt(n.pitch)
      let startstep = parseInt(n.quantizedStartStep)
      let endstep = parseInt(n.quantizedEndStep) > steps ? steps : parseInt(n.quantizedEndStep)
      if (adjustMode) {
        let filter = get(filterextents)
        let changemin = false
        let changemax = false
        let minvalue = undefined
        let maxvalue = undefined
        for (let i = startstep; i < endstep; i++) {
          if (filter[i] !== undefined) {
            if (minvalue === undefined || minvalue > filter[i][0])
              minvalue = filter[i][0]
            if (maxvalue === undefined || maxvalue > filter[i][1])
              maxvalue = filter[i][1]

            if (pitch < filter[i][0]) {
              changemin = true
            } if (pitch > filter[i][1]) {
              changemax = true
            }
          }
        }
        if (changemin) {
          while (pitch < minvalue) {
            pitch = pitch + 12
          }
        }
        if (changemax) {
          while (pitch > maxvalue) {
            pitch = pitch - 12
          }
        }
        if (minvalue !== undefined && maxvalue !== undefined && (pitch < minvalue || pitch > maxvalue)) {
          pitch = Math.round(minvalue + ((maxvalue - minvalue) / 2))
        }

        let kfilter = get(selectedKeys)
        if (kfilter.filter(n => n).length !== 0) {
          if (!kfilter[pitch % 12]) {
            strangernum++
            if (strangernum > get(strangers)) {
              while (!kfilter[pitch % 12]) {
                pitch = pitch + 1
              }
            }
          }
        }
      }
      if(n?.meloID!==undefined && n?.trackID!==undefined)
        temp.push({ pitch: pitch, quantizedStartStep: startstep, quantizedEndStep: endstep, meloID:n?.meloID, trackID:n?.trackID })
      else if(n?.meloID!==undefined)
        temp.push({ pitch: pitch, quantizedStartStep: startstep, quantizedEndStep: endstep, meloID:n?.meloID })
      else if(n?.trackID!==undefined)
        temp.push({ pitch: pitch, quantizedStartStep: startstep, quantizedEndStep: endstep, trackID:n?.trackID })
      else
        temp.push({ pitch: pitch, quantizedStartStep: startstep, quantizedEndStep: endstep })
    }
  })
  data.totalQuantizedSteps = steps
  data.notes = temp
  return data
}

export function adjustMelodiesToFilters() {
  log("adjust with filters", { pitchmap: get(filterextents), keys: get(selectedKeys) })
  if(get(emotionbased).value === 0){
    let temp = []
    get(models).forEach(model => {
      temp = []
      model.melodies.forEach(melody => {
        temp.push(adaptMelodiesWithRules(melody, melody.totalQuantizedSteps, true))
      })
      models.addMelodiesToModel(model.name, temp)
    })
  }else if(get(emotionbased).value === 2){
    let temp = [[],[],[]]
    get(polyoptions).forEach((voice,i) => {
      voice.forEach(p => {
        temp[i].push(adaptMelodiesWithRules(p, p.totalQuantizedSteps, true))
        if(p.basemelody === 145)
          console.log(p)
      })
    })
    console.log(temp)
    polyoptions.set(temp)
  }
}

function isDifferent(melody, melody1, a, b) {
  if(!melody?.isPolymix && b === a)
    return false
  if(melody?.isPolymix && (melody.basemelody === a || melody.combinations.includes(a)))
    return false
  if(melody?.array !== undefined && melody1?.array !== undefined)
    return isDifferentArray(melody.array, melody1.array)
  else{
    let notes = melody.notes
    let notes1 = melody1.notes
    let total = Math.min(melody.totalQuantizedSteps, melody1.totalQuantizedSteps)
    for (let i = 0; i < total; i++) {
      let t1 = notes.filter(n => n.quantizedStartStep <= i && n.quantizedEndStep > i).map(n => n.pitch)
      let t2 = notes1.filter(n => n.quantizedStartStep <= i && n.quantizedEndStep > i).map(n => n.pitch)
      if (t1.filter((n) => t2.indexOf(n) !== -1).length > 0) {
        return false
      }
    }
    return true
  }
}

function isDifferentArray(melody, melody1) {
  for(let i = 0; i<Math.min(melody.length, melody1.length);i++){
    if(melody1[i].filter((n)=> {
      melody[i].includes(n)
    }).length >0)
    return false
  }
  return true
}

function minQuints(melody, melody1, num) {
  let notes = melody.notes
  let notes1 = [...melody1.notes]
  let total = Math.max(melody.totalQuantizedSteps, melody1.totalQuantizedSteps)
  let blocked = -1
  let numQuint = 0
  let changed = false
  for (let i = 0; i < total; i++) {
    if (blocked < i) {
      changed = false
      let t1 = notes.filter(n => n.quantizedStartStep <= i && n.quantizedEndStep > i)
      let t2 = notes1.filter(n => n.quantizedStartStep <= i && n.quantizedEndStep > i)
      t1.forEach((n) => {
        t2.forEach((n1) => {
          if (n.pitch === n1.pitch + 7 || n.pitch === n1.pitch - 7) {
            blocked < Math.min(n.quantizedEndStep - 1, n1.quantizedEndStep - 1) ? blocked = Math.min(n.quantizedEndStep - 1, n1.quantizedEndStep - 1) : null
            changed = true
          }
        })
      })
      if (changed) {
        numQuint++
      }
    }
    if (numQuint >= num)
      return true
  }
  return false

}

function removeOverNotes(m1) {
  let m1notes = [...m1]
  let notes = []
  let overlap = []
  let out = []
  for (let i = 0; i < m1notes.length; i++) {
    let n = m1notes[i]
    if (out.indexOf(i) === -1) {
      overlap = m1notes.filter((n1, j) => n.quantizedStartStep < n1.quantizedEndStep && n.quantizedEndStep > n1.quantizedStartStep && n.pitch === n1.pitch && j !== i)
      notes.push(n)
      if (overlap.length !== 0) {
        overlap.forEach((n1) => {
          if (n.quantizedEndStep >= n1.quantizedEndStep) {
            out.push(m1notes.indexOf(n1))
          } else {
            let note = n1
            note.quantizedStartStep = n.quantizedEndStep
            m1notes[m1notes.indexOf(n1)] = note
          }
        })
      }
    }
  }
  return notes
}

export function calcIndexing(current, m2) {
  let m2i = { meloID: m2.index, trackID: undefined, meanpitch: meanpitch(m2.melody) }
  current.push(m2i)
  let sorted = current.sort((a, b) => a.meanpitch - b.meanpitch)
  sorted.forEach((n, i) => {
    n.trackID = i
  })
  return sorted
}

function combineMelo(m1, m2s, idtag) {
  let id_comb = idtag[1] !== undefined ? idtag[0] + "_" + idtag[1] + "_" + idtag[2] : idtag[0] + "_" + idtag[2]
  let basemelody
  let combinations
  let m1notesadapt = idtag[1] !== undefined ? m1.notes : m1.notes.map((n, i) => {
    n.meloID = idtag[3]
    return n
  })
  let current = idtag[0] <= 1 ? [{ meloID: idtag[3], trackID: 0, meanpitch: meanpitch(m1) }] :[...m1.indexing]
  if (idtag[0] <= 1) {
    basemelody = idtag[3]
    combinations = [m2s.index]
  } else {
    let c = [...m1.combinations]
    c.push(m2s.index)
    basemelody = m1.basemelody
    combinations = c
  }
  let m2r = JSON.parse(JSON.stringify(m2s.melody.notes))
  let m2 = m2r.map(n => {
    n.meloID = m2s.index
    return n
  })
  let m1notes = m1notesadapt.concat(m2)
  m1notes = m1notes.sort((a, b) => a.quantizedStartStep - b.quantizedStartStep)
  let notes = removeOverNotes(m1notes)
  const indexing = calcIndexing(current, m2s)
  let notes2 = []
  notes.forEach(n => {
    notes2.push({pitch:n.pitch, quantizedStartStep:n.quantizedStartStep, quantizedEndStep:n.quantizedEndStep, meloID:n.meloID, trackID:indexing.filter(t => t.meloID === n.meloID)[0].trackID})
  })
  return {
    notes: notes2,
    totalQuantizedSteps: Math.max(m1.totalQuantizedSteps, m2s.melody.totalQuantizedSteps),
    id_comb: id_comb,
    basemelody: basemelody,
    combinations: combinations,
    indexing: indexing,
    isPolymix: true
  }
}

function equalMelodies(m1, m2) {
  if (m1.notes.length !== m2.notes.length)
    return false
  m1.notes.every((n1, i) => {
    if (m2.notes[i] !== n1) {
      return false
    }
  })
  return true
}

function notCombined(c, combined) {
  return combined.filter((m) => equalMelodies(c, m)).length > 0 ? false : true
}

export function findPolyMelodies(num, melody, rule) {
  // 0 = all notes have to be different
  // 1 = minimum of 5 quints 
  let current = [JSON.parse(JSON.stringify(melody.melody))]
  let potential = []
    try{
      potential = JSON.parse(JSON.stringify(get(currentpoints))).map((m) => m[2]);
    }catch(e){
      try{
        let curmin = 0
        let steps = 200
        while(get(currentpoints).length>curmin){
          potential = potential.concat(JSON.parse(JSON.stringify(get(currentpoints).slice(curmin, steps))).map((m) => m[2]));
          curmin = steps
          steps = Math.min(get(currentpoints).length, steps + 200)
        }
      }catch(e){
        console.log(e)
      }
    }
  let combined = []
  for (let r = 1; r < num; r++)
    combined.push([])
  let diff = []
  let iter = 1
  while (iter < num) {
    current.forEach((current1, i) => {
      let currjson = JSON.parse(JSON.stringify(current1))
      if (rule === 0)
        diff = potential.filter((m, j) => isDifferent(current1, m[2].melody, m[2].index, melody.index))
      else if (rule === 1)
        diff = potential.filter((m, j) => minQuints(current1, m[2].melody, 5))
      diff.forEach((m) => {
        let c = combineMelo(currjson, m[2], [iter, currjson?.id_comb, m[2].index, melody.index])
        let com = notCombined(c, combined[iter - 1])
        if (com)
          combined[iter - 1].push(c)
      })
    })
    current = combined[iter - 1]
    iter++
  }
  return combined
}


export function findAllPolyMelodies(num, rule) {
  // 0 = all notes have to be different
  // 1 = minimum of 5 quints 
  let points = []
    try{
      points = JSON.parse(JSON.stringify(get(currentpoints))).map((m) => m[2]);
    }catch(e){
      try{
        let curmin = 0
        let steps = 100
        while(get(currentpoints).length>curmin){
          points = points.concat(JSON.parse(JSON.stringify(get(currentpoints).slice(curmin, steps))).map((m) => m[2]));
          curmin = steps
          steps = Math.min(get(currentpoints).length, steps + 100)
        }
      }catch(e){
        console.log(e)
      }
    }
  if (points.length === 0) {
    polyoptions.set([[], [], []])
    return null
  }
  //progress.set(0)
  let combined = []
  for (let r = 1; r < num; r++)
    combined.push([])
  for (let i = 0; i < points.length; i++) {
    let melody = JSON.parse(JSON.stringify(points[i]))
    let current = [JSON.parse(JSON.stringify(melody.melody))]
    //let potential = JSON.parse(JSON.stringify(get(currentpoints)))
    let potential = []
    try{
      potential = JSON.parse(JSON.stringify(get(currentpoints)));
    }catch(e){
      try{
        let curmin = 0
        let steps = 100
        while(get(currentpoints).length>curmin){
          potential = potential.concat(JSON.parse(JSON.stringify(get(currentpoints).slice(curmin, steps))));
          curmin = steps
          steps = Math.min(get(currentpoints).length, steps + 100)
        }
      }catch(e){
        console.log(e)
      }
    }
    let diff = []
    let iter = 1
    while (iter < num) {
      current.forEach((current1) => {
        let currjson = JSON.parse(JSON.stringify(current1))
        if (rule === 0)
          diff = potential.filter((m, j) => isDifferent(currjson, m[2].melody, m[2].index, melody.index))
        else if (rule === 1)
          diff = potential.filter((m, j) => minQuints(currjson, m[2].melody, 5))
        diff.forEach((m) => {
          let c = combineMelo(currjson, m[2], [iter, currjson?.id_comb, m[2].index, melody.index])
          let com = notCombined(c, combined[iter - 1])
          if (com)
            combined[iter - 1].push(c)
        })
      })
      current = combined[iter - 1]
      iter++
    }
    //progress.set(100 * (i/(points.length-1)))
  }
  //progress.set(100)
  polyoptions.set(combined)
  emotionbased.set({ label: "Polyoptions", value: 2 })
  return combined
}

export function calcArrayforMelo(melo){
  let array = new Array(melo.totalQuantizedSteps).fill([])
  melo.notes.forEach(n => {
    for(let i = n.quantizedStartStep; i<n.quantizedEndStep;i++){
      array[i] = [...array[i],n.pitch]
    }
  })
  return array
}


export function findAllPolyMelodiesExtern(num, rule, points, combined, i) {
  let melody = JSON.parse(JSON.stringify(points[i]))
  let current = [JSON.parse(JSON.stringify(melody.melody))]
  //let potential = JSON.parse(JSON.stringify(get(currentpoints)))
  let potential = []
    try{
      potential = JSON.parse(JSON.stringify(get(currentpoints)));
    }catch(e){
      try{
        let curmin = 0
        let steps = 100
        while(get(currentpoints).length>curmin){
          potential = potential.concat(JSON.parse(JSON.stringify(get(currentpoints).slice(curmin, steps))));
          curmin = steps
          steps = Math.min(get(currentpoints).length, steps + 100)
        }
      }catch(e){
        console.log(e)
      }
    }
  let diff = []
  let iter = 1
  while (iter < num) {
    current.forEach((current1) => {
      let currjson = JSON.parse(JSON.stringify(current1))
      if (rule === 0)
        diff = potential.filter((m, j) => isDifferent(currjson, m[2].melody, m[2].index, melody.index))
      else if (rule === 1)
        diff = potential.filter((m, j) => minQuints(currjson, m[2].melody, 5))
      diff.forEach((m) => {
        let c = combineMelo(currjson, m[2], [iter, currjson?.id_comb, m[2].index, melody.index])
        let com = notCombined(c, combined[iter - 1])
        if (com)
          combined[iter - 1].push(c)
      })
    })
    current = combined[iter - 1]
    iter++
  }
  if (i === points.length - 1) {
    progress.set(100)
    polyoptions.set(combined)
    emotionbased.set({ label: "Polyoptions", value: 2 })
  }
  return combined
}



export function reshuffleQuintCircle(bn, mode) {
  let quintcirclers = quintcircle.map(m => {
    return mode === "dur" ? m.dur : m.moll
  })
  let basenote = bn
  if (!isNaN(basenote))
    basenote = keysLookup[basenote]
  let quints = quintcirclers
  let index = quints.indexOf(basenote) - 6
  while (index !== 0) {
    quints.push(quints.shift())
    index = quints.indexOf(basenote) - 6
  }
  return quints
}

export function isBright(p, bk){
  let qc = reshuffleQuintCircle(bk, "dur")
  let note = keysLookup[p % 12]
  let index = qc.findLastIndex(v => v === note) - 6
  if(index > 0 || bk === -1) 
    return true
  else if(index === -6)
    return -6
  else if(index === 0)
    return 0
  else
    return false

}

export function calcAllTimbre(melody) {
  let timbrearray = []
  for (let basenote = 0; basenote < 12; basenote++) {
    let qc = reshuffleQuintCircle(basenote, "dur")
    timbrearray.push(calcTimbre(melody, basenote, qc).timbre)
  }
  for (let basenote = 0; basenote < 12; basenote++) {
    let qc = reshuffleQuintCircle(basenote, "dur")
    timbrearray.push(calcWeightedTimbre(melody, basenote, qc).timbre)
  }
  return timbrearray
}

export function calcTimbre(melody, basenote, qc) {
  if (basenote === -1 || qc === undefined)
    return { timbre: undefined, timbrescore: 0 }
  let timbre = 0
  let timbrescore = 0
  let hardcase = 0
  melody.notes.forEach(n => {
    let note = keysLookup[n.pitch % 12]
    let index = qc.findLastIndex(v => v === note) - 6
    if (index === -6)
      hardcase++
    else
      timbre += index > 0 ? 1 : index < 0 ? -1 : 0
    timbrescore += index
  })
  timbre += timbre > 0 ? hardcase : timbre < 0 ? -hardcase : 0
  let scale = d3.scaleLinear()
    .domain([-melody.notes.filter(n => n.pitch % 12 !== basenote).length, melody.notes.filter(n => n.pitch % 12 !== basenote).length])
    .range([0, 1])
  return { timbre: scale(timbre), timbrescore: timbrescore / melody.notes.length }
}

export function calcWeightedTimbre(melody, basenote, qc) {
  if (basenote === -1 || qc === undefined)
    return { timbre: undefined, timbrescore: 0 }
  let timbre = 0
  let timbrescore = 0
  let hardcase = 0
  let total = 0
  melody.notes.forEach(n => {
    let note = keysLookup[n.pitch % 12]
    let length = n.quantizedEndStep - n.quantizedStartStep
    let index = qc.findLastIndex(v => v === note) - 6
    if(index !== 0){
      if (index === -6)
        hardcase += length
      else
        timbre += index > 0 ? length : index < 0 ? -length : 0
      timbrescore += index
      total += length
    }
  })
  timbre += timbre > 0 ? hardcase : timbre < 0 ? -hardcase : 0
  let scale = d3.scaleLinear()
    .domain([-total, total])
    .range([0, 1])
  return { timbre: scale(timbre), timbrescore: timbrescore / melody.notes.length }
}

export function orderQuintenzirkel(array) {
  // C cis D dis e f fis g gis a ais b
  // 0  1  2  3  4 5  6  7  8  9  10 11
  let temp = new Array(array.length);
  //let index = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]; // top is at the left
  let index = [6, 1, 8, 3, 10, 5, 0, 7, 2, 9, 4, 11] // if middle is top 
  array.forEach((d, i) => {
    temp[index[i]] = d;
  });
  return temp
}

export function calcIntervals(melody, voices) {
  if (!melody.isPolymix)
    return []
  else {
    let intervals = []
    for (let i = 0; i < melody.totalQuantizedSteps; i++) {
      let notesat = melody.notes.filter(n => n.quantizedStartStep <= i && n.quantizedEndStep > i).sort((a, b) => a.trackID - b.trackID)
      if (notesat.length > 1) {
        let int = []
        for (let j = 0; j < notesat.length - 1; j++) {
          if(Math.abs(notesat[j].trackID - notesat[j + 1].trackID) === 1){
            let interval = { value: Math.abs(notesat[j + 1].pitch - notesat[j].pitch), voices: Math.max(notesat[j].trackID, notesat[j + 1].trackID) }
            int.push(interval)
          }
        }
        intervals.push({ quantizedStartStep: i, quantizedEndStep: i + 1, intervals: int, voices: notesat.length })
      }
    }
    return intervals
  }

}
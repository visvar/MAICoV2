import * as tonal from 'tonal'
import models, { player, currentpoints, axisselect, keydetectselect, seen, filterextents, selectedKeys, bpm, strangers, filterkey, playclick } from '../stores/stores.js'
import { get } from "svelte/store";
import * as mm from '@magenta/music'
import * as visutil from './visutil.js'
import * as glutil from './glyphutil.js'

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


export function getExtentOfMelody(melody, mode, isPrimer) {
  let max = 0;
  let min = 128;
  melody?.notes.forEach(note => {
    note.pitch < min ? min = note.pitch : null
    note.pitch > max ? max = note.pitch : null
  })
  if (mode) {
    if (!isPrimer)
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
import { allPrimer, keysLookup } from '../stores/globalValues.js';
import { log } from './fileutil.js';

export function playMelody(e, event, playbackline, xend, time, reset, sample, logseq={}) {
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
      console.log(logseq)
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
            if (minvalue === undefined || maxvalue > filter[i][1])
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
      temp.push({ pitch: pitch, quantizedStartStep: startstep, quantizedEndStep: endstep })
    }
  })
  data.totalQuantizedSteps = steps
  data.notes = temp
  return data
}

export function adjustMelodiesToFilters(){
  let temp = []
  get(models).forEach(model => {
    temp = []
    console.log(model.melodies)
    model.melodies.forEach(melody => {
      temp.push(adaptMelodiesWithRules(melody, melody.totalQuantizedSteps, true))
    }) 
    console.log(temp)
    models.addMelodiesToModel(model.name, temp)
  })
}
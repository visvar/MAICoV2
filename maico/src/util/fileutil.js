import { saveAs } from 'file-saver'
import { Midi } from '@tonejs/midi'
import * as mm from '@magenta/music'
import models, { actionlog, exportList, modelselected, polyoptions, primerList, progress } from '../stores/stores'
import { get } from 'svelte/store'
import * as mu from "./modelutil"

export function writeToMidi(melodies1, bpm, mode) {
  if (melodies1.length === 0)
    return null
  try {
    const midi = new Midi()
    let newSec = mm.sequences.createQuantizedNoteSequence(4, bpm)
    let sec
    let melodies = melodies1.map((m) => m.melody)
    if (mode === 2) {
      let track0 = midi.addTrack()
      track0.channel = 0
      let track1 = midi.addTrack()
      track1.channel = 1
      let track2 = midi.addTrack()
      track2.channel = 2
      let track3 = midi.addTrack()
      track3.channel = 3
      let tracks = [track0, track1, track2, track3]
      let lastTiming = 0
      console.log(melodies)
      melodies.forEach((mel) => {
        const poly = mel.isPolymix ? true : false
        mel.notes.forEach(n => {
          newSec.notes.push({ pitch: n.pitch, quantizedEndStep: n.quantizedEndStep + lastTiming, quantizedStartStep: n.quantizedStartStep + lastTiming, trackID: poly ? n.trackID : 0 })
        })
        lastTiming += mel.totalQuantizedSteps
      })
      sec = mm.sequences.unquantizeSequence(newSec, bpm)
      sec.notes.forEach((n, i) => {
        n.trackID = newSec.notes[i].trackID
      })
      tracks.forEach((t, i) => {
        sec.notes.filter(n => n.trackID === i).forEach((note) => {
          t.addNote({
            midi: note.pitch,
            time: note.startTime,
            duration: note.endTime - note.startTime,
            velocity: 100,
          })
        })
      })
      console.log(sec, newSec, tracks)
      /*
      sec = mm.sequences.unquantizeSequence(newSec, bpm)
      sec.notes.forEach((note) => {
        track.addNote({
          midi: note.pitch,
          time: note.startTime,
          duration: note.endTime - note.startTime,
          velocity: 100,
        })
      })
      */
      const array = midi.toArray()
      const buffer = array.buffer
      /* global Blob */
      const blob = new Blob([buffer], { type: 'audio/mid' })
      let primername = melodies[0]?.primer?.name !== undefined ? melodies[0].primer.name : 'Polyphony'
      writeName(blob, primername, melodies.length, "variations_sequence")
    } else if (mode === 1) {
      melodies.forEach((mel) => {
        let track = midi.addTrack()
        newSec.notes = mel.notes
        sec = mm.sequences.unquantizeSequence(newSec, bpm)
        sec.notes.forEach((note) => {
          track.addNote({
            midi: note.pitch,
            time: note.startTime,
            duration: note.endTime - note.startTime,
            velocity: 100,
          })
        })
      })
      const array = midi.toArray()
      const buffer = array.buffer
      /* global Blob */
      const blob = new Blob([buffer], { type: 'audio/mid' })
      let primername = melodies[0]?.primer?.name !== undefined ? melodies[0].primer.name : 'Polyphony'
      writeName(blob, primername, melodies.length, "variations_tracks")
    } else if (mode === 0) {
      melodies.forEach((mel, i) => {
        let primername = mel?.primer?.name !== undefined ? mel.primer.name : 'Polyphony'
        const poly = mel?.isPolymix ? true : false
        console.log(poly)
        writeMidifile(mel, bpm, i, primername, poly)
      })
    }
    //writeLogs()
    //mu.exportModelJson();
    exportList.clear()
    return null
  } catch (e) {
    console.log(e)
  }
}

function writeName(blob, primerfile, num, zusatz) {
  return new Promise(() => {
    const d = new Date().toISOString();
    saveAs(blob, d.substring(2, 10) + "_" + primerfile + "_anzahl_" + num + "_" + zusatz + '.mid')
  })
}

function writeMidifile(mel, bpm, i, primerfile = "", poly) {
  return new Promise(() => {
    const midi = new Midi()
    let newSec = mm.sequences.createQuantizedNoteSequence(4, bpm)
    let sec
    console.log(mel.notes)
    if (poly) {
      const comb = Math.max(...mel.notes.map(n => n.trackID))
      for (let i = 0; i <= comb; i++) {
        let track = midi.addTrack()
        track.channel = i
        newSec.notes = mel.notes.filter(n => n.trackID === i)
        sec = mm.sequences.unquantizeSequence(newSec, bpm)
        sec.notes.forEach((note) => {
          track.addNote({
            midi: note.pitch,
            time: note.startTime,
            duration: note.endTime - note.startTime,
            velocity: 100,
          })
        })
      }
    } else {
      const track = midi.addTrack()
      newSec.notes = mel.notes
      sec = mm.sequences.unquantizeSequence(newSec, bpm)
      sec.notes.forEach((note) => {
        track.addNote({
          midi: note.pitch,
          time: note.startTime,
          duration: note.endTime - note.startTime,
          velocity: 100,
        })
      })
    }
    const array = midi.toArray()
    const buffer = array.buffer
    /* global Blob */
    const blob = new Blob([buffer], { type: 'audio/mid' })
    const d = new Date().toISOString();
    saveAs(blob, d.substring(2, 10) + "_" + primerfile + "_" + i + "_variation.mid")
  })
}

export function importMidi(event, primerList, lastid) {

  if (lastid === 0 && get(primerList).length > 0) {
    lastid = get(primerList)[get(primerList).length - 1].id + 1
  }

  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = (e) => {

      const sequence = mm.midiToSequenceProto(e.target.result)
      sequence.tempos = [{ qpm: 120 }]

      let quan = mm.sequences.quantizeNoteSequence(sequence, 4)
      quan.notes = quan.notes.map(n => { return { pitch: n.pitch, quantizedEndStep: n.quantizedEndStep, quantizedStartStep: n.quantizedStartStep, velocity: n.velocity } })
      quan.id = lastid
      quan.name = file.name.substring(0, file.name.length - 4)
      log("load Midi", quan)
      primerList.addMelo(quan)
    };

    reader.readAsArrayBuffer(file);
    return lastid + 1
  }
  return lastid
}


export function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.round(Math.random() * charactersLength));
    counter += 1;
  }
  result += '#' + new Date().toISOString()
  return result;
}

export function log(action, data) {
  if (get(progress) !== 100 || get(progress) !== 0)
    actionlog.add(new Date().toISOString().substring(11, 23), action, data)
}

function replace(key, value) {
  if (key === "totalQuantizedSteps" || key === 'quantizedEndStep' || key === 'quantizedStartStep') {
    let change = parseInt(value);
    return change;
  }
  return value;
}

export function getDataset() {
  const data = get(models)
  //const primerString = JSON.stringify(get(primerList), replace, 2)
  //const jsonString = JSON.stringify(data, replace, 2)
  const primer = get(primerList)
  const poly = get(polyoptions)
  const complete = JSON.stringify({ primerList: { primer }, modelList: { data }, poly: {poly} }, replace, 2)
  const blob = new Blob([complete], { type: 'application/json' })
  const name = new Date().toISOString().substring(2, 10) + "_dataset" + '.json'
  return [blob, name]
}

export function getLogs() {
  const complete = JSON.stringify(get(actionlog))
  const blob = new Blob([complete], { type: 'application/json' })
  const name = new Date().toISOString().substring(2, 10) + "_logs" + '.json'
  return [blob, name]
}

export function writeLogs() {
  return new Promise(() => {
    const complete = JSON.stringify(get(actionlog))
    const blob = new Blob([complete], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = new Date().toISOString().substring(2, 19) + "_logs" + '.json'
    link.click()
    URL.revokeObjectURL(url)
  })
}

export function polyUnselected(index, ms) {
  let m = get(models)
  let p = get(primerList)
  let indexlow = p.length
  let ret = true
  m.forEach((model, i) => {
    if (!ms[model.name] && ret) {
      let temp = indexlow + model.melodies.length
      index.forEach((ind) => {
        if (ind >= indexlow && ind < temp)
          ret = false
      })
    }
    indexlow += model.melodies.length
  })
  return ret
}
import { saveAs } from 'file-saver'
import { Midi } from '@tonejs/midi'
import * as mm from '@magenta/music'

export function writeToMidi(melodies1, bpm, mode) {
  if (melodies1.length === 0)
    return null
  try {
    const midi = new Midi()
    let newSec = mm.sequences.createQuantizedNoteSequence(4, bpm)
    let sec
    let melodies = melodies1.map((m) => m.melody)
    if (mode === 2) {
      const track = midi.addTrack()
      let lastTiming = 0
      melodies.forEach((mel) => {
        mel.notes.forEach(n => {
          newSec.notes.push({ pitch: n.pitch, quantizedEndStep: n.quantizedEndStep + lastTiming, quantizedStartStep: n.quantizedStartStep + lastTiming })
        })
        lastTiming += mel.totalQuantizedSteps
      })
      sec = mm.sequences.unquantizeSequence(newSec, bpm)
      sec.notes.forEach((note) => {
        track.addNote({
          midi: note.pitch,
          time: note.startTime,
          duration: note.endTime - note.startTime,
          velocity: 100,
        })
      })
      const array = midi.toArray()
      const buffer = array.buffer
      /* global Blob */
      const blob = new Blob([buffer], { type: 'audio/mid' })
      writeName(blob, melodies[0].primer.name, melodies.length, "variations_sequence")
    } else if (mode === 1) {
      melodies.forEach((mel) => {
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
      })
      const array = midi.toArray()
      const buffer = array.buffer
      /* global Blob */
      const blob = new Blob([buffer], { type: 'audio/mid' })
      writeName(blob, melodies[0].primer.name, melodies.length, "variations_tracks")
    } else if (mode === 0) {
      melodies.forEach((mel, i) => {
        writeMidifile(mel, bpm, i, mel.primer.name)
      })
      return null
    }
  } catch (e) {
    console.log(e)
  }
}

function writeName(blob, primerfile, num, zusatz){
  const d = new Date().toISOString();
  saveAs(blob, d.substring(2,10)+"_"+primerfile+"_anzahl_"+num+"_"+zusatz+'.mid')
}

function writeMidifile(mel, bpm, i, primerfile="") {
  return new Promise(() => {
    const midi = new Midi()
    let newSec = mm.sequences.createQuantizedNoteSequence(4, bpm)
    let sec
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
    const array = midi.toArray()
    const buffer = array.buffer
    /* global Blob */
    const blob = new Blob([buffer], { type: 'audio/mid' })
    const d = new Date().toISOString();
    saveAs(blob, d.substring(2,10)+"_"+primerfile+"_"+i+"_variation.mid")
  })
}

export function importMidi(event, primerList, lastid) {

  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = (e) => {

      const sequence = mm.midiToSequenceProto(e.target.result)
      sequence.tempos = [{ qpm: 120 }]

      let quan = mm.sequences.quantizeNoteSequence(sequence, 4)
      quan.notes = quan.notes.map(n => { return { pitch: n.pitch, quantizedEndStep: n.quantizedEndStep, quantizedStartStep: n.quantizedStartStep, velocity: n.velocity } })
      quan.id = lastid
      quan.name = file.name.substring(0, file.name.length-4)
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
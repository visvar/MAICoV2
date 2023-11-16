import { saveAs } from 'file-saver'
import { Midi } from '@tonejs/midi'
import * as mm from '@magenta/music'

export function writeToMidi(melodies, bpm, mode) {
  if (melodies.length === 0)
    return null
  try {
    const midi = new Midi()
    let newSec = mm.sequences.createQuantizedNoteSequence(4, bpm)
    let sec
    if (mode === 2) {
      const track = midi.addTrack()
      let lastTiming = 0
      melodies.forEach((mel) => {
        newSec.notes = mel.notes
        sec = mm.sequences.unquantizeSequence(newSec, bpm)
        sec.notes.forEach((note) => {
          track.addNote({
            midi: note.pitch,
            time: note.startTime + lastTiming,
            duration: note.endTime - note.startTime,
            velocity: 100,
          })
        })
        lastTiming = mel.totalQuantizedSteps * 60 / 4 * bpm
      })
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
    } else if (mode === 0) {
      console.log(melodies)
      melodies.forEach((mel, i) => {
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
        console.log(array)
        const buffer = array.buffer
        /* global Blob */
        const blob = new Blob([buffer], { type: 'audio/mid' })
        console.log(blob)
        saveAs(blob, 'composedMidi' + i + '.mid')
      })
      return null
    }

    if (mode > 0) {
      const array = midi.toArray()
      const buffer = array.buffer
      /* global Blob */
      const blob = new Blob([buffer], { type: 'audio/mid' })
      saveAs(blob, 'composedMidi.mid')
    }
  } catch (e) {
    console.log(e)
  }
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
      primerList.addMelo(quan)
    };

    reader.readAsArrayBuffer(file);
    return lastid + 1
  }
  return lastid
}
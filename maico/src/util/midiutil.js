import { recorder, bpm, primerList, player, exportList } from '../stores/stores.js'
import { recording, midiinputs, selectedMidiInput, recordedNotes, playrecord, midiplayer } from "../stores/devStores.js";
import { get } from "svelte/store";
import * as mm from '@magenta/music'
import { log, makeid } from './fileutil.js';


const synth = new Tone.PolySynth().toDestination()
import * as Tone from 'tone'
import { oktaveLookup } from '../stores/globalValues.js';

export function initRecorder() {
    let rec = new mm.Recorder()//SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus')
    rec.initialize().then(() => {
        rec.callbackObject = {
            run: (seq) => {
                recordedNotes.set(seq.notes)
            },
            noteOn: (pitch, vel, device) => {
                if (get(playrecord))
                    synth.triggerAttack(oktaveLookup.find(n => n.pitch === pitch).label)
            },
            noteOff: (pitch, vel, device) => {
                if (get(playrecord))
                    synth.triggerRelease(oktaveLookup.find(n => n.pitch === pitch).label)
            }
        }
        recorder.set(rec)

        let inp = rec.getMIDIInputs()
        midiinputs.set(inp)
        selectedMidiInput.set(inp.length > 0 ? { label: inp[0].name, value: 0 } : { label: 'none', value: 0 })
    })
}

export function startRecording(record, lastid) {
    try {
        if (lastid === undefined)
            lastid = get(primerList).length
        let rec = get(recorder)
        if (rec === null || rec === undefined) {
            initRecorder()
            return lastid
        } else if (record) {
            recording.set(false);
            synth.releaseAll()
            log("recording stopped", { rec: rec.getNoteSequence() })
            let ret = rec.getNoteSequence() === null ? console.log("there is no recording") : showTrimResult(rec.getNoteSequence(), lastid)
            rec.reset()
            return ret === null ? lastid : ret
        }
        rec.setTempo(get(bpm))
        recording.set(true);
        rec.setTempo(get(bpm))
        recordedNotes.set([])

        let selected = get(selectedMidiInput)
        let inputs = get(midiinputs)
        if (selected.label !== 'none') {
            //rec.start([inputs[selected.value]])
            rec.start([inputs[selected.value]])
        }
        return lastid
    } catch (e) {
        console.log(e)
    }
}

function showTrimResult(result, lastid) {
    try {
        result = mm.sequences.quantizeNoteSequence(result, 4)
        if (result.notes.length > 0) {
            let max = 0
            result = transformNotesToStart(result) // mm.sequences.trim(result, 17, result.notes[result.notes.length - 1].quantizedEndStep)
            result.uniqueID = makeid(3)
            result.id = lastid
            result.recorded = true
            primerList.addMelo(result)
            console.log(lastid++, 'show', get(primerList))
            return lastid++
        } else {
            console.log('No recorded notes')
        }
        return lastid
    } catch (e) {
        console.log(e)
    }
}

function transformNotesToStart(result) {
    try {
        let min = Math.min(...result.notes.map((n) => n.quantizedStartStep))
        result.notes.forEach((note) => {
            note.quantizedStartStep -= min
            note.quantizedEndStep -= min
        })
        return result
    } catch (e) {
        console.log(e)
    }
}


export function playMidiOut(output) {
    let player = get(midiplayer)
    if (player === null || player === undefined) {
        player = new mm.MIDIPlayer({
            run: (note) => {
                console.log(note)
            },
            stop: null
        });
        midiplayer.set(player)
    }

    if (player.isPlaying()) {
        player.stop()
        return null
    }

    player.outputs = output;

    let list = get(exportList)
    let notes = []

    let totalstep = 0
    list.forEach((m) => {
        mm.sequences.clone(m.melody).notes.forEach((n) => {
            n.quantizedStartStep += totalstep
            n.quantizedEndStep += totalstep
            n.index = m.index
            n.maxStep = totalstep + m.melody.totalQuantizedSteps
            notes.push(n)
        })
        totalstep += m.melody.totalQuantizedSteps
    })


    if (notes?.length > 0) {
        const seq = mm.sequences.createQuantizedNoteSequence(4, 120)
        seq.notes = notes
        player.start(seq)
    }
}


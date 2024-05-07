import { recorder, bpm, primerList } from '../stores/stores.js'
import { recording, midiinputs } from "../stores/devStores.js";
import { get } from "svelte/store";
import * as mm from '@magenta/music'
import { log, makeid } from './fileutil.js';


export function initRecorder() {
    let rec = new mm.Recorder()//SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus')
    rec.initialize().then(() => {
        recorder.set(rec)

        let inp = rec.getMIDIInputs()
        console.log(inp)
        midiinputs.set(inp.map((m, i) => { return { label: m.name, value: i } }))
    })

}

export function startRecording(record, lastid) {
    try {
        let rec = get(recorder)
        if (rec === null || rec === undefined) {
            recording.set(false);
            rec = new mm.Recorder()//SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus')
            rec.callbackObject = {
                run: (note) => {
                    console.log(note)
                },
                stop: () => {
                    recording.set(false)
                }
            }
            //player1.loadAllSamples(1, false).then(() => { console.log('playerLoaded'); player.set(player1) })
            recorder.set(rec)
        } else if (record) {
            recording.set(false);
            log("recording stopped", { rec: rec.getNoteSequence() })
            rec.reset()
            let ret = rec.getNoteSequence() === null ? console.log("there is no recording") : showTrimResult(rec.getNoteSequence(), lastid)
            return ret === null ? lastid : ret
        }
        rec.setTempo(get(bpm))
        let inp = rec.getMIDIInputs()
        console.log(inp)
        midiinputs.set(inp.map((m, i) => { return { label: m.name, value: i } }))

        recording.set(true);
        rec.setTempo(get(bpm))
        /*
        const index = midiInputSelected
        if (index !== 0 && midiinputs[midiInputSelected - 1] !== undefined) {
            rec.start([midiinputs[midiInputSelected - 1]])
        } else {
            rec.start()
        }
        */
        rec.start()


    } catch (e) {
        console.log(e)
    }
}

function showTrimResult(result, lastid) {
    try {
        result = mm.sequences.quantizeNoteSequence(result, 4)
        if (result.notes.length > 0) {
            let max = 0
            const input = mm.sequences.createQuantizedNoteSequence()
            result = transformNotesToStart(result) // mm.sequences.trim(result, 17, result.notes[result.notes.length - 1].quantizedEndStep)
            primerList.addMelo(result)
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



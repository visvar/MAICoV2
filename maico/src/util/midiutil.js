import { recorder, bpm, primerList, player, exportList, meloselected, currentcolor, selectedBaseKeys, clickRecording } from '../stores/stores.js'
import { recording, midiinputs, selectedMidiInput, recordedNotes, playrecord, midiplayer, playingHighlight, lastidPrimer, selectedMeloColors } from "../stores/devStores.js";
import { get } from "svelte/store";
import * as mm from '@magenta/music'
import { log, makeid } from './fileutil.js';

import { WebMidi } from "webmidi";


const synth = new Tone.PolySynth().toDestination()
import * as Tone from 'tone'
import { oktaveLookup } from '../stores/globalValues.js';
import { getColor, hToPadColor, hexToHSL } from './visutil.js';

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

export function startRecording(record) {
    try {
        let lastid = get(lastidPrimer)
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
        rec.enablePlayClick(get(clickRecording))
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
            result = transformNotesToSeq(result) // mm.sequences.trim(result, 17, result.notes[result.notes.length - 1].quantizedEndStep)
            result.uniqueID = makeid(3)
            result.id = lastid
            result.recorded = true
            primerList.addMelo(result)
            console.log(lastid++, 'show', get(primerList))
            lastidPrimer.set(lastid++)
            return lastid++
        } else {
            console.log('No recorded notes')
        }
        return lastid
    } catch (e) {
        console.log(e)
    }
}

function transformNotesToSeq(result) {
    try {
        let min = Math.min(...result.notes.map((n) => n.quantizedStartStep))
        result.notes.forEach((note) => {
            note.quantizedStartStep -= min
            note.quantizedEndStep -= min
        })
        result.totalQuantizedSteps = Math.max(...result.notes.map((n) => n.quantizedEndStep))
        return result
    } catch (e) {
        console.log(e)
    }
}


export function playMidiOut(output) {
    let player = get(midiplayer)

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

    const seq = mm.sequences.createQuantizedNoteSequence(4, 120)
    seq.notes = notes

    const unseq = mm.sequences.unquantizeSequence(seq, get(bpm))
    unseq.notes.forEach((n, i) => {
        n.index = notes[i].index
    })

    if (player === null || player === undefined) {
        player = new mm.MIDIPlayer({
            run: (note) => {
                console.log(note)
                //player.playNote(0, note)
                let index = unseq.notes.filter((n) => n.pitch === note.pitch && n.startTime === note.startTime && n.endTime === note.endTime)[0].index
                playingHighlight.set(index)
            },
            stop: () => {
                playingHighlight.set(null)
            }
        });
        midiplayer.set(player)
    }

    if (player.isPlaying()) {
        playingHighlight.set(null)
        player.stop()
        return null
    }

    player.outputs = output;
    console.log(output, player.outputs)




    if (notes?.length > 0) {


        player.start(seq)
    }
}

// colors: https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/LPP3_prog_ref_guide_200415.pdf

export function controlColor(note, on, mode = 1, color = null) {
    WebMidi.enable().then(() => {
        let ou = WebMidi.getOutputByName("MIDIOUT2 (LPMiniMK3 MIDI)");
        if (ou === undefined || ou.state !== "connected") return null;
        if (on) {
            let options = color !== null ? {
                rawAttack: color
            } : {}
            ou.channels[mode].playNote(note, options);
        } else {
            ou.stopNote(note)
        }
    });
}

export function melodyColors(reset, melos = null) {
    WebMidi.enable().then(() => {
        let ou = WebMidi.getOutputByName("MIDIOUT2 (LPMiniMK3 MIDI)");
        if (ou === undefined || ou.state !== "connected") return null;
        if (reset) {
            for (let i = 36; i < 70; i++) {
                controlColor(i, false)
            }
            selectedMeloColors.set(null)
        } else {
            if (melos !== null) {
                let temp = []
                melos.forEach((m, i) => {
                    let color = getColor(m[2], get(currentcolor), get(selectedBaseKeys));
                    if (color === '#444' || color === "#444444") {
                        temp.push(1)
                        controlColor(36 + i, true, 1, 1)
                    } else {
                        let c = 0
                        if (color !== null) {
                            let h = hexToHSL(color).h
                            c = hToPadColor(h)
                        }
                        temp.push(c)
                        controlColor(36 + i, true, 1, c)
                    }

                    selectedMeloColors.set(temp)
                })
            }
        }
    });


}

export function modelColor() {
    controlColor(99, true, 1, 45)
    controlColor(95, true, 1, 9)
    controlColor(91, true, 1, 5)
    controlColor(87, true, 1, 33)
    controlColor(83, true, 1, 21)
}
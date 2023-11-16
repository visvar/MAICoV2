// @ts-ignore
import { models, modelselected, primerList, samplingstatus, selectedKeys } from '../stores/stores.js'
import { iter, genlength } from '../stores/devStores.js'
import { get } from 'svelte/store';
// @ts-ignore
import * as mm from '@magenta/music'
import * as Tonal from '@tonaljs/tonal'
import { keysLookup } from '../stores/globalValues.js';

import * as mu from "./musicutil.js"

export async function addModel(model) {
    try {
        // resolve import meta glob to load files
        async function importAll(r) {
            let files = []
            for (const fileMatch of Object.values(r)) {
                const fileContents = await fileMatch()
                files.push(fileContents.default)
            }
            return files
        }

        if (model === undefined) {
            const files = import.meta.glob("../checkpoints/*.json");//require.context('./checkpoints', false, /\.json$/)
            let loadedModels = await importAll(files)
            models.setAll(loadedModels)
        } else {

        }
    } catch (e) {
        console.log(e)
    }
}


// maybe add information of the model, temperature etc -> could also be a store
export function flattenAllMelodies() {
    let melodies = get(primerList).map((melo) => [melo, { model: undefined, temperature: undefined }])
    let information = { model: '', temperature: 1 }
    get(models).filter((model) => model?.melodies?.length > 0 && get(modelselected)[model.name])
        .forEach(model => model.melodies.forEach(melo => {
            information = { model: model, temperature: melo.temperature }
            melodies.push([melo, information])
        }))
    return melodies
}

export async function uploadDatasetFile(event) {
    try {
        const reader = new FileReader();
        reader.readAsText(event.target.files[0], "UTF-8");
        reader.onload = function (evt) {
            const obj = JSON.parse(String(evt.target.result))
            console.log(obj)
            models.setAll(obj)
        }
    } catch (e) {
        console.log(e)
    }
}

export async function requestModels(allprimer) {
    samplingstatus.set('waiting for models')
    if (allprimer?.length <= 0)
        return null
    let resultdata = {}
    const rnnSteps = get(genlength)
    let tempArray = []
    let starting = Array.from({ length: 15 }, (_, i) => Math.round((i / 10 + 0.2) * 100) / 100) //Array.from({ length: 15 }, (_, i) => Math.round((i / 10 + 0.2) * 100) / 100)
    for (let i = 0; i < get(iter); i++) {
        tempArray = tempArray.concat(starting)
    }
    tempArray.sort((a, b) => a - b)
    const numOut = tempArray.length
    let modelsFinished = 0
    try {
        let queue = []
        await get(models).forEach(async (model, indexm) => {

            const checkpointURL = model.checkpointURL
            console.log(checkpointURL)
            // for testing as it is not set up


            if (!model.js && model.type === 'music_rnn') { //&& false) {
                allprimer.forEach(async (primer, index) => {

                    const request = { tempos: [{ qpm: 120 }], notes: primer.notes, totalQuantizedSteps: primer.totalQuantizedSteps, flags: [{}] }

                    const possibleFlags = { numOut: numOut, numSteps: rnnSteps, temperature: tempArray }

                    for (const [key, value] of Object.entries(model.fixflags[0])) {
                        request.flags[0][key] = value
                    }
                    for (const [key, value] of Object.entries(model.needflags[0])) {
                        if (possibleFlags[value] !== undefined) { request.flags[0][key] = possibleFlags[value] }
                    }
                    try {
                        /* global fetch */
                        fetch(checkpointURL, {
                            method: 'POST',
                            headers: {
                                'Access-Control-Allow-Origin': '*',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(request)
                        }).then(res => res.json()).then(
                            data => {
                                console.log(data)
                                data.melodies.forEach(m => {
                                    m.primer = primer
                                })
                                if (index === 0)
                                    models.addMelodiesToModel(model.name, data.melodies)
                                else
                                    models.appendMelodiesToModel(model.name, data.melodies)
                            })
                    } catch (e) {
                        console.log(e)
                    }
                })
            } else if (model.js && model.name !== 'improv_rnn' && model.type === 'music_rnn') {
                let dataArray = []
                allprimer.forEach(async (primer, index) => {
                    samplingstatus.set('started generating')
                    const request = mm.sequences.createQuantizedNoteSequence()
                    request.tempos[0].qpm = 120
                    request.notes = primer.notes
                    request.totalQuantizedSteps = primer.totalQuantizedSteps
                    request.flags = [{}]
                    // for improv RNN important to put in spec
                    let musicRnn = new mm.MusicRNN(checkpointURL)
                    await musicRnn.initialize()

                    const chord = getChord(get(selectedKeys).filter((k) => k).map((k, i) => keysLookup[i]), model.name === 'improv_rnn')
                    for (let i = 0; i < numOut; i++) {
                        // chord needs to be calculated for some models
                        await musicRnn
                            .continueSequence(request, rnnSteps, tempArray[i], chord)
                            .then((data) => {
                                data = data.toJSON()
                                if (data?.notes !== undefined && mu.passGenerateFilter(data, true)) {
                                    data.temperature = tempArray[i]
                                    data.primer = primer
                                    dataArray.push(data)
                                    if (i == numOut - 1 && index === allprimer.length - 1) {
                                        console.log(model.name + ' finished')
                                        modelsFinished++
                                        models.addMelodiesToModel(model.name, dataArray)
                                    }
                                } else {
                                    queue.push({ model: model, type: 'music_rnn', url: checkpointURL, temp: tempArray[i], primer: request, steps: rnnSteps, chord: chord })
                                    if (i == numOut - 1 && index === allprimer.length - 1) {
                                        modelsFinished++
                                    }
                                }
                                if (modelsFinished === get(models).length) {
                                    afterRequest(numOut * allprimer.length, queue, modelsFinished)
                                }
                            })
                    }
                })
            } else if (model.js && model.type === 'music_vae') {
                let dataArray = []
                allprimer.forEach(async (primer, index) => {
                    samplingstatus.set('started generating')
                    const request = mm.sequences.createQuantizedNoteSequence()
                    request.tempos[0].qpm = 120
                    request.notes = primer.notes
                    request.totalQuantizedSteps = primer.totalQuantizedSteps
                    let music_vae = await new mm.MusicVAE(checkpointURL);
                    await music_vae.initialize()
                    for (let i = 0; i < numOut; i++) {
                        // request, numOuts?, similarity, temperature
                        await music_vae.similar(request, 1, 0.90, tempArray[i])
                            .then((d) => d[0]) // we only create one so if multiple this is not a step
                            .then((data) => {
                                if (data?.notes !== undefined && mu.passGenerateFilter(data, true)) {
                                    mu.cropToSteps(data, rnnSteps)
                                    data.temperature = tempArray[i]
                                    data.primer = primer
                                    dataArray.push(data)
                                    if (i == numOut - 1 && index === allprimer.length - 1) {
                                        console.log(model.name + ' finished')
                                        modelsFinished++
                                        models.addMelodiesToModel(model.name, dataArray)
                                    }
                                } else {
                                    queue.push({ model: model, type: 'music_vae', url: checkpointURL, temp: tempArray[i], primer: request, steps: rnnSteps, chord: undefined })
                                    if (i == numOut - 1 && index === allprimer.length - 1) {
                                        modelsFinished++
                                    }
                                }
                                if (modelsFinished === get(models).length) {
                                    afterRequest(numOut * allprimer.length, queue, modelsFinished)
                                }
                            });
                    }
                })
            } else {
                models.addMelodiesToModel(model.name, [])
            }
        });

    } catch (e) {
        console.log(e)
    }
    return resultdata
}

let threshhold = 0.1

function afterRequest(total, queue, modell) {
    samplingstatus.set('sampling ended with ' + (queue.length / total).toFixed(2) + "% missing")
    if (queue.length > total * threshhold) {
        requestModelagain(queue, total, total * threshhold, 1)
    }
}


export async function requestModelagain(q, total, percent, round) {
    samplingstatus.set('resampling round ' + round + '; missed: ' + (q.length / total).toFixed(2) + "%")
    console.log("generate again round: " + round + " of 5")
    console.log("queuelength: " + q.length + ' of ' + total)
    console.log("last reach: " + (total - q.length) / total + "%")
    let queue = []
    let t = q.sort((a, b) => a.model.name - b.model.name);
    let url = ""
    console.log(t)
    t.forEach(async (req) => {
        if (req.type === "music_rnn") {
            let musicRnn = undefined
            if (url !== req.url) {
                url = req.url
                musicRnn = await new mm.MusicRNN(req.url)
                await musicRnn.initialize()
            }
            while(musicRnn !== undefined && musicRnn.isInitialized()){

            }
            // chord needs to be calculated for some models
            await musicRnn
                .continueSequence(req.primer, req.steps, req.temp, req.chord)
                .then((data) => {
                    data = data.toJSON()
                    if (round < 5) {
                        if (data?.notes !== undefined && mu.passGenerateFilter(data, true)) {
                            data.temperature = req.temp
                            data.primer = req.primer

                            models.appendMelodiesToModel(req.model.name, [data])
                        } else {
                            queue.push(req)
                        }
                    } else {
                        models.appendMelodiesToModel(req.model.name, [mu.passGenerateFilter(data, false)])
                    }
                })

        } else if (req.type === "music_vae") {
            let music_vae = undefined
            if (url !== req.url && music_vae === undefined) {
                url = req.url
                music_vae = await new mm.MusicVAE(req.url);
                await music_vae.initialize()
            }
            while(music_vae !== undefined && music_vae.isInitialized()){
                
            }
            // request, numOuts?, similarity, temperature
            await music_vae.similar(req.primer, 1, 0.90, req.temp)
                .then((d) => d[0]) // we only create one so if multiple this is not a step
                .then((data) => {
                    if (round < 5) {
                        if (data?.notes !== undefined && mu.passGenerateFilter(data, true)) {
                            mu.cropToSteps(data, req.steps)
                            data.temperature = req.temp
                            data.primer = req.primer
                            models.appendMelodiesToModel(req.model.name, [data])
                        } else {
                            queue.push(req)
                        }
                    } else {
                        models.appendMelodiesToModel(req.model.name, [mu.passGenerateFilter(data, false)])
                    }
                });
        }
    })

    if (queue.length > percent) {
        requestModelagain(queue, total, percent, round+1)
    } else {
        samplingstatus.set('resampling finished, round ' + round + '; missed: ' + (queue.length / total).toFixed(2) + "%")
        console.log("regenerate finished after " + round + " rounds", queue)
    }
}

function getChord(notes, flag) {
    if (!flag)
        return undefined

    function first(array) {
        if (array !== undefined && array.length > 0) {
            const common = Tonal.Chord.detect(array)
            return common.length ? common[0] : array[0]
        } else {
            return 'CM'
        }
    }
    function detectChord(notes) {
        notes = notes.map(n => Tonal.Note.pitchClass(n)).sort()
        return Tonal.PcSet.modes(notes)
            .map((mode, i) => {
                const tonic = Tonal.Note.name(notes[i])
                const names = Tonal.ChordDictionary.symbols(mode)
                return names.length ? tonic + names[0] : null
            })
            .filter((v, i, a) => a.indexOf(v) === i)
    }

    const notes1 = notes
    const chords = detectChord(notes1)
    console.log(chords)
    const chord = first(chords)
    return [chord]
}


export function deleteModel() {
    models.deleteIndex(-1)
}

function getModel(name, models) {
    return get(models).filter((value => {
        return value.name === name
    }))
}

function replace(key, value) {
    if (key === "totalQuantizedSteps" || key === 'quantizedEndStep' || key === 'quantizedStartStep') {
        let change = parseInt(value);
        return change;
    }
    return value;
}

/**
 * if(modelname === undefined){
        data.forEach(model=>{
            model.melodies.forEach(mel => {
                mel = mel.toJSON()
                mel.totalQuantizedSteps = parseInt(mel.totalQuantizedSteps)
                mel.notes.forEach(note => {
                    note.quantizedStartStep = parseInt(note.quantizedStartStep)
                    note.quantizedEndStep = parseInt(note.quantizedEndStep)
                })
            })
        })
    }
 */

export function exportModelJson(modelname) {
    const data = modelname !== undefined ? getModel(modelname, models)[0] : get(models)
    const jsonString = JSON.stringify(data, replace, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = modelname || 'dataset' + '.json'
    link.click()
    URL.revokeObjectURL(url)
}

export function getIndexbyModelname(n) {
    let result = null
    let counter = 0
    get(models).forEach((obj, index) => {
        if (obj?.name == n && obj?.melodies?.length === 0) {
            return null
        } else if (obj?.name == n) {
            result = counter
        } else if (obj?.melodies?.length > 0) {
            counter++
        }
    })
    return result
}

// export { addModel, requestModel };

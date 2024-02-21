// @ts-ignore
import { adjustMode, models, modelselected, primerList, progress, samplingstatus, selectedKeys, strangers, mvaesim, polyoptions, filterextents, similarityweight, DRumap, emotionbased, numpoly, axisselect, selectedBaseKeys, importedSession, pointcolorselect, vorcolorselect, glyphselect, edgeBundlingPoly } from '../stores/stores.js'
import { iter, genlength } from '../stores/devStores.js'
import { get } from 'svelte/store';
// @ts-ignore
import * as mm from '@magenta/music'
import * as Tonal from '@tonaljs/tonal'
import { keysLookup } from '../stores/globalValues.js';

import * as mu from "./musicutil.js"

import { makeid } from './fileutil.js';

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


export async function requestModels(allprimer) {
    progress.set(0)
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
    let vaesim = get(mvaesim)
    console.log(vaesim)
    const numOut = tempArray.length
    let total = numOut * get(models).length * allprimer.length
    let count = 0
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
                                if (data?.notes === undefined) {
                                    queue.push({ name: model.name, model: musicRnn, type: 'music_rnn', url: checkpointURL, temp: tempArray[i], primer: request, steps: rnnSteps, chord: chord, mvaesim: undefined })
                                    if (i == numOut - 1 && index === allprimer.length - 1) {
                                        modelsFinished++
                                        models.addMelodiesToModel(model.name, dataArray)
                                    }
                                } else {
                                    data = mu.adaptMelodiesWithRules(data, rnnSteps, get(adjustMode))
                                    if (mu.passGenerateFilter(data, true, get(strangers))) {
                                        data.temperature = tempArray[i]
                                        data.primer = primer
                                        data.mvaesim = undefined
                                        data.uniqueID = makeid(8)
                                        dataArray.push(data)
                                        count++

                                        progress.set(100 * (count / total))
                                        if (i == numOut - 1 && index === allprimer.length - 1) {
                                            console.log(model.name + ' finished')
                                            modelsFinished++
                                            models.addMelodiesToModel(model.name, dataArray)
                                        }
                                    } else {
                                        queue.push({ name: model.name, model: musicRnn, type: 'music_rnn', url: checkpointURL, temp: tempArray[i], primer: request, steps: rnnSteps, chord: chord, mvaesim: undefined })
                                        if (i == numOut - 1 && index === allprimer.length - 1) {
                                            modelsFinished++
                                            models.addMelodiesToModel(model.name, dataArray)
                                        }
                                    }
                                }
                                if (modelsFinished === get(models).length) {
                                    afterRequest(get(models).length * numOut * allprimer.length, queue, modelsFinished, rnnSteps)
                                }
                            })
                    }
                })
            } else if (model.js && model.type === 'music_vae') {
                let dataArray = []
                allprimer.forEach(async (primer, index) => {
                    const request = mm.sequences.createQuantizedNoteSequence()
                    request.tempos[0].qpm = 120
                    request.notes = primer.notes
                    request.totalQuantizedSteps = primer.totalQuantizedSteps
                    let music_vae = await new mm.MusicVAE(checkpointURL);
                    await music_vae.initialize()
                    for (let i = 0; i < numOut; i++) {
                        // request, numOuts?, similarity, temperature
                        await music_vae.similar(request, 1, vaesim, tempArray[i])
                            .then((d) => d[0]) // we only create one so if multiple this is not a step
                            .then((data) => {
                                data = data.toJSON()
                                if (data?.notes === undefined) {
                                    queue.push({ name: model.name, model: music_vae, type: 'music_vae', url: checkpointURL, temp: tempArray[i], primer: request, steps: rnnSteps, chord: undefined, mvaesim: vaesim })
                                    if (i == numOut - 1 && index === allprimer.length - 1) {
                                        modelsFinished++
                                        models.addMelodiesToModel(model.name, dataArray)
                                    }
                                } else {
                                    data = mu.adaptMelodiesWithRules(data, rnnSteps, get(adjustMode))
                                    if (mu.passGenerateFilter(data, true, get(strangers))) {
                                        data.temperature = tempArray[i]
                                        data.primer = primer
                                        data.mvaesim = vaesim
                                        data.uniqueID = makeid(8)
                                        dataArray.push(data)
                                        count++

                                        progress.set(100 * (count / total))
                                        if (i == numOut - 1 && index === allprimer.length - 1) {
                                            console.log(model.name + ' finished')
                                            modelsFinished++
                                            models.addMelodiesToModel(model.name, dataArray)
                                        }
                                    } else {
                                        queue.push({ name: model.name, model: music_vae, type: 'music_vae', url: checkpointURL, temp: tempArray[i], primer: request, steps: rnnSteps, chord: undefined, mvaesim: vaesim })
                                        if (i == numOut - 1 && index === allprimer.length - 1) {
                                            modelsFinished++
                                            models.addMelodiesToModel(model.name, dataArray)
                                        }
                                    }
                                } if (modelsFinished === get(models).length) {
                                    afterRequest(get(models).length * numOut * allprimer.length, queue, modelsFinished, rnnSteps, count)
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

let threshhold = 0.05

function afterRequest(total, queue, modell, rnnSteps, count) {

    console.log('afterRequest', total, queue)
    if (queue.length > total * threshhold) {
        requestModelagain(queue, total, total * threshhold, 1, rnnSteps, count)
    } else {
        progress.set(100)

    }
}


export async function requestModelagain(q, total, percent, round, rnnSteps, count) {
    console.log("generate again round: " + round + " of 5")
    console.log("queuelength: " + q.length + ' of ' + total)
    console.log("last reach: " + 100 * (total - q.length) / total + "%")
    let queue = []
    let t = q.sort((a, b) => a.model.name - b.model.name);
    let url = ""
    let music_vae = undefined
    let musicRnn = undefined
    let counter = 0
    t.forEach(async (req, index) => {
        if (req.type === "music_rnn") {
            await req.model
                .continueSequence(req.primer, req.steps, req.temp, req.chord)
                .then((data) => {
                    data = data.toJSON()
                    if (round < 5) {
                        counter++
                        if (data?.notes === undefined) {
                            queue.push(req)
                        } else {
                            data = mu.adaptMelodiesWithRules(data, rnnSteps, get(adjustMode))
                            if (mu.passGenerateFilter(data, true, get(strangers))) {
                                data.mvaesim = undefined
                                data.temperature = req.temp
                                data.primer = req.primer
                                data.uniqueID = makeid(8)
                                count++

                                progress.set(100 * (count / total))
                                models.appendMelodiesToModel(req.name, [data])
                            } else {
                                queue.push(req)
                            }
                        }
                        if (counter === t.length) {
                            if (queue.length > percent) {
                                requestModelagain(queue, total, percent, round + 1, rnnSteps, count)
                            } else {
                                progress.set(100)
                                console.log("regenerate finished after " + round + " rounds", queue)
                            }
                        }
                    } else {
                        count++
                        progress.set(100 * (count / total))
                        models.appendMelodiesToModel(req.name, [mu.passGenerateFilter(data, false, true)])
                    }
                })

        } else if (req.type === "music_vae") {
            // request, numOuts?, similarity, temperature
            await req.model.similar(req.primer, 1, req.mvaesim, req.temp)
                .then((d) => d[0]) // we only create one so if multiple this is not a step
                .then((data) => {
                    data = data.toJSON()
                    if (round < 5) {
                        counter++
                        if (data?.notes === undefined) {
                            queue.push(req)
                        } else {
                            data = mu.adaptMelodiesWithRules(data, rnnSteps, get(adjustMode))
                            if (mu.passGenerateFilter(data, true, get(strangers))) {
                                data.mvaesim = req.mvaesim
                                data.temperature = req.temp
                                data.primer = req.primer
                                data.uniqueID = makeid(8)
                                count++
                                progress.set(100 * (count / total))
                                models.appendMelodiesToModel(req.name, [data])
                            } else {
                                queue.push(req)
                            }
                        }
                        if (counter === t.length) {
                            if (queue.length > percent) {
                                requestModelagain(queue, total, percent, round + 1, rnnSteps, count)
                            } else {
                                progress.set(100)
                                console.log("regenerate finished after " + round + " rounds", queue)
                            }
                        }
                    } else {
                        count++
                        progress.set(100 * (count / total))
                        models.appendMelodiesToModel(req.name, [mu.passGenerateFilter(data, false, true)])
                    }
                });


        }

    })
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

//polyoptions also
export function exportModelJson(modelname) {
    const data = modelname !== undefined ? getModel(modelname, models)[0] : get(models)
    //const primerString = JSON.stringify(get(primerList), replace, 2)
    //const jsonString = JSON.stringify(data, replace, 2)
    const primer = get(primerList)
    const poly = get(polyoptions)
    const complete = JSON.stringify({
        primerList: { primer }, modelList: { data }, polyoptions: { poly },
        variables: {
            strangers: get(strangers), genlength: get(genlength),
            filterextents: get(filterextents), mvaesim: get(mvaesim), iter: get(iter), similarityweight: get(similarityweight),
            DRumap: get(DRumap), emotionbased: get(emotionbased), numpoly: get(numpoly), axisselect: get(axisselect), selectedKeys: get(selectedKeys), selectedBaseKeys: get(selectedBaseKeys),
            pointcolorselect: get(pointcolorselect), vorcolorselect: get(vorcolorselect), glyphselect: get(glyphselect), edgeBundlingPoly: get(edgeBundlingPoly)
        }
    }, replace, 2)
    const blob = new Blob([complete], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = modelname || new Date().toISOString().substring(2, 19) + "_dataset" + '.json'
    link.click()
    URL.revokeObjectURL(url)
}

export async function uploadDatasetFile(event) {
    try {
        const reader = new FileReader();
        reader.readAsText(event.target.files[0], "UTF-8");
        reader.onload = function (evt) {
            const obj = JSON.parse(String(evt.target.result))
            models.setAll(obj.modelList.data)
            primerList.set(obj.primerList.primer)
            if (obj?.polyoptions !== undefined) {
                polyoptions.set(obj.polyoptions.poly)
            }
            if (obj?.variables !== undefined) {
                strangers.set(obj.variables.strangers)
                genlength.set(obj.variables.genlength)
                filterextents.set(obj.variables.filterextents)
                mvaesim.set(obj.variables.mvaesim)
                iter.set(obj.variables.iter)
                similarityweight.set(obj.variables.similarityweight)
                DRumap.set(obj.variables.DRumap)
                emotionbased.set(obj.variables.emotionbased)
                numpoly.set(obj.variables.numpoly)
                let axis = obj.variables.axisselect
                if (axis[2] === true)
                    axis[2] = 1
                axisselect.set(axis)
                selectedKeys.set(obj.variables.selectedKeys)
                selectedBaseKeys.set(obj.variables.selectedBaseKeys)
                importedSession.set(get(importedSession) + 1)
                if (obj?.variables?.pointcolorselect !== undefined) {
                    pointcolorselect.set(obj.variables.pointcolorselect)
                    vorcolorselect.set(obj.variables.vorcolorselect)
                    glyphselect.set(obj.variables.glyphselect)
                    edgeBundlingPoly.set(obj.variables.edgeBundlingPoly)
                }
            }
        }
    } catch (e) {
        console.log(e)
    }
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

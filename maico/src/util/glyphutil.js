import * as mvlib from 'musicvis-lib';
import { scaleLinear } from 'd3-scale';
import * as d3 from 'd3'
import * as muutil from './musicutil'
import { get } from 'svelte/store';

import Starglyph from '../visualization/Glyphs/Starglyph.svelte';
import models from '../stores/stores';


export const colormap12 = [
  '#ff0000',
  '#ff4e00',
  '#db7b00',
  '#ffcc00',
  '#e4ed00',
  '#81d700',
  '#00ffb4',
  '#00ffea',
  '#00baff',
  '#3c00ff',
  '#a800ff',
  '#ff00fd'
].map(d => {
  const c = d3.hsl(d)
  c.s = 0.5
  return c.toString()
})

export const Starglyphcolor = (val) => colormap12[val % 12]

export function calcRhythmStarData(mel, countOffBeat, percentagePauses, countRhyhtmChange, maxvalues) {
  //let rhyhtmChange = countRhyhtmChange.scaleLinear().domain([0, maxvalues.maxChange]).range([0, 1])
  //let length = mel.notes.
  return {
    className: mel.notes,
    axes: [
      { axis: 'numberNotes', value: mel.notes.length / maxvalues.maxL },
      { axis: 'countRhythmChange', value: countRhyhtmChange / maxvalues.maxChange },
      { axis: "pausePercentage", value: percentagePauses },
      { axis: 'countOffBeat', value: countOffBeat / maxvalues.maxOffBeat }
    ]
  }
}

function calcStarData(mel, maxvalues) {
  let notes = mel.notes
  let scale = scaleLinear().domain([0, maxvalues.maxnum]).range([0, 1])
  const numberNotes = Math.min(1, scale(notes.length))
  //scale = scaleLinear().domain([0.2, 1.8]).range([0, 1])
  //let temperature = Math.min(1, scale(mel.temperature))
  //if (temperature < 0 || temperature === undefined) { temperature = 0 }
  scale = scaleLinear().domain([1, maxvalues.maxl]).range([0, 1])
  const meanLength = Math.min(1, scale(muutil.getMeanLength(mel)))
  scale = scaleLinear().domain([0, maxvalues.maxvar]).range([0, 1])
  const varianceJumps = Math.min(1, scale(muutil.calcVariance(notes)))
  const dist = muutil.ourDistanceFunction(mel, mel.primer, 1, 0.5)

  return {
    className: notes,
    axes: [
      { axis: 'numberNotes', value: numberNotes },
      { axis: 'meanLength', value: meanLength },
      { axis: 'varianceJumps', value: varianceJumps },
      //{ axis: "temperature", value: temperature },
      { axis: 'similarity', value: dist }
    ]
  }
}

export function calcPolygonStar(mel, maxvalues, dataselect, x = 0, y = 0, size = 10) {
  //                                                                       [melody, countOffBeat, percentagePauses, countRhyhtmChange]
  const data = dataselect === 0 ? calcStarData(mel, maxvalues) : calcRhythmStarData(mel[0], mel[1], mel[2], mel[3], maxvalues)
  const NUM_OF_SIDES = data.axes.length
  const offset = Math.PI
  const polyangle = (Math.PI * 2) / NUM_OF_SIDES
  const center =
  {
    x: x,
    y: y
  }

  const wrapper = d3.select('#app')
    .append('svg')
    .attr('width', size)
    .attr('height', size)

  d3.select('svg').append('g')
  const generatePoint = ({ length, angle, axis, value }) => {
    const point =
    {
      x: center.x - (length * Math.sin(offset - angle)),
      y: center.y - (length * Math.cos(offset - angle)),
      value: value,
      axis: axis
    }
    return point
  }

  const points = []
  let length = size
  for (let vertex = 0; vertex < NUM_OF_SIDES; vertex++) {
    const theta = vertex * polyangle
    length = size * data.axes[vertex].value
    points.push(generatePoint({ length, angle: theta, axis: data.axes[vertex].axis, value: data.axes[vertex].value }))
  }

  wrapper.remove()
  return points
}

export function calcDataPie(mel) {
  let occ = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let length = 0
  if (mel.notes.length > 0) {
    mel.notes.forEach((note) => {
      const index = note.pitch % 12
      occ[index] = occ[index] + 1
      length++
    })
  }
  return { occ: occ, length: length }
}


export function getColorLightness(color) {
  if (color !== undefined && color !== null) {
    const { r, g, b } = d3.color(color).rgb()
    const Y = (r + r + r + b + g + g + g + g) >> 3
    return Y / 2.55
  } else {
    return 100
  }
}

export function calcMinMaxForRoll(mel) {
  let pmax = 0
  let pmin = 128
  mel.notes.forEach((note) => {
    if (note.pitch > pmax) { pmax = note.pitch }
    if (note.pitch < pmin) { pmin = note.pitch }
  })
  while (pmax - pmin < 3) {
    pmax++
    pmin--
  }
  pmin--;
  pmax++
  return [pmin, pmax]
}

export function histogramColorScale(num) {
  const scale1 = d3.scaleLinear().domain([0, 24])
  const scale2 = d3.scaleLinear().domain([0, 0.5, 1]).range([1, 0, 1])

  const lowerColor = (d) => d3.interpolateRgb('grey', 'blue')(d)
  const higherColor = (d) => d3.interpolateRgb('grey', 'red')(d)
  return scale1(num) < 0.5 ? lowerColor(scale2(scale1(num))) : higherColor(scale2(scale1(num)))
}

export function histogramColorLegend(num) {

  let scale1 = d3.scaleLinear().domain([0, 0.5])
  let scale2 = d3.scaleLinear().domain([0.5, 1])

  const lowerColor = (d) => d3.interpolateRgb('grey', 'blue')(d)
  const higherColor = (d) => d3.interpolateRgb('grey', 'red')(d)
  return num < 0.5 ? lowerColor(1 - scale1(num)) : higherColor(scale2(num))
}

export function calcHistoGlyphData(data) {
  let histoData = []
  data.forEach((mel) => {
    const occ = Array(25).fill(0)
    const distNotes = muutil.pitchDiff(mel[0].notes)
    distNotes.shift()
    distNotes.forEach((diff) => {
      let dist = diff.pitch
      if (dist > 12) { dist = 24 } else if (dist < -12) { dist = 0 } else { dist += 12 }
      occ[dist] = occ[dist] + 1
    })
    histoData.push(occ)
  });
  return histoData
}

export function getMaxOcc(data) {
  let max = 1
  data.forEach((arr, i) => {
    const tmax = Math.max(...arr)
    if (tmax > max) { max = tmax }
  })
  return max
}

function addTwoArrays(a1, a2) {
  let temp = new Array(a1.length)
  a1.forEach((e1, i1) => {
    temp[i1] = e1 + a2[i1]
  })
  return temp
}

function addTwoArraysObj(a1, a2) {
  let temp = new Array(a1.length)
  a1.forEach((e1, i1) => {
    temp[i1] = { x: e1.x + a2[i1].x, y: e1.y + a2[i1].y, value: e1.value + a2[i1].value, axis: e1.axis }
  })
  return temp
}

export function getMiddlePosition(points) {
  let x = points[0][0].map((t) => 0)
  let y = points[0][1].map((t) => 0)
  points.forEach((p, i) => {
    x = addTwoArrays(x, p[2].visdata[0])
    y = addTwoArrays(y, p[2].visdata[1])
  })

  x = x.map(b => b / points.length)
  y = y.map(b => b / points.length)

  return [x, y]
}

export function averageOfGlyphs(points, color) {

  let information = {
    repcolor: null,
    melody: null,
    temperature: 0,
    model: null,
    index: null,
    // DR, Temperature, SimilarityPrimer, VarianceIntervals, NumberOfNotes
    visdata: [[0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]],
    repposition: [[0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]],
    starglyph: { data: [{ x: 0, y: 0, value: 0 }, { x: 0, y: 0, value: 0 }, { x: 0, y: 0, value: 0 }, { x: 0, y: 0, value: 0 }], maxvalues: points[0][2].starglyph.maxvalues }, //, { x: 0, y: 0 }
    chromapie: { data: { occ: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], length: 0 } },
    pianoroll: { data: null, maxocc: 0, xextent: [0, 0], yextent: [0, 0] },
    histInterval: { data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], max: points[0][2].histInterval.max }
    /*
    visdata:[[drpoints[index][0], melo[1].temperature, sim, varInt, melo[0].notes.length, muutil.getInScalePercent(harmonicInfo)],
             [drpoints[index][1], melo[1].temperature, sim, varInt, melo[0].notes.length, muutil.getInScalePercent(harmonicInfo)]],
    starglyph:{data:glutil.calcPolygonStar(melo[0], maxvalues), maxvalues:maxvalues}, 
    chromapie:{data:glutil.calcDataPie(melo[0])},
    pianoroll:{data:glutil.calcMinMaxForRoll(melo[0])},
    histInterval:{data:histdata[index], max: glutil.getMaxOcc(histdata)},
    additional:{pace:muutil.calcPaceMelody(melo[0]), isPolyphonic:muutil.isPolyphonic(melo[0]), percentagePause:muutil.percentagePauses(melo[0]), 
      harmonicInfo: harmonicInfo, harmonicScore: muutil.getHarmonicScore(melo[0], harmonicInfo), key:key}
    */
  }

  points.forEach((p, i) => {
    // melody avg? => heatmap

    // temperature => avg
    information.temperature += p[2].temperature
    // model => histogram -> erstmal weglassen

    // visdata => avg for all (.map)
    information.visdata[0] = addTwoArrays(information.visdata[0], p[2].visdata[0])
    information.visdata[1] = addTwoArrays(information.visdata[1], p[2].visdata[1])

    //starglyph => data avg?
    // {x:0, y:0}
    information.starglyph.data = addTwoArraysObj(information.starglyph.data, p[2].starglyph.data)

    // chroma => avg
    information.chromapie.data.occ = addTwoArrays(information.chromapie.data.occ, p[2].chromapie.data.occ)

    // histInterval => avg
    // data.occ
    information.histInterval.data = addTwoArrays(information.histInterval.data, p[2].histInterval.data)
    // additional => erstmal weglassen
    // what about rhythm
  })
  // pianoroll ? => heatmaproll
  let heatmap = calcPianoHeatmap(points.map((p) => p[2].melody))
  information.pianoroll.data = heatmap[0]
  information.pianoroll.maxocc = heatmap[1]
  information.pianoroll.xextent = [0, heatmap[0][0].length]
  information.pianoroll.yextent = [heatmap[0][0][0].pitch, heatmap[0][heatmap[0].length - 1][0].pitch]

  information.repcolor = color
  information.temperature = information.temperature / points.length
  information.visdata = information.visdata.map(a => a.map(b => b / points.length))
  information.starglyph.data = information.starglyph.data.map(b => { b.x = b.x / points.length; b.y = b.y / points.length; b.value = b.value / points.length; return b })
  information.chromapie.data.occ = information.chromapie.data.occ.map(b => b / points.length)
  information.chromapie.data.length = information.chromapie.data.occ.reduce((a, b) => a + b)
  information.histInterval.data = information.histInterval.data.map(b => b / points.length)
  information.repposition = information.visdata

  return [information.visdata[0], information.visdata[1], information]
}

export function calcModelFromCluster(points) {
  let occ = []
  let modelnames = []
  let length = points.length
  get(models).forEach(m => {
    occ.push(0)
    modelnames.push(m.name)
  })

  points.forEach((p) => {
    const ind = modelnames.findIndex((n) => n === p[2].model.name)
    occ[ind] = occ[ind] + 1
  })

  return { occ: occ, modelnames: modelnames, length: length }
}

export function calcVariancesCluster(points, color) {

  let starglyph = points[0][2].starglyph.data.map(() => 0)

  let chromapie = points[0][2].chromapie.data.occ.map(() => 0)

  let histInterval = points[0][2].histInterval.data.map(() => 0)

  let temperaturev = d3.deviation(points.map((p, i) => p[2].temperature))

  let starglyphvx = d3.deviation(starglyph.map((d, i) => d3.deviation(points.map((p) => p[2].starglyph.data[i].x))))
  let starglyphvy = d3.deviation(starglyph.map((d, i) => d3.deviation(points.map((p) => p[2].starglyph.data[i].y))))

  let chromapiev = d3.deviation(chromapie.map((d, i) => d3.deviation(points.map((p) => p[2].chromapie.data.occ[i]))))

  let histIntervalv = d3.deviation(histInterval.map((d, i) => d3.deviation(points.map((p) => p[2].histInterval.data[i]))))

  let deviation = (temperaturev + ((starglyphvx + starglyphvy) / 2) + chromapiev + histIntervalv) / 4

  if (isNaN(deviation) || deviation === undefined)
    deviation = 0

  return deviation
}

export function calcInformation(points) {

  // key distribution

  let keyDist = sortKeys(objDist(points.map((p, i) => {
    if (p[2].additional.key === null)
      return 'none'
    return p[2].additional.key.tonic + ' ' + p[2].additional.key.type
  })))


  // piano heatmap
  // needs array of melodies
  let pheatmap = calcPianoHeatmap(points.map((p) => p[2].melody))

  // model distribution
  let modDist = objDist(points.map((p) => p[2].model.name))
  // harmonic distribution -> how much inscale?
  let harmdist = calcDistribution(points.map((p) => p[2].additional.harmonicInfo))
  let inScaPerc = 0
  if (points.length > 0)
    inScaPerc = points.map(p => muutil.getInScalePercent(p[2].additional.harmonicInfo)).reduce((a, b) => a + b) / points.length


  let modekeystack =
    addupOcc(keyDist.map(k => {
      let obj = { x: k.name }
      modDist.forEach(m => {
        obj[m.name] = 0
      })
      return obj
    }), points)

  let info = { keydist: keyDist, pheatmap: pheatmap, moddist: modDist, harmdist: harmdist, inScaPerc: inScaPerc, modkeystack: modekeystack }
  return info
}

function calcDistribution(data) {
  let temp = data[0]
  for (let index = 1; index < data.length; index++) {
    temp = temp.map((v, i) => v + data[index][i])
    if (index === data.length - 1) {
      let total = temp.reduce((a, b) => a + b)
      temp = temp.map(t => (t / total).toFixed(3))
    }
  }
  return temp
}

function addupOcc(data, p) {
  p.forEach((v, i) => {
    let value = v[2]
    let tonal = v[2].additional.key === null ? 'none' : v[2].additional.key.tonic + ' ' + v[2].additional.key.type
    data.find(obj => obj.x === tonal)[value.model.name] += 1
  })
  return data
}

function sortKeys(data) {
  const keyInd = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'N']
  const sortedArray = data.sort((a, b) => {
    const keyA = a.name.toUpperCase()
    const keyB = b.name.toUpperCase()

    let va = keyInd.indexOf(keyA[0])
    let vb = keyInd.indexOf(keyB[0])

    if (keyA[1] === '#')
      va += 0.5
    if (keyB[1] === '#')
      vb += 0.5

    return va - vb
  });
  return sortedArray;
}

function objDist(data) {
  let temp = []
  data.forEach((v, i) => {
    let value = v
    if (temp.some(obj => obj.hasOwnProperty("name") && obj["name"] === value)) {
      temp.find(obj => obj.hasOwnProperty("name") && obj["name"] === value).occ += 1
    } else {
      temp.push({ name: value, occ: 1 })
    }
  })
  return temp
}

function calcPianoHeatmap(data) {

  if (data.length > 0) {
    let pitchext = [128, 0]
    let lengthext = [0, 32]
    data.forEach((v, i) => {
      let ext = muutil.getExtentOfMelody(v, false)
      ext[0]--
      ext[1]++
      if (ext[0] < pitchext[0])
        pitchext[0] = ext[0]
      if (ext[1] > pitchext[1])
        pitchext[1] = ext[1]
      lengthext[1] < v.totalQuantizedSteps ? lengthext[1] = v.totalQuantizedSteps : null
    })
    pitchext[1]++
    pitchext[0]--
    //let occu = new Array(pitchext[1] - pitchext[0]).fill(new Array(lengthext[1] - lengthext[0] + 1).fill(null))

    let occu = new Array(pitchext[1] - pitchext[0])
    for (let p = 0; p < occu.length; p++) {
      occu[p] = new Array(lengthext[1] - lengthext[0] + 1)
      for (let t = 0; t < occu[0].length; t++) {
        occu[p][t] = { pitch: p + pitchext[0], start: t + lengthext[0], length: 1, occ: 0 }
      }
    }

    let maxocc = 0

    for (let i = lengthext[0]; i < lengthext[1]; i++) {
      data.forEach(v => v.notes.forEach(d => {
        if (d.quantizedStartStep <= i && d.quantizedEndStep > i) {
          const o = occu[d.pitch - pitchext[0]][i - lengthext[0]]
          o.occ++
          occu[d.pitch - pitchext[0]][i - lengthext[0]].occ = o.occ + 1
          if (maxocc < o.occ) { maxocc = o.occ }
        }
      }))
    }

    return [occu, maxocc]
  }
  else {
    return [[[0]], 0]
  }
}
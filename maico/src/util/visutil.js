import { vorcolorselect, weightTimbre, brushClusterSwitch, clusterdata, models, axisselect, brushselection, modelselected, currentcolor, colors, points, side, setcpoints, currentpoints, seen, meloselected, selectedBaseKeys, primerList } from '../stores/stores.js'
import { get } from 'svelte/store';
import { extent } from 'd3-array';
import * as d3 from 'd3'
import * as modelutil from './modelutil.js';
import * as druid from '@saehrimnir/druidjs/dist/druid.esm.js'
import { keysLookup } from '../stores/globalValues.js';
import { log } from './fileutil.js';

export function isBrushed(x, y, b, p) {
  if (b === null || b === undefined || (p !== undefined && !p[2]?.isPrimer && !p[2]?.isPolymix && !get(modelselected)[p[2].model.name])) {
    return false
  } else {
    if (x > b[0][0] && x < b[1][0] && y > b[0][1] && y < b[1][1]) {
      return true
    }
    return false
  }
}

// xScale, yScale, pointData
export function getSelectedMelodies(x, y, points) {
  if (get(brushselection) === null || get(brushselection) === undefined || points === undefined || points === null) {
    if (get(meloselected) !== null)
      log("delete brush")
    return null
  }
  let brush = get(brushselection)
  let selpoints = points.filter((point) => isBrushed(x(point[0][get(axisselect)[0].value]), y(point[1][get(axisselect)[1].value]), get(brushselection), point))
  let newpoints = []
  selpoints.forEach(p => {
    if (get(seen).filter(p1 => p1[2].index === p[2].index).length === 0) {
      p[2].userspecific.seen = 1
      newpoints.push(p)
    }
  })
  seen.set(get(seen).concat(newpoints))
  const selectedpoints = selpoints.map((m) => { return { primer: m[2].isPrimer, melody: m[2].melody } })
  log("select brush results in points", { brush, selected: selectedpoints })
  return selpoints
}

export function getTimbreKeySelectedMelodies(x, y, points, spoints, ordering, maxsame) {
  if (get(brushselection) === null || get(brushselection) === undefined || points === undefined || points === null) {
    if (get(meloselected) !== null)
      log("delete brush")
    return null
  }
  let brush = get(brushselection)
  let keyindizes = [...Array(maxsame).keys()].filter((v, i) => x(v) > get(brushselection)[0][0] && x(v) < get(brushselection)[1][0]) // 4,5,6
  let selpoints = spoints.filter((point,i) => {
      if (y(point[3]) > get(brushselection)[0][1] && y(point[3]) < get(brushselection)[1][1] && keyindizes.indexOf(i - ordering[point[3]]) !== -1)
        return true
      else 
        return false
  })
  let newpoints = []
  selpoints.forEach(p => {
    if (get(seen).filter(p1 => p1[2].index === p[2].index).length === 0) {
      p[2].userspecific.seen = 1
      newpoints.push(p)
    }
  })
  seen.set(get(seen).concat(newpoints))
  const selectedpoints = selpoints.map((m) => { return { primer: m[2].isPrimer, melody: m[2].melody } })
  log("select brush results in timbrekey", { brush, selected: selectedpoints })
  return selpoints
}

export function getTimbreSelectedMelodies(x, y, points, ordering) {
  if (get(brushselection) === null || get(brushselection) === undefined || points === undefined || points === null) {
    if (get(meloselected) !== null)
      log("delete brush")
    return null
  }
  let brush = get(brushselection)
  let keyindizes = ordering.filter((v, i) => x(i) > get(brushselection)[0][0] && x(i) < get(brushselection)[1][0])
  let selpoints = points.filter((point) => {
    let r = false
    keyindizes.forEach((v) => {
      if (y(point[2].timbre[v]) > get(brushselection)[0][1] && y(point[2].timbre[v]) < get(brushselection)[1][1])
        r = true
    })
    return r
  })
  let newpoints = []
  selpoints.forEach(p => {
    if (get(seen).filter(p1 => p1[2].index === p[2].index).length === 0) {
      p[2].userspecific.seen = 1
      newpoints.push(p)
    }
  })
  seen.set(get(seen).concat(newpoints))
  const selectedpoints = selpoints.map((m) => { return { primer: m[2].isPrimer, melody: m[2].melody } })
  log("select brush results in timbre", { brush, selected: selectedpoints })
  return selpoints
}

export function getExportSelectedMelodies(x, y, points, ordering) {
  if (get(brushselection) === null || get(brushselection) === undefined || points === undefined || points === null) {
    if (get(meloselected) !== null)
      log("delete brush")
    return null
  }
  let brush = get(brushselection)

  let selpoints = points.filter((point, index) => {
    if (y(Math.floor(index/10)) > get(brushselection)[0][1] && y(Math.floor(index/10)) < get(brushselection)[1][1] && x(index%10) >get(brushselection)[0][0] && x(index%10) <get(brushselection)[1][0])
        return true
    return false
  })
  let newpoints = []
  selpoints.forEach(p => {
    if (get(seen).filter(p1 => p1.index === p.index).length === 0) {
      p.userspecific.seen = 1
      newpoints.push(p)
    }
  })
  seen.set(get(seen).concat(newpoints))
  const selectedpoints = selpoints.map((m) => { return { primer: m?.isPrimer, melody: m.melody } })
  log("select brush results in export", { brush, selected: selectedpoints })
  return selpoints.map(p => [0,0,p])
}

export function getColor(data, currentcolor, basenote) {
  return get(colors)[currentcolor].scale(data, basenote)

}


export function calcAllColorScales(alldata) {
  let result = []
  let information = alldata.map(d => d[2])
  let scale
  // models -> put in information
  result.push({
    name: 'Models', scale: (data, a) => {
      const value = modelutil.getIndexbyModelname(data?.model?.name)
      return value !== null && value !== undefined ? modelColor10(value) : '#444'
    }
  })

  // temperature -> put in melody
  let ext = extent(information.map(d => parseFloat(d.temperature)))
  result.push({
    name: 'Temperature', scale: (data, a) => {
      scale = d3.scaleLinear().domain(ext)
      return divergingScale(scale(data.temperature))
    }
  })

  // key -> put in melody
  result.push({
    name: 'Key', scale: (data, a) => {
      return keyColors(data.additional.key)
    }
  })

  // primer -> put in melody
  result.push({
    name: 'Primer', scale: (data, a) => {
      return modelColor10(data.primerindex)
    }
  })

  //rhythm
  result.push({
    name: 'Rhythm', scale: (data, a) => {
      return divergingScale(data.rhythm.complexity)
    }
  })

  result.push({
    name: 'Seen', scale: (data, a) => {
      return data.userspecific.seen ? "green" : "red" // 
    }
  })

  result.push({
    name: 'Rate', scale: (data, a) => {
      return data.userspecific.rate !== 0 ? (data.userspecific.rate === 1 ? "green" : "red") : 'blue'
    }
  })

  result.push({
    name: 'Timbre', scale: (data, a) => {              //sequentialScale
      return data?.timbre !== undefined && a !== -1 ? divergingTimbreScale(data.timbre[a]) : 'lightgrey'
    }
  })

  result.push({
    name: 'hasPrimer', scale: (data, a) => {            
      return data?.isPolymix && (data?.polyinfo?.basemelody < get(primerList).length || data?.polyinfo?.combinations.filter(v => v < get(primerList).length).length > 0) ? 'lightgrey' : '#444'
    }
  })

  colors.set(result)
}
// 10 different values
export function modelColor10(i) {
  const scale = d3.schemeTableau10
  return scale[i % 10]
}

export function melodyColor(index, indexing) {
  let id = indexing.filter(n => n.id === index)[0].meloID
  const scale = d3.schemeTableau10
  return scale[id % 10]
}

// dark to bright
export function sequentialScale(i) {
  const scale = d3.interpolateViridis
  return scale(i)
}

//blue to red
export function divergingScale(i) {
  //console.log(i)
  const scale = d3.interpolateRdYlBu//.interpolateSpectral//.interpolateTurbo
  const rescale = d3.scaleLinear().domain([0, 1]).range([1, 0])//[0.07,1])
  return scale(rescale(i))
}

/**
 * Blue-white-blue scale
 * @param {*} i
 * @returns
 */
export function divergingScaleSymmetric(i) {
  return i < 0.5 ? d3.interpolateBlues((-i + 0.5) * 2) : d3.interpolateBlues((i - 0.5) * 2)
}

export function divergingTimbreScale(i) {
  return d3.interpolateViridis(i)//d3.interpolateRdYlGn(i)
}

// what kinds of types are major and which are minor? maybe do differentiation not just color?
export const keyColors = (key) => {
  if (key === null || key === undefined)
    return '#444'

  const co = [
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
  ]
  const sat = (d, mode) => {
    const c = d3.hsl(d)
    c.s = mode.includes('major') ? 0.7 : 0.7
    return c.toString()
  }
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const ind = keys.indexOf(keys.filter((k) => key.tonic.includes(k))[0])
  return sat(co[ind], key.type)
}



/**
 * Computes hierachical clustering on a distance matrix to obtain a coloring
 * @param {number[][]} distMatrix distance matrix
 * @param {function} colormap colormap [0,1]=>string
 * @param {number} [clusterThreshold=0] threshold between 0 and 1 for cluster
 * cut-off
 *
 */
export function getColorsViaClusteringFromDistances(
  distMatrix,
  colormap,
  clusterThreshold = 0,
) {
  if (distMatrix?.length === 0 || distMatrix?.length === 1) { return [] }
  // Perform clustering
  const druidMatrix = druid.Matrix.from(distMatrix)
  const clusterTree = new druid.Hierarchical_Clustering(
    druidMatrix,
    "complete",
    "precomputed"
  )
  if (!clusterTree.root) {
    // Happens when there are no items, e.g., when piece has no sections
    return []
  }
  /**
   * Traverses a tree in pre-order
   * @param {object} node tree node
   * @returns {object[]} nodes
   */
  function preOrderTraverse(node) {
    const nodes = []
    // Next node always at last position
    const todo = [node]
    while (todo.length > 0) {
      const currentNode = todo.pop()
      nodes.push(currentNode)
      if (!currentNode.isLeaf) {
        // Do left before right, so push it last
        todo.push(currentNode.right, currentNode.left)
      }
    }
    return nodes
  }
  // Get nodes
  const nodes = preOrderTraverse(clusterTree.root)
  const leaves = nodes.filter((n) => n.isLeaf)
  // Compute x from weighted mean of children
  for (const [i, node] of leaves.entries()) {
    node.x = i
  }
  const sortedBottomUp = nodes
    .filter((n) => !n.isLeaf)
    .sort((a, b) => a.depth - b.depth)
  for (const node of sortedBottomUp) {
    const { left, right } = node
    node.x =
      (left.x * left.size + right.x * right.size) / (left.size + right.size)
  }
  // Get clusters (e.g. for color)
  const clusters = clusterTree.get_clusters(clusterThreshold, "distance")
  // Assign cluster IDs to nodes
  for (const [clusterId, cluster] of clusters.entries()) {
    for (const node of cluster) {
      node.clusterId = clusterId
    }
  }
  const measureClusters = clusters.flatMap((cluster, cIndex) =>
    cluster.map((item) => {
      return {
        mIndex: item.index,
        cIndex
      }
    })
  )
    .sort((a, b) => a.mIndex - b.mIndex)
    .map((d) => d.cIndex)
  const scaleColor = d3
    .scaleLinear()
    .domain([0, clusters.length])
    .range([0, 1])
  const measureColors = measureClusters.map((d) =>
    colormap(scaleColor(d + 0.5))
  )
  // measureClusters is an array with array[measureIndex] = clusterId
  // return { measureClusters, measureColors, nClusters: clusters.length };
  return [measureClusters, measureColors]
}


export function getAxisScale() {
  const margin = { top: 25, right: 25, bottom: 25, left: 25 };

  if (get(points) === undefined) return []
  const domainx = makeextentBigger(d3.extent(get(points).map((value) => value[0][get(axisselect)[0].value])))
  const x = get(points) !== undefined ?
    d3.scaleLinear()
      .domain(domainx)
      .range([margin.left, get(side) - margin.right])
      .nice() :
    d3.scaleLinear()
      .domain([-1, 1])
      .range([margin.left, get(side) - margin.right])
      .nice();

  const domainy = makeextentBigger(d3.extent(get(points).map((value) => value[1][get(axisselect)[1].value])))
  const y = get(points) !== undefined ?
    d3.scaleLinear()
      .domain(domainy)
      .range([get(side) - margin.bottom, margin.top])
      .nice() :
    d3.scaleLinear()
      .domain([-1, 1])
      .range([get(side) - margin.bottom, margin.top])
      .nice();

  return [x, y]
}

export function getFillForVoronoi(data) {
  if (data !== undefined) {
    const s = get(vorcolorselect).value
    if (s === 0) {
      return getColor(data.data[2], 1)
    } else if (s === 1) {
      const temp1 = get(clusterdata).filter((element, index) => {
        return element.containpoints.filter((cpoint) => { return data.data[2].index === cpoint[2].index }).length > 0
      })
      return temp1[0].color
    } else if (s === 2) {
      return getColor(data.data[2], 2)
    } else if (s === 3) {
      return getColor(data.data[2], 0)
    } else if (s === 4) {
      return getColor(data.data[2], 3)
    } else if (s === 5) {
      return getColor(data.data[2], 4)
    } else if (s === 6) {
      return getColor(data.data[2], 5) //data.data[2].userspecific.seen ? "green" : "red"
    } else if (s === 7) {
      return getColor(data.data[2], 6) //data.data[2].userspecific.rate !== 0 ? (data.userspecific.rate === 1 ? "green" : "red") : 'blue'
    } else if (s === 8) {
      return getColor(data.data[2], 7, get(selectedBaseKeys))
    } else if (s === 9) {
      return 'transparent'
    }

  } else {
    return null
  } // for temperature
}

export function correlationCoefficient(X, Y, n) {
  let sumX = 0; let sumY = 0; let sumXY = 0
  let squareSumX = 0; let squareSumY = 0

  for (let i = 0; i < n; i++) {
    // Sum of elements of array X.
    sumX = sumX + X[i]

    // Sum of elements of array Y.
    sumY = sumY + Y[i]

    // Sum of X[i] * Y[i].
    sumXY = sumXY + X[i] * Y[i]

    // Sum of square of array elements.
    squareSumX = squareSumX + X[i] * X[i]
    squareSumY = squareSumY + Y[i] * Y[i]
  }

  // Use formula for calculating correlation
  // coefficient.
  const corr = (n * sumXY - sumX * sumY) /
    (Math.sqrt((n * squareSumX -
      sumX * sumX) *
      (n * squareSumY -
        sumY * sumY)))

  return corr
}

export function makeextentBigger(extent) {
  const range = extent[1] - extent[0]
  const pad = range * 0.01

  return [extent[0] - pad, extent[1] + pad]
}

export function hitDetection(r, x, y, dif) {
  const axis = getAxisScale();
  const xs = axis[0];
  // @ts-ignore
  const ys = axis[1];
  const rx = xs(r[2].repposition[0][get(axisselect)[0].value])
  const ry = ys(r[2].repposition[1][get(axisselect)[1].value])

  // get nearest melody
  // get axis -> invert -> compare to all vis data and get nearest

  if (Math.abs(rx - x) < dif && Math.abs(ry - y) < dif)
    return true
  return false
}


export function recalculatePositions() {
  console.log("recompute")
  // compute everything and then set

  // setcpoints.set([])
}

export function drawAxis(context, type, height, tick, scale, offset) {
  context.fillStyle = "black";
  const tickSize = 4
  let ticks = null
  if (type === 'x') {
    ticks = [];
    for (let t = 0; t <= tick; t++) {
      if (t % 16 === 0) {
        ticks.push(t);
      }
    }
  } else {
    ticks = []
    for (let t = tick[0] + 1; t <= tick[1]; t++) {
      ticks.push(t);
    }
  }//.tickFormat(tickFormat)
  context.beginPath();

  ticks.forEach((d) => {
    if (type === "x") {
      context.moveTo(scale(d), height);
      context.lineTo(scale(d), height + tickSize);
    } else if (type === "y") {
      context.moveTo(2 * offset, scale(d));
      context.lineTo(2 * offset - tickSize, scale(d));
    }
  });

  context.strokeStyle = "#333";
  context.stroke();

  context.textAlign = type === "x" ? "center" : "right";
  context.textBaseline = type === "x" ? "top" : "middle";
  context.fillStyle = "#333";

  ticks.forEach((d) => {
    if (type === "x") {
      context.fillText(
        Math.round(d / 16),
        scale(d),
        height + tickSize + 1
      );
    } else if (type === "y") {
      if (d % 3 === 0)
        context.fillText(keysLookup[d % 12], 2 * offset - tickSize - 1, scale(d));
    }
  });
}

export function drawAxisHisto(context, type, height, tick, scale, offset) {
  context.fillStyle = "black";
  const tickSize = 4
  let ticks = null
  if (type === 'x') {
    ticks = [];
    for (let t = 0; t < tick; t++) {
      ticks.push(t + 12.5);
    }
  } else {
    ticks = []
    for (let t = 0; t <= tick; t++) {
      if (tick > 30) {
        if (t % 2 === 0 || t === tick)
          ticks.push(t);
      } else {
        ticks.push(t);
      }
    }
  }//.tickFormat(tickFormat)
  context.beginPath();

  ticks.forEach((d) => {
    if (type === "x") {
      context.moveTo(scale(d), height);
      context.lineTo(scale(d), height + tickSize);
    } else if (type === "y") {
      context.moveTo(2 * offset, scale(d));
      context.lineTo(2 * offset - tickSize, scale(d));
    }
  });

  context.strokeStyle = "#333";
  context.stroke();

  context.textAlign = type === "x" ? "center" : "right";
  context.textBaseline = type === "x" ? "top" : "middle";
  context.fillStyle = "#333";

  ticks.forEach((d) => {
    if (type === "x") {
      context.fillText(
        d - 12.5,
        scale(d),
        height + tickSize + 1
      );
    } else if (type === "y") {
      if (tick > 30) {
        if (d % 8 === 0 || d === tick)
          context.fillText(d, 2 * offset - tickSize - 1, scale(d));
      } else if (tick > 10 || d === tick) {
        if (d % 4 === 0)
          context.fillText(d, 2 * offset - tickSize - 1, scale(d));
      } else {
        if (d % 2 === 0 || d === tick) {
          context.fillText(d, 2 * offset - tickSize - 1, scale(d));
        }
      }
    }
  });
}

export function glyphInBig(e) {
  let axis = getAxisScale()
  const x = axis[0]
  // @ts-ignore
  const y = axis[1]

  const selx = x.invert(e.offsetX)
  const sely = y.invert(e.offsetY)

  const margin = [Math.abs(x.invert(50) - x.invert(100)), Math.abs(y.invert(50) - y.invert(100))]

  const curaxisx = get(axisselect)[0].value
  const curaxisy = get(axisselect)[1].value

  let closest = get(currentpoints).reduce(function (prev, curr) {
    return (Math.abs(curr[0][curaxisx] - selx) + Math.abs(curr[1][curaxisy] - sely) < Math.abs(prev[0][curaxisx] - selx) + Math.abs(prev[1][curaxisy] - sely) ? curr : prev);
  });

  if (Math.abs(closest[0][curaxisx] - selx) < margin[0] && Math.abs(closest[1][curaxisy] - sely) < margin[1])
    return closest
  return null
}

export function pearsonCorrelation(prefs, p1, p2) {
  var si = [];

  for (var key in prefs[p1]) {
    if (prefs[p2][key]) si.push(key);
  }

  var n = si.length;

  if (n == 0) return 0;


  var sum1 = 0;
  for (var i = 0; i < si.length; i++) sum1 += prefs[p1][si[i]];

  var sum2 = 0;
  for (var i = 0; i < si.length; i++) sum2 += prefs[p2][si[i]];

  var sum1Sq = 0;
  for (var i = 0; i < si.length; i++) {
    sum1Sq += Math.pow(prefs[p1][si[i]], 2);
  }

  var sum2Sq = 0;
  for (var i = 0; i < si.length; i++) {
    sum2Sq += Math.pow(prefs[p2][si[i]], 2);
  }

  var pSum = 0;
  for (var i = 0; i < si.length; i++) {
    pSum += prefs[p1][si[i]] * prefs[p2][si[i]];
  }

  var num = pSum - (sum1 * sum2 / n);
  var den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / n) *
    (sum2Sq - Math.pow(sum2, 2) / n));

  if (den == 0) return 0;

  return num / den;

}


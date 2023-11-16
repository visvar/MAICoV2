import * as druid from '@saehrimnir/druidjs/dist/druid.esm.js'
// import * as druid from '@saehrimnir/druidjs'
import * as hagrid from '@saehrimnir/hagrid'
import * as muutil from './musicutil.js'

function getDrProjectedPoints(distMatrix, umap, emotion) {
  const druidMatrix = druid.Matrix.from(distMatrix)

  // const DR = new druid.TSNE(druidMatrix).init(druidMatrix).transform();
  let DR
  // MDS if false
  if (!umap) {
    if (!emotion) {
      //DR = new druid.MDS(druidMatrix, { d: 2, metric: 'precomputed' }).transform()
      let DRn = new druid.MDS(druidMatrix, { d: 2, metric: 'precomputed' })
      DR = DRn.transform()
      /*} else if (drMethod === 'TSNE') {
        let perplexity = 40
        if (temp.length >= 55) {
          perplexity = 50
        } else if (temp.length <= 10) {
          perplexity = 5
        } else {
          perplexity = temp.length - 5
        }

        DR = new druid.TSNE(druidMatrix, { perplexity: perplexity, epsilon: 10, d: 2, metric: 'precomputed' }).transform()
      // console.log("perp: "+perplexity+", eps: 10, Anzahl: "+temp.length);
      */
    } else {
      let DRn = new druid.MDS(druidMatrix, { d: 2 })
      DR = DRn.transform()
    }
  } else {
    if (!emotion) {
      let DRn = new druid.UMAP(druidMatrix, { n_neighbors: Math.min(distMatrix.length, 15), local_connectivity: 3, min_dist: 1, d: 2, metric: 'precomputed' })
      //DRn._X = druidMatrix
      DR = DRn.transform()
    } else {
      let DRn = new druid.UMAP(druidMatrix, { n_neighbors: Math.min(distMatrix.length, 15), local_connectivity: 3, min_dist: 1, d: 2 })
      //DRn._X = druidMatrix
      DR = DRn.transform()
    }
  }

  // @ts-ignore
  const points = DR.to2dArray
  return points
}

function getDistanceMatrix(array, distanceFunction, weight, symmetric) {
  const n = array.length
  const matrix = Array.from({ length: n }).map(() => Array.from({ length: n }))
  for (const [index1, item1] of array.entries()) {
    const start = symmetric ? index1 : 0
    for (let index2 = start; index2 < n; index2++) {
      const item2 = array[index2]
      let distance = distanceFunction(item1, item2, 1, weight)
      if (isNaN(distance)) { distance = 1 }
      // Need a distance matrix, so invert similarity
      matrix[index1][index2] = distance
      if (symmetric) {
        matrix[index2][index1] = distance
      }
    }
  }
  return matrix
}

export function getPoints(distMatrix, umap, emotion) {
  if (distMatrix !== undefined && distMatrix.length > 0) {
    const points = getDrProjectedPoints(distMatrix, umap, emotion)
    return points
  }
}

export function distanceMatrix(melodies, weight) {

  if (melodies.length > 0) {
    const distMatrix = getDistanceMatrix(melodies, muutil.ourDistanceFunction, weight, true)
    return distMatrix

  }
}

export function gridify(points, num) {
  let gridpoints = null
  if (points === undefined)
    return points
  if (num === 0)
    if (points.length >= 100)
      gridpoints = hagrid.gridify(points, 'hilbert', {
        l_min: 0,
        pluslevel: 0,
        keep_aspect_ratio: true
      })
    else
      gridpoints = hagrid.gridify(points, 'hilbert', {
        l_min: 0,
        pluslevel: 1,
        keep_aspect_ratio: true
      })
  else if (num === 1)
    gridpoints = hagrid.gridify(points, 'gosper', {
      l_min: 0,
      pluslevel: 0,
      keep_aspect_ratio: true
    })

  else if (num === 2)
    gridpoints = hagrid.gridify(points, "dgrid", {
      l_min: 0,
      pluslevel: 2,
      keep_aspect_ratio: true
    })

  return gridpoints
}

export function getNum(val) {
  if (isNaN(val)) {
    return 0;
  }
  return val;
}

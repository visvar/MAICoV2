
import * as d3 from 'd3'
import * as muutil from '../../util/musicutil.js'
import { onMount } from 'svelte';

export function PianorollDensity(data, svg, h, w, xDomain, yDomain, maxocc) {

    const margin = { top: 20, right: 10, bottom: 10, left: 25 };

    if (svg !== undefined && data[0]?.hullpoints !== null) {

        let x = d3.scaleLinear()
            .domain(xDomain)
            .range([margin.left, w - margin.right])


        let y = d3.scaleLinear()
            .domain(yDomain)
            .range([h - margin.bottom, margin.top])

        let noteheight = (y(yDomain[1] - 1) - y(yDomain[1]))

        const xticks = []
        for (let t = 0; t <= xDomain[1] + 1; t++) {
            if (t % 16 === 0) {
                xticks.push(t)
            }
        }

        function xAxis(g) {
            g.attr('transform', `translate(${0},${margin.top})`)
                .call(d3.axisTop(x).tickValues(xticks).tickFormat((t) => {
                    return Math.round(t / 16)
                }))
        }

        function yAxis(g) {
            g
                .attr('transform', `translate(${margin.left},${0})`)
                .style('font', Math.max(Math.min(noteheight, 16), 11) + 'px times')
                .call(d3.axisLeft(y).ticks((yDomain[1] - yDomain[0])).tickFormat((t) => {
                    if (t % 12 === 0 || t % 12 === 5 || t % 12 === 9) {
                        return t
                    }
                }).tickSize(-x(xDomain[1]) + margin.left))

        }

        svg.selectAll('*').remove()

        svg.append('g').call(xAxis)
        let labelaxis = svg.append('g').call(yAxis)
        labelaxis.selectAll(".tick line")
            .attr("opacity", 0.1)
            .attr('stroke', '#111')
            .attr('stroke-width', 0.5)

        let s = d3.scaleLinear().domain([0, maxocc]).range([0, (noteheight * 0.95) / 2])

        data.forEach((cluster, index) => {
            svg.append('g')
                .selectAll('path')
                .data(cluster?.clusterData?.pheatmap[0])
                .enter()
                .append('path')
                .style('stroke', 'none')
                .style('fill', cluster.color)
                .style('opacity', 0.3)
                .attr('d', d3.area()
                    .y0(function (d) { return (y(d.pitch) - s(d.occ)) })
                    .y1(function (d) { return (y(d.pitch) + s(d.occ)) })
                    .x(function (d) { return (x(d.start)) })
                    .curve(d3.curveMonotoneX)
                )
        })
    }

}




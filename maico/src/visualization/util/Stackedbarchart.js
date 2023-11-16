import * as d3 from 'd3'

export function StackedBarChart(data, {
    svg = null,
    marginTop = 20, // top margin, in pixels
    marginRight = 10, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 50, // left margin, in pixels
    width = 640, // outer width, in pixels
    height = 400, // outer height, in pixels
    yDomain = [0], // array of x-values
    xRange = [marginLeft, width - marginRight], // [left, right]
    xPadding = 0.1, // amount of x-range to reserve to separate bars
    xType = d3.scaleLinear, // type of y-scale
    xDomain = [0,0], // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    zDomain = [0], // array of z-values
    colors // array of colors
  } = {}) {
    if(data !== undefined  && data.length > 0){
  
        const yCDomain = [0, data.length-1]
        // Construct scales, axes, and formats.
        const yScale = d3.scaleBand(yDomain, yRange).paddingInner(0.1).paddingOuter(0.2)
        const yScaleCluster = d3.scaleBand(yCDomain, [0,yScale.bandwidth()]).paddingInner(0.1).paddingOuter(0.1)
        const xScale = d3.scaleLinear().domain(xDomain).range(xRange)
        const xAxis = d3.axisBottom(xScale).tickSizeOuter(0).ticks(xDomain[1]+1)
        const yAxis = d3.axisLeft(yScale)  

        svg.selectAll('*').remove()
            
        
        svg.append("g")
            .attr("transform", `translate(0,${height - marginBottom})`)
            .call(xAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
                .attr("y2", - height + marginTop + marginBottom)
                .attr("stroke-opacity", 0.1))
    

        data.forEach((cluster, index) => {

            let dataset = d3.stack()
            .keys(zDomain)
            (cluster.clusterData.modkeystack)  


            let groups = svg.selectAll('g.bars'+index)
                .data(dataset)
                .enter()
                .append('g').attr('class', 'bars'+index)
                .style('fill', (d,i) => colors(d))
                .style('stroke', cluster.color)

            const bar = groups.selectAll("rect")
                .data(d => d)
                .enter()
                .append('rect')
                .attr("y", d => yScale(d.data.x)+yScaleCluster(index))
                .attr("x", d => xScale(d[0]))
                .attr("height", yScaleCluster.bandwidth())
                .attr("width", d => xScale(d[1]) - xScale(d[0]));
        

            svg.selectAll('g.cluster'+index)
                .data(dataset)
                .enter()
                .append('g').attr('class', 'cluster'+index)
                .style('fill', cluster.color)
                .style('opacity', 0.2)
                .selectAll("rect")
                .data(d => d)
                .enter()
                .append("rect")
                .attr("y", d => yScale(d.data.x)+yScaleCluster(index))
                .attr("x", d => 0)
                .attr("height", yScaleCluster.bandwidth())
                .attr("width", d => xScale(0))
                
            
            
        })
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(yAxis)
            .call(g => g.select(".domain").remove())
            .selectAll(".tick")
            .each(function(d,i){
                let tick = d3.select(this),
                    text = tick.select('text'),
                    bBox = text.node().getBBox()
              
                tick.insert('rect', ':first-child')
                  .attr('x', bBox.x - 2)
                  .attr('y', bBox.y - 2)
                  .attr('height', bBox.height + 4)
                  .attr('width', bBox.width + 4)
                  .style('fill', 'white');      
              });
    
    }
  }
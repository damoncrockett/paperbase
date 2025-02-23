import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { interpolate } from 'd3-interpolate';

const UV = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 550;  
    const height = 400; 
    const margin = { top: 30, right: 20, bottom: 30, left: 0 };
    
    select(svgRef.current).selectAll("*").remove();

    const svg = select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = scaleLinear()
      .domain([1890, 2000])  
      .range([0, width - margin.left - margin.right]);

    const yScale = scaleLinear()
      .domain([0, 7])  
      .range([height - margin.top - margin.bottom, 0]);

    const colorScale = (auc) => {
      const t = (auc - 0.0130) / (6.9240 - 0.0130);
      return interpolate('#ffffff', '#0066cc')(t);
    };

    const lineGenerator = line()
      .x(d => xScale(parseInt(d.decade)))
      .y(d => yScale(d.auc))  
      .curve(curveMonotoneX);

    svg.append('path')
      .datum(data.points)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 1.5)
      .attr('d', lineGenerator);

    svg.selectAll('.point')
      .data(data.points)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(parseInt(d.decade)))
      .attr('cy', d => yScale(d.auc)) 
      .attr('r', 8)
      .attr('fill', d => colorScale(d.auc))  
      .attr('stroke', 'rgba(255, 255, 255, 0.6)')
      .attr('stroke-width', 1);

    const xAxis = axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => d.toString());

    const yAxis = axisLeft(yScale)
      .ticks(4)
      .tickSize(-width + margin.left + margin.right);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .attr('color', 'rgba(255, 255, 255, 1)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '10px')
      .call(g => g.select('.domain').remove());

    svg.append('g')
      .call(yAxis)
      .attr('color', 'rgba(255, 255, 255, 1)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '10px')
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', 'rgba(255, 255, 255, 0.1)'));

  }, [data]);

  return (
    <div className="svgContainer">
      <svg ref={svgRef} style={{ width: '100%', height: '100%', overflow: 'visible' }}></svg>
    </div>
  );
};

export default UV;

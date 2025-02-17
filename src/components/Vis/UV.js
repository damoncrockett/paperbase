import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { interpolate } from 'd3-interpolate';

const UV = ({ data }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = 400;
    const margin = { top: 30, right: 20, bottom: 30, left: 0 };
    
    // Clear previous SVG content
    select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = scaleLinear()
      .domain([1890, 2000])  // Updated domain for UV data
      .range([0, width - margin.left - margin.right]);

    const yScale = scaleLinear()
      .domain([0, 7])  // Updated domain for UV data
      .range([height - margin.top - margin.bottom, 0]);

    // Create color interpolator (white to blue)
    const colorScale = (auc) => {
      const t = (auc - 0.0130) / (6.9240 - 0.0130);
      return interpolate('#ffffff', '#0066cc')(t);
    };

    // Create line generator
    const lineGenerator = line()
      .x(d => xScale(parseInt(d.decade)))
      .y(d => yScale(d.auc))  // Using auc instead of warmth
      .curve(curveMonotoneX);

    // Draw line
    svg.append('path')
      .datum(data.points)
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
      .attr('stroke-width', 1.5)
      .attr('d', lineGenerator);

    // Add points
    svg.selectAll('.point')
      .data(data.points)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(parseInt(d.decade)))
      .attr('cy', d => yScale(d.auc))  // Using auc instead of warmth
      .attr('r', 8)
      .attr('fill', d => colorScale(d.auc))  // Using auc instead of warmth
      .attr('stroke', 'rgba(255, 255, 255, 0.6)')
      .attr('stroke-width', 1);

    // Add axes
    const xAxis = axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => d.toString());

    const yAxis = axisLeft(yScale)
      .ticks(4)
      .tickSize(-width + margin.left + margin.right);

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .attr('color', 'rgba(255, 255, 255, 1)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '10px')
      .call(g => g.select('.domain').remove());

    // Add y-axis
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
    <div ref={containerRef} className="svgContainer" >
      <svg ref={svgRef} style={{ overflow: 'visible' }}></svg>
    </div>
  );
};

export default UV;

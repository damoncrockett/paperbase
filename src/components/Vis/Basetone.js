import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';

const Basetone = ({ data }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = 400;
    const margin = { top: 30, right: 20, bottom: 30, left: 0 };
    
    // Base unit for scaling the entire visualization
    const baseUnit = 20;
    
    // All measurements defined relative to baseUnit
    const gridSize = baseUnit;
    const iconSize = baseUnit * 0.8;  // 80% of baseUnit
    const innerIconSize = baseUnit * 0.4;  // 40% of baseUnit
    const cornerRadius = baseUnit * 0.15;  // 15% of baseUnit
    
    // Clear previous SVG content
    select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales with offset for centering in grid squares
    const xScale = scaleLinear()
      .domain([0, 19])
      .range([gridSize/2, (20 * gridSize) - gridSize/2]); // Offset by half gridSize

    const yScale = scaleLinear()
      .domain([0, 19])
      .range([(20 * gridSize) - gridSize/2, gridSize/2]); // Offset by half gridSize

    // Process data to extract x and y from gridloc
    const processedData = data.map(d => ({
      ...d,
      x: parseInt(d.gridloc.split('_')[0]),
      y: parseInt(d.gridloc.split('_')[1])
    }));

    // Create icon groups
    const icons = svg.selectAll('.icon')
      .data(processedData)
      .enter()
      .append('g')
      .attr('class', 'icon')
      .attr('transform', d => `translate(${xScale(d.x)},${yScale(d.y)})`);

    // Add outer squares (background)
    icons.append('rect')
      .attr('x', -iconSize/2)
      .attr('y', -iconSize/2)
      .attr('width', iconSize)
      .attr('height', iconSize)
      .attr('rx', cornerRadius)
      .attr('ry', cornerRadius)
      .attr('fill', d => d.dminHex)
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke-width', 1);

    // Add inner squares
    icons.append('rect')
      .attr('x', -innerIconSize/2)
      .attr('y', -innerIconSize/2)
      .attr('width', innerIconSize)
      .attr('height', innerIconSize)
      .attr('rx', cornerRadius-1)
      .attr('ry', cornerRadius-1)
      .attr('fill', d => d.dmaxHex);

    // Add x-axis (adjusted position for grid alignment)
    const xAxis = axisBottom(xScale)
      .ticks(10)
      .tickFormat(d => d);

    svg.append('g')
      .attr('transform', `translate(0,${20 * gridSize})`)
      .call(xAxis)
      .attr('color', 'rgba(255, 255, 255, 0.6)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '10px')
      .call(g => g.select('.domain').remove());

    // Add y-axis (adjusted position for grid alignment)
    const yAxis = axisLeft(yScale)
      .ticks(10)
      .tickFormat(d => d);

    svg.append('g')
      .call(yAxis)
      .attr('color', 'rgba(255, 255, 255, 0.6)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '10px')
      .call(g => g.select('.domain').remove());

    // Add grid lines
    const gridLines = svg.append('g')
      .attr('class', 'grid-lines');

    // Vertical grid lines
    for (let i = 0; i <= 20; i++) {
      gridLines.append('line')
        .attr('x1', i * gridSize)
        .attr('y1', 0)
        .attr('x2', i * gridSize)
        .attr('y2', 20 * gridSize)
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke-width', 0.5);
    }

    // Horizontal grid lines
    for (let i = 0; i <= 20; i++) {
      gridLines.append('line')
        .attr('x1', 0)
        .attr('y1', i * gridSize)
        .attr('x2', 20 * gridSize)
        .attr('y2', i * gridSize)
        .attr('stroke', 'rgba(255, 255, 255, 0.1)')
        .attr('stroke-width', 0.5);
    }

  }, [data]);

  return (
    <div ref={containerRef} className="svgContainer" >
      <svg ref={svgRef} style={{ overflow: 'visible' }}></svg>
    </div>
  );
};

export default Basetone;

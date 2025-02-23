import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';

const Basetone = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 400;  // 20 grid squares * 20px baseUnit
    const height = 400; // Square visualization
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

    // Create SVG with viewBox
    const svg = select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
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

    // Replace x-axis code with label
    svg.append('text')
      .attr('x', (20 * gridSize) / 2)  // Center of the visualization
      .attr('y', 20 * gridSize + 25)   // Below the visualization
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.6)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '18px')
      .text('warmer image →');

    // Replace y-axis code with rotated label
    svg.append('text')
      .attr('transform', 'rotate(-90)')  // Rotate text vertically
      .attr('x', -(20 * gridSize) / 2)   // Center of the visualization (y-axis)
      .attr('y', -25)                    // Left of the visualization
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.6)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '18px')
      .text('warmer base →');

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
    <div className="svgContainer" >
      <svg ref={svgRef} style={{ width: '100%', height: '100%', overflow: 'visible' }}></svg>
    </div>
  );
};

export default Basetone;

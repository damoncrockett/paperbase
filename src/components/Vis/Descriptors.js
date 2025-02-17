import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleSequential } from 'd3-scale';
import { path } from 'd3-path';
import { forceSimulation, forceX, forceY, forceCollide } from 'd3-force';
import { categoricalColors } from '../../utils/color';

const ProportionalBar = ({ data, title, barIndex = 0 }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = 80;
    const margin = { top: 30, right: 60, bottom: 30, left: 0 };
    const barHeight = 40;
    const cornerRadius = 8;

    // Clear previous SVG content
    select(svgRef.current).selectAll("*").remove();

    // Create SVG with fixed height
    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scale
    const x = scaleLinear()
      .domain([0, 1])
      .range([0, width - margin.left - margin.right]);

    // Calculate cumulative positions
    let cumulative = 0;
    const segments = data.map(d => {
      const start = cumulative;
      cumulative += d.value;
      return {
        ...d,
        start,
        end: cumulative,
        middle: start + (d.value / 2)
      };
    });

    const numColorsNeeded = segments.length;
    const startIdx = 5;
    const colors = categoricalColors.slice(startIdx, startIdx + numColorsNeeded);

    // Add title if provided
    if (title) {
      svg.append('text')
        .attr('x', 0)
        .attr('y', -20)
        .attr('fill', 'rgba(255, 255, 255, 0.9)')
        .attr('font-size', '14px')
        .attr('font-family', 'DM Mono')
        .text(title);
    }

    // Draw bars with rounded corners
    segments.forEach((d, i) => {
      const isFirst = i === 0;
      const isLast = i === segments.length - 1;
      const segment = svg.append('path');
      
      const x1 = x(d.start);
      const x2 = x(d.end);
      
      // Create rounded rectangle path
      const pathGen = path();
      if (isFirst) {
        // Round left corners only
        pathGen.moveTo(x1 + cornerRadius, 0);
        pathGen.lineTo(x2, 0);
        pathGen.lineTo(x2, barHeight);
        pathGen.lineTo(x1 + cornerRadius, barHeight);
        pathGen.arcTo(x1, barHeight, x1, barHeight - cornerRadius, cornerRadius);
        pathGen.lineTo(x1, cornerRadius);
        pathGen.arcTo(x1, 0, x1 + cornerRadius, 0, cornerRadius);
      } else if (isLast) {
        // Round right corners only
        pathGen.moveTo(x1, 0);
        pathGen.lineTo(x2 - cornerRadius, 0);
        pathGen.arcTo(x2, 0, x2, cornerRadius, cornerRadius);
        pathGen.lineTo(x2, barHeight - cornerRadius);
        pathGen.arcTo(x2, barHeight, x2 - cornerRadius, barHeight, cornerRadius);
        pathGen.lineTo(x1, barHeight);
        pathGen.closePath();
      } else {
        // No rounded corners for middle segments
        pathGen.moveTo(x1, 0);
        pathGen.lineTo(x2, 0);
        pathGen.lineTo(x2, barHeight);
        pathGen.lineTo(x1, barHeight);
        pathGen.closePath();
      }
      
      segment
        .attr('d', pathGen.toString())
        .attr('fill', colors[i % colors.length]);  // Cycle through colors if more segments than colors
    });

    // Function to check if label fits inside its segment
    const labelFitsInside = (d) => {
      const labelWidth = d.label.length * 6;
      return x(d.value) > labelWidth + 10;
    };

    // Prepare data for external labels that need force layout
    const externalLabels = segments.filter(d => !labelFitsInside(d) && d.label);
    const labelNodes = externalLabels.map(d => ({
      x: x(d.middle),
      y: barHeight + 25,
      segment: d,
      initialX: x(d.middle)
    }));

    // Create force simulation for external labels with adjusted parameters
    const simulation = forceSimulation(labelNodes)
      .force('x', forceX(d => d.initialX).strength(0.1))
      .force('y', forceY(barHeight + 25).strength(0.1))
      .force('collision', forceCollide().radius(25))
      .stop();

    // Run the simulation longer
    for (let i = 0; i < 200; i++) simulation.tick();

    // Add labels with dynamic positioning
    segments.forEach(d => {
      if (labelFitsInside(d)) {
        // Inside label
        svg.append('text')
          .attr('x', x(d.middle))
          .attr('y', barHeight / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('fill', 'black')
          .attr('font-size', '12px')
          .attr('font-family', 'DM Sans')
          .attr('font-weight', 400)
          .text(d.label || '-');
      }
    });

    // Add external labels using simulation results
    labelNodes.forEach(node => {
      const g = svg.append('g').attr('class', 'external-label');
      
      // Curved connecting line
      const pathGen = path();
      pathGen.moveTo(node.initialX, barHeight);
      pathGen.quadraticCurveTo(
        node.initialX,
        (barHeight + node.y) / 2,
        node.x,
        node.y - 10
      );
      
      g.append('path')
        .attr('d', pathGen.toString())
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.6)')
        .attr('stroke-width', 0.5);

      g.append('text')
        .attr('x', node.x)
        .attr('y', node.y)
        .attr('text-anchor', 'middle')
        .attr('fill', 'rgba(255, 255, 255, 0.9)')
        .attr('font-size', '10px')
        .attr('font-family', 'DM Sans')
        .attr('font-weight', 400)
        .text(node.segment.label);
    });

    // Percentage labels - updated to round to nearest integer
    svg.selectAll('.percentage')
      .data(segments)
      .enter()
      .append('text')
      .attr('x', d => x(d.middle))
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('font-size', '10px')
      .attr('font-family', 'Archivo')
      .text(d => `${Math.round(d.value * 100)}`);

  }, [data, title, barIndex]);

  return (
    <div ref={containerRef} className="containerItem" style={{ height: '100px' }}>
      <svg ref={svgRef} style={{ overflow: 'visible' }}></svg>
    </div>
  );
};

const Descriptors = ({ categories }) => {
  return (
    <div className="svgContainer">
      {categories.map((category, index) => (
        <ProportionalBar
          key={category.title}
          data={category.data}
          title={category.title}
          barIndex={index}
        />
      ))}
    </div>
  );
};

export default Descriptors;
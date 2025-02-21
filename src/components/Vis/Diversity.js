import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import { line, curveBasis, area } from 'd3-shape';
import { axisBottom, axisLeft } from 'd3-axis';
import { bin, max } from 'd3-array';
import diversityData from '../../assets/data/diversityData.json';
import { categoricalColors } from '../../utils/color';

const Diversity = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 550;  // Fixed width
    const height = 400; // Fixed height to match other visualizations
    const margin = { top: 30, right: 20, bottom: 40, left: 0 };

    const colors = ["#f59ae7", "#698e4e"];

    // Colors for the two distributions
    const histogramColors = {
      single: {
        stroke: '#f59ae7',
        fill: 'rgba(245, 154, 231, 0.3)'
      },
      double: {
        stroke: '#698e4e',
        fill: 'rgba(105, 142, 78, 0.3)'
      }
    };

    // Separate data by thickness type
    const singleWeight = diversityData.filter(d => d.thicknessWord === "Single Weight");
    const doubleWeight = diversityData.filter(d => d.thicknessWord === "Double Weight");

    // Clear previous SVG content
    select(svgRef.current).selectAll("*").remove();

    // Create SVG with viewBox
    const svg = select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = scaleLinear()
      .domain([0, max(diversityData, d => d.thickness)])
      .range([0, width - margin.left - margin.right]);

    // Create bins for both datasets
    const binner = bin()
      .domain(xScale.domain())
      .thresholds(40);

    const singleBins = binner(singleWeight.map(d => d.thickness));
    const doubleBins = binner(doubleWeight.map(d => d.thickness));

    // Convert bins to density
    const maxCount = Math.max(
      max(singleBins, d => d.length),
      max(doubleBins, d => d.length)
    );

    const yScale = scaleLinear()
      .domain([0, maxCount])
      .range([height - margin.top - margin.bottom, 0]);

    // Create area generator
    const areaGenerator = area()
      .curve(curveBasis)
      .x(d => xScale(d.x0 + (d.x1 - d.x0) / 2))
      .y0(height - margin.top - margin.bottom)
      .y1(d => yScale(d.length));

    // Create line generator
    const lineGenerator = line()
      .curve(curveBasis)
      .x(d => xScale(d.x0 + (d.x1 - d.x0) / 2))
      .y(d => yScale(d.length));

    // Add gridlines and y-axis labels
    const yAxis = axisLeft(yScale)
      .ticks(5)
      .tickSize(-width + margin.left + margin.right);

    svg.append('g')
      .attr('class', 'grid')
      .call(yAxis)
      .attr('color', 'rgba(255, 255, 255, 0.1)')
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text')
        .attr('x', 4)
        .attr('dy', -4)
        .attr('color', 'rgba(255, 255, 255, 0.9)')
        .attr('font-family', 'DM Sans')
        .attr('font-size', '10px')
        .attr('text-anchor', 'start'));

    // Draw areas
    svg.append('path')
      .datum(singleBins)
      .attr('fill', histogramColors.single.fill)
      .attr('d', areaGenerator);

    svg.append('path')
      .datum(doubleBins)
      .attr('fill', histogramColors.double.fill)
      .attr('d', areaGenerator);

    // Draw lines
    svg.append('path')
      .datum(singleBins)
      .attr('fill', 'none')
      .attr('stroke', histogramColors.single.stroke)
      .attr('stroke-width', 2)
      .attr('d', lineGenerator);

    svg.append('path')
      .datum(doubleBins)
      .attr('fill', 'none')
      .attr('stroke', histogramColors.double.stroke)
      .attr('stroke-width', 2)
      .attr('d', lineGenerator);

    // Add x-axis
    const xAxis = axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => d.toFixed(2));

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .attr('color', 'rgba(255, 255, 255, 0.9)')
      .attr('font-family', 'DM Sans')
      .attr('font-size', '10px')
      .call(g => g.select('.domain').remove());

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right - 150}, 0)`);

    // Single Weight legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', histogramColors.single.stroke)
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 30)
      .attr('y', 0)
      .attr('dy', '0.32em')
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '12px')
      .text('Single Weight');

    // Double Weight legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 20)
      .attr('y2', 20)
      .attr('stroke', histogramColors.double.stroke)
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 30)
      .attr('y', 20)
      .attr('dy', '0.32em')
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('font-family', 'Archivo')
      .attr('font-size', '12px')
      .text('Double Weight');

  }, []);

  return (
    <div className="svgContainer">
      <svg ref={svgRef} style={{ width: '100%', height: '100%', overflow: 'visible' }}></svg>
    </div>
  );
};

export default Diversity;

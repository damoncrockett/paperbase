import React, { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { scaleLinear, scaleBand } from 'd3-scale';
import { axisBottom } from 'd3-axis';
import { path } from 'd3-path';

const Surfs = () => {
  const svgRef = useRef();

  const data = [
    { name: "Kodak Velox F", value: 179 },
    { name: "Kodak Kodabromide F", value: 137 },
    { name: "Kodak Velox Velvet (Velox)", value: 77 },
    { name: "Kodak Kodabromide E", value: 71 },
    { name: "Agfa Gevaert Brovira 1", value: 61 },
    { name: "Kodak Polycontrast F", value: 56 },
    { name: "Kodak Ektalure X", value: 52 },
    { name: "Kodak Medalist J", value: 51 },
  ];

  useEffect(() => {
    const width = 550;  
    const height = 400; 
    const margin = { top: 30, right: 20, bottom: 30, left: 0 };
    const cornerRadius = 8;
    
    select(svgRef.current).selectAll("*").remove();

    const svg = select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = scaleLinear()
      .domain([0, Math.max(...data.map(d => d.value))])
      .range([0, width - margin.left - margin.right]);

    const yScale = scaleBand()
      .domain(data.map(d => d.name))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.3);

    const fontSize = Math.min(12, yScale.bandwidth() * 0.7);

    const bars = svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bar');

    bars.each(function(d) {
      const bar = select(this);
      const barWidth = xScale(d.value);
      const barHeight = yScale.bandwidth();
      const y = yScale(d.name);
      
      const pathGen = path();
      pathGen.moveTo(cornerRadius, y);
      pathGen.lineTo(barWidth - cornerRadius, y);
      pathGen.quadraticCurveTo(barWidth, y, barWidth, y + cornerRadius);
      pathGen.lineTo(barWidth, y + barHeight - cornerRadius);
      pathGen.quadraticCurveTo(barWidth, y + barHeight, barWidth - cornerRadius, y + barHeight);
      pathGen.lineTo(cornerRadius, y + barHeight);
      pathGen.quadraticCurveTo(0, y + barHeight, 0, y + barHeight - cornerRadius);
      pathGen.lineTo(0, y + cornerRadius);
      pathGen.quadraticCurveTo(0, y, cornerRadius, y);
      pathGen.closePath();

      bar.append('path')
        .attr('d', pathGen.toString())
        .attr('fill', d => d.name.includes('Kodak') ? "#dfbf4e" : "#c96a40");
    });

    bars.append('text')
      .attr('x', 10)
      .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', d => d.name.includes('Kodak') ? "black" : "white")
      .attr('font-family', 'Archivo')
      .attr('font-size', `${fontSize}px`)
      .attr('font-weight', 400)
      .text(d => d.name);

    bars.append('text')
      .attr('x', d => xScale(d.value) + 5)
      .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', "white")
      .attr('font-family', 'DM Mono')
      .attr('font-size', `${fontSize}px`)
      .text(d => d.value);

  }, []);

  return (
    <div className="svgContainer">
      <svg ref={svgRef} style={{ width: '100%', height: '100%', overflow: 'visible' }}></svg>
    </div>
  );
};

export default Surfs;

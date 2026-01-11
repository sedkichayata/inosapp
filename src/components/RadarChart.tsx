import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

interface RadarChartProps {
  data: { label: string; value: number }[];
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export function RadarChart({
  data,
  size = 200,
  color = '#C9A86C',
  backgroundColor = '#2A2A2E',
}: RadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) * 0.75;
  const angleStep = (2 * Math.PI) / data.length;
  const levels = 5;

  // Calculate points for data polygon
  const dataPoints = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const value = Math.min(100, Math.max(0, item.value)) / 100;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  // Generate grid lines
  const gridLines = [];
  for (let level = 1; level <= levels; level++) {
    const levelRadius = (radius * level) / levels;
    const points = data.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = center + levelRadius * Math.cos(angle);
      const y = center + levelRadius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    gridLines.push(
      <Polygon
        key={`grid-${level}`}
        points={points}
        fill="none"
        stroke={backgroundColor}
        strokeWidth={1}
        opacity={0.5}
      />
    );
  }

  // Generate axis lines
  const axisLines = data.map((_, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return (
      <Line
        key={`axis-${index}`}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke={backgroundColor}
        strokeWidth={1}
        opacity={0.5}
      />
    );
  });

  // Generate labels
  const labels = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const labelRadius = radius + 20;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);

    // Adjust text anchor based on position
    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    if (Math.cos(angle) > 0.1) textAnchor = 'start';
    else if (Math.cos(angle) < -0.1) textAnchor = 'end';

    return (
      <SvgText
        key={`label-${index}`}
        x={x}
        y={y + 4}
        fontSize={9}
        fill="#888"
        textAnchor={textAnchor}
      >
        {item.label}
      </SvgText>
    );
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {/* Grid */}
        {gridLines}
        {/* Axis lines */}
        {axisLines}
        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill={color}
          fillOpacity={0.3}
          stroke={color}
          strokeWidth={2}
        />
        {/* Data points */}
        {data.map((item, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const value = Math.min(100, Math.max(0, item.value)) / 100;
          const x = center + radius * value * Math.cos(angle);
          const y = center + radius * value * Math.sin(angle);
          return (
            <Circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r={4}
              fill={color}
            />
          );
        })}
        {/* Labels */}
        {labels}
      </Svg>
    </View>
  );
}

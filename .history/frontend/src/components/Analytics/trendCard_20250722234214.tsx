import React from 'react';

interface TrendChartProps {
  title: string;
  data: Array<{
    period: string;
    [key: string]: string | number;
  }>;
  metrics: Array<{
    key: string;
    label: string;
    color: string;
  }>;
}

const TrendChart: React.FC<TrendChartProps> = ({ title, data, metrics }) => {
  // Simple line chart implementation
  // For production, consider using recharts, chart.js, or similar
  
  const maxValue = Math.max(
    ...data.flatMap(item => 
      metrics.map(metric => Number(item[metric.key]) || 0)
    )
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {metrics.map(metric => (
          <div key={metric.key} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: metric.color }}
            />
            <span className="text-sm text-gray-600">{metric.label}</span>
          </div>
        ))}
      </div>
      
      {/* Chart Area */}
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 800 200">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="50"
              y1={200 - (y * 2)}
              x2="750"
              y2={200 - (y * 2)}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Data lines */}
          {metrics.map(metric => {
            const points = data.map((item, index) => {
              const x = 50 + (index * (700 / (data.length - 1)));
              const value = Number(item[metric.key]) || 0;
              const y = 200 - ((value / maxValue) * 180);
              return `${x},${y}`;
            }).join(' ');
            
            return (
              <polyline
                key={metric.key}
                points={points}
                fill="none"
                stroke={metric.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          
          {/* Data points */}
          {metrics.map(metric =>
            data.map((item, index) => {
              const x = 50 + (index * (700 / (data.length - 1)));
              const value = Number(item[metric.key]) || 0;
              const y = 200 - ((value / maxValue) * 180);
              
              return (
                <circle
                  key={`${metric.key}-${index}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={metric.color}
                />
              );
            })
          )}
        </svg>
        
        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-12">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-gray-500">
              {item.period}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendChart;
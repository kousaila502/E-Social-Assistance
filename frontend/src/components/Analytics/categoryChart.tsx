import React from 'react';

interface CategoryData {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

interface CategoryChartProps {
  title: string;
  data: CategoryData[];
  type?: 'pie' | 'donut' | 'bar';
  showPercentages?: boolean;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ 
  title, 
  data, 
  type = 'donut', 
  showPercentages = true 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate angles for pie/donut chart
  let currentAngle = 0;
  const segments = data.map(item => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
      angle
    };
  });

  const createPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number, innerRadius = 0) => {
    const start = {
      x: centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180),
      y: centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180)
    };
    
    const end = {
      x: centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180),
      y: centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180)
    };

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    if (innerRadius === 0) {
      // Pie chart
      return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
    } else {
      // Donut chart
      const innerStart = {
        x: centerX + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180),
        y: centerY + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180)
      };
      
      const innerEnd = {
        x: centerX + innerRadius * Math.cos((endAngle - 90) * Math.PI / 180),
        y: centerY + innerRadius * Math.sin((endAngle - 90) * Math.PI / 180)
      };

      return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y} Z`;
    }
  };

  if (type === 'bar') {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 truncate">{item.label}</div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-4 relative">
                  <div
                    className="h-4 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: item.color,
                      width: `${(item.value / maxValue) * 100}%`
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-sm text-gray-900 text-right">
                {showPercentages ? `${((item.value / total) * 100).toFixed(1)}%` : item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="240" height="240" className="transform -rotate-90">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createPath(120, 120, 100, segment.startAngle, segment.endAngle, type === 'donut' ? 60 : 0)}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
          </svg>
          
          {type === 'donut' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="ml-8 space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: segment.color }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{segment.label}</div>
                <div className="text-xs text-gray-500">
                  {segment.value} ({segment.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryChart;
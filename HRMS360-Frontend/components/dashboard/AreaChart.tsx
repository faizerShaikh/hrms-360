import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface areaChartInterface {
  data: any;
  color: string;
  height?: number;
  tick?: boolean;
  strokWidth?: number;
  xAxisDataKey?: string | undefined;
  dataKey?: string | undefined;
}

export const DashboardAreaChart = ({
  data,
  color,
  height,
  tick = true,
  strokWidth = 4,
  xAxisDataKey,
  dataKey,
}: areaChartInterface) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart height={height} data={data}>
        <defs>
          <linearGradient
            id={color.replace("#", "")}
            x1="0"
            y1="1"
            x2="0"
            y2="0"
          >
            {Array.from(Array(20), (_, index) => (index + 1) * 5).map((e) => (
              <stop
                offset={`${e}%`}
                stopColor={color}
                stopOpacity={e / 100}
                key={e}
              />
            ))}
          </linearGradient>
        </defs>
        {tick && (
          <XAxis
            dataKey={`${xAxisDataKey}`}
            tick={tick}
            tickLine={false}
            axisLine={false}
            tickMargin={16}
            fontSize={11}
          />
        )}
        {tick && (
          <YAxis
            tick={tick}
            tickLine={false}
            axisLine={false}
            tickMargin={16}
            fontSize={11}
          />
        )}
        <Tooltip />

        <Area
          type="linear"
          dataKey={`${dataKey}`}
          strokeWidth={strokWidth}
          stroke={color}
          fill={`url(#${color.replace("#", "")})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

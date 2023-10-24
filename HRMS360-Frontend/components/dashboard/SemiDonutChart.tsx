import { colors } from "constants/theme";
import { useCallback, useState } from "react";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
  Sector,
} from "recharts";

const renderColorfulLegendText = (value: string, _: any) => {
  return (
    <span
      style={{
        color: "#889696",
        fontSize: "11px",
        textTransform: "capitalize",
      }}
    >
      {value}
    </span>
  );
};

interface pieChartInterface {
  data: any;
  cellColors: string[];
  isSemiCircle: boolean;
  innerRadius: number;
  outerRadius: number;
  startAngle?: number | undefined;
  endAngle?: number | undefined;
  positionFromYaxis?: number | undefined;
  dataKey?: string;
  width?: number | undefined;
  positionFromXaxis?: number | undefined;
  url?: string;
  selected?: string;
}

export const SemiDonutChart = ({
  isSemiCircle,
  innerRadius,
  outerRadius,
  startAngle = undefined,
  endAngle = undefined,
  positionFromYaxis = undefined,
  positionFromXaxis = undefined,
  dataKey,
  width,
  data,
  cellColors,
}: pieChartInterface) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const onPieEnter = useCallback(
    (_: any, index: number) => {
      if (isSemiCircle) {
        setActiveIndex(index);
      }
    },
    [setActiveIndex, isSemiCircle]
  );

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;

    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      percent,
      value,
    } = props;

    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        {isSemiCircle ? (
          <>
            <text
              x={cx}
              y={cy - 30}
              dy={8}
              textAnchor='middle'
              fill={colors.text.dark}
              fontSize={45}
              fontWeight={700}
            >
              {`${(percent * 100).toFixed(0)}%`}
            </text>

            <Sector
              cx={cx}
              cy={cy}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={startAngle}
              endAngle={endAngle}
              fill={fill}
            />
          </>
        ) : (
          <>
            <Sector
              cx={cx}
              cy={cy}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              startAngle={startAngle}
              endAngle={endAngle}
              fill={fill}
            />
            <path
              d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
              stroke={fill}
              fill='none'
            />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke='none' />
            <text
              x={ex + (cos >= 0 ? 1 : -1) * 12}
              y={ey}
              textAnchor={textAnchor}
              fill='#797979'
              fontSize={10}
            >{`${value}`}</text>
            <text
              x={ex + (cos >= 0 ? 1 : -1) * 12}
              y={ey}
              dy={18}
              textAnchor={textAnchor}
              fill='#797979'
              fontSize={10}
            >
              {`(${(percent * 100).toFixed(2)}%)`}
            </text>
          </>
        )}
      </g>
    );
  };

  let statusColors: any = {
    "Completed": colors.status.completed.text,
    "In Progress": colors.status.in_progress.text,
    "Pending Approval": colors.secondary.dark,
    "Ongoing": colors.status.ongoing.text,
    "Terminated": colors.status.terminated.text,
    "Initiated": colors.status.initiated.text,
    "Closed": colors.status.closed.text,
    "ongoing survey": colors.status.ongoing.text,
    "completed survey": colors.status.completed.text,
    "On Hold": colors.status.on_hold.text,
  };

  return (
    <>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart width={width}>
          <Pie
            dataKey={`${dataKey}`}
            startAngle={startAngle}
            endAngle={endAngle}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            data={
              data?.map((item: any) => ({
                ...item,
                value: +item.value,
              })) || []
            }
            cy={positionFromYaxis}
            cx={positionFromXaxis}
            paddingAngle={2}
            activeIndex={
              isSemiCircle
                ? activeIndex
                : data?.map((_: any, index: number) => index)
            }
            onMouseEnter={onPieEnter}
            activeShape={renderActiveShape}
          >
            {data?.length &&
              data?.map((item: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    isSemiCircle
                      ? statusColors[item.name]
                      : cellColors[index % cellColors.length]
                  }
                />
              ))}
          </Pie>
          <Tooltip
            itemStyle={{
              color: colors.text.dark,
              fontSize: "14px",
              textTransform: "capitalize",
              fontFamily: "century-gotic",
              fontWeight: 600,
            }}
          />
          {isSemiCircle && (
            <Legend
              wrapperStyle={{ bottom: 30 }}
              formatter={renderColorfulLegendText}
              iconType={"square"}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </>
  );
};

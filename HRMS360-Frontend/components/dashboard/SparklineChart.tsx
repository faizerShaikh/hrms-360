import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
export const SparklineChart = ({
  data,
  categories,
  colors,
}: {
  data: number[];
  categories: string[];
  colors: string[];
}) => {
  return (
    <ReactApexChart
      series={[
        {
          data,
          color: colors[0],
        },
      ]}
      type='area'
      height={50}
      width={165}
      options={{
        chart: {
          type: "area",

          toolbar: { show: false },
          sparkline: {
            enabled: true,
          },
          zoom: {
            autoScaleYaxis: false,
          },
        },
        grid: {
          show: false,

          yaxis: {
            lines: {
              show: false,
            },
          },
        },
        stroke: {
          curve: "smooth",
          colors: colors,
          width: 2,
        },
        fill: {
          opacity: 0.3,
          colors: colors,
        },
        xaxis: {
          categories,
          crosshairs: {
            width: 0,
          },
        },
        yaxis: {
          min: 0,
          show: false,
        },
      }}
    />
  );
};

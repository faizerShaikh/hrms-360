import * as React from "react";
import { Tabs as MuiTabs, Tab, Box } from "@mui/material";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      className='h-full overflow-y-auto'
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    "id": `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

interface TabsProps {
  tabs: {
    id: number;
    buttonLabel: string;
    component: React.ReactNode;
    componentProps?: unknown;
  }[];
  query?: string;
}
export function Tabs({ tabs, query }: TabsProps) {
  const [value, setValue] = React.useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box className='w-full h-full overflow-y-auto'>
      <Box
        sx={{ borderBottom: 1, borderColor: "divider" }}
        className='h-full overflow-y-auto'
      >
        <MuiTabs
          value={value}
          onChange={handleChange}
          variant={"standard"}
          aria-label='basic tabs example'
          className='flex justify-between p-2 bg-red'
        >
          {tabs.map((item) => (
            <Tab
              className={`${
                item.id !== value ? "text-dark" : "text-primary"
              } capitalize xl:text-sm 2xl:text-base`}
              key={item.id}
              label={item.buttonLabel}
              {...a11yProps(item.id)}
            />
          ))}
        </MuiTabs>
      </Box>
      {tabs.map((item) => (
        <TabPanel value={value} index={item.id} key={item.id}>
          {typeof item.component === "string"
            ? item.component
            : React.cloneElement(
                item.component as React.ReactElement,
                item?.componentProps
                  ? { ...item?.componentProps, query }
                  : { query }
              )}
        </TabPanel>
      ))}
    </Box>
  );
}

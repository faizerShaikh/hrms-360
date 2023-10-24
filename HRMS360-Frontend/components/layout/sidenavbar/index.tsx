import * as React from "react";

import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import { colors, drawerWidth } from "constants/theme";
import AppBar from "./AppBar";

import DrawerBody from "./DrawerBody";
import { setApiHeaders } from "utils/setApiHeaders";

interface Props {
  window?: () => Window;
  children: React.ReactNode;
}

export function SideNav(props: Props) {
  const { children } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const width = React.useRef(drawerWidth);
  const container = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    setApiHeaders();
    container.current = document.getElementById("__next");
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar handleDrawerToggle={handleDrawerToggle} />
      <Box
        component='nav'
        sx={{
          width: { sm: width.current, lg: 280, xl: 300 },
          flexShrink: { sm: 0 },
        }}
        aria-label='mailbox folders'
      >
        <Drawer
          container={container.current}
          variant='temporary'
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            "display": { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: width.current,
            },
          }}
        >
          <DrawerBody />
        </Drawer>
        <Drawer
          variant='permanent'
          sx={{
            "display": { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: {
                sm: drawerWidth,
                lg: `280px`,
                xl: `300px`,
              },
            },
          }}
          open
        >
          <DrawerBody />
        </Drawer>
      </Box>
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          p: 3,
          width: {
            sm: `calc(100% - ${drawerWidth}px)`,
            lg: `calc(100% - 280px)`,
            xl: `calc(100% - 300px)`,
          },
        }}
      >
        <Toolbar />
        <Box
          className='px-5 pt-2 pb-6'
          sx={{
            border: `1px solid ${colors.secondary.dark}60`,
            height: "calc(100vh - 110px)",
            overflow: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

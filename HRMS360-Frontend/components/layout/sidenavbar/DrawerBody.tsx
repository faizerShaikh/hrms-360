import {
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { colors } from "constants/theme";

import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import {
  Catalog,
  ChatLaunch,
  ChevronDown,
  ChevronUp,
  CollapseCategories,
  DashboardReference,
  Events,
  Settings,
  ShareKnowledge,
  TaskComplete,
} from "@carbon/icons-react";
import { Image } from "../Image";

import { useLayoutContext } from "stores/layout";
import { logoPath } from "constants/layout";
import { TenentInterface } from "interfaces/tenant";
import { getParsedCookie } from "utils/getParsedCookie";

const activeMenuStyles = {
  background: colors.primary.light,
  borderLeft: `4px solid ${colors.primary.dark}`,
};

const activeSubMenuStyles = {
  background: colors.secondary.light,
  boxShadow: `-5px 0px 0px 0px ${colors.secondary.dark}`,
};

let Icons: { [key: string]: () => React.ReactNode } = {
  DashboardReference: () => (
    <DashboardReference fill={colors.primary.dark} size={24} />
  ),
  CollapseCategories: () => (
    <CollapseCategories fill={colors.primary.dark} size={24} />
  ),
  Catalog: () => <Catalog fill={colors.primary.dark} size={24} />,
  Events: () => <Events fill={colors.primary.dark} size={24} />,
  ChatLaunch: () => <ChatLaunch fill={colors.primary.dark} size={24} />,
  Settings: () => <Settings fill={colors.primary.dark} size={24} />,
  TaskComplete: () => <TaskComplete fill={colors.primary.dark} size={24} />,
  ShareKnowledge: () => <ShareKnowledge fill={colors.primary.dark} size={24} />,
};

const DrawerBody = () => {
  const { pathname } = useRouter();
  const [menus, setMenus] = useState([]);

  let tenant: TenentInterface | null = getParsedCookie("tenant");

  const [selectedPath, setSelectedMenu] = useState("");

  const { menu } = useLayoutContext();

  useEffect(() => {
    setMenus(menu);
  }, [menu]);

  useEffect(() => {
    setSelectedMenu(pathname);
  }, [pathname]);

  return (
    <div>
      <Box height='66px' className='flex items-center justify-center'>
        <Image
          alt='company_logo'
          objectFit='contain'
          objectPosition='center'
          defaultImage={logoPath}
          src={
            tenant?.tenant_pic
              ? `${process.env.NEXT_PUBLIC_API_URL?.split("/api/v1")[0]}${
                  tenant?.tenant_pic
                }`
              : logoPath
          }
          height='50px'
          width='150px'
        />
      </Box>
      <Divider color={colors.secondary.dark} className='w-10/12 mx-auto' />
      <List className='pt-4'>
        {menus?.length > 0 &&
          menus?.map((item: any, index: number) =>
            item?.children ? (
              <Box key={item.title + index}>
                <ListItem
                  disablePadding
                  style={
                    selectedPath.startsWith(item.path) ? activeMenuStyles : {}
                  }
                  onClick={() =>
                    setSelectedMenu((prev) =>
                      prev !== item.path ? item.path : ""
                    )
                  }
                >
                  <ListItemButton className='pl-8'>
                    <ListItemIcon sx={{ minWidth: "40px" }} className='pr-3'>
                      {item.icon &&
                        (Icons[item.icon] ? Icons[item.icon]() : "")}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        className:
                          "font-aller font-medium xl:text-sm 2xl:text-base",
                        color: "#4D4D4F",
                      }}
                    />
                    {selectedPath.startsWith(item.path) ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    )}
                  </ListItemButton>
                </ListItem>
                <Collapse
                  in={selectedPath.startsWith(item.path)}
                  timeout='auto'
                  unmountOnExit
                  component='div'
                >
                  <List
                    component='div'
                    className={`border-start border-3 ps-3 py-0 ml-8`}
                  >
                    {item.children.map((subItem: any) => (
                      <Link key={subItem.title} href={subItem.path} passHref>
                        <ListItem
                          disablePadding
                          style={
                            subItem.path === pathname ? activeSubMenuStyles : {}
                          }
                        >
                          <ListItemButton className='pl-8'>
                            <ListItemText
                              primary={subItem.title}
                              primaryTypographyProps={{
                                className:
                                  "font-aller font-medium xl:text-sm 2xl:text-base",
                                color: "#4D4D4F",
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      </Link>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ) : (
              <Link href={item.path || "#"} passHref key={item.title + index}>
                <ListItem
                  onClick={() => setSelectedMenu(item.path)}
                  disablePadding
                  style={
                    item.path === "/" && item.path === selectedPath
                      ? activeMenuStyles
                      : item.path !== "/" && selectedPath.startsWith(item.path)
                      ? activeMenuStyles
                      : {}
                  }
                >
                  <ListItemButton className='pl-8'>
                    <ListItemIcon sx={{ minWidth: "40px" }} className='pr-3'>
                      {item.icon &&
                        (Icons[item.icon] ? Icons[item.icon]() : "")}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        className:
                          "font-aller font-medium    xl:text-sm 2xl:text-base",
                        color: "#4D4D4F",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Link>
            )
          )}
      </List>
    </div>
  );
};

export default DrawerBody;

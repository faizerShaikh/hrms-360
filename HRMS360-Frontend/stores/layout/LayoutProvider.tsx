import { useRouter } from "next/router";
import React, { createContext, useContext, useEffect, useReducer } from "react";
import { getParsedCookie } from "utils/getParsedCookie";
import { SET_NAVBAR_TITLE, SET_SIDEBAR_MENU } from "./layoutContants";
import { initialState, layoutReducer } from "./layoutReducer";

export const LayoutContext = createContext<any>(initialState);

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(layoutReducer, initialState);

  const { pathname } = useRouter();

  useEffect(() => {
    dispatch({ type: SET_NAVBAR_TITLE, payload: "" });
  }, [pathname]);

  useEffect(() => {
    const menus = getParsedCookie("menu");
    dispatch({ type: SET_SIDEBAR_MENU, payload: menus });
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        ...state,
        dispatch,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayoutContext = () => {
  return useContext(LayoutContext);
};

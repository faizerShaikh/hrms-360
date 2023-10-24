import { cookieOptions } from "constants/config";
import { menuType } from "constants/layout";
import { setCookie } from "cookies-next";
import { ActionInterface } from "interfaces/base";
import { getParsedCookie } from "utils/getParsedCookie";
import { SET_NAVBAR_TITLE, SET_SIDEBAR_MENU } from "./layoutContants";

export interface initialStateInterface {
  navbarTitle: string;
  menu: menuType[] | null;
}

export const initialState: initialStateInterface = {
  navbarTitle: "",
  menu: getParsedCookie("menu") ? getParsedCookie("menu") : [],
};

export const layoutReducer = (
  state: initialStateInterface,
  action: ActionInterface
) => {
  switch (action.type) {
    case SET_NAVBAR_TITLE:
      return { ...state, navbarTitle: action.payload };
    case SET_SIDEBAR_MENU:
      setCookie("menu", JSON.stringify(action.payload), cookieOptions);
      return { ...state, menu: action.payload };
    default:
      return state;
  }
};

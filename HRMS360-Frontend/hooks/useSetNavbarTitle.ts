import { useEffect } from "react";
import { SET_NAVBAR_TITLE, useLayoutContext } from "stores/layout";

export const useSetNavbarTitle = (title: string) => {
  const { dispatch } = useLayoutContext();

  useEffect(() => {
    dispatch({ type: SET_NAVBAR_TITLE, payload: title || "" });
    //eslint-disable-next-line
  }, [title]);

  return true;
};

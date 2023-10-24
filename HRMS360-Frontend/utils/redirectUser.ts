import { useRouter } from "next/router";

export const RedirectUsers = (paths: string[], pathname: string) => {
  if (!paths.includes(pathname)) {
    const { push } = useRouter();
    return push(paths[0]);
  }
};

// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { menuType } from "constants/layout";

let pathsToExclude = [
  "/components",
  "/favicon.ico",
  "/_next(.*)",
  "/media(.*)",
  "/fonts(.*)",
  "/assets/image-placeholder.png",
  "/survey/assessment(.*)",
  "/survey/report(.*)",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token");

  if (
    pathsToExclude.some((item) =>
      Boolean(request.nextUrl.pathname.match(new RegExp(item)))
    )
  ) {
    return NextResponse.next();
  }

  if (
    ["/sign-in(.*)", "/apsis-admin/sign-in(.*)", "/forgot-password(.*)"].some(
      (item) => Boolean(request.nextUrl.pathname.match(new RegExp(item)))
    ) &&
    !token
  ) {
    return NextResponse.next();
  }

  if (!token) {
    let next = `?next=${request.nextUrl.pathname}`;
    return NextResponse.redirect(new URL(`/sign-in${next}`, request.url));
  }

  let paths: string[] = [];
  const menu: menuType[] = JSON.parse(request.cookies.get("menu") ?? "[]");
  menu?.map((item: menuType) => {
    if (item.path) {
      paths.push(item.path);
    }
    item.children
      ? item.children?.forEach((i: menuType) => i.path && paths.push(i.path))
      : "";
  });

  if (
    !paths.some((item) => {
      if (item === "/") {
        return item === request.nextUrl.pathname;
      }
      return request.nextUrl.pathname.startsWith(item);
    })
  ) {
    const { origin } = request.nextUrl;
    const url = `${origin}${paths[0]}`;

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

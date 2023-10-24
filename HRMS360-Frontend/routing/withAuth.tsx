import Router from "next/router";
import { NextPage, NextPageContext } from "next";
import { getCookie } from "cookies-next";
import { setApiHeaders } from "utils/setApiHeaders";

const login = "/sign-in"; // Define your login route address.

export const withAuth = <P extends {}>(WrappedComponent: NextPage<P>) => {
  const hocComponent = ({ ...props }: P) => <WrappedComponent {...props} />;

  hocComponent.getInitialProps = async (context: NextPageContext) => {
    let token = getCookie("token", { req: context.req, res: context.res });

    if (!token) {
      // Handle server-side and client-side rendering.
      if (context.res) {
        context.res?.writeHead(302, {
          Location: login,
        });
        context.res?.end();
      } else {
        Router.replace(login);
      }
    } else if (WrappedComponent.getInitialProps) {
      const wrappedProps = await WrappedComponent.getInitialProps({
        ...context,
      });
      return { ...wrappedProps };
    }
    setApiHeaders(context);

    return { authenticated: true };
  };

  return hocComponent;
};

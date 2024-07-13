import React, { useMemo } from 'react';
import { Route, Redirect } from 'react-router-dom';

type AuthChildRouterType = {
  render: (props?: any) => any;
  allRoute: string[];
  defaultRoute: string;
  [key: string]: any;
};

const AuthChildRouter = (props: AuthChildRouterType) => {
  const { path, render: Component, allRoute, defaultRoute, ...rest } = props;

  const res = useMemo(() => {
    const isPathInAllRoute = allRoute.includes(path);
    if (isPathInAllRoute) {
      return <Route {...rest} render={props => <Component {...props} />} />;
    }
    return <Redirect to={defaultRoute} />;
  }, [path]);

  return res;
};

export default AuthChildRouter;

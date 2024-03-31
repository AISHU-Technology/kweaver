import React from 'react';
import Cookie from 'js-cookie';
import { Route, Redirect } from 'react-router-dom';
import _ from 'lodash';
import NotFound from '@/components/NotFound';

type AuthRouterType = {
  render: (props?: any) => any;
  isRender?: boolean;
  [key: string]: any;
};

const AuthRouter = (props: AuthRouterType) => {
  const { render: Component, isRender, ...rest } = props;

  return <Route {...rest} render={props => (isRender ? <Component {...props} /> : <NotFound />)} />;
};

export default (props: AuthRouterType) => {
  return <AuthRouter {...props} />;
};

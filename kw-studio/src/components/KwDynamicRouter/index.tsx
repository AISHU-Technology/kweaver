import React, { useEffect, useState, Suspense } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import servicesEventStats, { listMenuDataType } from '@/services/eventStats';
import { lazyLoad } from '@/utils/handleFunction';

interface KwRouteConfig {
  path: string;
  component: string;
}

interface KwDynamicRouterProps {
  menuId: string;
  extraProps?: Record<string, any>;
}

const KwDynamicRouter = (props: KwDynamicRouterProps) => {
  const { menuId, extraProps } = props;
  const [routes, setRoutes] = useState<KwRouteConfig[]>([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const reqData: listMenuDataType = { isTree: 1, menuType: 1, pid: menuId, page: 1, size: -1 };
        const response = (await servicesEventStats.newMenuList(reqData)) || {};
        const routesData = response.res.data.map((route: any) => ({
          path: route.path,
          component: route.component
        }));
        setRoutes(routesData);
      } catch (error) {
        /* empty */
      }
    };

    fetchRoutes();
  }, [menuId]);

  console.log('xxx --->');

  return (
    <React.Fragment>
      {routes.map(route => (
        <Route
          key={route.path}
          path={route.path}
          render={(routerProps: any) => (
            <Suspense fallback={<div />}>
              {React.createElement(lazyLoad(route.component), { ...routerProps, ...extraProps })}
            </Suspense>
          )}
        />
      ))}
    </React.Fragment>
  );
};

export default KwDynamicRouter;

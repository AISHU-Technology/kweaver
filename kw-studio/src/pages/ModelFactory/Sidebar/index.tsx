import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import HOOKS from '@/hooks';
import servicesEventStats, { listMenuDataType } from '@/services/eventStats';
import IconFont from '@/components/IconFont';
import SideBar from '@/components/SideBar';

import './style.less';

const Sidebar = (props: any) => {
  const { setDefaultSelectRoute } = props;
  const history = useHistory();
  const language = HOOKS.useLanguage();
  const location = useLocation();
  const { pathname } = location;
  const [sideBarItems, setSideBarItems] = useState<any[]>([]);
  const keyToRoute = useRef<Record<string, any>>({});
  const selectedKeys = useMemo(() => {
    if (Object.keys(keyToRoute.current).length) {
      const keyToFind = Object.keys(keyToRoute.current).find(key => keyToRoute.current[key] === pathname);
      return [keyToFind!];
    }
    return [];
  }, [pathname, keyToRoute.current]);

  useEffect(() => {
    fetchSideBarItems();
  }, []);

  const findTrueDefaultSelectRoute = (itemArr: any[]) => {
    for (const item of itemArr) {
      if (item.children.length) {
        return item;
      }
    }
  };

  const findLastChildren = (item: any): any => {
    if (item) {
      if (!item.children) {
        return item.key;
      }
      return findLastChildren(item.children[0]);
    }
  };

  const fetchSideBarItems = async () => {
    const data: listMenuDataType = { isTree: 1, menuType: 1, pid: '293', page: 1, size: -1 };
    const result = (await servicesEventStats.newMenuList(data)) || {};
    if (result.res) {
      const finalTreeData: any[] = [];
      result.res.data.forEach((item: any) => {
        handlingRecursiveData(finalTreeData, item);
      });
      const defaultSelRoute = findTrueDefaultSelectRoute(finalTreeData);
      setDefaultSelectRoute(keyToRoute.current[findLastChildren(defaultSelRoute)]);
      setSideBarItems(finalTreeData);
    }
  };

  const handlingRecursiveData = (processedTreeData: any, fetchedTreeData: any) => {
    if (fetchedTreeData.level === 1) {
      const groupChildren: any[] = [];
      fetchedTreeData.children.forEach((item: any) => {
        handlingRecursiveData(groupChildren, item);
      });
      processedTreeData.push({
        key: fetchedTreeData.code,
        type: 'group',
        label: language === 'en-US' ? fetchedTreeData.eName : fetchedTreeData.cName,
        children: groupChildren
      });
    } else {
      if (!fetchedTreeData.children.length) {
        keyToRoute.current = { ...keyToRoute.current, ...{ [fetchedTreeData.code]: fetchedTreeData.path } };
        processedTreeData.push({
          key: fetchedTreeData.code,
          label: language === 'en-US' ? fetchedTreeData.eName : fetchedTreeData.cName,
          icon: <IconFont type={fetchedTreeData.icon} />,
          selectedIcon: <IconFont type={fetchedTreeData.selectedIcon} />
        });
        return;
      }
      const children: any[] = [];
      fetchedTreeData.children.forEach((item: any) => {
        handlingRecursiveData(children, item);
      });
      processedTreeData.push({
        key: fetchedTreeData.code,
        label: language === 'en-US' ? fetchedTreeData.eName : fetchedTreeData.cName,
        children
      });
    }
  };

  const recursionOpenKeys = (barItem: any, pathName: any) => {
    if (keyToRoute.current[barItem.key] === pathName) {
      return [barItem.key];
    } else if (barItem.children) {
      for (const child of barItem.children) {
        const resultKey: any = recursionOpenKeys(child, pathName);
        if (resultKey) return resultKey;
      }
    }
  };

  const findPathToTarget = (node: any, targetValue: any) => {
    let path: any[] = [];
    let isBreak = false;
    const dfs = (node: any) => {
      if (node.key === targetValue) {
        isBreak = true;
        return isBreak;
      }
      path.push(node.key);
      if (node.children) {
        for (const child of node.children) {
          if (isBreak) return;
          dfs(child);
        }
        if (!isBreak) {
          path = path.filter(item => item !== node.key);
        }
      } else {
        path = path.filter(item => item !== node.key);
      }
    };
    dfs(node);
    return path.length > 0 ? path : undefined;
  };

  const openKeys = useMemo(() => {
    for (const sideBarItem of sideBarItems) {
      if (keyToRoute.current[sideBarItem.key] === pathname) {
        return [pathname];
      } else if (sideBarItem.children) {
        for (const child of sideBarItem.children) {
          const resultKey = recursionOpenKeys(child, pathname);
          if (resultKey) {
            const pathArr = findPathToTarget(sideBarItem, resultKey[0]);
            return [...pathArr!, ...resultKey];
          }
        }
      }
    }
  }, [pathname, sideBarItems]);

  const onSelectedKeysChange = async (data: any) => {
    const key = data?.keyPath[0];
    history.push(keyToRoute.current[key]);
  };

  return (
    <SideBar
      className="knowledgeNetworkSideBarRoot"
      items={sideBarItems}
      openKeys={openKeys}
      selectedKeys={selectedKeys}
      onSelectedKeysChange={onSelectedKeysChange}
    />
  );
};

export default Sidebar;

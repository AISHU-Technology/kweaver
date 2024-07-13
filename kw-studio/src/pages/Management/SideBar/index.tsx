import { useHistory, useLocation } from 'react-router-dom';
import React, { useEffect, useMemo, useState, useRef } from 'react';

import HOOKS from '@/hooks';
import SideBar from '@/components/SideBar';
import IconFont from '@/components/IconFont';
import servicesEventStats, { listMenuDataType } from '@/services/eventStats';

const SideBarComp = (props: any) => {
  const { setDefaultSelectRoute } = props;
  const history = useHistory();
  const location = useLocation();
  const language = HOOKS.useLanguage();
  const { pathname } = location;
  const keyToRoute = useRef<any>({});
  const selectedKeys = useMemo(() => {
    if (Object.keys(keyToRoute.current).length) {
      const keyToFind = Object.keys(keyToRoute.current).find(key => keyToRoute.current[key] === pathname);
      if (keyToFind) {
        return [keyToFind];
      }
    }
  }, [pathname, keyToRoute.current]);
  const [sideBarItems, setSideBarItems] = useState<any>([]);

  const recursionOpenKeys = (barItem: any, pathName: string): any => {
    if (keyToRoute.current[barItem.key] === pathName) {
      return [barItem.key];
    } else if (barItem.children) {
      for (const child of barItem.children) {
        const resultKey = recursionOpenKeys(child, pathName);
        if (resultKey) return resultKey;
      }
    }
  };

  const findPathToTarget = (node: any, targetValue: any) => {
    let path: any = [];
    let isBreak = false;
    const dfs = (node: any) => {
      // 找到目标节点，结束搜索
      if (node.key === targetValue) {
        isBreak = true;
        return isBreak;
      }
      // 将当前节点添加到路径中
      path.push(node.key);
      if (node.children) {
        for (const child of node.children) {
          if (isBreak) return;
          // 递归遍历子节点
          dfs(child);
        }
        // 如果一组children没有找到targetValue，清空已存储的key
        if (!isBreak) {
          path = path.filter((item: any) => item !== node.key);
        }
      } else {
        path = path.filter((item: any) => item !== node.key);
      }
    };
    // 从根节点开始搜索
    dfs(node);
    // 返回路径或undefined
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
            return [...pathArr, ...resultKey];
          }
        }
      }
    }
  }, [pathname, sideBarItems]);

  useEffect(() => {
    fetchSideBarItems();
  }, []);

  const fetchSideBarItems = async () => {
    const param: listMenuDataType = {
      pid: '0',
      isTree: 1,
      menuType: 1,
      key: 'adf-management',
      page: 1,
      size: -1
    };
    const result = await servicesEventStats.newMenuList(param);
    if (result.res) {
      const finalTreeData: any = [];
      result.res.data.forEach((item: any) => {
        handlingRecursiveData(finalTreeData, item);
      });
      const defaultSelRoute = findTrueDefaultSelectRoute(finalTreeData);
      setDefaultSelectRoute(keyToRoute.current[findLastChildren(defaultSelRoute)]);
      setSideBarItems(finalTreeData);
    }
  };

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

  const handlingRecursiveData = (processedTreeData: any, fetchedTreeData: any) => {
    if (fetchedTreeData.level === 1) {
      const groupChildren: any = [];
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
        keyToRoute.current = {
          ...keyToRoute.current,
          ...{
            [fetchedTreeData.code]:
              fetchedTreeData.path === '/admin/management-menu'
                ? '/management/management-menu'
                : '/management/management-dict'
          }
        };
        processedTreeData.push({
          key: fetchedTreeData.code,
          label: language === 'en-US' ? fetchedTreeData.eName : fetchedTreeData.cName,
          icon: <IconFont type={fetchedTreeData.icon} />,
          selectedIcon: <IconFont type={fetchedTreeData.selectedIcon} />
        });
        return;
      }
      const children: any = [];
      fetchedTreeData.children.forEach((item: any) => {
        handlingRecursiveData(children, item);
      });
      processedTreeData.push({
        key: fetchedTreeData.code,
        label: language === 'en-US' ? fetchedTreeData.desc : fetchedTreeData.name,
        children
      });
    }
  };

  const onSelectedKeysChanged = (key: any) => {
    history.push(keyToRoute.current[key]);
  };

  return (
    <SideBar
      items={sideBarItems}
      openKeys={openKeys}
      selectedKeys={selectedKeys}
      onSelectedKeysChange={e => onSelectedKeysChanged(e.key)}
    />
  );
};

export default SideBarComp;

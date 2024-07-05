import { useHistory, useLocation } from 'react-router-dom';
import React, { useMemo, useState, useEffect, useRef } from 'react';

import HOOKS from '@/hooks';
import SideBar from '@/components/SideBar';
import IconFont from '@/components/IconFont';
import servicesEventStats from '@/services/eventStats';
import { sessionStore } from '@/utils/handleFunction';

import './style.less';

const Sidebar = props => {
  const { setDefaultSelectRoute } = props;
  const history = useHistory();
  const language = HOOKS.useLanguage();
  const location = useLocation();
  const { pathname } = location;
  const [sideBarItems, setSideBarItems] = useState([]);
  const keyToRoute = useRef({});
  const selectedKeys = useMemo(() => {
    if (Object.keys(keyToRoute.current).length) {
      const keyToFind = Object.keys(keyToRoute.current).find(key => keyToRoute.current[key] === pathname);
      return [keyToFind];
    }
  }, [pathname, keyToRoute.current]);

  // const id = useMemo(() => getParam('id'), [search]);
  // const id = useMemo(() => sessionStore.get('selectedKnowledgeId'), []);

  useEffect(() => {
    fetchSideBarItems();
  }, []);

  // 获取侧边栏
  const fetchSideBarItems = async () => {
    const data = { isTree: 1, menuType: 1, pid: '1', page: 1, size: -1 };
    const result = (await servicesEventStats.newMenuList(data)) || {};
    if (result.res) {
      const finalTreeData = [];
      result.res.data.forEach(item => {
        handlingRecursiveData(finalTreeData, item);
      });
      const defaultSelRoute = findTrueDefaultSelectRoute(finalTreeData);
      setDefaultSelectRoute(keyToRoute.current[findLastChildren(defaultSelRoute)]);
      setSideBarItems(finalTreeData);
    }
  };

  const findTrueDefaultSelectRoute = itemArr => {
    for (const item of itemArr) {
      if (item.children.length) {
        return item;
      }
    }
  };

  const findLastChildren = item => {
    if (item) {
      if (!item.children) {
        return item.key;
      }
      return findLastChildren(item.children[0]);
    }
  };

  // 处理后端返回数据
  const handlingRecursiveData = (processedTreeData, fetchedTreeData) => {
    if (fetchedTreeData.level === 1) {
      const groupChildren = [];
      fetchedTreeData.children.forEach(item => {
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
      const children = [];
      fetchedTreeData.children.forEach(item => {
        handlingRecursiveData(children, item);
      });
      processedTreeData.push({
        key: fetchedTreeData.code,
        label: language === 'en-US' ? fetchedTreeData.eName : fetchedTreeData.cName,
        children
      });
    }
  };

  const recursionOpenKeys = (barItem, pathName) => {
    if (keyToRoute.current[barItem.key] === pathName) {
      return [barItem.key];
    } else if (barItem.children) {
      for (const child of barItem.children) {
        const resultKey = recursionOpenKeys(child, pathName);
        if (resultKey) return resultKey;
      }
    }
  };

  const findPathToTarget = (node, targetValue) => {
    let path = [];
    let isBreak = false;
    const dfs = node => {
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
          path = path.filter(item => item !== node.key);
        }
      } else {
        path = path.filter(item => item !== node.key);
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

  const onSelectedKeysChange = async data => {
    // const isTip = await getLicenseList({});
    // if (isTip) {
    //   message.error(intl.get('license.productExpired'));
    // }
    const key = data?.keyPath[0];
    // history.push(`${key}?id=${id}`);
    sessionStore.remove('thesaurusSelectedId');
    history.push(`${keyToRoute.current[key]}?id=${sessionStore.get('selectedKnowledgeId')}`);
  };

  return (
    <SideBar
      className="knowledgeNetworkSideBarRoot"
      items={sideBarItems}
      openKeys={openKeys}
      selectedKeys={selectedKeys}
      onSelectedKeysChange={onSelectedKeysChange}
      draggable={false}
    />
  );
};

export default Sidebar;

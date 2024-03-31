import React, { useMemo, useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { message } from 'antd';
import { useHistory, useLocation } from 'react-router-dom';

import HOOKS from '@/hooks';
import serviceLicense from '@/services/license';
import servicesEventStats, { listMenuDataType } from '@/services/eventStats';

import { getParam } from '@/utils/handleFunction';
import IconFont from '@/components/IconFont';
import SideBar from '@/components/SideBar';

import './style.less';

const ADF_APP_CODE = 'adf-app';

const Sidebar = (props: any) => {
  const { kwLang, setDefaultSelectRoute } = props;
  const history = useHistory();
  const language = HOOKS.useLanguage();
  const location = useLocation();
  const { pathname, search } = location;
  const [lang, setLang] = useState('zh');
  const id = useMemo(() => getParam('id'), [search]);
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

  useEffect(() => {
    if (kwLang === 'zh-CN') {
      setLang('zh');
    } else {
      setLang('en');
    }
  }, [kwLang]);

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

  // 获取侧边栏
  const fetchSideBarItems = async () => {
    // const data: listMenuDataType = { code: ADF_APP_CODE };
    // const result = (await servicesEventStats.newMenuList(data)) || {};
    // if (result.res) {
    //   const finalTreeData: any[] = [];
    //   result.res.forEach((item: any) => {
    //     handlingRecursiveData(finalTreeData, item);
    //   });
    //   const defaultSelRoute = findTrueDefaultSelectRoute(finalTreeData);
    //   setDefaultSelectRoute(keyToRoute.current[findLastChildren(defaultSelRoute)]);
    //   setSideBarItems(finalTreeData);
    // }
  };

  // 处理后端返回数据
  const handlingRecursiveData = (processedTreeData: any, fetchedTreeData: any) => {
    if (fetchedTreeData.level === 1) {
      const groupChildren: any[] = [];
      fetchedTreeData.children.forEach((item: any) => {
        handlingRecursiveData(groupChildren, item);
      });
      processedTreeData.push({
        key: fetchedTreeData.code,
        type: 'group',
        label: language === 'en-US' ? fetchedTreeData.desc : fetchedTreeData.name,
        children: groupChildren
      });
    } else {
      if (!fetchedTreeData.children.length) {
        keyToRoute.current = { ...keyToRoute.current, ...{ [fetchedTreeData.code]: fetchedTreeData.content } };
        processedTreeData.push({
          key: fetchedTreeData.code,
          label: language === 'en-US' ? fetchedTreeData.desc : fetchedTreeData.name,
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
        label: language === 'en-US' ? fetchedTreeData.desc : fetchedTreeData.name,
        children
      });
    }
  };

  /**
   * 根据类型和状态返回
   */
  const deliveryList = (data: any) => {
    // 主产品 激活
    const newListMain = _.filter(data, item => {
      if (item.type !== 10 && item.type !== 14 && item.status === 1) {
        return item;
      }
    });
    // 测试 到期
    const expireTrail = _.filter(data, item => {
      if (item.type === 14 && item.status === 2) {
        return item;
      }
    });
    return { expireTrail, newListMain };
  };

  /**
   * 获取列表
   */
  // const getLicenseList = async (data: any) => {
  //   try {
  //     const res = await serviceLicense.getLicenseList({ status: -1, service: -1, lang, ...data });
  //     if (res?.res?.data) {
  //       const licenseList = deliveryList(res.res.data);
  //       if (licenseList?.newListMain.length !== 0) return false;
  //       if (licenseList?.expireTrail.length !== 0) {
  //         return true;
  //       }
  //     }
  //     return false;
  //   } catch (error) {
  //     if (!error.type) return;
  //     const { Description, description } = error.response || {};
  //     const curDesc = description || Description;
  //     curDesc && message.error(curDesc);
  //   }
  // };

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
            return [...pathArr!, ...resultKey];
          }
        }
      }
    }
  }, [pathname, sideBarItems]);

  // Application application
  const items = [
    {
      key: 'exploitation',
      type: 'group',
      label: intl.get('global.exploitation'),
      children: [
        {
          key: '/cognitive-application/domain-analysis',
          label: intl.get('cognitiveService.analysis.graphService'),
          icon: <IconFont type="icon-color-tufenxiyingyong1" />,
          selectedIcon: <IconFont type="icon-color-tufenxiyingyong2" />
        },
        {
          key: '/cognitive-application/domain-intention',
          label: intl.get('cognitiveSearch.cognitive'),
          icon: <IconFont type="icon-color-renzhisousuoyingyong1" />,
          selectedIcon: <IconFont type="icon-color-renzhisousuoyingyong2" />
        },
        // {
        //   key: '/cognitive-application/domain-dbapi',
        //   label: intl.get('global.dpapi'),
        //   icon: <IconFont type="icon-color-shujuchaxunyingyong1" />,
        //   selectedIcon: <IconFont type="icon-color-shujuchaxunyingyong2" />
        // },
        {
          key: '/cognitive-application/domain-custom',
          label: intl.get('customService.customTitle'),
          icon: <IconFont type="icon-color-zidingyiyingyong1" />,
          selectedIcon: <IconFont type="icon-color-zidingyiyingyong2" />
        },
        {
          key: '/cognitive-application/domain-search',
          label: intl.get('global.knowledgeSearch'),
          icon: <IconFont type="icon-color-zhishiwangluosousuo1" />,
          selectedIcon: <IconFont type="icon-color-zhishiwangluosousuo2" />
        }
      ]
    },
    {
      key: 'subscription',
      type: 'group',
      label: intl.get('subscriptionService.subscription'),
      children: [
        {
          key: '/cognitive-application/subscription',
          label: intl.get('subscriptionService.subscribed'),
          icon: <IconFont type="icon-color-yidingyueyingyong1" />,
          selectedIcon: <IconFont type="icon-color-yidingyueyingyong2" />
        }
      ]
    }
  ];

  const onSelectedKeysChange = async (data: any) => {
    // const isTip = await getLicenseList({});
    // if (isTip) {
    //   message.error(intl.get('license.productExpired'));
    // }
    const key = data?.keyPath[0];
    // history.push(`${key}?id=${id}`);
    history.push(keyToRoute.current[key]);
  };

  return (
    <SideBar
      className="knowledgeNetworkSideBarRoot"
      // items={items}
      items={sideBarItems}
      openKeys={openKeys}
      selectedKeys={selectedKeys}
      draggable={false}
      onSelectedKeysChange={onSelectedKeysChange}
    />
  );
};

export default Sidebar;

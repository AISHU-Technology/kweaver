import _ from 'lodash';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { message, Tooltip } from 'antd';
import { useHistory, useLocation } from 'react-router-dom';
import React, { useMemo, useState, useEffect, useRef } from 'react';

import HOOKS from '@/hooks';
import Format from '@/components/Format';
import SideBar from '@/components/SideBar';
import IconFont from '@/components/IconFont';
import serviceLicense from '@/services/license';
import servicesPermission from '@/services/rbacPermission';
import servicesEventStats, { listMenuDataType } from '@/services/eventStats';
import { formatIQNumber, sessionStore } from '@/utils/handleFunction';

import './style.less';

const ADF_KN_CODE = 'adf-kn';

const Sidebar = props => {
  const { score, kwLang, setDefaultSelectRoute } = props;
  const history = useHistory();
  const language = HOOKS.useLanguage();
  const location = useLocation();
  const { pathname, search } = location;
  const [lang, setLang] = useState('zh');
  const [collapsed, setCollapsed] = useState(false);
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

  useEffect(() => {
    if (kwLang === 'zh-CN') {
      setLang('zh');
    } else {
      setLang('en');
    }
  }, [kwLang]);

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

  /**
   * 根据类型和状态返回
   */
  const deliveryList = data => {
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
  // const getLicenseList = async data => {
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

  const onCollapsedChange = collapsed => {
    setCollapsed(collapsed);
  };

  const card = useMemo(() => {
    return (
      <div
        className={classNames('knowledgeNetworkSideBarRoot-iqCard kw-mb-5', {
          'kw-pl-4 kw-pr-4': !collapsed
        })}
        onClick={() => {
          history.push(`/knowledge/studio-iq?id=${sessionStore.get('selectedKnowledgeId')}`);
        }}
      >
        {collapsed ? (
          <Format.Button type="icon" tip={intl.get('global.domainIQ')} tipPosition={'right'}>
            <IconFont className="kw-c-primary" style={{ fontSize: 18 }} type="icon-color-lingyuzhishang" />
          </Format.Button>
        ) : (
          <div className="knowledgeNetworkSideBarRoot-iqCard-content kw-border kw-center">
            <img src={require('@/assets/images/DomainIQ.svg').default} alt="" />
            <span className="kw-flex-column kw-ml-2">
              <span style={{ lineHeight: 1 }} className="kw-c-subtext kw-ellipsis">
                {intl.get('global.domainIQScore')}
              </span>
              <span style={{ fontSize: 20, lineHeight: 1, textAlign: 'left' }} className="kw-c-header">
                {formatIQNumber(score)}
              </span>
            </span>
          </div>
        )}
      </div>
    );
  }, [collapsed, score]);

  return (
    <SideBar
      className="knowledgeNetworkSideBarRoot"
      // extraFooter={card}
      // items={items}
      items={sideBarItems}
      openKeys={openKeys}
      selectedKeys={selectedKeys}
      onSelectedKeysChange={onSelectedKeysChange}
      onCollapsedChange={onCollapsedChange}
      draggable={false}
    />
  );
};

export default Sidebar;

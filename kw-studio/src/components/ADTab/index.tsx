/*
 * @Author: 林峰(Gabriel_lin) Gabriel.lin@aishu.cn
 * @Date: 2023-10-26 14:44:54
 * @LastEditors: 林峰(Gabriel_lin) Gabriel.lin@aishu.cn
 * @LastEditTime: 2023-12-05 14:36:45
 */
import React, { useMemo, useReducer, useEffect, useRef, useState, ReactNode } from 'react';
import type { TableProps, TableColumnProps } from 'antd';
import { Tabs } from 'antd';
import classnames from 'classnames';
import Format from '@/components/Format';
import ContainerIsVisible from '@/components/ContainerIsVisible';

import { useHover, useSize, useSafeState } from 'ahooks';
import intl from 'react-intl-universal';

import './style.less';

interface HeaderTabPropsType {
  children?: ReactNode;
  visible?: boolean;
  className?: string;
  renderConfig?: {
    tabKeys: string[];
    tabContents: ReactNode[];
  };
}

const { TabPane } = Tabs;

/**
 *
 * @demo
 *  <ADTab
        renderConfig={{ tabKeys: ['tab1', 'tab2'], tabContents: [<div key="1">tab_1</div>, <div key="2">tab_2</div>] }}
    ></ADTab>
 */
const HeaderTab: React.FC<HeaderTabPropsType> = props => {
  const {
    renderConfig = {
      tabKeys: [],
      tabContents: []
    },
    className,
    children
  } = props;
  const { tabKeys, tabContents } = renderConfig;
  const [tabKey, setTabKey] = useState(tabKeys[0]);

  return (
    <ContainerIsVisible isVisible={tabContents.length !== 0}>
      <div className={classnames(className, 'kw-tab')}>
        {children || (
          <Tabs
            activeKey={tabKey}
            animated={false}
            onChange={e => {
              setTabKey(e);
            }}
          >
            {/* <TabPane key="search" forceRender tab={intl.get('cognitiveSearch.service')}>
          <SearchConfig />
        </TabPane>
        <TabPane key="intention" forceRender tab={intl.get('cognitiveSearch.intentPool')}>
          <IntentionConfig />
        </TabPane> */}
            {tabContents.map((tabContent, index) => {
              return (
                <TabPane key={tabKeys[index]} forceRender tab={tabKeys[index]}>
                  {tabContent}
                </TabPane>
              );
            })}
          </Tabs>
        )}
      </div>
    </ContainerIsVisible>
  );
};

export default HeaderTab;

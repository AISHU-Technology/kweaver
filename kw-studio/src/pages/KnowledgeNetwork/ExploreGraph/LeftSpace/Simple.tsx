import React, { useMemo } from 'react';
import { Menu, Button, Tooltip, Dropdown } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';
import { GRAPH_LAYOUT, GRAPH_LAYOUT_PATTERN } from '@/enums';
import IconFont from '@/components/IconFont';

const Simple = (props: any) => {
  const { config = {}, selectedItem } = props;
  const { onClickMenu, onChangeConfig } = props;

  const graphLayoutPattern = selectedItem.graphLayoutPattern;
  // const isLayoutTree = selectedItem?.layoutConfig?.key === GRAPH_LAYOUT.TREE;
  const isLayoutTree = selectedItem?.graphLayoutPattern === GRAPH_LAYOUT.TREE;
  const language = HOOKS.useLanguage();

  const [menuWidth, textWidth] = useMemo(() => {
    if (language === 'en-US') return [178, 106];
    return [150, 80];
  }, [language]);

  const OP_LIST_INFO = useMemo(() => {
    const defaultOption = [
      {
        id: 'search',
        icon: <IconFont type="icon-searchvid" className="kw-pointer" />,
        intl: isLayoutTree ? intl.get('exploreGraph.searchTree') : intl.get('exploreGraph.search')
      },
      {
        id: 'sql',
        icon: <IconFont type="icon-daima" className="kw-pointer" />,
        intl: intl.get('exploreGraph.sqlQuery'),
        deps: [GRAPH_LAYOUT_PATTERN.COMMON]
      },
      {
        id: 'neighbors',
        icon: <IconFont type="icon-huaxiangfenxi" className="kw-pointer" />,
        intl: intl.get('exploreGraph.neighbor')
      },
      {
        id: 'path',
        icon: <IconFont type="icon-guiji" className="kw-pointer" />,
        intl: intl.get('exploreGraph.pathQuery'),
        deps: [GRAPH_LAYOUT_PATTERN.COMMON]
      }
    ];

    // 处理自定义按钮
    if (_.isEmpty(config)) return defaultOption;
    const customOptions = _.filter(config, item => item.type === 'custom');
    _.forEach(customOptions, item => {
      defaultOption.push({
        id: item.key,
        icon: <IconFont type="icon-function" className="kw-pointer" />,
        intl: item.alias
      });
    });
    const result: any = _.filter(defaultOption, item => {
      if (item.deps && graphLayoutPattern) return _.includes(item.deps, graphLayoutPattern);
      return item;
    });

    return result;
  }, [isLayoutTree, JSON.stringify(config)]);

  const onChangeMenu = (data: any) => {
    const configData = config[data.key];
    if (configData.type === 'custom') {
      onChangeConfig(configData);
    } else {
      onClickMenu(data?.key);
    }
  };

  const menu = (
    <Menu onClick={onChangeMenu} style={{ width: menuWidth, userSelect: 'none' }}>
      {_.map(OP_LIST_INFO, item => {
        if (!config[item.id] || !config[item.id]?.checked) return null;
        const { id, icon } = item;
        const text = config[item.id]?.alias || item.intl;
        const disabled = (id === 'sql' || id === 'path') && selectedItem?.layoutConfig?.key === GRAPH_LAYOUT.TREE;

        return (
          <Menu.Item key={id} className="menuItem" disabled={disabled}>
            <div className="kw-center" style={{ height: 30 }}>
              <span className="kw-mr-4" style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.5)' }}>
                {icon}
              </span>
              <span className="kw-ellipsis" style={{ display: 'inline-block', width: textWidth }} title={text}>
                {text}
              </span>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <div className="leftSpaceSimpleRoot">
      <Dropdown overlay={menu} trigger={['click']}>
        <Button className="dropdownButton" type="link">
          <Tooltip title={intl.get('exploreGraph.addData')} placement="top">
            <IconFont
              type="icon-tianjiashuju"
              className="kw-pointer"
              style={{ fontSize: 16, margin: '0px 8px 3px 8px' }}
            />
          </Tooltip>
        </Button>
      </Dropdown>
    </div>
  );
};

export default Simple;

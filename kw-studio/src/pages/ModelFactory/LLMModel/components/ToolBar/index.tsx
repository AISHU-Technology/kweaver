import React from 'react';
import { Select, Dropdown, Menu, Tooltip } from 'antd';
import { ArrowDownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import IconFont from '@/components/IconFont';
import { Header } from '@/components/ADTable';
import Format from '@/components/Format';
import { DESCEND, ASCEND, offsetY } from '@/enums';

import { FILTER_OPTION, SORTER_MENU } from '../../enums';
import { TableState } from '../../types';
import './style.less';

export interface ToolBarProps {
  className?: string;
  disabledStatus?: Record<string, boolean>;
  tableState: TableState;
  onOperate?: (key: string, data: any) => void;
  onStateChange: (state: Partial<TableState>) => void;
}

const ToolBar = (props: ToolBarProps) => {
  const { className, disabledStatus = {}, tableState, onOperate, onStateChange } = props;

  /**
   * 按照模型类别过滤
   * @param value 模型类别
   */
  const onFilterChange = (value: string) => {
    onStateChange({ series: value, page: 1 });
  };

  /**
   * 排序变更
   * @param key 排序字段
   */
  const onSortMenuClick = (key: string) => {
    const { order, rule } = tableState;
    onStateChange({
      page: 1,
      rule: key,
      order: rule === key ? (order === DESCEND ? ASCEND : DESCEND) : order
    });
  };

  const onViewChange = () => {
    onStateChange({ viewType: tableState.viewType === 'list' ? 'card' : 'list', page: 1 });
  };

  const onRefresh = () => {
    onStateChange({});
  };

  return (
    <div className={classNames(className, 'llm-toolbar-root kw-pl-6 kw-pr-6')}>
      <Header
        title={intl.get('llmModel.titleTwo')}
        showFilter={false}
        renderButtonConfig={[
          {
            key: '1',
            position: 'left',
            itemDom: (
              <Format.Button
                type="primary"
                icon={<IconFont type="icon-Add" />}
                disabled={disabledStatus.create}
                onClick={() => onOperate?.('create', {})}
              >
                {intl.get('global.create')}
              </Format.Button>
            )
          },
          {
            key: '2',
            position: 'right',
            itemDom: (
              <Dropdown
                placement="bottomRight"
                trigger={['click']}
                overlay={
                  <Menu selectedKeys={[tableState.rule]} onClick={({ key }) => onSortMenuClick(key)}>
                    {SORTER_MENU.map(({ key, label }) => (
                      <Menu.Item key={key}>
                        <ArrowDownOutlined
                          className="kw-mr-2"
                          rotate={tableState.order === DESCEND ? 0 : 180}
                          style={{
                            opacity: tableState.rule === key ? 0.8 : 0,
                            fontSize: 15,
                            ...offsetY(1)
                          }}
                        />
                        {label}
                      </Menu.Item>
                    ))}
                  </Menu>
                }
              >
                <Format.Button type="icon" tip={intl.get('global.sort')} tipPosition="top">
                  <IconFont type="icon-paixu11" className="sort-icon" />
                </Format.Button>
              </Dropdown>
            )
          },
          {
            key: '3',
            position: 'right',
            itemDom: (
              <Format.Button
                type="icon"
                tip={intl.get(`llmModel.${tableState.viewType === 'card' ? 'listMode' : 'cardMode'}`)}
                tipPosition="top"
                onClick={onViewChange}
              >
                <IconFont type={tableState.viewType === 'card' ? 'icon-liebiao' : 'icon-wanggemoshi'} />
              </Format.Button>
            )
          },
          {
            key: '4',
            position: 'right',
            itemDom: (
              <Format.Button type="icon" tip={intl.get('global.refresh')} tipPosition="top" onClick={onRefresh}>
                <IconFont type="icon-tongyishuaxin" />
              </Format.Button>
            )
          }
        ]}
        onSearchChange={(value: any) => {
          onStateChange({ name: value });
        }}
        searchPlaceholder={intl.get('llmModel.searchPlace')}
        filterToolsOptions={[
          {
            id: 1,
            label: intl.get('llmModel.colSupplier'),
            itemDom: (
              <Select
                options={FILTER_OPTION}
                value={tableState.series}
                style={{ width: 190 }}
                onChange={onFilterChange}
              />
            )
          }
        ]}
      ></Header>
    </div>
  );
};

export default ToolBar;

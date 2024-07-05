import React from 'react';
import { Select, Dropdown, Menu } from 'antd';
import { ArrowDownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import { DESCEND, ASCEND, offsetY } from '@/enums';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import { Header } from '@/components/KwTable';

import { PROMPT_TYPE_OPTION, SORTER_MENU } from '../../enums';
import { PromptState } from '../../types';
import './style.less';

export interface ToolBarProps {
  className?: string;
  tableState: PromptState;
  onOperate?: (key: string, data?: any) => void;
  onStateChange: (state: Partial<PromptState>) => void;
}

const ToolBar = (props: ToolBarProps) => {
  const { className, tableState, onOperate, onStateChange } = props;

  /**
   * 按照模型类别过滤
   * @param value 模型类别
   */
  const onTypeChange = (value: string) => {
    onStateChange({ prompt_type: value });
  };

  /**
   * 排序变更
   * @param key 排序字段
   */
  const onSortMenuClick = (key: string) => {
    const { order, rule } = tableState;
    onStateChange({
      rule: key,
      order: rule === key ? (order === DESCEND ? ASCEND : DESCEND) : order
    });
  };

  const onViewChange = () => {
    onStateChange({ viewType: tableState.viewType === 'list' ? 'card' : 'list' });
  };

  const onRefresh = () => {
    onStateChange({});
  };

  return (
    <div className={classNames(className, 'prompt-home-toolbar-root  kw-pl-6 kw-pr-6')}>
      <Header
        showFilter={false}
        renderButtonConfig={[
          {
            key: 'btn1',
            position: 'left',
            itemDom: (
              <Format.Button type="primary" icon={<IconFont type="icon-Add" />} onClick={() => onOperate?.('create')}>
                {intl.get('global.create')}
              </Format.Button>
            )
          },
          {
            key: 'btn2',
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
            key: 'btn3',
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
            key: 'btn4',
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
        searchPlaceholder={intl.get('prompt.namePlace')}
        filterToolsOptions={[
          {
            id: 'select1',
            label: intl.get('prompt.type'),
            itemDom: (
              <Select
                options={PROMPT_TYPE_OPTION}
                value={tableState.prompt_type}
                style={{ width: 160 }}
                onChange={onTypeChange}
              />
            )
          }
        ]}
      />
    </div>
  );
};

export default ToolBar;

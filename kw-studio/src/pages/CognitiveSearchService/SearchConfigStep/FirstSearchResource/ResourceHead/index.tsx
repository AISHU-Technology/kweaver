import React from 'react';
import { Button, Dropdown, Menu, Select } from 'antd';

import { ArrowDownOutlined, CaretDownOutlined } from '@ant-design/icons';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import intl from 'react-intl-universal';
import _ from 'lodash';

import './style.less';
import AdKnowledgeNetIcon from '@/components/AdKnowledgeNetIcon/AdKnowledgeNetIcon';
import ExplainTip from '@/components/ExplainTip';

export const SORTER_MENU = [
  {
    key: 'kg_name',
    text: intl.get('cognitiveSearch.resource.name')
  },
  {
    key: 'create_time',
    text: intl.get('cognitiveSearch.resource.createTime')
  },
  {
    key: 'edit_time',
    text: intl.get('cognitiveSearch.resource.finalTime')
  }
];

const SELECT_DATA = [
  { value: 'all', label: intl.get('global.all') },
  { value: 'kg', label: intl.get('cognitiveSearch.resource.know') },
  {
    value: 'model',
    label: intl.get('cognitiveSearch.resource.vectorModel')
  },
  {
    value: 'private',
    label: intl.get('cognitiveSearch.largeModel')
  }
];

const DESC = 'descend';
const ResourceHead = (props: any) => {
  const {
    onChangeTable,
    testData,
    tableState,
    onDelete,
    setOperationType,
    tableData,
    deleteIds,
    setIsAddModal,
    onOpenExternalModel,
    disabled,
    knwData,
    onOpenPrivateModel
  } = props;

  /**
   * 搜索
   */
  const onSearch = (e: any) => {
    onChangeTable({ name: e?.target?.value, page: 1 }, testData);
  };

  /**
   * 排序
   */
  const onSortMenuClick = (key: any) => {
    const { rule, order } = tableState;
    onChangeTable(
      {
        rule: key,
        order: rule === key ? (order === 'descend' ? 'ascend' : 'descend') : order
      },
      testData
    );
  };

  const menu = () => {
    return (
      <Menu>
        <Menu.Item
          onClick={() => {
            setOperationType('create');
            setIsAddModal(true);
          }}
        >
          {intl.get('cognitiveSearch.resource.know')}
        </Menu.Item>
        <Menu.Item onClick={() => onOpenExternalModel()}>{intl.get('cognitiveSearch.resource.vectorModel')}</Menu.Item>
        <Menu.Item onClick={() => onOpenPrivateModel()}>{intl.get('cognitiveSearch.largeModel')}</Menu.Item>
      </Menu>
    );
  };

  return (
    <div className="source-graph-header-wrap">
      <div className="kw-space-between">
        <Format.Title>{intl.get('cognitiveSearch.dataResource')}</Format.Title>
        <div className="kw-align-center">
          <span>{`${intl.get('global.kgNet')}：`}</span>
          <AdKnowledgeNetIcon className="kw-mr-2" type={knwData?.color} />
          <div className="kw-ellipsis" style={{ maxWidth: 300 }}>
            {knwData?.knw_name}
          </div>
        </div>
      </div>

      <div className="source-header kw-mt-5">
        <div className="header-left">
          <Dropdown overlay={menu} trigger={['hover']}>
            <Button type="primary" className="kw-mr-3">
              <IconFont type="icon-Add" />
              {intl.get('cognitiveSearch.resource.add')}
              <CaretDownOutlined />
            </Button>
          </Dropdown>

          <Button
            type="default"
            onClick={() => onDelete(deleteIds, 'multiple')}
            disabled={_.isEmpty(tableData) || _.isEmpty(deleteIds?.[0])}
          >
            <IconFont type="icon-lajitong" />
            {intl.get('cognitiveSearch.resource.delete')}
          </Button>
        </div>

        <div className="kw-flex header-right">
          <span className="kw-mr-2">{intl.get('cognitiveSearch.resource.resourceType')}</span>
          <Select
            className="kw-mr-2"
            style={{ width: 200 }}
            value={tableState?.type}
            onChange={e => {
              onChangeTable({ type: e }, testData);
            }}
            options={SELECT_DATA}
          />
          <SearchInput
            className="search-input"
            placeholder={intl.get('cognitiveSearch.resource.searchName')}
            onChange={onSearch}
            debounce
          />
          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            overlay={
              <Menu selectedKeys={[tableState.rule]} onClick={({ key }) => onSortMenuClick(key)}>
                {SORTER_MENU.map(({ key, text }) => (
                  <Menu.Item key={key}>
                    <ArrowDownOutlined
                      className="kw-mr-2"
                      rotate={tableState.order === DESC ? 0 : 180}
                      style={{ opacity: tableState.rule === key ? 0.8 : 0, fontSize: 15 }}
                    />
                    {text}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <ExplainTip title={intl.get('global.sort')}>
              <Format.Button className="" type="icon">
                <IconFont type="icon-paixu11" className="sort-icon" />
              </Format.Button>
            </ExplainTip>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default ResourceHead;

import React, { useState } from 'react';
import { Button, Dropdown, Menu } from 'antd';
import { ArrowDownOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import MoveClassifyModal from './MoveClassifyModal';
import './style.less';
import Format from '@/components/Format';
import ExplainTip from '@/components/ExplainTip';

const SORTER_MENU = [
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
const DESC = 'descend';

const ClassifyHead = (props: any) => {
  const { authData, onChangeTable, tableState, selectedRowKeys, testData, setTestData, selectedRows } = props;

  const [isMoveModal, setIsMoveModal] = useState(false); // 移动至分类弹窗

  /**
   * 搜索
   */
  const onSearch = (e: any) => {
    onChangeTable({ name: e?.target?.value, page: 1 });
  };

  /**
   * 排序
   */
  const onSortMenuClick = (key: any) => {
    const { rule, order } = tableState;
    onChangeTable({
      rule: key,
      order: rule === key ? (order === 'descend' ? 'ascend' : 'descend') : order
    });
  };

  /**
   * 取消弹窗
   */
  const onHandleCancel = () => {
    setIsMoveModal(false);
  };

  return (
    <div className="classify-right-head-box">
      <div className="header-left">
        <Button
          title={_.isEmpty(selectedRowKeys) ? intl.get('cognitiveSearch.resource.leastOne') : ''}
          type="primary"
          disabled={_.isEmpty(selectedRowKeys)}
          onClick={() => setIsMoveModal(true)}
        >
          {intl.get('cognitiveSearch.classify.move')}
        </Button>
      </div>
      <div className="header-right kw-flex">
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
            <Format.Button type="icon">
              <IconFont type="icon-paixu11" />
            </Format.Button>
          </ExplainTip>
        </Dropdown>
      </div>
      <MoveClassifyModal
        authData={authData}
        testData={testData}
        setTestData={setTestData}
        selectedRows={selectedRows}
        visible={isMoveModal}
        onHandleCancel={onHandleCancel}
        onChangeTable={onChangeTable}
      />
    </div>
  );
};

export default ClassifyHead;

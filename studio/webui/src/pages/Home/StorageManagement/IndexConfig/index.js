import React, { Component } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Table, Button, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import timeFormat from '@/utils/timeFormat/index.js';
import serviceStorageManagement from '@/services/storageManagement';

import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';

import DeleteModal from '../deleteModal';
import CreateModal from './CreateIndexModal';

import noResult from '@/assets/images/noResult.svg';
import addContentImg from '@/assets/images/create.svg';
import './index.less';

const antIconBig = <LoadingOutlined className="icon" style={{ fontSize: 24, top: '200px' }} spin />;

class IndexConfig extends Component {
  state = {
    tableData: [], // 表格数据
    visible: false, // 新建弹窗
    optionType: 'create', // 控制弹窗操作的类型 新建、编辑
    delModalVisible: false, // 删除弹窗
    optionStorage: {}, // 操作的某项索引
    searchValue: '', // 搜索值
    current: 1,
    pageSize: 20,
    total: 0,
    selectKey: 0, // 选中的行
    loading: false,
    deleteItem: {}, // 删除的索引
    checkedInfo: {}, // 保存编辑或查看的存储信息
    orderType: 'updated', // 排序的类型
    order: 'DESC' // 排序 ASC 升序 DESC 降序
  };

  searchInput = React.createRef();

  componentDidMount() {
    this.initData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabsKey !== this.props.tabsKey && this.props.tabsKey === 'index') {
      this.initData();
    }
  }

  /**
   * @description 获取初始配置
   */
  initData = async () => {
    const { current, pageSize, orderType, order, searchValue } = this.state;

    const type = orderType || 'updated';
    const sort = order || 'DESC';

    try {
      const data = { page: current, size: pageSize, orderField: type, order: sort, name: searchValue };
      const { res = {}, ErrorCode = '', Description = '' } = await serviceStorageManagement.openSearchGet(data);

      if (!_.isEmpty(res)) this.setState({ total: res?.total, tableData: res?.data });
      if (ErrorCode === 'Manager.Common.ServerError') message.error(Description);
    } catch (error) {
      //
    }
  };

  /**
   * 根据ID获取数据
   */
  getIndex = async (record, option) => {
    try {
      const {
        res = {},
        ErrorCode = '',
        Description = ''
      } = await serviceStorageManagement.openSearchGetById(record.id);

      if (!_.isEmpty(res)) {
        const { ip, port, name, password, user, id } = res;
        const data = { port: port[0], ip: ip[0], id, user, name, password };
        this.setState({
          checkedInfo: data,
          visible: true,
          optionType: option,
          optionStorage: record,
          selectKey: 0
        });
      }

      if (ErrorCode === 'Manager.Opensearch.OSRecordNotFoundError') message.error(intl.get('configSys.NotFoundError'));
      if (ErrorCode === 'Manager.Common.ServerError') message.error(Description);
    } catch (error) {
      //
    }
  };

  /**
   * 新建
   */
  onCreate = () => {
    this.setState({ visible: true, checkedInfo: [], optionType: 'create' });
  };

  /**
   * 搜索
   */
  onSearch = (e, clear = false) => {
    const { value } = this.searchInput.current.input;

    this.setState({ searchValue: clear ? '' : value }, () => {
      this.initData();
    });
  };

  /**
   * 页码变化
   */
  currentChange = page => {
    this.setState({ current: page }, () => {
      this.initData();
    });
  };

  /**
   * 选中毕竟加深
   */
  setSelectKey = id => {
    this.setState({ selectKey: id });
  };

  /**
   * 点击表格排序
   */
  sortOrderChange = (pagination, filters, sorter) => {
    const order = sorter.order === 'descend' ? 'DESC' : 'ASC';

    this.setState({ order, orderType: sorter.field }, () => {
      this.initData();
    });
  };

  /**
   * 关闭弹窗
   */
  closeModal = () => {
    this.setState({ visible: false, delModalVisible: false });
  };

  columns = [
    {
      title: intl.get('configSys.storageName'),
      dataIndex: 'name',
      ellipsis: true,
      width: 200
    },
    {
      title: intl.get('configSys.username'),
      dataIndex: 'user',
      width: 190
    },
    {
      title: intl.get('userManagement.createTime'),
      dataIndex: 'created',
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: text => {
        return timeFormat.timeFormat(text);
      }
    },
    {
      title: intl.get('graphList.finalOperatorTime'),
      dataIndex: 'updated',
      sorter: true,
      defaultSortOrder: 'descend',
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: text => {
        return timeFormat.timeFormat(text);
      }
    },
    {
      title: intl.get('configSys.op'),
      fixed: 'right',
      width: 110,
      render: (text, record) => {
        return record.name === '内置opensearch' ? (
          <span className="icon-sub">- -</span>
        ) : (
          <div className="ad-center columnOp" style={{ justifyContent: 'flex-start' }}>
            <Button type="link" onClick={() => this.getIndex(record, 'edit')}>
              {intl.get('configSys.Edit')}
            </Button>
            <Button
              type="link"
              onClick={() => this.setState({ delModalVisible: true, deleteItem: record, selectKey: 0 })}
            >
              {intl.get('datamanagement.delete')}
            </Button>
          </div>
        );
      }
    }
  ];

  render() {
    const { tableData, current, total, pageSize, selectKey, loading, searchValue } = this.state;

    return (
      <div className="storage-index-config">
        <div className="tool-box">
          <div className="tool-box-left">
            <Button type="primary" className="new-botton" onClick={this.onCreate}>
              <IconFont type="icon-Add" className="add-icon" />
              {intl.get('datamanagement.create')}
            </Button>
          </div>
          <div className="tool-box-right">
            <SearchInput
              placeholder={intl.get('configSys.searchTip')}
              ref={this.searchInput}
              onPressEnter={this.onSearch}
              onClear={e => this.onSearch(e, true)}
            />
          </div>
        </div>

        <div className="index-table-box">
          <Table
            tableLayout="fixed"
            dataSource={tableData}
            columns={this.columns}
            scroll={{ x: '100%' }}
            rowKey={record => record?.id}
            loading={loading ? { indicator: antIconBig } : false}
            rowClassName={record => record.id === selectKey && 'selectRow'}
            onChange={this.sortOrderChange}
            pagination={{
              total,
              current,
              pageSize,
              showTitle: false,
              showSizeChanger: false,
              onChange: this.currentChange,
              className: 'index-table-pagination ',
              showTotal: total => intl.get('userManagement.total', { total })
            }}
            locale={{
              emptyText:
                searchValue === '' ? (
                  <div className="nodata-box">
                    <img src={addContentImg} alt="nodata" className="nodata-img"></img>
                    <div className="nodata-text">
                      <p>
                        {intl.get('configSys.click')}
                        <span className="create-span" onClick={this.onCreate}>
                          {intl.get('global.emptyTableCreate')}
                        </span>
                        {intl.get('configSys.addIndex')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="nodata-box">
                    <img src={noResult} alt="nodata" className="nodata-img"></img>
                    <div className="nodata-text">{intl.get('memberManage.searchNull')}</div>
                  </div>
                )
            }}
          />
        </div>

        {/* 新建弹窗 */}
        <CreateModal
          visible={this.state.visible}
          optionType={this.state.optionType}
          closeModal={this.closeModal}
          getData={this.initData}
          initData={this.state.checkedInfo}
        />
        {/* 删除 */}
        <DeleteModal
          visible={this.state.delModalVisible}
          setVisible={this.closeModal}
          deleteItem={this.state.deleteItem}
          getData={this.initData}
          delType="index"
        />
      </div>
    );
  }
}
export default IndexConfig;

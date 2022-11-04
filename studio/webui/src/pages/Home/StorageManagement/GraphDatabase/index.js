import React, { Component } from 'react';
import _ from 'lodash';
import { Table, Button, Select, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';

import timeFormat from '@/utils/timeFormat/index.js';
import serviceStorageManagement from '@/services/storageManagement';

import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';

import CreateModal from './createModal';
import DeleteModal from '../deleteModal';
import GraphListModal from './graphListModal';

import noResult from '@/assets/images/noResult.svg';
import addContentImg from '@/assets/images/create.svg';
import './style.less';

const ERROR_CODE = {
  'Studio.Account.InsufficientAccountPermissionsError': 'configSys.PermissionsError',
  'Studio.GraphDB.GraphDBRecordNotFoundError': 'configSys.NotFoundError'
};
const antIconBig = <LoadingOutlined className="icon" style={{ fontSize: 24, top: '200px' }} spin />;
const { Option } = Select;

class GraphDatabase extends Component {
  state = {
    tableData: [], // 表格数据
    visible: false, // 新建弹窗
    optionType: 'create', // 控制弹窗操作的类型 新建、编辑
    graphInfoList: [],
    delModalVisible: false, // 删除弹窗
    graphModalVisible: false, // 图谱详情的列表弹窗
    optionStorage: {}, // 操作的某项存储
    searchType: 'all', // 搜索的类型
    searchValue: '', // 搜索值
    current: 1,
    pageSize: 20,
    total: 0,
    deleteItem: {}, // 删除的存储项
    graphListId: 0, // 点击存储的id
    storageInfo: {}, // 保存编辑或查看的存储信息
    orderType: 'updated', // 排序的类型
    order: 'DESC' // 排序 ASC 升序 DESC 降序
  };

  searchInput = React.createRef();

  componentDidMount() {
    this.initData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabsKey !== this.props.tabsKey && this.props.tabsKey === 'graph') {
      this.initData();
    }
  }

  /**
   * @description 获取初始配置
   */
  initData = async () => {
    const { current, pageSize, orderType, order, searchType, searchValue } = this.state;

    const type = orderType || 'updated';
    const sort = order || 'DESC';
    const data = { page: current, size: pageSize, orderField: type, order: sort, type: searchType, name: searchValue };

    try {
      const { res } = await serviceStorageManagement.graphDBGetList(data);
      if (!_.isEmpty(res)) this.setState({ total: res?.total, tableData: res?.data });
    } catch (error) {
      const { type = '', response = {} } = error || {};
      if (type === 'message') {
        const { ErrorCode } = response;
        if (ERROR_CODE[ErrorCode]) message.error(intl.get(ERROR_CODE[ErrorCode]));
      }
    }
  };

  /**
   * 新建
   */
  onCreate = async () => {
    try {
      const data = { page: 1, size: 10, orderField: 'updated', order: 'DESC', name: '' };
      const { res = {} } = await serviceStorageManagement.openSearchGet(data);
      if (res?.data?.length > 0) return this.setState({ visible: true, storageInfo: {}, optionType: 'create' });
      message.warning(intl.get('configSys.indexConfigurationFirst'));
    } catch (error) {
      message.warning(intl.get('configSys.indexConfigurationFirst'));
    }
  };

  /**
   * 根据ID获取数据
   */
  getStorage = async (record, option) => {
    try {
      const result = await serviceStorageManagement.graphDBGetById(record.id);

      if (!_.isEmpty(result?.res)) {
        const { ip, port, name, type, password, user, id } = result.res;
        const ips = _.map(ip, (item, index) => `${item}:${port[index]}`);
        const data = { port, ips, id, user, type, name, password, osName: record.osName };
        this.setState({ storageInfo: data, visible: true, optionType: option, optionStorage: record });
      }
    } catch (error) {
      const { type = '', response = {} } = error || {};
      if (type === 'message') {
        const { ErrorCode } = response;
        if (ERROR_CODE[ErrorCode]) message.error(intl.get(ERROR_CODE[ErrorCode]));
      }
    }
  };

  /**
   * 点击详情
   */
  getGraphInfo = id => {
    this.setState({ graphModalVisible: true, graphListId: id });
  };

  /**
   * 关闭弹窗
   */
  closeModal = () => {
    this.setState({ visible: false, delModalVisible: false, graphModalVisible: false });
  };

  /**
   * 根据类型搜索
   */
  typeChange = e => {
    this.setState({ searchType: e }, () => {
      this.initData();
    });
  };

  /**
   * 搜索存储
   */
  onSearch = (e, isClear = false) => {
    const { value } = this.searchInput.current.input;

    this.setState({ searchValue: isClear ? '' : value }, () => {
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
   * 点击表格排序
   */
  sortOrderChange = (pagination, filters, sorter) => {
    const order = sorter.order === 'descend' ? 'DESC' : 'ASC';

    this.setState({ order, orderType: sorter.field }, () => {
      this.initData();
    });
  };

  columns = [
    {
      title: intl.get('configSys.storageName'),
      dataIndex: 'name',
      ellipsis: true,
      width: 280
    },
    {
      title: intl.get('configSys.type'),
      dataIndex: 'type',
      width: 160,
      render: text => {
        if (text === 'orientdb') return 'OrientDB';
        if (text === 'nebula') return 'Nebula Graph';
      }
    },
    {
      title: intl.get('configSys.bindIndex'),
      dataIndex: 'osName',
      width: 190,
      ellipsis: true
    },
    {
      title: intl.get('global.graph'),
      dataIndex: 'graph',
      width: 160,
      render: (text, record) => {
        return (
          <div>
            <span>{record.count}</span>
            <span className="columnGraphInfo" onClick={() => this.getGraphInfo(record.id)}>
              {intl.get('configSys.deatil')}
            </span>
          </div>
        );
      }
    },
    {
      title: intl.get('configSys.username'),
      dataIndex: 'user',
      width: 190,
      ellipsis: true
    },
    {
      title: intl.get('userManagement.createTime'),
      dataIndex: 'created',
      width: 220,
      render: text => timeFormat.timeFormat(text),
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend']
    },
    {
      title: intl.get('graphList.finalOperatorTime'),
      dataIndex: 'updated',
      width: 220,
      render: text => timeFormat.timeFormat(text),
      sorter: true,
      defaultSortOrder: 'descend',
      sortDirections: ['ascend', 'descend', 'ascend']
    },
    {
      title: intl.get('configSys.op'),
      fixed: 'right',
      width: 160,
      render: (text, record) => {
        if (record.name === '内置OrientDB' || record.name === '内置Nebula') return '- -';
        return (
          <div className="ad-center columnOp" style={{ justifyContent: 'flex-start' }}>
            <Button type="link" onClick={() => this.getStorage(record, 'edit')}>
              {intl.get('configSys.Edit')}
            </Button>
            <Button type="link" onClick={() => this.setState({ delModalVisible: true, deleteItem: record })}>
              {intl.get('datamanagement.delete')}
            </Button>
          </div>
        );
      }
    }
  ];

  render() {
    const { checked, current, pageSize, total, selectedRowsList, tableData, loading, searchType, searchValue } =
      this.state;

    return (
      <div className="graph-database-management">
        <div className="ad-space-between">
          <Button type="primary" onClick={this.onCreate}>
            <IconFont type="icon-Add" />
            {intl.get('datamanagement.create')}
          </Button>
          <div className="ad-center">
            <span className="typeText">{intl.get('configSys.storageType')}</span>
            <Select className="storageSelect" defaultValue={'all'} onSelect={this.typeChange} title="">
              <Option value="all">{intl.get('graphList.all')}</Option>
              <Option value="orientdb">OrientDB</Option>
              <Option value="nebula">Nebula Graph</Option>
            </Select>
            <SearchInput
              ref={this.searchInput}
              placeholder={intl.get('configSys.searchTip')}
              onPressEnter={this.onSearch}
              onClear={e => this.onSearch(e, true)}
            />
          </div>
        </div>
        <div className="table-box">
          <Table
            tableLayout="fixed"
            scroll={{ x: '100%' }}
            columns={this.columns}
            rowKey={record => record.id}
            dataSource={checked ? selectedRowsList : tableData}
            loading={loading ? { indicator: antIconBig } : false}
            onChange={this.sortOrderChange}
            pagination={{
              total,
              current,
              pageSize,
              showTitle: false,
              showSizeChanger: false,
              onChange: this.currentChange,
              showTotal: total => intl.get('userManagement.total', { total })
            }}
            locale={{
              emptyText:
                searchType === 'all' && searchValue === '' ? (
                  <div className="nodata-box">
                    <img src={addContentImg} alt="nodata" className="nodata-img"></img>
                    <div className="nodata-text">
                      <p>
                        {intl.get('configSys.click')}
                        <span className="create-span" onClick={this.onCreate}>
                          {intl.get('global.emptyTableCreate')}
                        </span>
                        {intl.get('configSys.addStorage')}
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
          initData={this.state.storageInfo}
        />
        {/* 删除弹窗 */}
        <DeleteModal
          visible={this.state.delModalVisible}
          setVisible={this.closeModal}
          deleteItem={this.state.deleteItem}
          getData={this.initData}
          delType="graph"
        />
        {/* 图谱列表 */}
        <GraphListModal
          visible={this.state.graphModalVisible}
          setVisible={this.closeModal}
          id={this.state.graphListId}
        />
      </div>
    );
  }
}
export default GraphDatabase;

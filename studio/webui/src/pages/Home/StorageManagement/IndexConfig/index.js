import React, { Component } from 'react';
import intl from 'react-intl-universal';
import { Table, Button, message, Dropdown, Menu } from 'antd';
import { LoadingOutlined, EllipsisOutlined } from '@ant-design/icons';

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
    graphListId: 0, // 点击索引的id
    checkedInfo: {}, // 保存编辑或查看的存储信息
    orderType: 'updated', // 排序的类型
    order: 1 // 排序 0 升序 1 降序
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
    const { current, pageSize, orderType, order, searchType, searchValue } = this.state;

    const type = orderType || 'updated';
    const sort = order || 1;

    const data = {
      page: current,
      size: pageSize,
      order: `${type}-${sort}`,
      name: searchValue
    };
    const res = await serviceStorageManagement.openSearchGet(data);

    if (res && res.res) {
      this.setState({
        total: res.res.total,
        tableData: res.res.data
      });
    }

    if (res && res.ErrorCode === 'Manager.Common.ServerError') {
      message.error(res.Description);
    }
  };

  /**
   * 根据ID获取数据
   */
  getIndex = async (record, option) => {
    const res = await serviceStorageManagement.openSearchGetById(record.id);

    if (res && res.res) {
      const { ip, port, name, password, user, id } = res.res;

      const data = { port: port[0], ip: ip[0], id, user, name, password };

      this.setState({
        checkedInfo: data,
        visible: true,
        optionType: option,
        optionStorage: record,
        selectKey: 0
      });
    }

    if (res && res.ErrorCode === 'Manager.Opensearch.OSRecordNotFoundError') {
      message.error(intl.get('configSys.NotFoundError'));
    }

    if (res && res.ErrorCode === 'Manager.Common.ServerError') {
      message.error(res.Description);
    }
  };

  /**
   * 新建
   */
  onCreate = () => {
    this.setState({
      visible: true,
      checkedInfo: [],
      optionType: 'create'
    });
  };

  /**
   * 搜索
   */
  onSearch = (e, clear = false) => {
    const { value } = this.searchInput.current.input;

    this.setState(
      {
        searchValue: clear ? '' : value
      },
      () => {
        this.initData();
      }
    );
  };

  /**
   * 页码变化
   */
  currentChange = page => {
    this.setState(
      {
        current: page
      },
      () => {
        this.initData();
      }
    );
  };

  /**
   * 选中毕竟加深
   */
  setSelectKey = id => {
    this.setState({
      selectKey: id
    });
  };

  /**
   * 点击表格排序
   */
  sortOrderChange = (pagination, filters, sorter) => {
    const order = sorter.order === 'descend' ? '1' : '0';

    this.setState(
      {
        order,
        orderType: sorter.field
      },
      () => {
        this.initData();
      }
    );
  };

  /**
   * 关闭弹窗
   */
  closeModal = () => {
    this.setState({
      visible: false,
      delModalVisible: false
    });
  };

  columns = [
    {
      title: (
        <div>
          <span className="table-th-title">{intl.get('configSys.storageName')}</span>
        </div>
      ),
      dataIndex: 'name',
      fixed: 'left',
      ellipsis: true,
      width: 300
    },
    {
      title: (
        <div>
          <span className="table-th-title">{intl.get('configSys.op')}</span>
        </div>
      ),
      fixed: 'left',
      width: 160,
      render: (text, record, index) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="edit"
              onClick={() => {
                this.getIndex(record, 'edit');
              }}
            >
              <span>{intl.get('configSys.Edit')}</span>
            </Menu.Item>
            <Menu.Item
              key="del"
              onClick={() => {
                this.setState({ delModalVisible: true, deleteItem: record, selectKey: 0 });
              }}
            >
              <span>{intl.get('datamanagement.delete')}</span>
            </Menu.Item>
          </Menu>
        );

        return record.name === '内置opensearch' ? (
          <span className="icon-sub">-&nbsp;-</span>
        ) : (
          <Dropdown
            overlay={menu}
            trigger={['click']}
            overlayClassName="index-table-overlay"
            onVisibleChange={visible => (visible ? this.setSelectKey(record.id) : this.setSelectKey(0))}
          >
            <span className="icon-wrap">
              <EllipsisOutlined className="ellipsis-icon" />
            </span>
          </Dropdown>
        );
      }
    },
    {
      title: (
        <div>
          <span className="table-th-title">{intl.get('configSys.username')}</span>
        </div>
      ),
      dataIndex: 'user',
      width: 190
    },
    {
      title: (
        <div>
          <span className="table-th-title"> {intl.get('userManagement.createTime')}</span>
        </div>
      ),
      dataIndex: 'created',
      width: 330,
      render: (text, record, index) => {
        return <div>{timeFormat.timeFormat(text)}</div>;
      },
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend']
    },
    {
      title: (
        <div>
          <span className="table-th-title">{intl.get('graphList.finalOperatorTime')}</span>
        </div>
      ),
      dataIndex: 'updated',
      width: 238,
      render: (text, record, index) => {
        return <div>{timeFormat.timeFormat(text)}</div>;
      },
      sorter: true,
      defaultSortOrder: 'descend',
      sortDirections: ['ascend', 'descend', 'ascend']
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
            dataSource={tableData}
            columns={this.columns}
            pagination={{
              current,
              total,
              pageSize,
              onChange: this.currentChange,
              className: 'index-table-pagination ',
              showTotal: total => intl.get('userManagement.total', { total }),
              showTitle: false,
              showSizeChanger: false
            }}
            rowKey={record => record.id}
            rowClassName={record => record.id === selectKey && 'selectRow'}
            tableLayout="fixed"
            loading={
              loading
                ? {
                    indicator: antIconBig,
                    wrapperClassName: 'dataSource-Loading'
                  }
                : false
            }
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
            onChange={this.sortOrderChange}
            scroll={{ x: '100%' }}
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

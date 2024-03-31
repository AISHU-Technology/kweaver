import React, { useEffect, useMemo, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory, useLocation } from 'react-router-dom';
import { Button, Table, Modal, Popover, message, Tooltip, Dropdown, Menu } from 'antd';

import { GRAPH_STATUS, PERMISSION_KEYS } from '@/enums';
import { getParam } from '@/utils/handleFunction';
import serviceGraphDetail from '@/services/graphDetail';
import servicesPermission from '@/services/rbacPermission';
import servicesVisualAnalysis from '@/services/visualAnalysis';
import cognitiveSearchService from '@/services/cognitiveSearch';

import IconFont from '@/components/IconFont';
import TipModal from '@/components/TipModal';
import SearchInput from '@/components/SearchInput';

import kong from '@/assets/images/kong.svg';
import emptyImg from '@/assets/images/create.svg';
import noResImg from '@/assets/images/noResult.svg';
import './style.less';

const ORDER_MENU = [
  { id: 'create_time', intlText: 'knowledge.byCreate' },
  { id: 'update_time', intlText: 'knowledge.byUpdate' },
  { id: 'canvas_name', intlText: 'knowledge.byName' }
];
const AnalysisTable = (props: any) => {
  const { tableState, selectedGraph, ad_graphStatus, dataSource, kwLang } = props;
  const { onRefreshLeftSpace, onChangeState } = props;
  const history = useHistory(); // 路由
  const location = useLocation();
  const id = useMemo(() => getParam('id'), [location?.search]);

  const [selectedRowKeys, setSelectedRowKeys] = useState<any>();
  const [deleteInfo, setDeleteInfo] = useState<any>({ visible: false, type: 'one', id: '' });
  const [configGraph, setConfigGraph] = useState<any>([]); // 可分析的图谱
  const isGraphNormal = ad_graphStatus === GRAPH_STATUS.NORMAL || selectedGraph?.status === GRAPH_STATUS.NORMAL;
  const isAnalysis = useMemo(() => {
    return isGraphNormal || _.includes(configGraph, selectedGraph?.id);
  }, [configGraph]);

  useEffect(() => {
    getConfigGraph();
  }, []);

  const getConfigGraph = async () => {
    const { res } = (await cognitiveSearchService.getKgList(id)) || {};
    // bug451083 历史任务成功、图谱可使用
    const gId = _.map(res?.df, item => item?.kgconfid);
    setConfigGraph(gId);
  };

  /**
   * @description 搜索分析
   */
  const searchGraph = (e: any) => {
    onChangeState({ page: 1, query: e?.target?.value });
  };

  /**
   * 悬停查看信息
   */
  const overlayUser = (name: string) => {
    return (
      <div className="kw-align-center">
        <div className="kw-mr-2 userIcon kw-center">
          <IconFont type="icon-dengluzhanghu" style={{ color: '#a0a9b6' }}></IconFont>
        </div>
        <div>
          <div className="kw-c-text">{name}</div>
          {/* <div className="kw-c-subtext">{email}</div> */}
        </div>
      </div>
    );
  };

  /**
   * 删除
   * @param c_ids 画布id
   */
  const deleteData = async (c_ids: any) => {
    try {
      const res = await servicesVisualAnalysis.visualAnalysisDelete({ c_ids });
      res && message.success(intl.get('exploreAnalysis.delSuccess'));
      onChangeState({});
      setDeleteInfo({ visible: false });
    } catch (err) {
      const { Description } = err.data || {};
      Description && message.error(Description);
    }
  };

  const columns: any = [
    {
      title: intl.get('exploreAnalysis.name'),
      dataIndex: 'canvas_name',
      ellipsis: true,
      width: 296,
      render: (text: any, record: any) => (
        <span
          className="kw-pointer"
          title={text}
          onClick={() => onToPageExplore({ opType: 'edit', exId: record?.c_id, kg: record?.kg }, false)}
        >
          {text}
        </span>
      )
    },
    {
      title: intl.get('exploreAnalysis.description'),
      dataIndex: 'canvas_info',
      ellipsis: true,
      width: 296,
      render: (text: any) => (
        <>
          {text ? (
            <span title={text}>{text}</span>
          ) : (
            <span className="no-description" title={intl.get('exploreAnalysis.noDescription')}>
              {intl.get('exploreAnalysis.noDescription')}
            </span>
          )}
        </>
      )
    },
    {
      title: intl.get('exploreAnalysis.creator'),
      dataIndex: ['create_user', 'user_name'],
      ellipsis: true,
      width: 220,
      render: (text: any, record: any) => {
        return (
          <Popover
            placement="bottomLeft"
            overlayClassName="usertooltip"
            content={overlayUser(text)}
            getPopupContainer={() => document.getElementById('analysisTableRoot')!}
          >
            <div className="popover-icon">{text}</div>
            {/* <div className="kw-c-subtext kw-ellipsis">{record.create_user.email}</div> */}
          </Popover>
        );
      }
    },
    {
      title: intl.get('exploreAnalysis.createTime'),
      dataIndex: 'create_time',
      ellipsis: true,
      width: 220
    },
    {
      title: intl.get('exploreAnalysis.finalOperator'),
      dataIndex: ['update_user', 'user_name'],
      ellipsis: true,
      width: 220,
      render: (text: any, record: any) => {
        return (
          <Popover
            placement="bottomLeft"
            overlayClassName="usertooltip"
            content={overlayUser(text)}
            getPopupContainer={() => document.getElementById('analysisTableRoot')!}
          >
            <div className="popover-icon">{text}</div>
            {/* <div className="kw-c-subtext kw-ellipsis">{record.create_user.email}</div> */}
          </Popover>
        );
      }
    },
    {
      title: intl.get('exploreAnalysis.finalOperatorTime'),
      dataIndex: 'update_time',
      ellipsis: true,
      width: 220
    },
    {
      title: intl.get('exploreAnalysis.operate'),
      dataIndex: 'operate',
      width: kwLang === 'zh-CN' ? 220 : 250,
      fixed: 'right',
      render: (_: unknown, record: any) => {
        return (
          <div className="op-column">
            <Button
              type="link"
              onClick={() => onToPageExplore({ opType: 'edit', exId: record?.c_id, kg: record?.kg }, false)}
            >
              {intl.get('exploreAnalysis.edit')}
            </Button>
            <Button
              type="link"
              onClick={() => onToPageExplore({ opType: 'copy', exId: record?.c_id, kg: record?.kg }, false)}
            >
              {intl.get('exploreAnalysis.copy')}
            </Button>
            <Button type="link" onClick={() => setDeleteInfo({ visible: true, type: 'one', id: [record?.c_id] })}>
              {intl.get('exploreAnalysis.delete')}
            </Button>
          </div>
        );
      }
    }
  ];

  /**
   * 点击下拉框
   */
  const selectMenu = (e: any) => {
    const { order_field, order_type } = tableState;
    if (e.key === order_field) {
      const or = order_type === 'desc' ? 'asc' : 'desc';
      onChangeState({ order_type: or });
      return;
    }
    onChangeState({ order_field: e.key });
  };

  /**
   * 下拉筛选菜单
   */
  const menuRule = (
    <Menu className="analysis-menu-select" onClick={selectMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, intlText } = item;
        const isSelectClass = tableState?.order_field === id ? 'menu-selected' : '';
        const iconDirection = tableState?.order_type === 'desc' ? '' : 'direction';

        return (
          <Menu.Item key={id} className={isSelectClass}>
            <div className="select kw-align-center">
              <div className="icon">
                {tableState?.order_field === id ? (
                  <IconFont type="icon-fanhuishangji" className={iconDirection} />
                ) : null}
              </div>
              <div>{intl.get(intlText)}</div>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const onToPageExplore = async (data: any = {}, isRun = true) => {
    // DATA-354277 dataPermission 入参dataIds kg_conf_id -> id
    const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds: [String(selectedGraph?.id)] };
    // const result = await servicesPermission.dataPermission(postData);
    // const codes = result?.res?.[0]?.codes || [];
    // if (!_.includes(codes, PERMISSION_KEYS.KG_VIEW)) {
    //   Modal.warning({
    //     title: intl.get('exploreAnalysis.notHaveKGAuthor'),
    //     onOk: () => onRefreshLeftSpace()
    //   });
    //   return;
    // }

    const { kgconfid, name } = selectedGraph;
    const { opType = 'add', exId = '', kg = '' } = data;
    if (isRun) {
      try {
        await serviceGraphDetail.graphGetInfoOnto({ graph_id: selectedGraph?.id || kg?.kg_id });
      } catch (err) {
        const { type, response } = err as any;
        if (type === 'message') message.error(response?.Description || '');
        return;
      }
    }
    if (opType === 'add') {
      // params增加graphConfId ==> DATA-354277 解决历史遗留问题
      history.push(
        `/knowledge/explore?knId=${id}&opType=${opType}&graphId=${kg?.kg_id || selectedGraph?.id}&graphConfId=${
          selectedGraph?.id
        }&kg_name=${name}`
      );
    } else {
      // params增加graphConfId ==> DATA-354277 解决历史遗留问题
      history.push(
        `/knowledge/explore?knId=${id}&opType=${opType}&graphId=${kg?.kg_id}&graphConfId=${selectedGraph?.id}&c_id=${exId}&kg_name=${name}`
      );
    }
  };

  /**
   * 定义复选框
   */
  const rowSelection: any = {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys,
    onChange: (rowKeys: any) => setSelectedRowKeys(rowKeys),
    preserveSelectedRowKeys: true
  };

  return (
    <div className="analysisTableRoot" id="analysisTableRoot">
      <div className="kw-mb-5 kw-space-between">
        <div>
          <Button type="primary" disabled={!isAnalysis} onClick={() => onToPageExplore({}, true)}>
            <IconFont type="icon-Add" />
            {intl.get('exploreAnalysis.create')}
          </Button>
          <Button
            className="kw-ml-2"
            disabled={_.isEmpty(selectedRowKeys)}
            onClick={() => setDeleteInfo({ visible: true, type: 'more', id: selectedRowKeys })}
          >
            <IconFont type="icon-lajitong" />
            {intl.get('global.delete')}
          </Button>
        </div>
        <div className="kw-align-center">
          <SearchInput
            placeholder={intl.get('exploreAnalysis.analysisName')}
            onChange={e => {
              e.persist();
              searchGraph(e);
            }}
            debounce
          />
          <Dropdown
            className="dropdown"
            overlay={menuRule}
            trigger={['click']}
            placement="bottomRight"
            getPopupContainer={triggerNode => triggerNode.parentElement!}
          >
            <Tooltip title={intl.get('exploreAnalysis.sort')} placement="top">
              <Button className="kw-ml-3" style={{ minWidth: 32, padding: 0 }}>
                <IconFont type="icon-paixu11" style={{ fontSize: 18 }} />
              </Button>
            </Tooltip>
          </Dropdown>
        </div>
      </div>
      <Table
        className="analysisTable"
        dataSource={dataSource}
        columns={columns}
        rowSelection={rowSelection}
        rowKey={record => record?.c_id}
        scroll={{ x: '100%' }}
        pagination={{
          total: tableState?.total,
          current: tableState?.page,
          pageSize: 10,
          showTitle: false,
          showSizeChanger: false,
          onChange: page => onChangeState({ page }),
          showTotal: total => intl.get('exploreAnalysis.allCanvases', { total })
        }}
        locale={{
          emptyText: !(tableState?.kg_name === '' && !tableState?.query) ? (
            <div className="kw-mt-9 kw-mb-9">
              <img className="kw-tip-img" alt="nodata" src={noResImg} />
              <div className="kw-c-text">{intl.get('global.noResult')}</div>
            </div>
          ) : isAnalysis ? (
            <div className="kw-mt-9 kw-mb-9">
              <img className="kw-tip-img" alt="nodata" src={emptyImg} />
              <div className="text-content">
                {intl.get('exploreAnalysis.clickAdd').split('|')[0]}
                <Button
                  type="link"
                  className="kw-pointer"
                  disabled={!isAnalysis}
                  style={{ padding: 0, minWidth: 0 }}
                  onClick={() => onToPageExplore({}, true)}
                >
                  {intl.get('exploreAnalysis.clickAdd').split('|')[1]}
                </Button>
                {intl.get('exploreAnalysis.clickAdd').split('|')[2]}
              </div>
            </div>
          ) : (
            <div className="kw-mt-9 kw-mb-9 kw-column-center">
              <img src={kong} alt="nodata" className="kw-tip-img" />
              <span className="kw-c-text">{intl.get('exploreAnalysis.cannotUseAnalysis')}</span>
            </div>
          )
        }}
      />
      {/* 删除二次确认弹窗 */}
      <TipModal
        visible={deleteInfo.visible}
        closable={false}
        title={intl.get('exploreAnalysis.deleteCanvas')}
        content={
          deleteInfo.type === 'more'
            ? intl.get('exploreAnalysis.allCanvases', {
                total: selectedRowKeys?.length
              })
            : intl.get('exploreAnalysis.deleteContent')
        }
        onCancel={() => setDeleteInfo({ visible: false, type: 'one' })}
        onOk={() => deleteData(deleteInfo.id)}
      />
    </div>
  );
};
export default AnalysisTable;

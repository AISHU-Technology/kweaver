import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Input, Modal, Button, message, Tooltip, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, ExclamationCircleFilled } from '@ant-design/icons';

import HOOK from '@/hooks';
import snapshotsService from '@/services/snapshotsService';
import IconFont from '@/components/IconFont';
import PaginationCommon from '@/components/PaginationCommon';
import SnapshootsCreate from './SnapshootsCreate';

import ImageEmpty from '@/assets/images/empty.svg';
import ImageNoResult from '@/assets/images/noResult.svg';
import './style.less';
import { graphPolyfill } from '../../../polyfill';

const SnapshootsLine = (props: any) => {
  const { item, onSnapshootsInset, onSnapshootsEdit, onSnapshootsDelete } = props;

  return (
    <div className="snapshotsLineRoot">
      <div className="lineText" onClick={() => onSnapshootsInset(item)}>
        {item.snapshot_name}
      </div>
      <div>
        <Tooltip placement="bottomRight" title={intl.get('exploreGraph.snapshots.edit')}>
          <IconFont className="lineIcon" type="icon-edit" onClick={(e: any) => onSnapshootsEdit(item)} />
        </Tooltip>

        <Popconfirm
          title={intl.get('exploreGraph.snapshots.areYouSureYouWantToDelete')}
          placement="topRight"
          onConfirm={(e: any) => onSnapshootsDelete(item?.s_id)}
          getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
        >
          <Tooltip placement="bottomRight" title={intl.get('exploreGraph.snapshots.delete')}>
            <IconFont className="lineIcon" type="icon-lajitong" />
          </Tooltip>
        </Popconfirm>
      </div>
    </div>
  );
};

const ModelSnapshots = (props: any) => {
  const { selectedItem } = props;
  const serviceData = {
    kg_id: selectedItem?.detail?.kg?.kg_id,
    service_id: selectedItem?.detail?.kg?.service_id
  };

  const { onChangeData, onClosePopover, onOpenLeftDrawer } = props;
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [updateData, setUpdateData] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  const { pagination, onUpdatePagination } = HOOK.PaginationConfig({ pageSize: 10 });
  const { page, count, pageSize } = pagination;

  useEffect(() => {
    if (props.isVisible) {
      getSnapshots({ queryString: filter });
    } else {
      setFilter('');
      onUpdatePagination({ ...pagination, page: 1 });
    }
  }, [props.isVisible, page]);
  /** 获取快照列表 */
  const getSnapshots = async ({ queryString, queryPage = page }: any) => {
    try {
      const getData: any = {
        kg_id: serviceData.kg_id,
        service_id: serviceData.service_id,
        page: queryPage,
        size: pageSize
      };
      if (queryString) getData.query = queryString;
      const { res } = (await snapshotsService.snapshotsGetList(getData)) || {};
      if (!res) return;
      const { count, snapshots } = res;
      onUpdatePagination({ count, page: queryPage });
      setItems(snapshots);
    } catch (error) {
      if (error.type !== 'message') return;
      if (error?.response?.ErrorDetails?.[0]?.detail) {
        message.error(error?.response?.ErrorDetails?.[0]?.detail);
      } else {
        message.error(error?.response?.ErrorCode);
      }
    }
  };

  /** 搜索change */
  const onChangeInput = (e: any) => {
    const value = e.target.value;
    setFilter(value);
    getSnapshots({ queryString: value });
  };

  /** 切换页面 */
  const onChangePagination = (newPagination: any) => {
    onUpdatePagination(newPagination);
  };

  /** 创建快照相关 */
  const onOpenCreateModal = () => setIsVisible(true);
  const onCloseCreateModal = () => {
    setUpdateData({});
    setIsVisible(false);
  };
  const onModalOk = (type: string) => {
    const successMessage: any = {
      create: intl.get('exploreGraph.snapshots.addSuccess'),
      update: intl.get('exploreGraph.snapshots.updateSuccess')
    };
    message.success(successMessage[type]);
    onCloseCreateModal();
  };

  /** 导入快照, 全部显示隐藏的节点 */
  const onSnapshootsInset = async (data: any) => {
    try {
      const { res } = await snapshotsService.snapshotsGetById(data.s_id, serviceData.kg_id);
      if (!res) return;
      const detail = JSON.parse(res.snapshot_body);
      const nodes = selectedItem?.graph.current.getNodes();
      const edges = selectedItem?.graph.current.getEdges();

      if (nodes.length === 0) {
        const graphData = {
          nodes: _.map(detail?.graphData?.nodes || [], item => ({ ...item, x: item.x, y: item.y, hide: false })),
          edges: _.map(detail?.graphData?.edges || [], item => ({ ...item, hide: false }))
        };
        graphPolyfill(graphData);
        onChangeData({ type: 'layoutConfig', data: detail.layoutConfig });
        onChangeData({ type: 'graphData', data: graphData });
        onChangeData({ type: 'sliced', data: detail.sliced || [] });
        onOpenLeftDrawer('');
      } else {
        Modal.confirm({
          closable: true,
          title: intl.get('exploreGraph.snapshots.areYouSureToLoadTheSnapshot'),
          icon: <ExclamationCircleFilled style={{ color: 'red' }} />,
          content: intl.get('exploreGraph.snapshots.pleaseExerciseLoading'),
          zIndex: 2000,
          onOk: () => {
            onChangeData({ type: 'delete', data: { nodes, edges, length: nodes.length + edges.length } });
            setTimeout(() => {
              const graphData = {
                nodes: _.map(detail?.graphData?.nodes || [], item => ({ ...item, x: item.x, y: item.y, hide: false })),
                edges: _.map(detail?.graphData?.edges || [], item => ({ ...item, hide: false }))
              };
              onChangeData({ type: 'layoutConfig', data: detail.layoutConfig });
              onChangeData({ type: 'graphData', data: graphData });
              onChangeData({ type: 'sliced', data: detail.sliced || [] });
              onOpenLeftDrawer('');
            }, 1000);
          }
        });
      }
    } catch (error) {
      if (error.type !== 'message') return;
      if (error?.response?.ErrorDetails?.[0]?.detail) {
        message.error(error?.response?.ErrorDetails?.[0]?.detail);
      } else {
        message.error(error?.response?.ErrorCode);
      }
    }
  };

  /** 编辑快照 */
  const onSnapshootsEdit = (data: any) => {
    onClosePopover();
    setIsVisible(true);
    if (data?.snapshot_info === '--') data.snapshot_info = '';
    setUpdateData(data);
  };

  /** 删除快照 */
  const onSnapshootsDelete = async (id: string) => {
    try {
      const result = await snapshotsService.snapshotsPostDelete(Number(id), { kg_id: serviceData.kg_id });
      if (result?.res.s_id) {
        message.success(intl.get('exploreGraph.snapshots.deleteSuccess'));
        getSnapshots({ queryString: filter, queryPage: 1 });
      }
    } catch (error) {
      if (error.type !== 'message') return;
      if (error?.response?.ErrorDetails?.[0]?.detail) {
        message.error(error?.response?.ErrorDetails?.[0]?.detail);
      } else {
        message.error(error?.response?.ErrorCode);
      }
    }
  };

  return (
    <div
      className="modelSnapshotsRoot"
      style={count > pageSize ? { height: 556 } : { height: 517 }}
      onClick={(event: any) => {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation(); // 可控 Popover, 禁止冒泡
        return false;
      }}
    >
      <div className="kw-mb-3 kw-border-b kw-align-center" style={{ padding: '0px 16px', paddingBottom: 10 }}>
        <Button
          type="link"
          icon={<PlusOutlined />}
          style={{ padding: 0 }}
          onClick={() => {
            onClosePopover();
            onOpenCreateModal();
          }}
        >
          {intl.get('exploreGraph.snapshots.newSnapshot')}
        </Button>
      </div>
      <div className="kw-mb-2" style={{ padding: '0px 16px' }}>
        <Input
          value={filter}
          style={{ height: 32 }}
          placeholder={intl.get('exploreGraph.snapshots.searchSnapshotName')}
          prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
          onChange={onChangeInput}
        />
      </div>
      <div>
        {_.isEmpty(items) ? (
          filter ? (
            <div className="kw-column-center" style={{ marginTop: 16 }}>
              <img src={ImageNoResult} />
              <div className="d-c-text">{intl.get('exploreGraph.snapshots.sorryNoContentsFound')}</div>
            </div>
          ) : (
            <div className="kw-column-center" style={{ marginTop: 34 }}>
              <img src={ImageEmpty} />
              <div className="d-c-text">{intl.get('exploreGraph.snapshots.noSnapshot')}</div>
            </div>
          )
        ) : (
          <React.Fragment>
            {_.map(items, (item: any) => {
              return (
                <SnapshootsLine
                  key={item.s_id}
                  item={item}
                  onSnapshootsInset={onSnapshootsInset}
                  onSnapshootsEdit={onSnapshootsEdit}
                  onSnapshootsDelete={onSnapshootsDelete}
                />
              );
            })}
            {count > pageSize && (
              <PaginationCommon
                className="paginationCommon"
                antProps={{ size: 'small' }}
                paginationData={pagination}
                onChange={onChangePagination}
              />
            )}
          </React.Fragment>
        )}
      </div>
      {isVisible && (
        <SnapshootsCreate
          updateData={updateData}
          serviceData={serviceData}
          selectedItem={selectedItem}
          onOk={onModalOk}
          onCancel={onCloseCreateModal}
        />
      )}
    </div>
  );
};

export default ModelSnapshots;

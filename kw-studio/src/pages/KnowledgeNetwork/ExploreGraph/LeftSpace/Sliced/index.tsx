import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Dropdown, Button, Checkbox, ConfigProvider, Tooltip } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { COLORS_CARD } from '@/enums';
import HELPER from '@/utils/helper';
import IconFont from '@/components/IconFont';
import NoDataBox from '@/components/NoDataBox';
import SearchInput from '@/components/SearchInput';
import { tipModalFunc } from '@/components/TipModal';
import { fuzzyMatch } from '@/utils/handleFunction';
import { LeftDrawer } from '../components';
import OperateModal from './OperateModal';
import Result from './Result';
import ErrorTip from './ErrorTip';
import { querySubGroup, getShowKeys } from './assistant';
import './style.less';

const COLORS_LENGTH = COLORS_CARD.SUB_GROUP_COLORS.length;

type SubGroupItem = {
  id: string;
  name: string;
  nodes: string[];
  edges: string[];
  from: 'select' | 'subgroup' | 'path'; // 子图来源, selected表示自由选中
};

const Sliced = (props: any) => {
  const { className, selectedItem } = props;
  const { onChangeData, onCloseLeftDrawer, onChangeGraphItems } = props;
  const [footerRef, setFooterRef] = useState<any>();
  const [searchValue, setSearchValue] = useState(''); // 搜索关键字
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]); // 选中的切片
  const [operateInfo, setOperateInfo] = useState({ visible: false, data: {} }); // 保存弹窗
  const [resultInfo, setResultInfo] = useState({ visible: false, data: [] as any[] }); // 结果面板

  // 显示的切片列表
  const showedList = useMemo(() => {
    const total = [...(selectedItem?.sliced || [])];
    if (!searchValue) return total;
    return _.filter(total, d => fuzzyMatch(searchValue, d.name));
  }, [selectedItem?.sliced, searchValue]);

  // 全选的状态
  const checkStatus = useMemo(() => {
    let isAll = false;
    let isPart = false;
    if (!showedList.length || !selectedKeys.length) return { isAll, isPart };
    let checkedCount = 0;
    _.forEach(showedList, (d, i) => {
      const isCheck = selectedKeys.includes(d.id);
      if (isCheck) checkedCount += 1;
      if (checkedCount && checkedCount < i + 1) {
        isPart = true;
        return false;
      }
    });
    isAll = checkedCount === showedList.length;
    return { isAll, isPart: isAll ? false : isPart };
  }, [showedList, selectedKeys]);

  useEffect(() => {
    if (selectedItem?.tabFlag && !_.isEmpty(selectedItem?.sliced)) {
      handleAdd(_.map(selectedItem.sliced, s => s.id));
      selectedItem.tabFlag = undefined;
      onChangeGraphItems?.((pre: any[]) => {
        _.forEach(pre, item => {
          item.key === selectedItem.key && (item.tabFlag = undefined);
        });
      });
    }
  }, [selectedItem.key]);

  /**
   * 在新画布打开切片
   * @param item 切片数据
   */
  const openNewCanvas = (item: any) => {
    const sliced = selectedItem.sliced;
    const openData = _.isArray(item) ? _.filter(sliced, d => _.includes(item, d.id)) : [item];
    onChangeData({
      type: 'newCanvas',
      data: {
        sliced: _.cloneDeep(openData),
        kgInfo: { kg_id: selectedItem?.detail?.kg?.kg_id, kg_name: selectedItem?.detail?.kg?.name },
        leftDrawerKey: 'sliced',
        tabFlag: String(+new Date())
      }
    });
    onCloseLeftDrawer();
  };

  /**
   * 添加到当前画布
   * @param item 切片数据
   * @param action 添加方式
   */
  const handleAdd = async (item: Record<string, any> | string[], action?: string) => {
    const kg_id = selectedItem?.detail?.kg?.kg_id;
    if (!kg_id) return;
    const addGroup = _.isArray(item) ? _.filter(selectedItem?.sliced, d => _.includes(item, d.id)) : [item];
    onChangeData({ type: 'exploring', data: { isExploring: true } });
    onChangeData({ type: 'add', data: { nodes: [], edges: [], length: 0, unClose: true } });
    const [graph, groupRes, hasDeletedGroupIds] = await querySubGroup(addGroup, kg_id);
    // 添加点边被删除的标记
    let markedSliced = [];
    if (hasDeletedGroupIds.length) {
      markedSliced = _.map(selectedItem?.sliced, d => {
        let hasDeleted = d.hasDeleted;
        hasDeletedGroupIds.includes(d.id) && (hasDeleted = true);
        return { ...d, hasDeleted };
      });
    }
    onChangeData({ type: 'exploring', data: { isExploring: false } });
    onChangeData({
      type: 'add',
      data: { ...graph, length: graph.nodes.length + graph.edges.length, action, unClose: true }
    });
    markedSliced.length && onChangeData({ type: 'sliced', data: markedSliced });
    setResultInfo({ visible: true, data: groupRes });
    selectedItem?.graph?.current?.__removeSubGroups();
    setTimeout(() => {
      let maxNodes: any[] = []; // 取点最多的子图居中
      _.forEach(groupRes, (g, index) => {
        if (maxNodes.length < g.nodesDetail?.length) {
          maxNodes = g.nodesDetail;
        }
        if (g.slicedType !== 'subgraph') return;
        const i = index % COLORS_LENGTH;
        const fill = HELPER.hexToRgba(COLORS_CARD.SUB_GROUP_COLORS[i], 0.04);
        const stroke = HELPER.hexToRgba(COLORS_CARD.SUB_GROUP_COLORS[i], 0.1);
        selectedItem?.graph?.current?.__createSubGroup({
          mode: 'dashed',
          id: g.id,
          name: g.name,
          members: _.map(g.nodesDetail, n => n.id),
          info: { ...g, groupType: 'subgraph' },
          from: 'sliced',
          style: { fill, stroke }
        });
      });
      const centerNode = maxNodes[Math.floor(maxNodes.length / 2)];
      centerNode &&
        selectedItem.graph.current.focusItem(centerNode.id, true, {
          easing: 'easeCubic',
          duration: 800
        });
    }, 0);
  };

  /**
   * 点击下拉
   * @param item 切片数据
   * @param key 操作key
   */
  const onMenuClick = (item: Record<string, any> | string[], key: string) => {
    if (key === 'newCanvas') {
      return openNewCanvas(item);
    }
    handleAdd(item, key);
  };

  /**
   * 编辑切片
   * @param item 切片数据
   */
  const onEdit = (item: any) => {
    setOperateInfo({ visible: true, data: { ...item } });
  };

  /**
   * 删除切片
   * @param keys 删除的切片id数组
   */
  const onDelete = async (keys: string[]) => {
    if (!keys.length) return;
    const isOk = await tipModalFunc({
      title: intl.get('createEntity.sureDelete'),
      content: intl.get('createEntity.sureDeleteInfo'),
      closable: false
    });
    if (!isOk) return;
    const newList: any[] = [];
    const deleted: any[] = [];
    _.forEach(selectedItem?.sliced, d => {
      keys.includes(d.id) ? deleted.push(d) : newList.push(d);
    });
    onChangeData({ type: 'sliced', data: newList });
    _.forEach(deleted, g => {
      selectedItem?.graph?.current?.__removeSubGroup(g.id);
    });
  };

  /**
   * 防抖搜索
   */
  const debounceSearch = _.debounce(value => {
    setSearchValue(value);
  }, 100);

  /**
   * 勾选
   * @param isCheck 是否选中
   * @param item 切片数据
   */
  const onCheck = (isCheck: boolean, item: any) => {
    setSelectedKeys(pre => (isCheck ? [...pre, item.id] : pre.filter(id => id !== item.id)));
  };

  /**
   * 全选
   * @param isCheck 是否选中
   */
  const onCheckAll = (isCheck: boolean) => {
    const showKeys = _.map(showedList, d => d.id);
    setSelectedKeys(pre => (isCheck ? _.uniq([...pre, ...showKeys]) : _.filter(pre, id => !showKeys.includes(id))));
  };

  return (
    <LeftDrawer
      className={classnames('layoutRoot', className)}
      title={
        <span
          className={classnames({ 'kw-pointer': resultInfo.visible })}
          onClick={() => resultInfo.visible && setResultInfo({ visible: false, data: [] as any[] })}
        >
          {resultInfo.visible && <LeftOutlined className="kw-mr-2" />}
          {intl.get('exploreGraph.sliceTitle')}
        </span>
      }
      scaling={resultInfo.visible}
      onCloseLeftDrawer={onCloseLeftDrawer}
    >
      <div className="sliced-panel-root">
        <div className="list-box kw-h-100" style={{ display: resultInfo.visible ? 'none' : undefined }}>
          <SearchInput
            className="kw-mt-4 kw-mb-4"
            autoWidth
            placeholder={intl.get('exploreGraph.searchSlicePlace')}
            onChange={e => {
              e.persist();
              debounceSearch(e.target.value);
            }}
          />
          {!!showedList.length && (
            <div className="kw-mb-4">
              <Checkbox
                className="kw-ml-3 kw-mr-3"
                checked={checkStatus.isAll}
                indeterminate={checkStatus.isPart}
                onChange={e => onCheckAll(e.target.checked)}
              >
                {intl.get('global.checkAll')}
              </Checkbox>
            </div>
          )}
          <div className="list-wrap">
            {!showedList.length && !searchValue && <NoDataBox.NO_CONTENT text={intl.get('exploreGraph.notSlice')} />}
            {!showedList.length && searchValue && <NoDataBox.NO_RESULT />}
            {_.map(showedList, item => {
              const checked = _.includes(selectedKeys, item.id);
              return (
                <div key={item.id} className="list-item kw-align-center">
                  <Checkbox
                    className="kw-ml-3 kw-mr-3"
                    checked={checked}
                    onChange={e => onCheck(e.target.checked, item)}
                  />
                  <span className="s-name kw-ellipsis" title={item.name}>
                    {item.name}
                  </span>
                  <Dropdown
                    placement="bottomRight"
                    getPopupContainer={triggerNode => triggerNode.parentElement!}
                    destroyPopupOnHide
                    overlay={
                      <Menu onClick={({ key }) => onMenuClick(item, key)} style={{ width: 150 }}>
                        <Menu.Item key="add">{intl.get('exploreGraph.overlayAdd')}</Menu.Item>
                        <Menu.Item key="cover">{intl.get('exploreGraph.coverAdd')}</Menu.Item>
                        {selectedItem?.componentOrigin !== 'AnalysisServiceConfig' && (
                          <Menu.Item key="newCanvas">{intl.get('exploreGraph.toNewCanvas')}</Menu.Item>
                        )}
                      </Menu>
                    }
                  >
                    <IconFont type="icon-tianjia" className="op-icon kw-pointer kw-mr-3" />
                  </Dropdown>
                  <Tooltip title={intl.get('global.edit')}>
                    <IconFont type="icon-edit" className="op-icon kw-mr-3" onClick={() => onEdit(item)} />
                  </Tooltip>
                  <Tooltip title={intl.get('global.delete')}>
                    <IconFont type="icon-lajitong" className="op-icon kw-mr-3" onClick={() => onDelete([item.id])} />
                  </Tooltip>
                  {item.hasDeleted && <ErrorTip className="kw-mr-3" />}
                </div>
              );
            })}
          </div>
          <div ref={setFooterRef} className="footer-btn-box">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button
                type="default"
                disabled={!(checkStatus.isAll || checkStatus.isPart)}
                onClick={() => onDelete(getShowKeys(showedList, selectedKeys))}
              >
                {intl.get('global.delete')}
              </Button>
              <Dropdown
                destroyPopupOnHide
                disabled={!(checkStatus.isAll || checkStatus.isPart)}
                overlay={
                  <Menu
                    onClick={({ key }) => onMenuClick(getShowKeys(showedList, selectedKeys), key)}
                    style={{ width: (footerRef?.clientWidth - 8) / 2 }}
                  >
                    <Menu.Item key="add">{intl.get('exploreGraph.overlayAdd')}</Menu.Item>
                    <Menu.Item key="cover">{intl.get('exploreGraph.coverAdd')}</Menu.Item>
                    {selectedItem?.componentOrigin !== 'AnalysisServiceConfig' && (
                      <Menu.Item key="newCanvas">{intl.get('exploreGraph.toNewCanvas')}</Menu.Item>
                    )}
                  </Menu>
                }
              >
                <Button type="primary">{intl.get('global.add')}</Button>
              </Dropdown>
            </ConfigProvider>
          </div>
        </div>

        {resultInfo.visible && (
          <Result data={resultInfo.data} selectedItem={selectedItem} onChangeData={onChangeData} />
        )}
      </div>

      <OperateModal
        {...operateInfo}
        type="edit"
        selectedItem={selectedItem}
        onCancel={() => setOperateInfo({ visible: false, data: {} })}
        onChangeData={onChangeData}
      />
    </LeftDrawer>
  );
};

export default (props: any) => (props.visible ? <Sliced {...props} /> : null);

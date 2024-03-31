/**
 * 已保存的策略配置
 * @author Jason.ji
 * @date 2022/05/16
 *
 */

import React, { memo, useState, useEffect, useReducer, forwardRef, useImperativeHandle, useRef } from 'react';
import { Radio, Collapse, Dropdown, Menu, Pagination, Checkbox, message, Tooltip } from 'antd';
import { EllipsisOutlined, LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import VirtualList from 'rc-virtual-list';
import servicesSearchConfig from '@/services/searchConfig';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import TipModal from '@/components/TipModal';
import ScrollBar from '@/components/ScrollBar';
import ConfigModal from '../ConfigModal';
import { ERROR_CODE } from '../StrategyConfig';
import { convertData, initConfig } from '../assistFunction';
import clearIcon from '@/assets/images/clear.svg';
import noResult from '@/assets/images/noResult.svg';
// import kgImg from '@/assets/images/knGraph.svg';
import './style.less';

export interface SavedConfigProps {
  store?: any;
  tabKey?: string;
  kgData: Record<string, any>;
  onEdit?: (config: Record<string, any>) => void;
  notConfigCallback?: (isEmpty: boolean) => void;
}

interface ReducerState {
  maskLoading: boolean;
  searchLoading: boolean;
  query: string;
  page: number;
  total: number;
  dropId: number;
}

// 使用useReducer管理状态变量
const initState: ReducerState = {
  maskLoading: false, // loading遮罩
  searchLoading: false, // 搜索加载中
  query: '', // 搜索关键字
  page: 1, // 当前页码
  total: 0, // 总数
  dropId: 0 // 操作下拉id
};
const reducer = (state: ReducerState, action: Partial<ReducerState>) => ({ ...state, ...action });
const { Panel } = Collapse;
const PAGE_SIZE = 20;
let requestId = 0; // 标记请求
const SAVED = 'saved tab'; // 已保存搜索策略
const DELETE_CODE: Record<string, string> = {
  'EngineServer.ErrRightsErr': 'searchConfig.noAuth', // 无权限
  'EngineServer.ErrKGIDErr': 'searchConfig.graphNoExist' // 图谱不存在
};

const SavedConfig: React.ForwardRefRenderFunction<unknown, SavedConfigProps> = (
  {
    tabKey, // tabs key
    kgData, // 知识网络数据
    onEdit, // 编辑回调
    notConfigCallback // 无数据时的回调
  },
  ref
) => {
  const searchInput = useRef<any>(); // 搜索框
  const [selfState, dispatchState] = useReducer(reducer, initState); // 分页、loading等状态
  const [configList, setConfigList] = useState<any[]>([]); // 所有数据
  const [selectedConfig, setSelectedConfig] = useState<Record<string | number, any>>({}); // 选择的配置
  const [deleteInfo, setDeleteInfo] = useState<{ visible: boolean; id: number }>({ visible: false, id: 0 }); // 删除数据
  const [checkVisible, setCheckVisible] = useState(false); // 查看配置弹窗
  const [checkData, setCheckData] = useState<any>({}); // 查看的配置数据
  const [openKeys, setOpenKeys] = useState<string[]>([]); // 展开的panel key

  // 暴露组件内部方法
  useImperativeHandle(ref, () => ({
    getConfigs,
    getConfig: () => {
      return selectedConfig;
    },
    refresh: () => {
      getConfigs({ ...selfState }, false);
    },
    clear: () => setSelectedConfig({})
  }));

  useEffect(() => {
    if (tabKey !== SAVED) {
      setSelectedConfig({});
      return;
    }

    getConfigs({ ...selfState }, false);
  }, [tabKey]);

  /**
   * 获取配置
   * @param id // 知识网络id
   * @param page // 页码
   * @param query // 搜索关键字
   * @param needLoading // 是否需要loading动画
   */
  const getConfigs: Function = async ({ id, page = 1, query = '' }: any, needLoading = true) => {
    dispatchState({ searchLoading: needLoading, page, query });
    const signId = ++requestId;
    const kId = id || kgData.id;
    const { count, res } =
      (await servicesSearchConfig.fetchConfigList({
        knowledge_network_id: kId,
        page,
        query,
        filter: 'all',
        sort: 'descend',
        size: PAGE_SIZE
      })) || {};

    if (signId < requestId) return;

    dispatchState({ searchLoading: false });

    if (res) {
      if (res.length === 0 && count) {
        const newPage = Math.ceil(count / PAGE_SIZE);

        return getConfigs({ id, page: newPage, query }, needLoading);
      }

      setConfigList(res);
      dispatchState({ total: count });
      needLoading && setOpenKeys([]);
      // 通知父组件数据为空
      notConfigCallback?.(!count && !query && page === 1);
    }

    return res;
  };

  // 搜索
  const onSearch = () => {
    const { value } = searchInput.current.input;
    getConfigs({ query: value });
  };

  // 选择配置
  const onRadioChange = (item: Record<string, any>) => {
    const { kg_id, conf_id } = item;
    const data = { ...selectedConfig };

    data[kg_id]?.conf_id === conf_id ? delete data[kg_id] : (data[kg_id] = item);
    setSelectedConfig(data);
  };

  // 页码变化
  const onPageChange = (page: number) => {
    getConfigs({ ...selfState, page });
  };

  // 点击下拉菜单
  const onMenuClick = ({ key }: any, item: Record<string, any>) => {
    dispatchState({ dropId: 0 });
    key === 'check' && onCheckConfig(item);
    key === 'edit' && onEdit?.(item);
    key === 'delete' && setDeleteInfo({ visible: true, id: item.conf_id });
  };

  /**
   * 下拉菜单可见性变化, 同时触发勾选
   * @param visible 是否可见
   * @param item 操作行
   */
  const onDropChange = (visible: boolean, item: Record<string, any>) => {
    const { kg_id, conf_id } = item;
    const data = { ...selectedConfig };
    dispatchState({ dropId: visible ? conf_id : 0 });

    if (!visible || data[kg_id]?.conf_id === conf_id) return; // 已选, 忽略

    data[kg_id] = item;
    setSelectedConfig(data);
  };

  /**
   * 删除配置
   */
  const onDelete = async () => {
    const { res, ErrorCode, Description } =
      (await servicesSearchConfig.deleteAdvConfig({ conf_ids: [deleteInfo.id] })) || {};

    if (res) {
      message.success(intl.get('global.deleteSuccess'));
      setDeleteInfo({ visible: false, id: 0 });
      // 更新已选配置
      const arr = Object.entries(selectedConfig).find(([_, value]) => value.conf_id === deleteInfo.id);

      if (arr) {
        const data = { ...selectedConfig };
        delete data[arr[0]];
        setSelectedConfig(data);
      }
    }

    getConfigs({ ...selfState }, false);
    DELETE_CODE[ErrorCode]
      ? message.error(intl.get(DELETE_CODE[ErrorCode]))
      : Description && message.error(Description);
  };

  /**
   * 清除已选配置
   */
  const onClear = () => {
    if (!Object.values(selectedConfig).length) return;

    setSelectedConfig({});
    message.success(intl.get('searchConfig.cleared'));
  };

  /**
   * 查看配置
   * @param item 配置数据
   */
  const onCheckConfig = async (item: Record<string, any>) => {
    dispatchState({ maskLoading: true });
    const {
      res: configRes,
      ErrorCode: configCode,
      Description: configDes
    } = (await servicesSearchConfig.fetchConfig(item.conf_id)) || {};

    if (configRes) {
      const { kg_id, conf_content } = configRes;
      const {
        res: graphRes,
        ErrorCode: graphCode,
        Description: graphDes
      } = (await servicesSearchConfig.fetchCanvasData(kg_id)) || {};

      if (graphRes) {
        const graphData = convertData(graphRes);
        const defaultConfig = initConfig(graphData, conf_content);
        setCheckData({ baseInfo: configRes, graphData, defaultConfig });
        setCheckVisible(true);
      }

      ERROR_CODE[graphCode] ? message.error(intl.get(ERROR_CODE[graphCode])) : graphDes && message.error(graphDes);
    }

    ERROR_CODE[configCode] ? message.error(intl.get(ERROR_CODE[configCode])) : configDes && message.error(configDes);
    dispatchState({ maskLoading: false });
  };

  /**
   * 图谱勾选
   * @param e event
   * @param graph 行数据
   */
  const onCheckChange = (e: any, graph: Record<string, any>) => {
    e.stopPropagation();

    const { kg_id, adv_conf } = graph;
    const data = { ...selectedConfig };

    data[kg_id]?.conf_id ? delete data[kg_id] : (data[kg_id] = { kg_id, ...adv_conf[0] });
    setSelectedConfig(data);
    setOpenKeys(pre => (pre.includes(kg_id) ? pre : [...pre, kg_id]));
  };

  /**
   * 切换面板的回调
   * @param key 面板key
   */
  const onCollapseChange = (key: string | string[]) => {
    const keys = typeof key === 'string' ? [key] : key;
    setOpenKeys(keys);
  };

  /**
   * 渲染配置
   * @param configItem 配置数据
   */
  const renderConfig = (configItem: Record<string, any>) => {
    const { kg_id, conf_id, conf_name } = configItem;

    return (
      <div key={conf_id} className={`list-row ${selfState.dropId === conf_id && 'checked'}`}>
        <Radio
          className="c-radio"
          checked={selectedConfig[kg_id]?.conf_id === conf_id}
          onClick={() => onRadioChange({ kg_id, ...configItem })}
        />
        <span className="c-name ellipsis-one" onClick={() => onRadioChange({ kg_id, ...configItem })}>
          {conf_name}
        </span>

        <Dropdown
          overlay={
            <Menu onClick={e => onMenuClick(e, configItem)}>
              <Menu.Item key="check">{intl.get('global.check')}</Menu.Item>

              <Menu.Item key="edit">{intl.get('global.edit')}</Menu.Item>
              <Menu.Item key="delete">{intl.get('global.delete')}</Menu.Item>
            </Menu>
          }
          trigger={['click']}
          overlayStyle={selfState.dropId !== conf_id ? { display: 'none' } : undefined}
          overlayClassName="saved-config-drop"
          getPopupContainer={triggerNode => triggerNode.parentElement!}
          onVisibleChange={v => onDropChange(v, configItem)}
        >
          <span className="ellipsis-btn">
            <EllipsisOutlined className="e-icon" />
          </span>
        </Dropdown>
      </div>
    );
  };

  return (
    <div className="saved-strategy-pane">
      <div className="search-tool">
        <div className="search-wrap">
          <SearchInput ref={searchInput} placeholder={intl.get('searchConfig.configPlace')} onPressEnter={onSearch} />
        </div>

        <Tooltip title={intl.get('searchConfig.clearTip')}>
          <span className="clear-icon" onClick={onClear}>
            {/* <IconFont type="icon-clear" /> */}
            <img src={clearIcon} alt="clear" />
          </span>
        </Tooltip>
      </div>

      <div className="saved-config-scroll-wrap">
        <ScrollBar isshowx="false">
          <div className="config-list-box">
            <Collapse
              className="config-collapse"
              bordered={false}
              expandIconPosition="right"
              activeKey={openKeys}
              onChange={onCollapseChange}
            >
              {configList.map(item => {
                const { kg_id, kg_name, adv_conf } = item;
                const configArr: any[] = adv_conf || [];

                return (
                  <Panel
                    key={kg_id}
                    header={
                      <div className="panel-header kw-align-center">
                        <Checkbox
                          className="g-check"
                          checked={!!selectedConfig[kg_id]}
                          onClick={e => onCheckChange(e, item)}
                        />
                        <span className="kw-mr-2">
                          {/* <img src="kgImg" /> */}
                          <IconFont type="icon-color-zhishitupu11" style={{ fontSize: 16 }} />
                        </span>
                        <span className="g-title ellipsis-one" title={kg_name}>
                          {kg_name}
                        </span>
                      </div>
                    }
                  >
                    {configArr.length > 5 ? (
                      <VirtualList
                        className="v-list"
                        data={configArr}
                        itemKey="conf_id"
                        height={40 * 5}
                        itemHeight={40}
                      >
                        {confItem => renderConfig({ kg_id, ...confItem })}
                      </VirtualList>
                    ) : (
                      <div className="panel-list-box">
                        {configArr.map(confItem => renderConfig({ kg_id, ...confItem }))}
                      </div>
                    )}
                  </Panel>
                );
              })}
            </Collapse>

            <div className={`config-Pagination ${!configList.length && 'hide'}`}>
              <Pagination
                current={selfState.page}
                total={selfState.total}
                onChange={onPageChange}
                pageSize={PAGE_SIZE}
                showTitle={false}
                showSizeChanger={false}
              />
            </div>

            <div className={`no-config-box ${configList.length && 'hide'}`}>
              <img src={noResult} alt="no data" />
              <p className="desc">{intl.get('global.noResult')}</p>
            </div>
          </div>
        </ScrollBar>

        {/* 加载loading */}
        <div className={`pane-loading ${selfState.maskLoading && 'spanning'} `}>
          <LoadingOutlined className="l-icon" />
        </div>
      </div>

      {/* 删除二次确认弹窗 */}
      <TipModal
        visible={deleteInfo.visible}
        closable={false}
        title={intl.get('searchConfig.delTip')}
        content={intl.get('searchConfig.delContent')}
        onCancel={() => setDeleteInfo({ visible: false, id: 0 })}
        onOk={onDelete}
      />

      {/* 查看配置弹窗 */}
      <ConfigModal viewOnly visible={checkVisible} setVisible={setCheckVisible} defaultTab="base" {...checkData} />
    </div>
  );
};

export default memo(forwardRef(SavedConfig));

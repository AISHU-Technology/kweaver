/* eslint-disable max-lines */
/**
 * 普通搜索界面
 */

import React, { createRef, PureComponent } from 'react';
import { Select, Button, Input, Empty, ConfigProvider, Checkbox, Tabs, Modal, message } from 'antd';
import { UpOutlined, DownOutlined, ExclamationCircleFilled, CloseOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import { GET_CLASSDATA, GET_SEARCHLIST, GET_SEARCHE } from './gql';
import { exploreQuery, kgQuery } from '@/utils/graphQL-search';
import servicesExplore from '@/services/explore';
import IconFont from '@/components/IconFont';
import Analysis from '@/components/analysisInfo';
import AdSpin from '@/components/AdSpin';
import { throttle } from '@/utils/handleFunction';
import { boolCheckStatus, checkAllData, handleTags } from './assistFunction';
// import Header from './Header';
import FilterModal from './FilterModal';
import FilterTag from './FilterTag';
import SearchResult from './SearchResult';
import SumInfo from './SumInfo';
import BaseInfo from './BaseInfo';
import kongImg from '@/assets/images/kong.svg';
import noResult from '@/assets/images/noResult.svg';
import smileImg from '@/assets/images/xiaolian.svg';
import './style.less';

const { Option } = Select;
const { TabPane } = Tabs;
const PAGE_SIZE = 20; // 分页数
const V_ALL = 'all'; // 全部结果
const V_CHECK = 'selected'; // 查看已选结果
const V_UNCHECK = 'unselected'; // 查看未选择结果

class searchUI extends PureComponent {
  filterRef = createRef(null); // 筛选标签容器ref

  rightInfoRef = createRef(null); // 右侧信息详情容器ref

  searchReqid = 0; // 标记搜索请求

  detailReqid = 0; // 标记进出边详情接口请求

  graphCache = {}; // 切换图谱出现弹窗时缓存数据

  nodesLenCache = 0; // 切换视图时, 记录点类个数, 用于判断数据变化

  resetFlag = false; // 标记点击重置

  state = {
    classData: [], // 点类数据
    filterVisible: false, // 筛选条件弹窗
    conditions: [], // 筛选条件
    fold: null, // 折叠搜索条件, null不显示, { isOpen } 标记展开
    keyword: '', // 搜索关键字
    inputValue: '', // 搜索框文字
    resInfo: {}, // 搜索结果信息, 时间、总数
    resData: [], // 搜索结果数据
    curPage: 1, // 当前页码
    selectedValues: [], // 选择的数据
    checkStatus: { isAll: false, isPart: false }, // 全选框状态
    sumInfo: {}, // 汇总信息
    baseInfo: {}, // 基本信息
    searchLoading: false, // 搜索loading
    edgeLoading: false, // 进出边loading
    analysLoading: false, // 分析报告loading
    analysVisible: false, // 分析报告弹窗
    reportData: '', // 分析报告数据
    anylysisTitle: '', // 分析报告标题
    changeVisible: false, // 切换图谱确认弹窗
    viewType: V_ALL, // 结果筛选
    checkedCache: [], // 已选结果缓存
    rightKey: 'summary' // 侧边栏key值
  };

  componentDidMount() {
    const { selectedGraph } = this.props;
    if (!(selectedGraph && selectedGraph.step_num >= 6)) return;
    this.onChoiceGraph({
      kg_id: selectedGraph?.id?.toString(),
      kg_name: selectedGraph?.KG_name,
      graph_db_name: selectedGraph.graph_db_name
    });
    window.addEventListener('resize', this.listenResize);
    window.addEventListener('click', this.listenRightInfo);
  }

  componentDidUpdate(preProps) {
    const { visible, nodes } = this.props;
    const { viewType } = this.state;

    // 弹窗变化时更新操作
    if (preProps.visible !== visible) {
      if (visible) {
        // 更新选中状态
        const { selectedValues, resData } = this.state;
        const checkStatus = boolCheckStatus(selectedValues, resData, nodes);

        this.setState({ checkStatus });

        // 筛选状态下，节点变化时重新加载
        if (viewType !== V_ALL && nodes.length !== this.nodesLenCache) {
          this.onViewChange(viewType);
        }
      } else {
        this.nodesLenCache = nodes.length;
      }
    }

    if (preProps.selectedGraph !== this.props.selectedGraph) {
      this.onChoiceGraph({
        kg_id: this.props.selectedGraph?.id?.toString(),
        kg_name: this.props.selectedGraph?.KG_name,
        graph_db_name: this.props.selectedGraph?.graph_db_name
      });

      // 初始化
      this.setState({
        keyword: '', // 搜索关键字
        resInfo: {}, // 搜索结果信息, 时间、总数
        resData: [], // 搜索结果数据
        curPage: 1, // 当前页码
        selectedValues: [], // 选择的数据
        checkStatus: { isAll: false, isPart: false }, // 全选框状态
        sumInfo: {}, // 汇总信息
        baseInfo: {} // 基本信息
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.listenResize);
    window.removeEventListener('click', this.listenRightInfo);
  }

  /**
   * 获取图谱所有点类
   * @param {String} id 图谱id
   */
  getClassData = async id => {
    if (!id) {
      this.setState({ analysLoading: false });

      return;
    }

    try {
      this.resetFlag && (this.resetFlag = false);

      const res = await kgQuery(GET_CLASSDATA, { id });

      this.setState({ analysLoading: false });
      if (this.resetFlag) return;

      if (res && res.data) {
        const { v } = res.data.kg.onto;
        // 默认选择label, 没有label选中第一个
        const label = v.find(item => item.class === 'label');

        this.setState({ classData: v });
        this.props.setClass(label || v[0] || {});
      }
    } catch (err) {
      this.setState({ analysLoading: false });
    }
  };

  /**
   * 发起搜索请求, 无默认值的参数会从state|props中取
   * @param {String} keyword 搜索关键字
   * @param {Number} page 页码
   * @param {String} cType 实体类
   * @param {Array} tags 筛选条件
   * @param {String} vType 结果过滤
   * @param {Array} selectedRids 查看未选时过滤的已选择id
   */
  getResult = async ({ keyword = '', page = 1, cType, tags, vType, selectedRids }) => {
    const { selectGraph, selectClass } = this.props;

    if (!selectGraph.kg_id || !(selectClass.class || cType)) return;

    const { conditions, checkedCache, viewType } = this.state;
    const filter = handleTags(tags || conditions);
    const curView = vType || viewType;
    const params = {
      id: selectGraph.kg_id,
      class: cType || selectClass.class,
      q: keyword,
      page,
      size: PAGE_SIZE,
      query_all: !keyword,
      search_filter_args: {
        selected: curView === V_ALL ? undefined : curView,
        selectedRids: selectedRids || checkedCache,
        filter
      }
    };

    this.setState({ keyword, curPage: page, searchLoading: true });
    this.resetFlag && (this.resetFlag = false);

    const signId = ++this.searchReqid;
    const startTime = new Date();
    const res = await exploreQuery(GET_SEARCHLIST, params);

    if (signId < this.searchReqid || this.resetFlag) return;

    this.setState({ searchLoading: false });

    if (res && res.data) {
      const { vertexes, ...resInfo } = res.data.search_v;
      const count = parseInt(resInfo.count);

      if (!vertexes.length && count > 0) {
        const newPage = Math.ceil(count / PAGE_SIZE);

        return this.getResult({ keyword, page: newPage, cType, tags, vType, selectedRids });
      }

      const checkStatus = boolCheckStatus(this.state.selectedValues, vertexes, this.props.nodes);

      this.setState({ resInfo, resData: vertexes, checkStatus });
    } else {
      const endTime = new Date();
      const time = (endTime - startTime) / 1000;

      this.setState({ resData: [], resInfo: { count: 0, time: `${time.toFixed(2)}s` } });
    }
  };

  /**
   * 重置搜索界面
   */
  clearData = () => {
    this.setState({
      conditions: [], // 筛选条件
      fold: null, // 折叠搜索条件, null不显示, { isOpen } 标记展开
      keyword: '', // 搜索关键字
      inputValue: '', // 输入框文字
      resInfo: {}, // 搜索结果信息, 时间、总数
      resData: [], // 搜索结果数据
      curPage: 1, // 当前页码
      selectedValues: [], // 选择的数据
      checkStatus: { isAll: false, isPart: false }, // 全选框状态
      sumInfo: {}, // 汇总信息
      baseInfo: {}, // 基本信息
      viewType: V_ALL, // 结果筛选
      checkedCache: [] // 已选结果缓存
    });
  };

  /**
   * 监听窗口变化, 更新筛选标签折叠状态, 300ms防抖
   * @param {HtmlEvent} e
   */
  listenResize = throttle(e => {
    const { fold } = this.state;
    const { scrollHeight } = this.filterRef.current;

    this.setState({
      fold: scrollHeight > 40 ? fold || { isOpen: false } : null
    });
  }, 300);

  /**
   * 监听点击事件, 点击其他区域关闭右侧详情
   * @param {HtmlEvent} e
   */
  listenRightInfo = e => {
    if (
      !this.rightInfoRef.current ||
      !this.state.baseInfo.id ||
      this.rightInfoRef.current.contains(e.target) ||
      e.target.classList.contains('edge-detail')
    ) {
      return;
    }

    this.setState({ baseInfo: {}, sumInfo: {} });
  };

  /**
   * 点击右上角关闭搜索界面
   */
  onClose = e => {
    this.props.setVisible(false);
  };

  /**
   * 切换图谱
   * @param {Object} graph 选择的图谱
   */
  onChoiceGraph = graph => {
    // if (this.props.nodes.length || this.state.resData.length) {
    //   this.graphCache = graph;
    //   this.setState({ changeVisible: true });

    //   return;
    // }
    this.props.setGraph(graph);
    this.setState({ analysLoading: true });
    // this.getClassData(graph.kg_id);
    this.getClassData(graph?.graph_db_name);
  };

  /**
   * 确认切换图谱
   */
  confirmChange = () => {
    this.props.setGraph(this.graphCache);
    this.props.onGraphChange(this.graphCache);
    // this.getClassData(this.graphCache.kg_id);
    this.getClassData(this.graphCache?.graph_db_name);
    this.setState({ changeVisible: false });
    this.clearData();
  };

  /**
   * 切换实体类
   * @param {Object} value 实体
   */
  onClassChange = value => {
    this.props.setClass(value);
    this.setState(
      {
        conditions: [], // 筛选条件
        fold: null, // 折叠搜索条件
        selectedValues: [], // 选择的数据
        checkStatus: { isAll: false, isPart: false }, // 全选框状态
        viewType: V_ALL, // 结果筛选
        checkedCache: [] // 已选结果缓存
      },
      () => {
        this.getResult({
          keyword: this.state.inputValue,
          page: 1,
          cType: value.class,
          vType: V_ALL,
          tags: [],
          selectedRids: []
        });
      }
    );
  };

  /**
   * 点击搜索
   */
  onSearch = async () => {
    const { inputValue } = this.state;

    this.setState({ viewType: V_ALL, checkedCache: [] });
    this.getResult({ keyword: inputValue, vType: V_ALL, selectedRids: [] });
  };

  /**
   * 判断筛选条件是否需要展开
   */
  boolFold = () => {
    setTimeout(() => {
      const { fold } = this.state;
      const { scrollHeight } = this.filterRef.current;

      this.setState({
        fold: scrollHeight > 40 ? fold || { isOpen: false } : null
      });
    }, 0);
  };

  /**
   * 筛选条件弹窗回调
   * @param {Array} data 回调数据
   */
  onAddConditions = data => {
    const { keyword, conditions } = this.state;
    const { selectGraph, selectClass } = this.props;

    const newData = [...conditions, ...data];

    this.setState({ conditions: newData });
    this.boolFold();

    if (!selectGraph.kg_id || !selectClass.class) return;

    this.getResult({ keyword, tags: newData });
  };

  /**
   * 展开/收起筛选条件
   */
  onFoldChange = e => {
    this.setState({ fold: { isOpen: !this.state.fold.isOpen } });
  };

  /**
   * 删除单个筛选条件
   * @param 删除的索引
   */
  onDelTag = index => {
    const { keyword, conditions } = this.state;
    const newData = [...conditions];

    newData.splice(index, 1);
    this.setState({ conditions: newData });
    this.boolFold();
    this.getResult({ keyword, tags: newData });
  };

  /**
   * 清除所有筛选条件
   */
  onClearFilter = e => {
    const { keyword } = this.state;

    this.setState({
      conditions: [],
      fold: null
    });
    this.getResult({ keyword, tags: [] });
  };

  /**
   * 列表勾选
   * @param {Array} values 选中的值
   */
  onCheckChange = values => {
    const checkStatus = boolCheckStatus(values, this.state.resData, this.props.nodes);

    this.setState({ selectedValues: values, checkStatus });
  };

  /**
   * 点击全选
   * @param {HtmlEvent} e
   */
  onCheckAll = e => {
    const { checkStatus, selectedValues, resData } = this.state;
    const newData = checkAllData(selectedValues, resData, checkStatus.isAll, this.props.nodes);
    const newStatus = boolCheckStatus(newData, resData, this.props.nodes);

    this.setState({
      selectedValues: newData,
      checkStatus: newStatus
    });
  };

  /**
   * 过滤搜索结果方式选择
   * @param {String} value 查看方式
   */
  onViewChange = value => {
    const { keyword, selectedValues } = this.state;
    const { nodes } = this.props;
    const checkedCache = value === V_ALL ? [] : [...nodes, ...selectedValues].map(({ id }) => id);

    this.setState({ checkedCache, viewType: value });
    this.getResult({ keyword, vType: value, selectedRids: checkedCache });
  };

  /**
   * 翻页
   * @param {Array} values 选中的值
   */
  onPageChange = page => {
    const { keyword } = this.state;

    this.getResult({ keyword, page });
  };

  /**
   * 点击行标题, 直接探索
   * @param data 行数据
   */
  onTitleClick = data => {
    const { id } = data;
    const { selectedValues } = this.state;
    const { nodes } = this.props;
    const existNode = nodes.find(item => item.id === id);

    // 已经添加直接打开画布
    if (existNode) {
      this.props.onToExplore([existNode], false);

      return;
    }

    this.props.onToExplore([data]);
    this.setState({ selectedValues: selectedValues.filter(item => item.id !== id) });
  };

  /**
   * 查看进出边详情
   * @param {Object} baseInfo 行数据
   * @param {String} target 'summary' | 'base' 打开汇总信息或基本信息
   */
  onSeeDetail = async (baseInfo, target = 'summary') => {
    this.setState({ edgeLoading: true, baseInfo });
    this.resetFlag && (this.resetFlag = false);

    const sid = this.searchReqid;
    const did = ++this.detailReqid;
    const res = await exploreQuery(GET_SEARCHE, {
      id: this.props.selectGraph.kg_id,
      rid: baseInfo.id
    });

    // 处理接口竞态问题
    if (sid < this.searchReqid || this.resetFlag) {
      this.setState({
        edgeLoading: false,
        baseInfo: {},
        sumInfo: {}
      });

      return;
    }
    if (did < this.detailReqid) return;

    this.setState({ edgeLoading: false });
    res &&
      res.data &&
      this.setState({
        rightKey: target,
        sumInfo: res.data.search_e
      });
  };

  /**
   * 获取分析报告
   * @param data 行数据
   */
  getReport = async data => {
    const { id, name } = data;
    const params = {
      id: this.props.selectGraph.kg_id,
      rid: encodeURIComponent(id)
    };

    this.setState({ anylysisTitle: name, analysLoading: true });
    this.resetFlag && (this.resetFlag = false);

    const res = await servicesExplore.analysisReportGet(params);

    this.setState({ analysLoading: false });
    if (this.resetFlag) return;

    if (res && res.ErrorCode === 'EngineServer.ErrNebulaStatsErr') {
      message.error(intl.get('graphQL.errNebulaStatsErr'));
      return;
    }

    if (res && res.ErrorCode === 'EngineServer.ErrVClassErr') {
      message.error(intl.get('graphQL.e500500'));
      return;
    }

    if (res && res.ErrorCode === 'EngineServer.ErrRightsErr') {
      message.error(intl.get('graphList.authErr'));
      this.props.history.push('/home/graph-list');
      return;
    }

    if (res && res.ErrorCode === 'EngineServer.ErrInternalErr') {
      message.error(intl.get('graphList.hasBeenDel'));
      this.props.history.push('/home/graph-list');
      return;
    }

    this.setState({
      reportData: res.res || res,
      analysVisible: true
    });
  };

  /**
   * 点击加入探索
   */
  handleToExplore = () => {
    this.props.onToExplore(this.state.selectedValues);
    this.setState({ selectedValues: [] });
  };

  // 更新筛选弹窗
  setFilterVisible = bool => this.setState({ filterVisible: bool });

  // 点击重置
  onReset = () => {
    this.resetFlag = true;
    this.clearData();
    this.props.onGraphChange({});
  };

  render() {
    const {
      classData,
      filterVisible,
      conditions,
      fold,
      inputValue,
      resData,
      resInfo,
      curPage,
      selectedValues,
      checkStatus,
      sumInfo,
      baseInfo,
      searchLoading,
      edgeLoading,
      analysLoading,
      analysVisible,
      reportData,
      anylysisTitle,
      changeVisible,
      viewType,
      rightKey
    } = this.state;
    const { selectGraph, selectClass, nodes, visible, setVisible } = this.props;

    return (
      <div
        className={`normal-search-UI ${!!selectedValues.length && 'has-footer'} ${
          !visible && 'normal-search-UI-no-visible'
        }`}
      >
        <div className="main-box">
          <div className="main-header">
            {/* 输入区域 */}
            <div className="input-group">
              <Input.Group compact>
                <Select
                  className="class-select"
                  value={selectClass.class}
                  onChange={(_, option) => this.onClassChange(option.data)}
                  getPopupContainer={triggerNode => triggerNode.parentElement}
                  notFoundContent={<Empty image={kongImg} description={intl.get('searchConfig.nodata')} />}
                >
                  {classData.map(item => (
                    <Option key={item.class} value={item.class} data={item}>
                      {item.alias || item.class}
                    </Option>
                  ))}
                </Select>

                <Input
                  allowClear
                  value={inputValue}
                  className="search-input"
                  placeholder={intl.get('search.searchPlace')}
                  suffix={
                    <IconFont type="icon-shaixuan" className="f-icon" onClick={() => this.setFilterVisible(true)} />
                  }
                  prefix={<IconFont type="icon-sousuo" className="s-icon" onClick={this.onSearch} />}
                  onPressEnter={this.onSearch}
                  onChange={e => this.setState({ inputValue: e.target.value })}
                />
              </Input.Group>

              <ConfigProvider autoInsertSpaceInButton={false}>
                <Button type="primary" onClick={this.onSearch}>
                  {intl.get('search.search')}
                </Button>
                <Button className="ant-btn-default" onClick={this.onReset}>
                  {intl.get('search.reset')}
                </Button>
              </ConfigProvider>
            </div>

            <div className="tags-box">
              <div ref={this.filterRef} className={`tags-list ${fold ? (fold.isOpen ? 'open' : 'close') : ''}`}>
                {conditions.map((item, index) => (
                  <FilterTag key={`${index}`} index={index} data={item} onDelete={this.onDelTag} />
                ))}

                {fold && fold.isOpen && (
                  <div className="clo-btn" onClick={this.onFoldChange}>
                    <span>{intl.get('search.fold')}</span>
                    <UpOutlined className="fold-icon" />
                  </div>
                )}
              </div>

              {fold && !fold.isOpen && (
                <div className="open-btn" onClick={this.onFoldChange}>
                  <span>{intl.get('search.expand')}</span>
                  <DownOutlined className="fold-icon" />
                </div>
              )}

              {!!conditions.length && (
                <div className="clear-tag" onClick={this.onClearFilter}>
                  <IconFont type="icon-lajitong" />
                  <span style={{ marginLeft: 4 }}>{intl.get('search.clearAll')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 列表 */}
          <div className="main-content">
            {!!resInfo.time && (
              <>
                <div className="list-wrapper">
                  {/* 搜索性能展示 */}
                  <div className="res-header">
                    <div>
                      <Checkbox
                        checked={checkStatus.isAll}
                        indeterminate={checkStatus.isPart}
                        disabled={!resData.length || !!checkStatus.isDisabled}
                        onChange={this.onCheckAll}
                      />

                      <span>
                        {intl.get('search.find1')}
                        <span className="hl-text">{resInfo.count}</span>
                        {intl.get('search.find2', { time: resInfo.time })}
                      </span>
                    </div>

                    <Select
                      className="res-select"
                      value={viewType}
                      bordered={false}
                      showArrow={false}
                      getPopupContainer={triggerNode => triggerNode.parentElement}
                      onChange={this.onViewChange}
                      optionLabelProp="label"
                    >
                      <Option
                        value={V_ALL}
                        label={
                          <>
                            <IconFont type="icon-shaixuan" className="option-icon" />
                            {intl.get('search.resAll')}
                          </>
                        }
                      >
                        {intl.get('search.resAll')}
                      </Option>
                      <Option
                        value={V_CHECK}
                        disabled={viewType !== V_CHECK && !(nodes.length || selectedValues.length)}
                        label={
                          <>
                            <IconFont type="icon-shaixuan" className="option-icon" />
                            {intl.get('search.resSelect')}
                          </>
                        }
                      >
                        {intl.get('search.resSelect')}
                      </Option>
                      <Option
                        value={V_UNCHECK}
                        disabled={viewType !== V_UNCHECK && !(nodes.length || selectedValues.length)}
                        label={
                          <>
                            <IconFont type="icon-shaixuan" className="option-icon" />
                            {intl.get('search.resUnselect')}
                          </>
                        }
                      >
                        {intl.get('search.resUnselect')}
                      </Option>
                    </Select>
                  </div>

                  {/* 结果列表 */}
                  {!!resData.length && (
                    <SearchResult
                      resData={resData}
                      resInfo={resInfo}
                      curPage={curPage}
                      selectedValues={selectedValues}
                      disabledValues={this.props.nodes}
                      checkedRow={baseInfo.id}
                      onCheckChange={this.onCheckChange}
                      onPageChange={this.onPageChange}
                      onDetail={this.onSeeDetail}
                      onReport={this.getReport}
                      onTitleClick={this.onTitleClick}
                    />
                  )}
                </div>

                <div className="info-wrapper" ref={this.rightInfoRef}>
                  {baseInfo.id && (
                    <>
                      <div className="close-wr">
                        <CloseOutlined
                          className="icon"
                          onClick={() => {
                            this.setState({
                              baseInfo: {}
                            });
                          }}
                        />
                      </div>
                      <Tabs
                        className="right-info-tabs"
                        centered
                        animated={false}
                        activeKey={rightKey}
                        onChange={rightKey => this.setState({ rightKey })}
                      >
                        <TabPane tab={intl.get('search.sumInfo')} key="summary">
                          <SumInfo key={baseInfo.id} data={sumInfo} />
                        </TabPane>

                        <TabPane tab={intl.get('search.baseInfo')} key="base">
                          <BaseInfo data={baseInfo} />
                        </TabPane>
                      </Tabs>
                    </>
                  )}

                  {/* 获取进出边loading */}
                  <div className={`search-loading-mask ${edgeLoading && 'spinning'}`}>
                    <AdSpin />
                  </div>
                </div>

                {/* 搜索为空 */}
                {!resData.length && !searchLoading && (
                  <div className="empty-wrap">
                    <div className="no-data">
                      <img src={noResult} alt="nodata" />
                      <p className="desc">{intl.get('search.noRes')}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 搜索loading */}
            {searchLoading && (
              <div className={`search-loading-mask ${searchLoading && 'spinning'}`}>
                <AdSpin desc={intl.get('search.searching')} />
              </div>
            )}

            {/* 空页面 */}
            {!resInfo.time && !searchLoading && !analysLoading && (
              <div className="no-data">
                <img src={smileImg} alt="nodata" />
                <p className="desc">{intl.get('search.pleaseSearch')}</p>
              </div>
            )}
          </div>
        </div>

        {!!resData.length && (
          <div className="footer">
            <Checkbox
              className="footer-check"
              checked={checkStatus.isAll}
              indeterminate={checkStatus.isPart}
              disabled={!resData.length || !!checkStatus.isDisabled}
              onChange={this.onCheckAll}
            />

            <Button type="primary" onClick={this.handleToExplore} disabled={!selectedValues.length}>
              {intl.get('search.explore')}
            </Button>

            {!!nodes.length && (
              <Button type="default" onClick={() => setVisible(false)}>
                {intl.get('createEntity.cancel')}
              </Button>
            )}
          </div>
        )}

        {/* 分析报告loading */}
        <div className={`search-loading-mask analys ${analysLoading && 'spinning'}`}>
          <AdSpin />
        </div>

        {/* 筛选条件弹窗 */}
        <FilterModal
          graphId={selectGraph.kg_id}
          selectClass={selectClass}
          visible={filterVisible}
          setVisible={this.setFilterVisible}
          onOk={this.onAddConditions}
        />

        {/* 分析报告弹窗 */}
        <Modal
          title={
            <>
              <div className="left-title">{intl.get('searchGraph.report')}</div>
              <div className="right-title">{intl.get('searchGraph.Summary')}</div>
            </>
          }
          className="modal-multlist-anlys"
          width={'auto'}
          height={'calc(100% - 40px)'}
          destroyOnClose
          visible={analysVisible}
          maskClosable={false}
          footer={null}
          forceRender
          onCancel={() => this.setState({ analysVisible: false })}
        >
          <Analysis reportData={reportData} anylysisTitle={anylysisTitle} />
        </Modal>

        {/* 切换图谱确认弹窗 */}
        <Modal
          className="graph-sw-modal"
          visible={changeVisible}
          focusTriggerAfterClose={false}
          destroyOnClose
          maskClosable={false}
          width={432}
          footer={null}
          onCancel={() => this.setState({ changeVisible: false })}
        >
          <div className="m-title">
            <ExclamationCircleFilled className="title-icon" />
            <span className="title-text">{intl.get('search.swTitle')}</span>
          </div>

          <div className="m-body">{intl.get('search.swContent')}</div>

          <div className="m-footer">
            <ConfigProvider autoInsertSpaceInButton={false}>
              <Button className="ant-btn-default cancel-btn" onClick={() => this.setState({ changeVisible: false })}>
                {intl.get('global.cancel')}
              </Button>
              <Button type="primary" className="ok-btn" onClick={this.confirmChange}>
                {intl.get('global.ok')}
              </Button>
            </ConfigProvider>
          </div>
        </Modal>
      </div>
    );
  }
}

searchUI.defaultProps = {
  history: { push: () => {} },
  visible: false,
  nodes: [],
  selectGraph: {},
  selectClass: {},
  setVisible: () => {},
  setGraph: () => {},
  setClass: () => {},
  onGraphChange: () => {},
  onToExplore: () => {}
};

export default searchUI;

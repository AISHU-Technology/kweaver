import React, { useState, useEffect } from 'react';
import { Select, Input, Button, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import visualAnalysis from '@/services/visualAnalysis';
import { getParam } from '@/utils/handleFunction';
import FilterList from '../FilterList';
import { getSearchConfig } from '../assistant';
import { ErrorTip } from '../../components';
import './style.less';
import ResultPanel, { RESULT_TYPE, getInitResState, parseCommonResult } from '../../components/ResultPanel';
import AddTypeSelector, { ADD_TYPES } from '../../components/AddTypeSelector';

const { ADD_IMMEDIATELY, ADD_SELECT, COVER_IMMEDIATELY, COVER_SELECT } = ADD_TYPES;
const ERROR: Record<string, string> = {
  'EngineServer.KGIDErr': 'exploreGraph.deleteGraph',
  'EngineServer.ConfigStatusErr': 'exploreGraph.noSearchable',
  'EngineServer.VClassErr': 'exploreGraph.notExist',
  'EngineServer.VProErr': 'exploreGraph.entityAttribute',
  'EngineServer.VIDLengthErr': 'exploreGraph.inputCorrect'
};
const VidSearch = (props: any) => {
  const { classData, searchConfig, selectedItem, isLayoutTree, leftDrawerKey, resultPanelDisplay } = props;
  const { onChangeData, onCloseLeftDrawer, setSearchConfig, onResultVisibleChange } = props;
  const [searchScope, setSearchScope] = useState('graph'); // 搜索范围
  const [vids, setVids] = useState('');
  const [isError, setIsError] = useState<any>('');
  const authorKgView = selectedItem?.detail?.authorKgView;
  const [results, setResults] = useState(() => getInitResState()); // 结果面板数据
  const [addType, setAddType] = useState(ADD_IMMEDIATELY); // 添加方式

  // --start 树图有特殊的搜索功能
  const _isLayoutTree = isLayoutTree && searchScope === 'graph';
  useEffect(() => {
    let newVids = vids;
    if (_isLayoutTree) newVids = newVids.split('\n')[0];
    setVids(newVids);
  }, [_isLayoutTree]);
  // --end 树图有特殊的搜索功能

  useEffect(() => {
    setSearchScope(authorKgView ? 'graph' : 'canvas');
  }, [authorKgView]);

  useEffect(() => {
    if (!selectedItem?.exploring?.isExploring) setIsError(false);
  }, [selectedItem?.exploring?.isExploring]);

  useEffect(() => {
    if (leftDrawerKey) setResults(getInitResState());
  }, [leftDrawerKey]);

  useEffect(() => {
    setResults(getInitResState());
  }, [selectedItem?.key]);

  // 控制搜索结果弹窗
  const onCloseResultModal = () => {
    onCloseLeftDrawer();
    setResults(getInitResState());
  };

  // 搜索
  const getResult = async () => {
    if (selectedItem?.exploring?.isExploring) return setIsError(true);
    const search_config = getSearchConfig(searchConfig);
    const id = selectedItem?.detail?.kg?.kg_id || getParam('graphId'); // 图谱id
    let vidArr: any = [];
    if (!_.isEmpty(vids)) vidArr = _.split(vids, '\n');
    try {
      const params = { page: 1, size: 0, search_config, kg_id: id, vids: vidArr };
      onChangeData({ type: 'exploring', data: { isExploring: true } });
      const res = await visualAnalysis.vidRetrieval(params, searchScope, selectedItem);
      onChangeData({ type: 'exploring', data: { isExploring: false } });
      if (res?.res === null || !res?.res?.nodes?.length) {
        message.warning(intl.get('exploreGraph.noSearch'));
      }
      if (res?.res?.nodes?.length) {
        setIsError(false);
        const { graph } = parseCommonResult(res.res);
        if ([ADD_IMMEDIATELY, COVER_IMMEDIATELY].includes(addType)) addToCanvas({ graph });
        if (resultPanelDisplay === 'displayResult' || [ADD_SELECT, COVER_SELECT].includes(addType)) {
          setResults({
            visible: true,
            data: graph.nodes,
            originData: res?.res,
            checkable: [ADD_SELECT, COVER_SELECT].includes(addType),
            params
          });
          onResultVisibleChange(true);
        }
        if (resultPanelDisplay === 'notDisplayPanel') {
          onCloseLeftDrawer();
        }
      }
    } catch (err) {
      if (err?.type === 'message') {
        const { ErrorCode, Description } = err.response;
        ERROR[ErrorCode] ? message.error(intl.get(ERROR[ErrorCode])) : message.error(Description);
      } else {
        const { ErrorCode, Description } = err?.data || err;
        ERROR[ErrorCode] ? message.error(intl.get(ERROR[ErrorCode])) : message.error(Description);
      }
      onCloseLeftDrawer();
      onChangeData({ type: 'exploring', data: { isExploring: false } });
    }
  };

  /**
   * 添加数据到画布中
   */
  const addToCanvas = ({ graph }: any) => {
    onChangeData({ type: 'add', data: { nodes: [], edges: [], length: 0 } });
    onChangeData({
      type: 'add',
      data: {
        ...graph,
        length: graph.nodes.length + graph.edges.length,
        action: [COVER_IMMEDIATELY, COVER_SELECT].includes(addType) ? 'cover' : 'add'
      }
    });
  };

  return (
    <div className="vidSearchRoot kw-h-100">
      <div className="retrieval-scroll kw-pl-6">
        <div className="kw-pr-6">
          <div className="kw-mt-6">
            <div>
              {intl.get('exploreGraph.range')}
              <Select className="kw-mt-2 kw-w-100" value={searchScope} onChange={e => setSearchScope(e)}>
                {authorKgView && <Select.Option value="graph">{intl.get('exploreGraph.currentGraph')}</Select.Option>}
                <Select.Option value="canvas">{intl.get('exploreGraph.currentCanvas')}</Select.Option>
              </Select>
            </div>
            <div className="kw-mt-5">
              {intl.get('exploreGraph.matchRule')}
              <Select className="kw-mt-2 kw-w-100" disabled value="all">
                <Select.Option value="all">{intl.get('exploreGraph.perfectMatch')}</Select.Option>
              </Select>
            </div>
          </div>
          <div>
            <Input.TextArea
              className="kw-mt-5"
              value={vids}
              disabled={_isLayoutTree && selectedItem?.apis?.getGraphShapes()?.nodes?.length > 0}
              onChange={e => {
                const value = e.target.value.split('\n');
                if (_isLayoutTree) return setVids(value[0]);

                const rows = _.filter(value, v => !!v);
                if (rows?.length >= 1001) {
                  setVids(rows.slice(0, 1000).join('\n'));
                  return;
                }
                setVids(e.target.value);
              }}
              placeholder={`${intl.get('exploreGraph.enterVID')}\nstring1\nstring2\nstring3`}
              cols={1000}
              style={{ height: 200 }}
            />
          </div>
          <div className="kw-w-100 kw-pt-5">
            <AddTypeSelector value={addType} onChange={setAddType} />
          </div>
          <div style={{ padding: '0px 6px 0px 0' }}>
            <FilterList
              classData={classData?.entity}
              setSearchConfig={setSearchConfig}
              selectedItem={selectedItem}
              searchConfig={searchConfig}
            />
          </div>
        </div>
      </div>

      <div className="kw-pt-3 kw-p-6">
        <Button
          className="kw-w-100"
          type="primary"
          disabled={_isLayoutTree && selectedItem?.apis?.getGraphShapes()?.nodes?.length > 0}
          onClick={() => getResult()}
        >
          {intl.get('global.search')}
        </Button>
        {isError && <ErrorTip />}
      </div>
      <ResultPanel
        {...results}
        className="kw-pl-6 kw-pr-6"
        title={'VID'}
        selectedItem={selectedItem}
        from={RESULT_TYPE.vid}
        updateGraph={onChangeData}
        onAdd={addToCanvas}
        onBack={() => setResults(getInitResState())}
        onClose={onCloseResultModal}
      />
    </div>
  );
};
export default VidSearch;

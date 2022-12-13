import React, { useEffect, useState, memo } from 'react';
import { Button, Checkbox, Modal, Radio, message, Tooltip } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import ScrollBar from '@/components/ScrollBar';
import classNames from 'classnames';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import Subgraph from '@/components/Subgraph';
import SearchInput from '@/components/SearchInput';
import { numToThousand } from '@/utils/handleFunction';
import servicesSubGraph from '@/services/subGraph';
import servicesCreateEntity from '@/services/createEntity';

import noResult from '@/assets/images/noResult.svg';
import './style.less';
const ModalBranchTask = (props: {
  graphId: number;
  visible: boolean;
  ontoId: any;
  handleCancel: () => void;
  goToTask: () => void;
}) => {
  const { visible, graphId, goToTask, handleCancel, ontoId } = props;
  const [graphData, setGraphData] = useState({});
  const [subgraphList, setsubgraphList] = useState<Array<any>>([]);
  const [runMode, setrunMode] = useState('skip'); // 写入模式 默认跳过
  const [selected, setSelected] = useState(-1); // 选中展示的子图
  const [subgraphIds, setSubgraphIds] = useState<Array<any>>([]); // 构建子图列表id
  const [ontoData, setOntoData] = useState<Array<any>>([]); // 本体数据
  const [searchValue, setSearchValue] = useState('');
  const [errorIds, setErrorIds] = useState<Array<any>>([]); // 不存在的子图

  useEffect(() => {
    if (visible) {
      getListData({});
      getOntoData();
    }
    return () => {
      setrunMode('skip');
      setSubgraphIds([]);
      setErrorIds([]);
    };
  }, [visible]);

  /**
   * 查询本体数据
   */
  const getOntoData = async () => {
    try {
      const res = await servicesCreateEntity.getEntityInfo(decodeURI(ontoId));
      if (res?.res) {
        setOntoData(res?.res?.df?.[0]);
      }
      res?.ErrorCode && message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  /**
   * @param name 查询的子图列表
   */
  const getListData = async ({ name = '' }) => {
    try {
      setSearchValue(name);
      const data = { graph_id: graphId, subgraph_name: name };
      const res = await servicesSubGraph.subGraphGetList(data);
      if (res?.res) {
        setsubgraphList(res?.res);
      }
      res?.Description && message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  /**
   * @param id 子图id
   */
  const subgraphData = async (id: number) => {
    try {
      const data = { subgraph_id: id };
      const res = await servicesSubGraph.subGraphInfoDetail(data);
      if (res?.res) {
        setGraphData(res?.res);
      }
      if (res?.ErrorCode === 'Builder.SubgraphService.GetSubgraphConfig.SubgraphIdNotExist') {
        const id = res?.Description.replace(/[^0-9]/gi, '');
        const ids = _.uniq([...errorIds, id]).map(Number);

        setErrorIds(ids);
        const subIds = _.filter(subgraphIds, id => !ids.includes(id));
        setSubgraphIds(subIds);
        return message.error(intl.get('task.subGraphDelete'));
      }
      res?.Description && message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  /**
   * 搜索子图
   */
  const search = (e: any) => {
    const { value } = e.target;

    _.debounce(value => {
      getListData({ name: value });
    }, 300)(value);
  };

  /**
   * 选中或取消某个子图
   */
  const changeSelect = (e: any, id: number) => {
    if (e?.target?.checked) {
      setSubgraphIds([...subgraphIds, id]);
    } else {
      const ids = _.filter(subgraphIds, item => item !== id);
      setSubgraphIds(ids);
    }
  };

  /**
   * 全选按钮
   */
  const onChangeAll = (e: any) => {
    if (e?.target?.checked) {
      const ids = _.map(subgraphList, item => item?.id);
      setSubgraphIds(ids);
    } else {
      setSubgraphIds([]);
    }
  };

  /**
   * 点击子图
   */
  const handleClick = (id: number) => {
    setSelected(id);
    subgraphData(id);
  };

  /**
   * 确定运行
   */
  const runTask = async () => {
    if (_.isEmpty(subgraphIds)) {
      message.error('请先选择分组');
      return;
    }
    try {
      const graph_id = graphId;
      const data = {
        graph_id: graphId,
        subgraph_ids: subgraphIds,
        write_mode: runMode
      };
      const res = await servicesSubGraph.subgraphRunTask(graph_id, data);
      if (res?.res) {
        message.success(intl.get('task.submitSuccess'));
        handleCancel();
        goToTask();
      }
      if (res?.ErrorCode === 'Builder.CeleryBlue.TaskBatch.SubgraphIdNotExist') {
        setNotExitIds(res?.Description);
        return;
      }
      res?.Description && message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  /**
   * @param description 错误描述
   */
  const setNotExitIds = (description: string) => {
    if (_.isEmpty(description)) return;
    const start = description.indexOf('{');
    const end = description.indexOf('}');
    const str = description.slice(start + 1, end);

    if (!_.isEmpty(str)) {
      const arr = str?.split(',').map(Number);
      const ids = _.uniq([...errorIds, ...arr]);
      setErrorIds(ids);

      const subIds = _.filter(subgraphIds, id => !ids.includes(id));
      setSubgraphIds(subIds);
    }
  };

  return (
    <Modal
      title={intl.get('task.groupRun')}
      visible={visible}
      wrapClassName="modal-branch-task"
      footer={null}
      destroyOnClose={true}
      maskClosable={false}
      onCancel={handleCancel}
      width={1000}
    >
      <div>
        <div className="top-mode-box">
          <span className="ad-mr-5 ad-c-header">{intl.get('task.runconfigTip')}</span>
          <Radio.Group onChange={e => setrunMode(e?.target?.value)} value={runMode}>
            <Radio value="skip">{intl.get('task.skip')}</Radio>
            <Radio value="overwrite">{intl.get('task.return')}</Radio>
          </Radio.Group>
        </div>
        <div className="modal-content">
          <div className="child-list">
            <SearchInput
              placeholder={intl.get('task.searchGroup')}
              className="search-input"
              allowClear={true}
              onChange={search}
            />
            {!_.isEmpty(subgraphList) ? (
              <div>
                <Checkbox
                  className="ad-pl-2 ad-mb-4"
                  onChange={e => onChangeAll(e)}
                  indeterminate={!!subgraphIds.length && subgraphIds.length < subgraphList.length}
                  checked={subgraphIds.length === subgraphList.length}
                >
                  {intl.get('global.checkAll')}
                </Checkbox>
                <ScrollBar isshowx="false" autoHeight autoHeightMax={400}>
                  <div className="ad-pr-5">
                    {_.map(subgraphList, item => {
                      return (
                        <div
                          className={classNames('subgraph-item ad-space-between', {
                            'selected-bg': item?.id === selected
                          })}
                          onClick={() => {
                            handleClick(item?.id);
                          }}
                          key={item?.id}
                        >
                          <div className="ad-align-center">
                            <Checkbox
                              checked={subgraphIds.includes(item?.id)}
                              onChange={e => changeSelect(e, item?.id)}
                              onClick={e => {
                                e.stopPropagation();
                              }}
                              disabled={_.includes(errorIds, item?.id)}
                            />
                            <IconFont type="icon-putongwenjianjia" className="ad-ml-3"></IconFont>
                            <Format.Text
                              className={classNames('ad-ml-2 subgraph-name', {
                                'disabled-sub': _.includes(errorIds, item?.id)
                              })}
                              ellipsis
                            >
                              {item?.name === 'ungrouped' ? '未分组' : item?.name}
                            </Format.Text>
                          </div>

                          {_.includes(errorIds, item?.id) ? (
                            <Tooltip
                              placement="right"
                              title={intl.get('task.subGraphDelete')}
                              className="ad-c-error"
                              trigger="hover"
                            >
                              <ExclamationCircleOutlined />
                            </Tooltip>
                          ) : (
                            numToThousand(item?.entity_num + item?.edge_num)
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollBar>
              </div>
            ) : searchValue ? (
              <div className="search-none">
                <img src={noResult} alt="noResult" />
                <div className="word">{intl.get('global.noResult')}</div>
              </div>
            ) : null}
          </div>
          <div className="graph-box">
            <Subgraph graphData={selected === -1 ? ontoData : graphData} />
          </div>
        </div>
        <div className="modal-footer">
          <div>
            <Button type="default" className="btn" onClick={handleCancel}>
              {intl.get('global.cancel')}
            </Button>
            <Button type="primary" className="ok-btn btn" onClick={runTask}>
              {intl.get('global.ok')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default memo(ModalBranchTask);

import React, { useState, useEffect, useReducer } from 'react';
import { message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';

import * as promptServices from '@/services/prompt';
import { sorter2sorter } from '@/enums';
import LoadingMask from '@/components/LoadingMask';
import NoDataBox from '@/components/NoDataBox';
import { getParam } from '@/utils/handleFunction';
import { tipModalFunc } from '@/components/TipModal';
import createSvg from '@/assets/images/create.svg';

import ToolBar from '../components/ToolBar';
import DataCards from './DataCards';
import DataTable from './DataTable';
import MoveModal from '../components/MoveModal';
import ViewModal from '../components/ViewModal';

import { getRememberParams } from '../utils';
import { PromptState, CategoryItem, PromptItem, ProjectItem } from '../types';
import { getPromptReduceState, promptReducer } from '../enums';
import './style.less';

let requestId = 0; // 标记网络请求

export interface ProjectDetailProps {
  className?: string;
  selectedCategory: CategoryItem;
  projectList: ProjectItem[];
}

const ProjectDetail = (props: ProjectDetailProps) => {
  const { className, selectedCategory, projectList } = props;
  const history = useHistory();
  const [promptList, setPromptList] = useState<PromptItem[]>([]);
  const [tableState, dispatchTableState] = useReducer(promptReducer, getPromptReduceState());
  const [opController, setOpController] = useState({ visible: false, action: '', data: {} as any }); // 各种弹窗操作控制器
  const closeModal = () => setOpController({ visible: false, action: '', data: {} });
  const [viewModal, setViewModal] = useState(false); // 查看提示词弹窗
  const [recordData, setRecordData] = useState<any>({}); // 表格、卡片某一条数据

  useEffect(() => {
    getData({ ...tableState, name: '' }); // 切换时重置搜索
  }, [selectedCategory.prompt_item_type_id]);

  const getData: Function = async (state: Partial<PromptState>, needLoading = true) => {
    const { prompt_item_id, prompt_item_type_id } = selectedCategory;
    if (!prompt_item_type_id) {
      setPromptList([]);
      return;
    }
    try {
      dispatchTableState({ ...state, loading: needLoading });
      const { name, order, rule, deploy, prompt_type } = { ...tableState, ...state };
      const signId = ++requestId;
      const { res } =
        (await promptServices.promptList({
          prompt_item_id,
          prompt_item_type_id,
          prompt_name: name,
          rule,
          order: sorter2sorter(order),
          deploy,
          prompt_type,
          page: 1,
          size: 1000,
          is_management: true
        })) || {};
      if (signId < requestId) return;
      needLoading && dispatchTableState({ loading: false });
      if (res) {
        const { data, total } = res;
        setPromptList(data || []);
        dispatchTableState({ total });
      }
    } catch (err) {
      dispatchTableState({ loading: false });
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  /**
   * 排序等状态更新
   * @param state 更新的状态
   */
  const onStateChange = (state: Partial<PromptState>) => {
    getData({ ...tableState, ...(state || {}) });
  };

  /**
   * 各种操作的回调
   * @param key 操作的key标识
   * @param data 操作的数据
   */
  const onOperate = (key: string, data: any) => {
    key === 'create' &&
      history.push(
        `/model-factory/prompt-manage-create?action=create&_project=${selectedCategory?.prompt_item_id}&_category=${selectedCategory?.prompt_item_type_id}`
      );
    key === 'move' && setOpController({ visible: true, action: key, data });
    key === 'edit' && toEdit(data);
    key === 'check' && toCheck(data);
    key === 'deploy' && deploy(data);
    key === 'undeploy' && undeploy(data);
    key === 'api' && toDocument(data);
    key === 'delete' && confirmDelete(data);
  };

  /**
   * 跳转到文档
   */
  const toDocument = (data: PromptItem) => {
    window.open(`/model-factory/doc/prompt?id=${getParam('id')}&service_id=${data.prompt_service_id}`, '_blank');
  };

  const toEdit = (data: PromptItem) => {
    const search = getRememberParams(data);
    history.push(
      `/model-factory/prompt-manage-create${search}&action=edit&prompt_id=${data.prompt_id}&name=${data.prompt_name}`
    );
  };

  const toCheck = (data: PromptItem) => {
    setViewModal(true);
    setRecordData(data);
  };

  const deploy = async (data: PromptItem) => {
    try {
      await promptServices.promptDeploy({ prompt_id: data.prompt_id });
    } finally {
      getData(tableState);
    }
  };

  const undeploy = async (data: PromptItem) => {
    try {
      await promptServices.promptUndeploy({ prompt_id: data.prompt_id });
    } finally {
      getData(tableState);
    }
  };

  const confirmDelete = async ({ prompt_id }: PromptItem) => {
    const isOk = await tipModalFunc({
      title: intl.get('prompt.deletePrompt').split('\n')[0],
      content: intl.get('prompt.deletePrompt').split('\n')[0]
    });
    if (!isOk) return;
    try {
      await promptServices.promptDelete({ prompt_id });
    } finally {
      getData(tableState);
    }
  };

  const confirmMove = async (targetCategory: CategoryItem) => {
    try {
      if (targetCategory.prompt_item_type_id !== opController.data.prompt_item_type_id) {
        await promptServices.promptMove({
          prompt_item_id: targetCategory.prompt_item_id,
          prompt_item_type_id: targetCategory.prompt_item_type_id,
          prompt_id: opController.data.prompt_id
        });
      }
    } finally {
      closeModal();
      getData(tableState);
    }
  };

  return (
    <div className={classNames(className, 'manage-prompt-project-detail-root kw-flex-column kw-h-100')}>
      <ToolBar
        className="kw-mt-4 kw-mb-4"
        tableState={tableState}
        onOperate={onOperate}
        onStateChange={onStateChange}
      />
      <div className="kw-flex-item-full-height kw-pl-6 kw-pr-1" style={{ position: 'relative' }}>
        <LoadingMask loading={tableState.loading} />
        <div className={`detail-scroll-box kw-h-100 kw-pr-5 view-type-${tableState.viewType}`}>
          {!promptList.length && !tableState.name ? (
            <div className="kw-center">
              <NoDataBox
                style={{ marginTop: 48, height: 246 }}
                imgSrc={createSvg}
                desc={
                  <>
                    {intl.get('prompt.createPromptTip').split('|')[0]}
                    <span className="kw-c-primary kw-pointer" onClick={() => onOperate('create', {} as any)}>
                      {intl.get('prompt.createPromptTip').split('|')[1]}
                    </span>
                    {intl.get('prompt.createPromptTip').split('|')[2]}
                  </>
                }
              />
            </div>
          ) : (
            <>
              {tableState.viewType === 'list' ? (
                <DataTable
                  tableData={promptList}
                  tableState={tableState}
                  onStateChange={onStateChange}
                  onOperate={onOperate}
                />
              ) : (
                <DataCards cardsData={promptList} onOperate={onOperate} />
              )}
            </>
          )}
        </div>
      </div>

      <MoveModal
        visible={opController.visible && opController.action === 'move'}
        data={opController.data}
        projectList={projectList}
        onCancel={closeModal}
        onOk={confirmMove}
      />
      <ViewModal visible={viewModal} setViewModal={setViewModal} recordData={recordData} />
    </div>
  );
};

export default ProjectDetail;

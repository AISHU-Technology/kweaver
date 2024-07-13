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

import ToolBar from '../components/ToolBar';
import DataCards from './DataCards';
import DataTable from './DataTable';
import PromptOperateModal from '../components/PromptOperateModal';
import MoveModal from '../components/MoveModal';

import { getRememberParams } from '../utils';
import { PromptState, CategoryItem, PromptItem, ProjectItem } from '../types';
import { getPromptReduceState, promptReducer } from '../enums';
import createImg from '@/assets/images/kgEmpty.svg';
import './style.less';

let requestId = 0;

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
  const [opController, setOpController] = useState({ visible: false, action: '', data: {} as any });
  const closeModal = () => setOpController({ visible: false, action: '', data: {} });

  useEffect(() => {
    getData({ ...tableState, name: '' });
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
          size: 1000
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
    key === 'create' && setOpController({ visible: true, action: key, data: selectedCategory });
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
    window.open(
      `/model-factory/doc/prompt?id=${getParam('id')}&service_id=${data.prompt_service_id}&name=${data.prompt_name}`,
      '_blank'
    );
  };

  const toEdit = (data: PromptItem) => {
    const search = getRememberParams(data);
    history.push(
      `/model-factory/prompt-config${search}&action=edit&prompt_id=${data.prompt_id}&prompt_type=${data?.prompt_type}`
    );
  };

  const toCheck = (data: PromptItem) => {
    const search = getRememberParams(data);
    history.push(`/model-factory/prompt-config${search}&action=check&prompt_id=${data.prompt_id}`);
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

  /**
   * 操作后刷新
   */
  const onAfterOperate = () => {
    getData(tableState);
  };

  return (
    <div className={classNames(className, 'prompt-project-detail-root kw-flex-column kw-h-100')}>
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
            <div className="kw-center kw-h-100">
              <NoDataBox
                style={{ marginTop: -32 }}
                imgSrc={createImg}
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

      <PromptOperateModal
        visible={opController.visible && opController.action === 'create'}
        data={opController.data}
        action={opController.action}
        projectList={projectList}
        onCancel={closeModal}
        onOk={onAfterOperate}
      />

      <MoveModal
        visible={opController.visible && opController.action === 'move'}
        data={opController.data}
        projectList={projectList}
        onCancel={closeModal}
        onOk={confirmMove}
      />
    </div>
  );
};

export default ProjectDetail;

import React, { useState, useEffect, useReducer, useRef } from 'react';
import { message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import * as promptServices from '@/services/prompt';
import NoDataBox from '@/components/NoDataBox';
import { getParam } from '@/utils/handleFunction';
import LoadingMask from '@/components/LoadingMask';

import ProjectList, { ProjectListRef } from './ProjectList';
import ProjectHeader from './ProjectHeader';
import ProjectDetail from './ProjectDetail';
import ProjectOperateModal from './components/ProjectOperateModal';
import CategoryOperateModal from './components/CategoryOperateModal';
import DeleteModal from './components/DeleteModal';

import { ProjectState, ProjectItem, CategoryItem } from './types';
import { PROJECT_STATE, projectReducer } from './enums';
import createImg from '@/assets/images/kgEmpty.svg';
import './style.less';

let requestId = 0; // 标记网络请求

const PromptHome = (props: any) => {
  const { className } = props;
  const listRef = useRef<ProjectListRef>(null);
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [projectState, dispatchProjectState] = useReducer(projectReducer, PROJECT_STATE);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem>({} as CategoryItem);
  const [opController, setOpController] = useState({ visible: false, type: '', action: '', data: {} as any }); // 各种弹窗操作控制器
  const closeModal = () => setOpController({ visible: false, type: '', action: '', data: {} });
  const operateType = useRef<any>(''); // 搜索

  useEffect(() => {
    const mount = async () => {
      await getData(projectState, true);
      dispatchProjectState({ mountLoading: false });
    };
    mount();
  }, []);

  /**
   * 获取数据
   * @param state 各种状态
   * @param isMount 是否是初始化
   * @param targetData 触发选中
   */
  const getData = async (state: Partial<ProjectState>, isMount = false, targetData?: any) => {
    try {
      dispatchProjectState({ ...state, loading: true });
      const { name } = { ...projectState, ...state };
      const signId = ++requestId;
      const { res } =
        (await promptServices.promptProjectList({
          prompt_item_name: name,
          page: 1,
          size: 1000,
          is_management: true
        })) || {};
      if (signId < requestId) return;
      dispatchProjectState({ loading: false });
      if (res) {
        const { data, total, searchTotal } = res;
        setProjectList(data || []);
        dispatchProjectState({ total, searchTotal });
        data.length &&
          setSelectedCategory(pre => {
            // 从其他页面跳转回来, 选中指定分类
            if (isMount) {
              const { _project, _category } = getParam(['_project', '_category']);
              const category = getLatestCategory(data, {
                prompt_item_id: _project,
                prompt_item_type_id: _category
              } as any);
              if (category?.prompt_item_id) {
                return category;
              }
            }
            // 新建后选中
            if (targetData) {
              const category = getLatestCategory(data, targetData);
              if (category?.prompt_item_id) {
                return { ...category, scroll: true };
              }
            }
            // 更新选中的分类
            if (pre.prompt_item_id && operateType.current !== 'search') {
              const category = getLatestCategory(data, pre);
              if (category?.prompt_item_id) {
                return category;
              }
            }
            if (operateType?.current !== 'search') {
              const category = data[0].prompt_item_types?.[0];
              return {
                ..._.pick(data[0], 'prompt_item_id', 'prompt_item_name'),
                prompt_item_type_id: category?.id,
                prompt_item_type_name: category?.name
              };
            }
            return selectedCategory;
          });
      }
    } catch (err) {
      dispatchProjectState({ loading: false });
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  const getLatestCategory = (data: ProjectItem[], oldCategory?: CategoryItem) => {
    const project = _.find(data, d => d.prompt_item_id === oldCategory?.prompt_item_id);
    if (!project) return null;
    let category = _.find(project.prompt_item_types, d => d.id === oldCategory?.prompt_item_type_id);
    if (!category) category = project.prompt_item_types[0];
    return {
      ...(_.pick(project, 'prompt_item_id', 'prompt_item_name') as Pick<
        CategoryItem,
        'prompt_item_id' | 'prompt_item_name'
      >),
      prompt_item_type_id: category?.id,
      prompt_item_type_name: category?.name
    };
  };

  /**
   * 各种操作的回调
   * @param type 操作的是项目还是分组
   * @param key 操作的key标识
   * @param data 操作的数据
   */
  const onProjectOperate = (type: 'project' | 'category', key: string, data?: any) => {
    operateType.current = key;
    if (['create', 'edit', 'delete'].includes(key)) {
      setOpController({ visible: true, type, action: key, data });
    }
    if (key === 'search') {
      getData({ name: data });
    }
  };

  const onAfterOperate = async (action: string, id?: string) => {
    try {
      if (action === 'delete') {
        await confirmDelete();
      }
    } finally {
      closeModal();
      let category: any;
      const { type, data } = opController;
      // 新建后选中
      if (action === 'create') {
        category = {
          prompt_item_id: type === 'project' ? id : data.prompt_item_id,
          prompt_item_type_id: type === 'project' ? undefined : id
        };
      }
      // 删除后选中后一个
      if (action === 'delete') {
        if (type === 'project' && data.prompt_item_id === selectedCategory.prompt_item_id && projectList.length > 1) {
          const index = _.findIndex(projectList, item => item.prompt_item_id === data.prompt_item_id);
          const newIndex = index === projectList.length - 1 ? index - 1 : index + 1;
          category = {
            prompt_item_id: projectList[newIndex]?.prompt_item_id
          };
        }
        if (type === 'category' && data.prompt_item_type_id === selectedCategory.prompt_item_type_id) {
          const project = _.find(projectList, item => item.prompt_item_id === data.prompt_item_id);
          const index = _.findIndex(project?.prompt_item_types, item => item.id === data.prompt_item_type_id);
          const newIndex = index === (project?.prompt_item_types?.length || 0) - 1 ? index - 1 : index + 1;
          category = {
            prompt_item_id: project?.prompt_item_id,
            prompt_item_type_id: project?.prompt_item_types?.[newIndex]?.id
          };
        }
      }
      getData(action === 'create' ? { ...projectState, name: '' } : projectState, false, category);
    }
  };

  const confirmDelete = async () => {
    const { type, data } = opController;
    const body = type === 'project' ? { item_id: data.prompt_item_id } : { type_id: data.prompt_item_type_id };
    const { res } = (await promptServices.promptDelete(body)) || {};
  };

  const onCategorySelect = (data: CategoryItem) => {
    setSelectedCategory(data);
  };

  return (
    <div className={classNames(className, 'manage-prompt-home-root kw-flex kw-h-100')}>
      <ProjectList
        ref={listRef}
        operateType={operateType}
        data={projectList}
        projectState={projectState}
        selectedCategory={selectedCategory}
        onSelect={onCategorySelect}
        onOperate={onProjectOperate}
        setSelectedCategory={setSelectedCategory}
      />
      <div className="kw-flex-column kw-flex-item-full-width" style={{ position: 'relative' }}>
        <LoadingMask loading={projectState.mountLoading} />
        {projectState.total && selectedCategory.prompt_item_type_id ? (
          <>
            <ProjectHeader selectedCategory={selectedCategory} onOperate={onProjectOperate} />
            <ProjectDetail
              className="kw-flex-item-full-height"
              selectedCategory={selectedCategory}
              projectList={projectList}
            />
          </>
        ) : (
          <div className="kw-center kw-h-100" style={{ display: projectState.mountLoading ? 'none' : undefined }}>
            <NoDataBox
              className="noDataBox"
              imgSrc={createImg}
              desc={
                <>
                  {intl.get('prompt.createProjectTip').split('|')[0]}
                  <span
                    className="kw-c-primary kw-pointer"
                    onClick={() => {
                      const type = projectState.total ? 'category' : 'project';
                      onProjectOperate(type, 'create', {});
                    }}
                  >
                    {
                      intl
                        .get(`prompt.${projectState.total ? 'createGroupTip' : 'createProjectTemplateTip'}`)
                        .split('|')[1]
                    }
                  </span>
                  {
                    intl
                      .get(`prompt.${projectState.total ? 'createGroupTip' : 'createProjectTemplateTip'}`)
                      .split('|')[2]
                  }
                </>
              }
            />
          </div>
        )}
      </div>

      <ProjectOperateModal
        visible={opController.action !== 'delete' && opController.type === 'project' && opController.visible}
        data={opController.data}
        action={opController.action}
        onOk={onAfterOperate}
        onCancel={closeModal}
      />
      <CategoryOperateModal
        visible={opController.action !== 'delete' && opController.type === 'category' && opController.visible}
        data={opController.data}
        action={opController.action}
        onOk={onAfterOperate}
        onCancel={closeModal}
      />
      <DeleteModal
        visible={opController.action === 'delete' && opController.visible}
        type={opController.type}
        onOk={onAfterOperate}
        onCancel={closeModal}
      />
    </div>
  );
};

export default PromptHome;

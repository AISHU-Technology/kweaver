import React, { memo, useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { message, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import servicesThesaurus from '@/services/thesaurus';
import servicesPermission from '@/services/rbacPermission';

import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';

import ContainerIsVisible from '@/components/ContainerIsVisible';
import ThesaurusLeftList from './ThesaurusLeftList';
import ThesaurusRightContent from './ThesaurusRightContent';
// import CreateModal from './CreateModal';
import ThesaurusModeModal from '@/components/ThesaurusModeModal';

import './style.less';
import { sessionStore } from '@/utils/handleFunction';
interface ThesaurusProps {
  knData: Record<string, any>;
}
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.GetLexiconList.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId',
  'Builder.LexiconController.GetLexiconById.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId'
};
const ThesaurusManagement: React.FC<ThesaurusProps> = props => {
  const { knData } = props;
  const inputRef = useRef<any>();
  const [loading, setLoading] = useState(false);
  const [thesaurusId, setThesaurusId] = useState(0);
  const [thesaurusList, setThesaurusList] = useState<any>(0); // 词库列表
  const [selectedThesaurus, setSelectedThesaurus] = useState<any>(0); // 选中的词库
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false); // 新建弹窗
  const [importModalVisible, setImportModalVisible] = useState(false); // 导入弹窗
  const [thesaurusListCount, setThesaurusListCount] = useState<number>(0); // 词库数量
  const [listPage, setListPage] = useState(1); // 列表页码
  const [isCreateVisible, setIsCreateVisible] = useState(false);
  const [collapse, setCollapse] = useState(sessionStore.get('thesaurusList') === '1');
  const [selectedLeftId, setSelectedLeftId] = useState<any>(0);

  useEffect(() => {
    getThesaurusList({});
  }, [knData]);

  /**
   * 获取词库列表
   */
  const getThesaurusList = async ({
    page = 1,
    size = 100000,
    order = 'desc',
    word = '',
    rule = 'create_time',
    isUseInterval = false
  }) => {
    if (!knData?.id) return;
    const data = { knowledge_id: knData?.id, page, size, order, word, rule };
    if (!isUseInterval) setLoading(true);

    try {
      const response = await servicesThesaurus.thesaurusList(data);
      const { res, ErrorCode } = response || {};

      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(response?.Description);
        return;
      }
      setThesaurusListCount(res?.count);
      setThesaurusList(res?.df);
      setListPage(page);
      // if (res?.df?.length) {
      //   const dataIds = _.map(res?.df, (item: any) => String(item.id));
      //   const postData = { dataType: PERMISSION_KEYS.TYPE_LEXICON, dataIds };
      //   servicesPermission.dataPermission(postData).then(result => {
      //     const codesData = _.keyBy(result?.res, 'dataId');
      //     const newTableData = _.map(res?.df, (item: any) => {
      //       const codes = codesData?.[item.id]?.codes;
      //       item.__codes = codes;
      //       item.isDisable = !HELPER.getAuthorByUserInfo({
      //         roleType: PERMISSION_CODES.ADF_KN_LEXICON_EDIT,
      //         userType: PERMISSION_KEYS.LEXICON_VIEW,
      //         // userType: PERMISSION_KEYS.LEXICON_EDIT,
      //         userTypeDepend: codes
      //       });
      //       return item;
      //     });
      //     setThesaurusList(newTableData);
      //   });
      // }

      if (isUseInterval && selectedThesaurus?.status === 'running') {
        getThesaurusById(selectedThesaurus?.id);
        setSelectedLeftId(selectedThesaurus?.id);
      }
      if (!isUseInterval) {
        getThesaurusById(sessionStore.get('thesaurusSelectedId') || res?.df[0]?.id);
        setSelectedLeftId(sessionStore.get('thesaurusSelectedId') || res?.df[0]?.id);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const updateTimes = _.map(selectedThesaurus, item => item?.update_time)?.join(',');
  useEffect(() => {
    // 获取权限
    if (_.isEmpty(selectedThesaurus)) return;
    // const postData = { dataType: PERMISSION_KEYS.TYPE_LEXICON, dataIds: [String(selectedThesaurus?.id)] };
    // servicesPermission.dataPermission(postData).then(result => {
    //   setSelectedThesaurus({ ...selectedThesaurus, __codes: result?.res?.[0]?.codes || [] });
    // });
  }, [updateTimes]);

  /**
   * 根据ID查询词库的信息
   */
  const getThesaurusById = async (thesaurus: any, page = 1, refresh = false) => {
    if (!thesaurus) {
      setLoading(false);
      return;
    }
    setThesaurusId(thesaurus);

    // setLoading(true);
    try {
      const data = { id: thesaurus, page, size: 100 };
      const response = await servicesThesaurus.thesaurusInfoBasic(data);
      const { ErrorCode, res } = response || {};
      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(response?.Description);
        return;
      }
      setSelectedThesaurus(res);
      setLoading(false);
      if (refresh) message.success(intl.get('userManagement.refreshSuccess'));
    } catch (err) {
      //
    }
  };

  /**
   * 轮询数据
   */
  HOOKS.useInterval(async () => {
    const list = _.filter(thesaurusList, (item: any) => item?.status === 'running');
    if (!_.isEmpty(list)) {
      getThesaurusList({ page: listPage, isUseInterval: true });
    }
  }, 10 * 1000);

  /**
   * 导入 | 新建弹窗
   */
  const onImportAndCreateModal = (type: string) => {
    if (type === 'create') {
      setIsCreateVisible(true);
    } else {
      setImportModalVisible(true);
    }
  };

  /**
   * 清空输入框
   */
  const onHandleOk = () => {
    //
  };

  /**
   * 清空输入框
   */
  const onClearInput = () => {
    inputRef?.current?.onClearInputValue();
  };

  /**
   * 取消
   */
  const onHandleCancel = () => {
    setIsCreateVisible(false);
  };

  return (
    <div className="thesaurus-management kw-flex">
      <ThesaurusLeftList
        ref={inputRef}
        thesaurusList={thesaurusList}
        onImportAndCreateModal={onImportAndCreateModal}
        createModalVisible={createModalVisible}
        setCreateModalVisible={setCreateModalVisible}
        importModalVisible={importModalVisible}
        setImportModalVisible={setImportModalVisible}
        getThesaurusList={getThesaurusList}
        selectedThesaurus={selectedThesaurus}
        getThesaurusById={getThesaurusById}
        knowledge={knData}
        thesaurusListCount={thesaurusListCount}
        listPage={listPage}
        collapse={collapse}
        setCollapse={setCollapse}
        selectedLeftId={selectedLeftId}
        setSelectedLeftId={setSelectedLeftId}
      />
      <ThesaurusRightContent
        key={thesaurusId}
        loading={loading}
        thesaurusList={thesaurusList}
        selectedThesaurus={selectedThesaurus}
        knowledge={knData}
        getThesaurusList={getThesaurusList}
        getThesaurusById={getThesaurusById}
        onImportAndCreateModal={onImportAndCreateModal}
        onClearInput={onClearInput}
        collapse={collapse}
        setCollapse={setCollapse}
      />
      <ThesaurusModeModal
        visible={isCreateVisible}
        onHandleOk={onHandleOk}
        onHandleCancel={onHandleCancel}
        selectedThesaurus={selectedThesaurus}
      />
    </div>
  );
};

export default memo(ThesaurusManagement);

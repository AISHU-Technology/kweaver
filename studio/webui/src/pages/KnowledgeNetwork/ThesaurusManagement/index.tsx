import React, { memo, useState, useEffect } from 'react';
import _ from 'lodash';
import { message, Spin, notification } from 'antd';
import { LoadingOutlined, CheckCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import useInterval from '@/utils/useInterval/index';

import servicesThesaurus from '@/services/thesaurus';

import ThesaurusList from './ThesaurusList';
import ThesaurusContent from './ThesaurusContent';

import knowledgeEmpty from '@/assets/images/kgEmpty.svg';

import './style.less';
interface ThesaurusProps {
  kgData: Record<string, any>;
}
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.GetLexiconList.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId',
  'Builder.LexiconController.GetLexiconById.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId'
}
const ThesaurusManagement: React.FC<ThesaurusProps> = props => {
  const { kgData } = props;
  const [loading, setLoading] = useState(false);
  const [thesaurusList, setThesaurusList] = useState<any>(0); // 词库列表
  const [selectedThesaurus, setSelectedThesaurus] = useState<any>(0); // 选中的词库
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false); // 新建弹窗
  const [thesaurusListCount, setThesaurusListCount] = useState<number>(0); // 词库数量
  const [listPage, setListPage] = useState(1); // 列表页码

  useEffect(() => {
    getThesaurusList({});
  }, [kgData]);

  /**
   * 获取词库列表
   */
  const getThesaurusList = async ({ page = 1, size = 20, order = 'desc', word = '', rule = 'update_time', isUseInterval = false }) => {
    if (!kgData?.id) return;
    const data = {
      knowledge_id: kgData?.id,
      page,
      size,
      order,
      word,
      rule,
    }
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

      if (isUseInterval && selectedThesaurus?.status === 'running') {
        getThesaurusById(selectedThesaurus);
      }
      if (!isUseInterval) {
        getThesaurusById(res?.df[0]);
      }
    } catch (err) {
      setLoading(false);
    }
  }

  /**
   * 根据ID查询词库的信息
  */
  const getThesaurusById = async (thesaurus: any, page = 1, refresh = false) => {
    if (!thesaurus?.id) {
      setLoading(false);
      return;
    }
    // setLoading(true);
    try {
      const data = {
        id: thesaurus?.id,
        page,
        size: 50
      }
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
  }

  /**
  * 轮询数据
  */
  useInterval(() => {
    const list = _.filter(thesaurusList, ((item: any) => item?.status === 'running'));
    if (!_.isEmpty(list)) {
      getThesaurusList({ page: listPage, isUseInterval: true })
    }
  }, 10 * 1000);

  return (
    <div className="thesaurus-management">
      <div className="thesaurus-list-box">
        <ThesaurusList
          thesaurusList={thesaurusList}
          createModalVisible={createModalVisible}
          setCreateModalVisible={setCreateModalVisible}
          getThesaurusList={getThesaurusList}
          selectedThesaurus={selectedThesaurus}
          getThesaurusById={getThesaurusById}
          knowledge={kgData}
          thesaurusListCount={thesaurusListCount}
          listPage={listPage}
        />
      </div>
      <div className="thesaurus-content-box ">
        {loading ? (
          <div className="ad-center" style={{ height: '100%' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}></Spin>
          </div>
        ) : !_.isEmpty(thesaurusList) ?
          <ThesaurusContent
            selectedThesaurus={selectedThesaurus}
            knowledge={kgData}
            getThesaurusList={getThesaurusList}
            getThesaurusById={getThesaurusById}
          /> :
          <div className="thesaurus-empty">
            <div className="empty-content">
              <img src={knowledgeEmpty} alt="nodata" className="nodata-img"></img>
              <div className="text-des">
                <div className="">
                  {intl.get('ThesaurusManage.emptyDescription').split('|')[0]}
                  <span className="create-span" onClick={() => setCreateModalVisible(true)}>
                    {intl.get('ThesaurusManage.emptyDescription').split('|')[1]}
                  </span>
                  {intl.get('ThesaurusManage.emptyDescription').split('|')[2]}
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  )
}
export default (memo)(ThesaurusManagement);
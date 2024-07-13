import React, { useEffect, useState, useMemo, memo, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Table, Button, message, Tooltip, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import HELPER from '@/utils/helper';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import serverThesaurus from '@/services/thesaurus';

import AddWordsModal from './AddWordsModal';
import DeleteWordsModal from './DeleteWords';
import ThesaurusHeader from './Header';
import ModalImport from './ModelImport';
import ThesaurusTable from './ThesaurusTable';

import createSvg from '@/assets/images/create.svg';

import './style.less';

export interface ThesaurusContentProps {
  selectedThesaurus: any;
  getThesaurusById: (thesaurus: any) => void;
  knowledge: any;
}
// const SIZE = 50;
const SIZE = 16;
const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.SearchLexiconWord.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId'
};
const ThesaurusRightContent = (props: any) => {
  const {
    selectedThesaurus,
    getThesaurusById,
    loading,
    onImportAndCreateModal,
    knowledge,
    thesaurusList,
    getThesaurusList,
    onClearInput,
    collapse,
    setCollapse
  } = props;
  const searchInput = useRef<any>(); // 绑定搜索框
  // const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [page, setPage] = useState(1); // 页码
  // const [total, setTotal] = useState(0);
  const [showData, setShowData] = useState([{ id: '1' }]); // 表格数据
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [columns, setColumns] = useState<any[] | undefined>([]);
  const [addWordsVisible, setAddWordsVisible] = useState<boolean>(false); // 编辑新加词汇弹窗
  const [delWordsVisible, setDelWordsVisible] = useState<boolean>(false); // 删除词汇弹窗
  const [opWordsType, setOpWordsType] = useState<string>('add');
  // const [searchWordsValue, setSearchWordsValue] = useState<string>(''); // 控制搜索的值
  const [deleteType, setDeleteType] = useState<string>('one'); // 删除单个或多个
  const [deleteValue, setDeleteValue] = useState<Array<any>>([]); // 删除内容
  const [importModalVisible, setImportModalVisible] = useState<boolean>(false); // 导入弹窗
  const [editRecord, setEditRecord] = useState<any>(); // 编辑的一行词库
  const [showInfo, setShowInfo] = useState<boolean>(false); // 侧边信息

  /**
   * 编辑词库
   * @param record 一行的词
   */
  const editWords = (record: any) => {
    if (selectedThesaurus?.status === 'running') {
      message.warning(intl.get('ThesaurusManage.editwordsError'));
      return;
    }
    setEditRecord(record);
    setOpWordsType('edit');
    setAddWordsVisible(true);
  };

  /**
   * 打开删除弹窗
   */
  const openDeleteModal = (item: any, type: any) => {
    if (type === 'one') {
      setDeleteValue([item]);
    }
    if (type === 'more') {
      let value: any[] = [];
      selectedRowKeys.forEach(item => {
        const obj = JSON.parse(item as string);

        value = [...value, obj];
      });
      setDeleteValue(value);
    }
    setDeleteType(type);
    setDelWordsVisible(true);
  };

  // 关闭删除词汇弹窗
  const closeDelModal = () => setDelWordsVisible(false);
  // 关闭导入弹窗
  const closeImportModal = () => setImportModalVisible(false);
  // 关闭添加词库的弹窗
  const closeAddModal = () => setAddWordsVisible(false);

  const addWords = () => {
    if (selectedThesaurus?.status === 'running') {
      message.warning(intl.get('ThesaurusManage.editwordsError'));
      return;
    }
    setOpWordsType('add');
    setAddWordsVisible(true);
  };
  return (
    <div className="thesaurus-right-content-table-root" style={{ width: collapse ? '100%' : 'calc(100% - 320px)' }}>
      {loading ? (
        <div className="kw-center kw-h-100">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}></Spin>
        </div>
      ) : !_.isEmpty(thesaurusList) ? (
        <div className="thesaurus-content">
          <ThesaurusHeader
            columns={columns}
            selectedThesaurus={selectedThesaurus}
            setImportModalVisible={setImportModalVisible}
            setAddWordsVisible={setAddWordsVisible}
            setOpWordsType={setOpWordsType}
            knowledge={knowledge}
            getThesaurusById={getThesaurusById}
            getThesaurusList={getThesaurusList}
            showInfo={showInfo}
            setShowInfo={setShowInfo}
            onClearInput={onClearInput}
            collapse={collapse}
            setCollapse={setCollapse}
          />
          <ThesaurusTable
            hasAuthorEdit={true}
            selectedThesaurus={selectedThesaurus}
            showInfo={showInfo}
            setShowInfo={setShowInfo}
            columns={columns}
            setColumns={setColumns}
            knowledge={knowledge}
            setPage={setPage}
            selectedRowKeys={selectedRowKeys}
            setSelectedRowKeys={setSelectedRowKeys}
            setImportModalVisible={setImportModalVisible}
            getThesaurusById={getThesaurusById}
            addWords={addWords}
            showData={showData}
            openDeleteModal={openDeleteModal}
            page={page}
            setShowData={setShowData}
            editWords={editWords}
          />

          <AddWordsModal
            isVisible={addWordsVisible}
            closeModal={closeAddModal}
            setPage={setPage}
            page={page}
            type={opWordsType}
            columns={columns}
            selectedThesaurus={selectedThesaurus}
            editRecord={editRecord}
            getThesaurusById={getThesaurusById}
          />

          <ModalImport
            isVisible={importModalVisible}
            closeModal={closeImportModal}
            selectedThesaurus={selectedThesaurus}
            setPage={setPage}
            page={page}
            getThesaurusById={getThesaurusById}
            getThesaurusList={getThesaurusList}
          />

          <DeleteWordsModal
            isVisible={delWordsVisible}
            closeModal={closeDelModal}
            deleteType={deleteType}
            deleteValue={deleteValue}
            page={page}
            selectedThesaurus={selectedThesaurus}
            getThesaurusById={getThesaurusById}
          />
        </div>
      ) : (
        <div className="thesaurus-empty kw-c-text">
          <div className="empty-content">
            <img src={createSvg} alt="nodata" className="nodata-img" />
            <div className="text-des">
              <ContainerIsVisible placeholder={intl.get('ThesaurusManage.noWord')}>
                <div>
                  {intl.get('ThesaurusManage.create').split('|')[0]}
                  <span className="create-span kw-pointer" onClick={() => onImportAndCreateModal('import')}>
                    {intl.get('ThesaurusManage.create').split('|')[1]}
                  </span>
                  {intl.get('ThesaurusManage.create').split('|')[2]}
                  <span className="create-span" onClick={() => onImportAndCreateModal('create')}>
                    {intl.get('ThesaurusManage.create').split('|')[3]}
                  </span>
                  {intl.get('ThesaurusManage.create').split('|')[4]}
                </div>
              </ContainerIsVisible>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default memo(ThesaurusRightContent);

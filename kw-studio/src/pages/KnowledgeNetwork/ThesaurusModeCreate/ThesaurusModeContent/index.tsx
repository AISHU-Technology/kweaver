import React, { useState, useEffect, useRef } from 'react';

import { Tabs, Button, message } from 'antd';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { getParam, sessionStore } from '@/utils/handleFunction';
import { useHistory } from 'react-router-dom';

import { tipModalFunc } from '@/components/TipModal';
import THESAURUS_TEXT from '@/enums/thesaurus_mode';
import servicesThesaurus from '@/services/thesaurus';

import ThesaurusTopColumn from './ThesaurusTopColumn';
import GraphContent from './GraphContent';
import ThesaurusContent from './ThesaurusContent';

import { onFormatTableData, onHandleInfoToTable } from './assistFunction';
import { ERROR_CODE } from './enum';

import './style.less';
import classNames from 'classnames';
import HeaderTab from '@/components/ADTab';

const TAB_TITLE = {
  graph: intl.get('cognitiveSearch.resource.know'),
  thesaurus: intl.get('ThesaurusManage.thesaurus')
};

const ThesaurusModeContent = (props: any) => {
  const { isChange, setIsChange } = props;
  const history = useHistory();
  const tableCreateGraphRef = useRef<any>();
  const tableCreateThesaurusRef = useRef<any>();
  const [mode, setMode] = useState(''); // 模板类型 实体链接|近义词|分词
  const [tabKey, setTabKey] = useState('graph'); // tab名称
  const [visible, setVisible] = useState(false); // 添加弹窗
  const [tableData, setTableData] = useState<any>([]);
  const [thesaurusTableData, setThesaurusTableData] = useState<any>([]);
  const [thesaurusTableDataTime, setThesaurusTableDataTime] = useState<any>([]); // 词库列表实时保存
  const [graphTableDataTime, setGraphTableDataTime] = useState<any>([]); // 图谱实时保存
  const [visibleThesaurus, setVisibleThesaurus] = useState(false); // 添加词库弹窗
  const [usb, setUsb] = useState({});
  const [isPrevent, setIsPrevent] = useState(true); // 是否阻止路由跳转
  // const [isChange, setIsChange] = useState(false); // 是否操作过数据
  const [editRecord, setEditRecord] = useState<any>({}); // 编辑的信息
  const [tableLoading, setTableLoading] = useState(false);
  const [allData, setAllData] = useState<any>([]);

  useEffect(() => {
    const { mode } = getParam(['mode']);
    setMode(mode);

    onGetInfoById();
  }, []);

  useEffect(() => {
    onTableDataSave('');
  }, [tabKey]);

  const onTableDataSave = (data?: any) => {
    if (!data) {
      return;
    }
    setTableData(data?.values || allData?.values || []);
    tableCreateGraphRef?.current?.onChangeGraphTableData({ page: 1 }, data?.values || allData?.values || []);

    setThesaurusTableData(data?.result || allData?.result || []);
    tableCreateThesaurusRef?.current?.onChangeTableData({ page: 1 }, data?.result || allData?.result || []);
  };

  /**
   * 根据id获取词库信息
   */
  const onGetInfoById = async (type?: string) => {
    try {
      setTableLoading(true);
      const { thesaurus_id } = getParam(['thesaurus_id']);
      const data = { id: thesaurus_id, page: 1, size: 10000 };
      const response = await servicesThesaurus.thesaurusInfoBasic(data);
      const { ErrorCode, res } = response || {};
      if (ErrorCode) {
        setTableLoading(false);
        ERROR_CODE[ErrorCode] ? message.error(intl.get(ERROR_CODE[ErrorCode])) : message.error(response?.Description);
        return;
      }
      setTableLoading(false);
      setEditRecord({
        name: res?.lexicon_name,
        mode: res?.mode,
        description: res?.description,
        message: res?.extract_info
      });
      const { result, values } = onHandleInfoToTable(res?.extract_info);
      setAllData({ result, values });
      onTableDataSave({ result, values });
    } catch (err) {
      //
    }
  };

  /**
   * 退出
   */
  const onExit = async (type?: any, data?: any) => {
    if (isChange) {
      // if (isChange || ['knw', 'studio'].includes(type)) {
      const isOk = await tipModalFunc({
        title: intl.get('ThesaurusManage.createMode.tip'),
        content: intl.get('ThesaurusManage.createMode.tipContent')
      });
      if (!isOk) {
        return;
      }
      onExitKnw(type, data);
    } else {
      onExitKnw(type, data);
    }
  };

  /**
   * 退出原始菜单
   */
  const onExitKnw = (type: any, data?: any) => {
    const { knw_id, thesaurus_id } = getParam(['knw_id', 'thesaurus_id']);
    if (type === 'knw') {
      Promise.resolve().then(() => {
        history.push('/home');
        setIsChange(false);
      });
      return;
    }
    Promise.resolve().then(() => {
      setIsChange(false);
      history.push(`/knowledge/studio-concept-thesaurus?id=${knw_id}`);
      sessionStore.set('thesaurusSelectedId', thesaurus_id);
    });
  };

  const onTabKeyChange = (e: any) => {
    setTabKey(e);
  };

  /**
   * 保存
   */
  const onSave = async (value: string) => {
    const { thesaurus_id, action, type } = getParam(['thesaurus_id', 'action', 'type']);
    if (value === 'run' && !['create', 'edit'].includes(type)) {
      const isOk = await tipModalFunc({
        title: intl.get('ThesaurusManage.runTitle'),
        content: intl.get('ThesaurusManage.runContent')
      });
      if (!isOk) {
        setIsPrevent(true);
        return;
      }
    }

    const { extract_info } = onFormatTableData(tableData, thesaurusTableData);
    const data = {
      id: Number(thesaurus_id),
      name: editRecord?.name,
      description: editRecord?.description,
      extract_info
    };
    try {
      const { res, ErrorCode, ErrorDetails } = await servicesThesaurus.thesaurusEdit(data);
      if (res) {
        if (value === 'save') {
          setThesaurusTableDataTime([]);
          setGraphTableDataTime([]);
          message.success(intl.get('global.saveSuccess'));
          setIsChange(false);
          onGetInfoById('save');
        } else {
          onBuild(extract_info);
        }
      }
      if (ErrorCode === 'Builder.LexiconService.EditLexicon.DuplicatedName') {
        message.error(intl.get('ThesaurusManage.nameRepeatError'));
        return;
      }
      ErrorDetails && message.error(ErrorDetails);
    } catch (err) {
      //
    }
  };

  /**
   * 判断传值是否为空
   */
  const onJudgementIsEmpty = (data: any) => {
    if (mode !== 'custom') {
      if (_.isEmpty(data?.graph)) return false;
    } else {
      if (_.isEmpty(data?.graph) && _.isEmpty(data?.lexicon)) {
        return false;
      }
    }
    return true;
  };

  /**
   * 运行并关闭
   */
  const onBuild = async (extract_info: any) => {
    const { thesaurus_id, action, type } = getParam(['thesaurus_id', 'action', 'type']);
    const data = { lexicon_id: Number(thesaurus_id) };
    const isEmpty = onJudgementIsEmpty(extract_info);
    if (!isEmpty) {
      message.error(intl.get('ThesaurusManage.addConfig'));
      return;
    }

    try {
      const { res, ErrorDetails, ErrorCode } = await servicesThesaurus.thesaurusBuild(data);
      if (res) {
        message.success(intl.get('ThesaurusManage.runReturn'));
        onExitKnw('');
      }
      if (ErrorCode === 'Builder.LexiconService.BuildTask.KnowledgeCapacityError') {
        message.error(intl.get('license.operationFailed'));
        return;
      }
      ErrorDetails && message.error(ErrorDetails);
    } catch (err) {
      //
    }
  };

  return (
    <div className="thesaurus-mode-create-content-root kw-flex">
      <ThesaurusTopColumn
        onExit={onExit}
        mode={mode}
        setEditRecord={setEditRecord}
        editRecord={editRecord}
        isChange={isChange}
        setIsChange={setIsChange}
        thesaurusTableData={thesaurusTableData}
        tableData={tableData}
        onGetInfoById={onGetInfoById}
      />
      {mode === 'custom' ? (
        <Tabs className="kw-pl-6 kw-pr-6 kw-h-100" activeKey={tabKey} onChange={onTabKeyChange}>
          <Tabs.TabPane tab={intl.get('cognitiveSearch.resource.know')} key="graph">
            <GraphContent
              ref={tableCreateGraphRef}
              setVisible={setVisible}
              mode={mode}
              tableData={tableData}
              setTableData={setTableData}
              visible={visible}
              setIsChange={setIsChange}
              setGraphTableDataTime={setGraphTableDataTime}
              tableLoading={tableLoading}
              tabKey={tabKey}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab={intl.get('ThesaurusManage.thesaurus')} key="thesaurus">
            <ThesaurusContent
              ref={tableCreateThesaurusRef}
              mode={mode}
              setVisibleThesaurus={setVisibleThesaurus}
              thesaurusTableData={thesaurusTableData}
              setThesaurusTableData={setThesaurusTableData}
              setThesaurusTableDataTime={setThesaurusTableDataTime}
              visible={visibleThesaurus}
              tabKey={tabKey}
              setIsChange={setIsChange}
              tableLoading={tableLoading}
            />
          </Tabs.TabPane>
        </Tabs>
      ) : (
        <div className={classNames('kw-h-100', { 'kw-pl-6 kw-pr-6': mode !== 'std' })}>
          <GraphContent
            ref={tableCreateGraphRef}
            setVisible={setVisible}
            mode={mode}
            tableData={tableData}
            setTableData={setTableData}
            visible={visible}
            setIsChange={setIsChange}
            setGraphTableDataTime={setGraphTableDataTime}
            tableLoading={tableLoading}
            tabKey={tabKey}
          />
        </div>
      )}

      <div className="footer-box kw-center kw-pt-3 kw-pb-3">
        <Button className="kw-mr-3" onClick={onExit}>
          {intl.get('cognitiveSearch.cancel')}
        </Button>
        <Button className="kw-mr-3" onClick={() => onSave('save')}>
          {intl.get('cognitiveSearch.save')}
        </Button>
        <Button type="primary" onClick={() => onSave('run')}>
          {intl.get('ThesaurusManage.createMode.runAndExit')}
        </Button>
      </div>
    </div>
  );
};

export default ThesaurusModeContent;

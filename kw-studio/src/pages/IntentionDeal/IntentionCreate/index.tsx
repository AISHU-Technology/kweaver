import React, { useState, useRef, useEffect } from 'react';

import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory, Prompt } from 'react-router-dom';

import { Button, message, Tooltip } from 'antd';
import classNames from 'classnames';
import { LeftOutlined } from '@ant-design/icons';
import { tipModalFunc } from '@/components/TipModal';

import intentionService from '@/services/intention';
import { getParam } from '@/utils/handleFunction';

import IntentionTable from './IntentionTable';
import IntentionInfo from './IntentionInfo';
import './style.less';
import AdExitBar from '@/components/AdExitBar/AdExitBar';

const IntentionCreate = (props: any) => {
  const { knwData, knwStudio } = props;
  const history = useHistory();
  const fileRef = useRef<any>(null);
  const saveConfigRef = useRef<any>(); // 编辑搜索策略配置组件
  const [nameInput, setNameInput] = useState('');
  const [fileUpLoad, setFileUpLoad] = useState('');
  const [slotDes, setSlotDes] = useState('');
  const [action, setAction] = useState(''); // 新建|编辑
  const [knId, setKnId] = useState(''); // 知识网络id
  const [iconShow, setIconShow] = useState('empty'); // 缺醒图展示 empty
  const [isPrevent, setIsPrevent] = useState(true); // 是否阻止路由跳转
  const [docContent, setDocContent] = useState<any>([]); // 文档内容
  const [editMes, setEditMes] = useState<any>({}); // 编辑时的数据
  const [isUpload, setIsUpload] = useState(false); // 是否重新上传
  const [docName, setDocName] = useState('文档'); // 文档名称
  const [intentionList, setIntentionList] = useState<any>([]); // 文件解析后的表格数据
  const [knwMes, setKnwMes] = useState<any>({});
  const [usb, setUsb] = useState('');

  useEffect(() => {
    const { action } = getParam(['knw_id', 'action']);
    if (action === 'edit') {
      const { intentpool_id } = getParam(['intentpool_id']);
      onEditIntent(intentpool_id);
    }

    setAction(action);
    knwData?.id && setKnId(knwData?.id);
    setKnwMes({ ...knwData });
    if (usb === 'knw') {
      onKnwSkip('knw', knwData);
      return;
    }
    if (knwStudio === 'studio') {
      onKnwSkip('studio');
    }
  }, [knwData, knwStudio]);

  const onKnwSkip = async (type: any, knwData?: any) => {
    const isOk = await tipModalFunc({
      title: intl.get('intention.quit'),
      content: intl.get('intention.caution'),
      closable: false
    });
    if (!isOk) {
      setIsPrevent(true);
      return;
    }
    setIsPrevent(false);
    Promise.resolve().then(() => {
      if (type === 'knw') {
        history.push('/model-factory/studio-intentionPool');
        return;
      }
      if (type === 'studio') {
        history.push('/home');
      }
    });
  };

  /**
   * 编辑
   */
  const onEditIntent = async (id: any) => {
    const { knw_id } = getParam(['knw_id']);
    try {
      const { res } = await intentionService.editIntentPool({ intentpool_id: id });
      if (res) {
        setEditMes(res);
        setNameInput(res?.intentpool_name);
        setIconShow('table');
      }
    } catch (err) {
      //
    }
  };

  /**
   * 退出 | 保存并退出
   */
  const onExit = async (type: string) => {
    if (type === 'save') {
      if (iconShow !== 'table' || !nameInput) {
        saveConfigRef.current.onErrorTip(iconShow, !nameInput);
        return;
      }

      setIsPrevent(false);
      await saveConfigRef.current.onSave('save');
      return;
    }
    if (type === 'train') {
      setIsPrevent(false);
      const res = await saveConfigRef.current.onSave('train');
      if (res && res?.intentpool_id) {
        onSubmit(res?.intentpool_id);
      }
      return;
    }
    if (type === 'exit' || type === 'knw') {
      setIsPrevent(false);
      const isOk = await tipModalFunc({
        title: intl.get('intention.quit'),
        content: intl.get('intention.caution'),
        closable: false
      });
      if (!isOk) {
        setIsPrevent(true);
        return;
      }
      setIsPrevent(false);
      Promise.resolve().then(() => {
        history.push('/model-factory/studio-intentionPool');
      });
    }
  };

  /**
   * 提交训练
   */
  const onSubmit = async (id: any) => {
    try {
      const data: any = {
        intentpool_id: id
      };
      const res = await intentionService.trainModel(data);
      if (res) {
        history.push('/model-factory/studio-intentionPool');
        message.success(res);
      }
    } catch (err) {
      if (
        err?.ErrorDetails &&
        err?.ErrorDetails[0].detail === 'A task is training,please wait for completion before starting'
      ) {
        message.error(intl.get('intention.taskFull'));
        history.push('/model-factory/studio-intentionPool');
      }
    }
  };

  /**
   * 上传文件
   */
  const onUploadDocument = () => {
    setTimeout(() => {
      fileRef?.current.click();
    }, 0);
  };

  return (
    <div className="intention-service-config-root kw-flex-column kw-h-100">
      <AdExitBar
        onExit={() => onExit('exit')}
        title={action === 'create' ? intl.get('intention.createIntention') : intl.get('intention.editIntent')}
      />
      <div className="intention-create-content kw-flex kw-h-100">
        <div className="content-left">
          <IntentionInfo
            ref={saveConfigRef}
            setNameInput={setNameInput}
            setFileUpLoad={setFileUpLoad}
            setSlotDes={setSlotDes}
            setIconShow={setIconShow}
            editMes={editMes}
            docContent={docContent}
            setDocContent={setDocContent}
            isUpload={isUpload}
            setIsUpload={setIsUpload}
            docName={docName}
            setDocName={setDocName}
            intentionList={intentionList}
            iconShow={iconShow}
            slotDes={slotDes}
            nameInput={nameInput}
            fileRef={fileRef}
          />
        </div>
        <div className="content-right" style={iconShow === 'table' ? { background: '#ffffff', padding: '0px' } : {}}>
          <IntentionTable
            iconShow={iconShow}
            onUploadDocument={onUploadDocument}
            docContent={docContent}
            editMes={editMes}
            intentionList={intentionList}
            setIntentionList={setIntentionList}
          />
          <div className="kw-center kw-pt-3 bottom-btn kw-pb-3">
            <Button className="kw-mr-3" onClick={() => onExit('save')}>
              {intl.get('intention.save')}
            </Button>
            <Tooltip trigger={['hover']} placement="top" title={intl.get('intention.btnTip')}>
              <Button disabled={iconShow !== 'table' || !nameInput} type="primary" onClick={() => onExit('train')}>
                {intl.get('intention.run')}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
      <Prompt
        when={isPrevent}
        message={location => {
          setUsb('knw');
          return false;
        }}
      />
    </div>
  );
};

export default IntentionCreate;

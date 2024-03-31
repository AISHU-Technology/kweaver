/**
 * 顶部步骤条
 */

import React, { memo, useState, useRef, useEffect } from 'react';
import { Button, Input, message } from 'antd';
import { CheckOutlined, LeftOutlined } from '@ant-design/icons';
import IconFont from '@/components/IconFont';
import intl from 'react-intl-universal';
import './style.less';
import SaveOntologyModal, { SaveOntoModalRef } from '../OntoFooter/SaveOntoModal';
import servicesCreateEntity from '@/services/createEntity';
import Format from '@/components/Format';
import AdExitBar from '@/components/AdExitBar/AdExitBar';

const checkIcon = <CheckOutlined className="check-icon" />;

export interface TopStepsProps {
  current: number;
  saveOntoData: any;
  onExit: () => void;
  onEdit: () => void;
  setSaveOntoData: Function;
}

const TopSteps = (props: any) => {
  const { current, saveOntoData, onExit, setSaveOntoData, ontoLibType, otlId } = props;

  const [showSaveOntologyModal, setShowSaveOntologyModal] = useState(false); // 是否显示保存本体modal

  const saveOntoRef = useRef<SaveOntoModalRef>(null); // 保存本体ref

  const closeSaveOntologyModal = () => {
    setShowSaveOntologyModal(false);
  };

  const clickEdit = () => {
    setShowSaveOntologyModal(true);
  };

  const modalOkSave = async () => {
    const response = await servicesCreateEntity.updateName(otlId, {
      ontology_name: saveOntoRef.current?.dataSummary.current?.ontologyName || '',
      ontology_des: saveOntoRef.current?.dataSummary.current?.ontologyDescribe || '',
      domain: saveOntoRef.current?.dataSummary.current?.domainArray || []
    });
    if (response.Description) {
      if (saveOntoRef.current) {
        saveOntoRef.current!.formDetailError.current = response.ErrorDetails;
      }
      saveOntoRef.current?.form.validateFields();

      // message.error(response.ErrorDetails);
    } else if (response.res) {
      setSaveOntoData({
        ontologyName: saveOntoRef.current?.dataSummary.current?.ontologyName || '',
        domainArray: saveOntoRef.current?.dataSummary.current?.domainArray || [],
        ontologyDescribe: saveOntoRef.current?.dataSummary.current?.ontologyDescribe || ''
      });
      setShowSaveOntologyModal(false);
    }
  };

  return (
    <>
      <AdExitBar
        onExit={onExit}
        title={
          <div className="kw-align-center">
            <span style={{ maxWidth: 174 }} className="kw-ellipsis kw-mr-2" title={saveOntoData.ontologyName}>
              {saveOntoData.ontologyName || ''}
            </span>
            {ontoLibType !== 'view' && (
              <Format.Button type="text" onClick={clickEdit} tip={intl.get('global.edit')}>
                <IconFont type="icon-edit" style={{ fontSize: 14 }} />
              </Format.Button>
            )}
          </div>
        }
      />
      {showSaveOntologyModal && (
        <SaveOntologyModal
          ref={saveOntoRef}
          showSaveOntologyModal={showSaveOntologyModal}
          closeSaveOntologyModal={closeSaveOntologyModal}
          modalOkSave={modalOkSave}
          initData={saveOntoData}
          modalTitle={intl.get('ontoLib.editTitle')}
        />
      )}
    </>
  );
};

export default memo(TopSteps);

import { Form, message, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import Format from '@/components/Format';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import GlossaryTree from '../../../GlossaryTree';
import intl from 'react-intl-universal';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { addTermAttribute, deleteTermAttribute } from '@/services/glossaryServices';
import UniversalModal from '@/components/UniversalModal';

const AddProperty = (props: any) => {
  const {
    glossaryStore: { selectedLanguage, glossaryData, selectedTerm }
  } = useGlossaryStore();
  const { visible, onCancel, refreshTableData, listData } = props;
  const [attributeIds, setAttributeIds] = useState<string[]>([]);

  useEffect(() => {
    const keys = listData.map((item: any) => item.id);
    setAttributeIds(keys);
  }, []);

  const handleSave = async () => {
    if (attributeIds.length === 0) {
      message.error(intl.get('glossary.addEmptyTips'));
      return;
    }
    try {
      const termId = selectedTerm[0].id;
      const listIds = listData.map((item: any) => item.id);
      const addKeys = _.difference(attributeIds, listIds);
      const delKeys = _.difference(listIds, attributeIds);
      if (addKeys.length > 0) {
        await addTermAttribute(glossaryData!.id, {
          start_word_id: termId,
          end_word_id_list: addKeys
        });
        message.success(intl.get('glossary.addSuccess'));
        refreshTableData();
      }
      if (delKeys.length > 0) {
        await deleteTermAttribute(glossaryData!.id, {
          start_word_id: termId,
          end_word_id_list: delKeys
        });
        message.success(intl.get('glossary.addSuccess'));
        refreshTableData();
      }
      onCancel();
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };
  return (
    <UniversalModal
      title={intl.get('glossary.addAttribute')}
      visible={visible}
      width={640}
      onCancel={onCancel}
      footerData={[
        {
          label: intl.get('global.cancel'),
          type: 'default',
          onHandle: () => {
            onCancel();
          }
        },
        {
          label: intl.get('global.ok'),
          type: 'primary',
          onHandle: _.debounce(() => {
            handleSave();
          }, 300)
        }
      ]}
    >
      <div>
        <Format.Title className="kw-mb-2">{intl.get('glossary.termName')}</Format.Title>
        <div className="kw-border" style={{ height: 319, padding: '8px 12px' }}>
          <GlossaryTree
            headerVisible={false}
            readOnly
            checkedKeys={attributeIds}
            selectedLanguage={selectedLanguage}
            showSearch
            checkable
            onCheck={(keys: string[]) => {
              setAttributeIds(keys);
            }}
          />
        </div>
      </div>
    </UniversalModal>
  );
};
export default (props: any) => (props?.visible ? <AddProperty {...props} /> : null);

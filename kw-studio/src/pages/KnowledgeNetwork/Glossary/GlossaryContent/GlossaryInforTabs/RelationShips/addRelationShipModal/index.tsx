import { Form, message, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Format from '@/components/Format';
import _ from 'lodash';
import TemplateModal from '@/components/TemplateModal';
import GlossaryTree, { GlossaryTreeRefType } from '../../../GlossaryTree';
import intl from 'react-intl-universal';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { editCustomRelationByTerm, getCustomRelationList } from '@/services/glossaryServices';
import { TermCustomRelationType } from '@/pages/KnowledgeNetwork/Glossary/types';
import UniversalModal from '@/components/UniversalModal';

type AddRelationShipProps = {
  visible: boolean;
  editData: TermCustomRelationType | null;
  listData: TermCustomRelationType[];
  refreshTableData: () => void;
  onCancel: () => void;
};
const AddRelationShip: React.FC<AddRelationShipProps> = props => {
  const {
    glossaryStore: { selectedLanguage, glossaryData, selectedTerm, customRelationList }
  } = useGlossaryStore();
  const { visible, onCancel, refreshTableData, editData, listData } = props;
  const [customRelationProps, setCustomRelationProps] = useState({
    value: undefined as undefined | number,
    options: [] as any
  });
  const [termIds, setTermIds] = useState<string[]>([]);

  useEffect(() => {
    getCustomRelationOptions();
    if (editData) {
      const ids = editData.words.map(item => item.id);
      setTermIds(ids);
    }
  }, []);

  const getCustomRelationOptions = async () => {
    try {
      const options = customRelationList.map((item: any) => ({
        label: item.name,
        value: item.id
      }));
      if (options.length > 0) {
        const existData = listData.map(item => item.relation_id);
        const selectOptions = options.filter((item: any) => !existData.includes(item.value));
        setCustomRelationProps(prevState => ({
          ...prevState,
          options: editData ? options : selectOptions,
          value: editData ? editData.relation_id : selectOptions[0]?.value
        }));
      }
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  const handleSave = async () => {
    if (termIds.length === 0) {
      message.error(intl.get('glossary.addEmptyTips'));
      return;
    }
    try {
      const termId = selectedTerm[0].id;
      let add_end_word_id_list: string[] = [];
      let remove_end_word_id_list: string[] = [];
      if (!editData) {
        // 说明是新增
        add_end_word_id_list = termIds;
        remove_end_word_id_list = [];
      } else {
        // 说明是编辑
        const editDataTermIds = editData.words.map(item => item.id);
        add_end_word_id_list = _.difference(termIds, editDataTermIds);
        remove_end_word_id_list = _.difference(editDataTermIds, termIds);
      }
      if (add_end_word_id_list.length > 0 || remove_end_word_id_list.length > 0) {
        await editCustomRelationByTerm(glossaryData!.id, {
          relation_id: customRelationProps.value!,
          start_word_id: termId,
          add_end_word_id_list,
          remove_end_word_id_list
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
      title={editData ? intl.get('glossary.editCustomRelation') : intl.get('glossary.addCustomRelation')}
      open={visible}
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
        <div className="kw-mb-4">
          <Format.Title className="kw-mb-2">
            <span className="kw-c-error">*</span>
            {intl.get('glossary.customRelationName')}
          </Format.Title>
          <Select
            disabled={!!editData}
            value={customRelationProps.value}
            style={{ width: '100%' }}
            options={customRelationProps.options}
            onChange={value => {
              setCustomRelationProps(prevState => ({
                ...prevState,
                value
              }));
            }}
          />
        </div>

        <Format.Title className="kw-mb-2">
          <span className="kw-c-error">*</span>
          {intl.get('glossary.termName')}
        </Format.Title>
        <div className="kw-border" style={{ height: 319, padding: '8px 12px' }}>
          <GlossaryTree
            headerVisible={false}
            readOnly
            checkedKeys={termIds}
            selectedLanguage={selectedLanguage}
            showSearch
            checkable
            onCheck={(keys: string[]) => {
              setTermIds(keys);
            }}
          />
        </div>
      </div>
    </UniversalModal>
  );
};
export default (props: any) => (props?.visible ? <AddRelationShip {...props} /> : null);

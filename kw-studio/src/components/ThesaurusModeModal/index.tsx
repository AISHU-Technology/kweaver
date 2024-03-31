import React, { useState, useEffect } from 'react';

import { Form, Input, Radio, Table, Button, message } from 'antd';
import type { RadioChangeEvent } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';

import servicesThesaurus from '@/services/thesaurus';

import THESAURUS_TEXT from '@/enums/thesaurus_mode';
import { getParam } from '@/utils/handleFunction';
import { ONLY_KEYBOARD } from '@/enums';
import UniversalModal from '@/components/UniversalModal';
import { onFormatTableData } from './assistFunction';
import { SYNONYM_ENTITY_LINK, SYNONYM_STD, SYNONYM_CUSTOM, columnsData } from './template';
import ADTable from '../ADTable';

import './style.less';

export const ERROR_CODE: Record<string, string> = {
  'Builder.LexiconController.GetLexiconList.KnowledgeIdNotExist': 'ThesaurusManage.nullKnowlegeId',
  'Builder.LexiconController.GetLexiconById.LexiconIdNotExist': 'ThesaurusManage.nullThesaurusId',
  'Builder.LexiconService.CreateTemplateLexicon.KnAddLexiconError': 'ThesaurusManage.noPermission'
};

const TEMPLATE_DES = {
  entity_link: `${intl.get('ThesaurusManage.createMode.entityLink')}|${intl.get(
    'ThesaurusManage.createMode.entityLinkInfo'
  )}`,
  std: `${intl.get('ThesaurusManage.createMode.synonym')}|${intl.get('ThesaurusManage.createMode.synonymInfo')}`,
  custom: `${intl.get('ThesaurusManage.createMode.participle')}|${intl.get(
    'ThesaurusManage.createMode.participleInfo'
  )}`
};
const TEMPLATE_DATA: Record<any, any> = {
  entity_link: SYNONYM_ENTITY_LINK,
  std: SYNONYM_STD,
  custom: SYNONYM_CUSTOM
};

const { TextArea } = Input;
const ThesaurusModeModalContent = (props: any) => {
  const { onHandleCancel, editRecord, onHandleOk, isChange, thesaurusTableData, tableData } = props;
  const history = useHistory();
  const [form] = Form.useForm();
  const [value, setValue] = useState('entity_link'); // 单选框(默认选中第一个)

  useEffect(() => {
    if (!_.isEmpty(editRecord)) {
      form.setFieldsValue(editRecord);
      setValue(editRecord?.mode);
    }
  }, []);

  const columns = _.map(
    columnsData(TEMPLATE_DATA[value])?.slice(0, columnsData(TEMPLATE_DATA[value])?.length - 1),
    (item: any) => ({
      title: item,
      dataIndex: `${item}`,
      width: 167,
      render: (text: any) => (
        <div className="kw-ellipsis table-content" title={text}>
          {text}
        </div>
      )
    })
  );

  /**
   * 单选框变化
   */
  const onRadioChange = (e: RadioChangeEvent) => {
    setValue(e?.target?.value);
  };

  /**
   * 确定
   */
  const onOk = () => {
    form.validateFields().then(async values => {
      const { id, thesaurus_id, mode } = getParam(['id', 'thesaurus_id', 'mode']);
      let data: any = {};
      if (!_.isEmpty(editRecord)) {
        const { extract_info } = onFormatTableData(tableData, thesaurusTableData, mode);
        data = {
          id: Number(thesaurus_id),
          name: values?.name,
          description: values?.description || '',
          extract_info: editRecord?.message || {}
          // extract_info: isChange ? extract_info : editRecord?.message
        };
      } else {
        data = {
          name: values?.name,
          description: values?.description || '',
          knw_id: Number(id),
          mode: values?.mode
        };
      }

      try {
        const { res, ErrorCode, ErrorDetails } = await (_.isEmpty(editRecord)
          ? servicesThesaurus.thesaurusTemplateLexicon(data)
          : servicesThesaurus.thesaurusEdit(data));
        if (res) {
          if (!_.isEmpty(editRecord)) {
            onHandleOk(data);
            onHandleCancel();
          } else {
            history.push(
              `/knowledge/knowledge-thesaurus-create?action=create&mode=${values?.mode}&thesaurus_name=${
                // `/thesaurus?action=create&mode=${values?.mode}&thesaurus_name=${
                values?.name
              }&type=create&thesaurus_id=${res}&knw_id=${id}&description=${values?.description || ''}`
            );
          }
          return;
        }
        // Builder.LexiconService.CreateTemplateLexicon.DuplicatedName
        if (
          [
            'Builder_LexiconService_EditLexicon_DuplicatedName',
            'Builder.LexiconService.CreateTemplateLexicon.DuplicatedName'
          ].includes(ErrorCode)
        ) {
          form.setFields([{ name: 'name', errors: [intl.get('global.repeatName')] }]);
          return;
        }
        ErrorDetails && message.error(ErrorDetails);
      } catch (err) {
        //
      }
    });
  };

  return (
    <div className="create-thesaurus-model-wrap-root kw-flex">
      <div className="kw-flex">
        <div className="create-thesaurus-modal-left kw-pr-6 kw-pl-6 kw-pt-5">
          <Form form={form} layout="vertical" initialValues={{ mode: value }}>
            <Form.Item
              name="name"
              label={intl.get('ThesaurusManage.createMode.lexiconName')}
              rules={[
                {
                  required: true,
                  message: intl.get('exploreGraph.noSelectTip')
                },
                {
                  pattern: ONLY_KEYBOARD,
                  message: intl.get('global.onlyKeyboard')
                },
                {
                  max: 50,
                  message: intl.get('global.lenErr', { len: 50 })
                }
              ]}
            >
              <Input placeholder={intl.get('ThesaurusManage.inputName')} autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="mode"
              label={intl.get('ThesaurusManage.createMode.template')}
              rules={[
                {
                  required: true,
                  message: ''
                }
              ]}
            >
              <Radio.Group onChange={onRadioChange} value={value} defaultValue={'entity_link'}>
                {_.map(TEMPLATE_DES, (item: any, index: any) => {
                  return (
                    <Radio value={index} disabled={!_.isEmpty(editRecord)}>
                      <div className="radio-title">{item.split('|')[0]}</div>
                      <div className="kw-c-subtext">{item.split('|')[1]}</div>
                    </Radio>
                  );
                })}
              </Radio.Group>
            </Form.Item>
            <Form.Item
              name="description"
              label={intl.get('global.desc')}
              rules={[
                {
                  pattern: ONLY_KEYBOARD,
                  message: intl.get('global.onlyKeyboard')
                },
                {
                  max: 255,
                  message: intl.get('global.lenErr', { len: 255 })
                }
              ]}
            >
              <TextArea placeholder={intl.get('ThesaurusManage.inputDes')} style={{ height: '96px' }} />
            </Form.Item>
          </Form>
        </div>
        <div className="create-thesaurus-modal-right kw-pl-6 kw-pr-6 kw-pt-5">
          <div className="thesaurus-preview-title kw-mb-2">
            <span className="template-title">{intl.get('ThesaurusManage.createMode.preview').split('|')[0]}</span>
            <span className="kw-c-subtext">{intl.get('ThesaurusManage.createMode.preview').split('|')[1]}</span>
          </div>
          {value ? (
            <ADTable
              showHeader={false}
              className="thesaurus-table"
              rowKey={record => record?.id}
              pagination={false}
              dataSource={TEMPLATE_DATA[value]}
              columns={columns}
              rowClassName="thesaurus-cell"
              scroll={{ x: '100%' }}
            />
          ) : null}
        </div>
      </div>

      <div className="footer-box">
        <Button onClick={onHandleCancel} className="kw-mr-2">
          {intl.get('global.cancel')}
        </Button>
        <Button onClick={onOk} type="primary">
          {intl.get('global.ok')}
        </Button>
      </div>
    </div>
  );
};

const ThesaurusModeModal = (props: any) => {
  const { visible, onHandleCancel, onHandleOk, editRecord = {}, isChange, thesaurusTableData, tableData } = props;
  return (
    <UniversalModal
      visible={visible}
      className="create-thesaurus-model-root"
      width={'1000px'}
      title={
        !_.isEmpty(editRecord) ? intl.get('ThesaurusManage.editThesaurus') : intl.get('ThesaurusManage.createThesaurus')
      }
      maskClosable={false}
      onCancel={onHandleCancel}
    >
      <ThesaurusModeModalContent
        onHandleOk={onHandleOk}
        onHandleCancel={onHandleCancel}
        editRecord={editRecord}
        thesaurusTableData={thesaurusTableData}
        tableData={tableData}
        isChange={isChange}
      />
    </UniversalModal>
  );
};

export default ThesaurusModeModal;

import IconFont from '@/components/IconFont';
import { Button, Table, Dropdown, Menu, message } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import React, { useMemo, useState } from 'react';
import AddModal from './AddModal';
import intl from 'react-intl-universal';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import { TermLabelType } from '@/pages/KnowledgeNetwork/Glossary/types';
import { languageOptions } from '@/pages/KnowledgeNetwork/Glossary/constants';
import { editTerm } from '@/services/glossaryServices';
import _ from 'lodash';
import ADTable from '@/components/ADTable';

export default function BasicInfo({ refreshTerm }: any) {
  const {
    glossaryStore: { selectedTerm, glossaryData, mode }
  } = useGlossaryStore();
  const [tableProps, setTableProps] = useState({
    dataSource: [] as TermLabelType[]
  });
  const [modelProps, setModalProps] = useState({
    visible: false,
    editData: undefined as TermLabelType | undefined
  });

  const openModal = (data?: TermLabelType) => {
    setModalProps(prevState => ({
      ...prevState,
      visible: true,
      editData: data
    }));
  };

  const closeModal = () => {
    setModalProps(prevState => ({
      ...prevState,
      visible: false
    }));
  };

  const deleteData = async (data: TermLabelType) => {
    try {
      await editTerm(glossaryData!.id, selectedTerm[0].id, {
        action: 'remove',
        language: data.language
      });
      message.success(intl.get('global.delSuccess'));
      refreshTerm(selectedTerm[0].id);
    } catch (error) {
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  const dataSource = useMemo(() => {
    if (selectedTerm && selectedTerm.length > 0 && selectedTerm[0]) {
      return selectedTerm[0]?.label;
    }
    return [];
  }, [selectedTerm]);

  const columns: any = [
    {
      title: intl.get('glossary.language'),
      width: 120,
      dataIndex: 'language',
      render: (value: string) => {
        const target = languageOptions.find(item => item.value === value);
        if (target) {
          return target.label;
        }
      }
    },
    {
      title: intl.get('glossary.translate'),
      width: 296,
      dataIndex: 'name',
      ellipsis: true
    },
    {
      title: intl.get('glossary.synonym'),
      width: 296,
      dataIndex: 'synonym',
      ellipsis: true,
      render: (text: any) => {
        return text?.length > 0 ? (
          <div className="kw-pointer kw-ellipsis">{text?.join(',')}</div>
        ) : (
          <span className="kw-c-subtext">[{intl.get('global.noContent')}]</span>
        );
      }
    },
    {
      title: intl.get('glossary.description'),
      dataIndex: 'description',
      width: 420,
      ellipsis: true,
      render: (text: string) => {
        return text || <span className="kw-c-subtext">[{intl.get('global.noContent')}]</span>;
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operation',
      width: 100,
      fixed: 'right',
      render: (value: any, record: TermLabelType) => {
        return (
          <div className="kw-align-center">
            <Button
              style={{ padding: 0, minWidth: 'unset' }}
              type="link"
              onClick={() => {
                openModal(record);
              }}
            >
              {intl.get('global.edit')}
            </Button>
            <Button
              className="kw-ml-8"
              style={{ padding: 0, minWidth: 'unset' }}
              type="link"
              disabled={dataSource.length === 1}
              onClick={_.debounce(() => {
                deleteData(record);
              }, 300)}
            >
              {intl.get('global.delete')}
            </Button>
          </div>
        );
      }
    }
  ];

  const getColumns = () => {
    if (mode === 'view') {
      return columns.filter((item: any) => item.dataIndex !== 'operation');
    }
    return columns;
  };

  const btnDisabled = useMemo(() => {
    if (selectedTerm && selectedTerm.length > 0 && selectedTerm[0]) {
      return selectedTerm[0].label.length === 3;
    }
    return false;
  }, [selectedTerm]);

  return (
    <div>
      {mode === 'edit' && (
        <Button type="primary" disabled={btnDisabled} onClick={() => openModal()}>
          <IconFont type="icon-Add" />
          {intl.get('global.add')}
        </Button>
      )}
      <div className="kw-mt-4">
        <ADTable
          showHeader={false}
          scroll={{ x: '100%' }}
          columns={getColumns()}
          dataSource={dataSource}
          rowKey={record => record.language}
          pagination={false}
        />
      </div>
      <AddModal
        visible={modelProps.visible}
        editData={modelProps.editData}
        onCancel={closeModal}
        refreshTerm={refreshTerm}
      />
    </div>
  );
}

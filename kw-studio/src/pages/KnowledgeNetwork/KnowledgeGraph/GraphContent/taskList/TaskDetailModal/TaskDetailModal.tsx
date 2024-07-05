import React, { useEffect, useMemo, useState } from 'react';
import './style.less';
import { SplitBox } from '@antv/x6-react-components';
import '@antv/x6-react-components/es/split-box/style/index.css';
import UniversalModal from '@/components/UniversalModal';
import KwTable from '@/components/KwTable';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import { Dropdown, Menu, Form, Select, message } from 'antd';
import serviceTaskManagement from '@/services/taskManagement';
import _ from 'lodash';
import FileIcon from '@/components/FileIcon';
import KwReactG6, { KwBackEndOntologyDataProps } from '@/components/KwReactG6';
import { getParam } from '@/utils/handleFunction';
import serviceGraphDetail from '@/services/graphDetail';
import { EXTRACT_TYPE } from '@/enums';
import ErrorModal from '../errorModal';
import MultipleFileTree from '@/pages/KnowledgeNetwork/KnowledgeGraph/GraphContent/taskList/TaskDetailModal/MultipleFileTree/MultipleFileTree';
import StatisticsCount from '@/pages/KnowledgeNetwork/KnowledgeGraph/GraphContent/taskList/StatisticsCount/StatisticsCount';

const FormItem = Form.Item;

interface TaskDetailModalProps {
  closeTaskDetailModal: () => void;
  taskData: any;
}

const ORDER_MENU = [
  { id: 'start_time', title: intl.get('task.pulseOnTime') },
  { id: 'end_time', title: intl.get('task.endTime') }
];
const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ closeTaskDetailModal, taskData }) => {
  const [tableProps, setTableProps] = useState({
    page: 1,
    pageSize: 20,
    dataSource: [] as any,
    total: 0,
    orderField: 'start_time',
    order: 'desc',
    selectedStatus: '',
    selectedType: '',
    loading: false,
    scrollY: 200
  });
  const [sizeState, setSizeState] = useState({
    size: 0,
    minSize: 0,
    maxSize: 0
  });
  const [ontoData, setOntoData] = useState<KwBackEndOntologyDataProps>({ entity: [], edge: [] });
  const [errorModal, setErrorModal] = useState({ visible: false, error: '' });
  const graphId = useMemo(() => getParam('graphId'), []);
  const [multipleFileModal, setMultipleFileModal] = useState({ visible: false, data: null });
  const [collapseStatistic, setCollapseStatistic] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    const minSize = 200;
    const height = (document.querySelector('.TaskDetail') as HTMLDivElement).clientHeight;
    const maxSize = height - minSize;
    setSizeState(prevState => ({
      ...prevState,
      minSize,
      size: height / 2,
      maxSize
    }));
  }, []);

  useEffect(() => {
    getTableData();
  }, [
    taskData,
    tableProps.page,
    tableProps.selectedType,
    tableProps.selectedStatus,
    tableProps.orderField,
    tableProps.order
  ]);

  const getTableData = async () => {
    setTableProps(prevState => ({
      ...prevState,
      loading: true
    }));
    try {
      const param: any = {
        rule: tableProps.orderField,
        order: tableProps.order,
        page: tableProps.page,
        size: tableProps.pageSize
      };
      if (tableProps.selectedType) {
        param.task_type = tableProps.selectedType;
      }
      if (tableProps.selectedStatus) {
        param.task_status = tableProps.selectedStatus;
      }
      const { res } = (await serviceTaskManagement.getSubTaskByParentTaskId(taskData.task_id, param)) || {};
      const { tasks, count, entity, edge } = res || {};
      setTableProps(prevState => ({
        ...prevState,
        loading: false,
        dataSource: tasks,
        total: count
      }));
      const onTo = { entity, edge };
      setOntoData(onTo);
    } catch (error) {
      setTableProps(prevState => ({
        ...prevState,
        loading: false
      }));
      const errorTip = error.type === 'message' ? error.response.ErrorDetails : error.data.ErrorDetails;
      message.error(errorTip);
    }
  };

  /** 获取排序规则 */
  const getSortOrder = (field: string) => {
    if (tableProps.orderField !== field) return null;
    return tableProps.order === 'asc' ? 'ascend' : 'descend';
  };

  const columns: Array<any> = [
    {
      title: intl.get('task.type'),
      dataIndex: 'task_type',
      ellipsis: true,
      render: (value: string) => {
        if (value === 'entity') {
          return intl.get('global.entityClass');
        }
        if (value === 'edge') {
          return intl.get('global.relationClass');
        }
        if (value === 'model') {
          return intl.get('global.model');
        }
        return '--';
      }
    },
    {
      title: intl.get('task.className'),
      dataIndex: 'name_alias',
      ellipsis: true,
      render: (value: string, record: any) => {
        return (
          <div className="kw-pointer">
            <div className="kw-ellipsis" title={record.name}>
              {record.name}
            </div>
            <div className="kw-ellipsis kw-c-subtext" title={record.alias}>
              {record.alias}
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('task.point'),
      dataIndex: 'relation',
      ellipsis: true,
      render: (value: string, record: any) => {
        if (record.task_type === 'edge') {
          const relationString = record.relation.join(' > ');
          const relationAliasString = record.relation_alias.join(' > ');
          return (
            <div className="kw-pointer">
              <div className="kw-ellipsis" title={relationString}>
                {relationString}
              </div>
              <div className="kw-ellipsis kw-c-subtext" title={relationAliasString}>
                {relationAliasString}
              </div>
            </div>
          );
        }
        return '--';
      }
    },
    {
      title: intl.get('task.status'),
      dataIndex: 'task_status',
      width: 120,
      ellipsis: true,
      render: (text: string, record: any) => {
        return (
          <span className="kw-align-center">
            <span className={classNames('TaskDetail-status', `${text}`)} />
            <span className="TaskDetail-status-text">{intl.get(`task.${text}`)}</span>
            {text === 'failed' && (
              <Format.Button onClick={() => viewFileDetails(record)} type="icon" title={intl.get('task.report')}>
                <IconFont type="icon-wendang-xianxing" />
              </Format.Button>
            )}
          </span>
        );
      }
    },
    {
      title: intl.get('task.relationFile'),
      dataIndex: 'files',
      render: (value: any, record: any) => {
        if (record.task_type === 'model') {
          if (value) {
            return (
              <span className="kw-align-center">
                <span>{intl.get('task.mulFile')}</span>
                <Format.Button
                  onClick={() => {
                    checkFile(value);
                  }}
                  tip={intl.get('global.detail')}
                  type="icon"
                >
                  <IconFont type="icon-wendang-xianxing" />
                </Format.Button>
              </span>
            );
          }
          return '--';
        }
        if (value.length === 1) {
          const files = value[0].files;
          if (!files) {
            return '--';
          }
          if (files?.length === 1) {
            const file = files[0];
            return (
              <span className="kw-align-center">
                <FileIcon name={file.file_name} type={record === EXTRACT_TYPE.SQL ? 'sql' : 'sheet'} />
                <span title={file.file_name} className="kw-flex-item-full-width kw-ellipsis" style={{ marginLeft: 5 }}>
                  {file.file_name}
                </span>
              </span>
            );
          }
        }
      }
    },
    {
      title: intl.get('task.childTaskAllTime'),
      dataIndex: 'all_time',
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('task.pulseOnTime'),
      dataIndex: 'start_time',
      ellipsis: true,
      sorter: true,
      sortOrder: getSortOrder('start_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => text || '--'
    },
    {
      title: intl.get('task.endTime'),
      dataIndex: 'end_time',
      ellipsis: true,
      sorter: true,
      sortOrder: getSortOrder('end_time'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: any) => text || '--'
    }
  ];

  const onSelectOrderMenu = ({ key }: any) => {
    if (tableProps.orderField === key) {
      const targetOrder = tableProps.order === 'asc' ? 'desc' : 'asc';
      setTableProps(prevState => ({
        ...prevState,
        order: targetOrder
      }));
    } else {
      setTableProps(prevState => ({
        ...prevState,
        orderField: key
      }));
    }
  };

  /** 排序下拉选项 */
  const orderMenu = (
    <Menu className="menus" onClick={onSelectOrderMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, title } = item;
        const isSelected = id === tableProps.orderField;
        const iconDirection = tableProps.order === 'asc' ? '' : 'direction';

        return (
          <Menu.Item key={id} className={classNames('menusItem', { selected: isSelected })}>
            <div className="icon">{isSelected && <IconFont type="icon-fanhuishangji" className={iconDirection} />}</div>
            <div>{title}</div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const onFormValueChange = (values: any) => {};

  const viewFileDetails = (record: any) => {
    setErrorModal(prevState => ({
      ...prevState,
      visible: true,
      error: record.error_report
    }));
  };

  const onResizeEnd = (newSize: number) => {
    const height = (document.querySelector('.TaskDetail-table') as HTMLDivElement).clientHeight;
    const tableY = height - 64 - 32 - 72;
    setTableProps(prevState => ({
      ...prevState,
      scrollY: tableY > 260 ? tableY : 260
    }));
  };

  const checkFile = (files: any) => {
    setMultipleFileModal(prevState => ({
      ...prevState,
      data: files,
      visible: true
    }));
  };

  const closeMultipleFileModal = () => {
    setMultipleFileModal(prevState => ({
      ...prevState,
      data: null,
      visible: false
    }));
  };

  return (
    <UniversalModal fullScreen title={intl.get('task.taskDetail')} open onCancel={closeTaskDetailModal}>
      <div className="TaskDetail kw-w-100 kw-h-100 kw-flex">
        <span className="TaskDetail-count">
          {collapseStatistic ? (
            <div
              title={intl.get('createEntity.summary')}
              className="TaskDetail-statictis-btn kw-center"
              onClick={() => {
                setCollapseStatistic(false);
              }}
            >
              <IconFont type="icon-shujutongji2" />
            </div>
          ) : (
            <StatisticsCount
              data={taskData}
              setCollapseStatistic={setCollapseStatistic}
              collapseStatistic={collapseStatistic}
            />
          )}
        </span>

        <SplitBox
          split="horizontal"
          size={sizeState.size}
          minSize={sizeState.minSize}
          maxSize={sizeState.maxSize}
          onResizeEnd={onResizeEnd}
        >
          <KwReactG6 data={ontoData} />
          <div className="TaskDetail-table">
            <div className="kw-space-between kw-mb-4">
              <span style={{ fontWeight: 600 }}>{taskData.task_name}</span>
              <Form layout="inline" form={form} onValuesChange={onFormValueChange}>
                <FormItem name="task_type" label={intl.get('task.type')} initialValue="">
                  <Select
                    onChange={(value: string) => {
                      setTableProps(prevState => ({
                        ...prevState,
                        selectedType: value
                      }));
                    }}
                    style={{ width: 190 }}
                    options={[
                      {
                        label: intl.get('global.all'),
                        value: ''
                      },
                      {
                        label: intl.get('global.entityClass'),
                        value: 'entity'
                      },
                      {
                        label: intl.get('global.relationClass'),
                        value: 'edge'
                      },
                      {
                        label: intl.get('global.model'),
                        value: 'model'
                      }
                    ]}
                  />
                </FormItem>
                <FormItem name="task_status" label={intl.get('task.status')} initialValue="">
                  <Select
                    style={{ width: 190 }}
                    onChange={(value: string) => {
                      setTableProps(prevState => ({
                        ...prevState,
                        selectedStatus: value
                      }));
                    }}
                    options={[
                      {
                        label: intl.get('global.all'),
                        value: ''
                      },
                      {
                        label: intl.get('task.normal'),
                        value: 'normal'
                      },
                      {
                        label: intl.get('task.termination'),
                        value: 'stop'
                      },
                      {
                        label: intl.get('task.running'),
                        value: 'running'
                      },
                      {
                        label: intl.get('task.waiting'),
                        value: 'waiting'
                      },
                      {
                        label: intl.get('task.failed'),
                        value: 'failed'
                      }
                    ]}
                  />
                </FormItem>
                <FormItem noStyle>
                  <Dropdown
                    overlay={orderMenu}
                    trigger={['click']}
                    placement="bottomRight"
                    getPopupContainer={triggerNode => triggerNode.parentElement!}
                  >
                    <Format.Button type="icon" tip={intl.get('global.sort')} tipPosition="top">
                      <IconFont type="icon-paixu11" />
                    </Format.Button>
                  </Dropdown>
                </FormItem>
              </Form>
            </div>
            <KwTable
              scroll={{ y: tableProps.dataSource.length === 0 ? undefined : tableProps.scrollY }}
              lastColWidth={170}
              showHeader={false}
              loading={tableProps.loading}
              rowKey="id"
              columns={columns}
              dataSource={tableProps.dataSource}
              pagination={{
                pageSize: tableProps.pageSize,
                total: tableProps.total,
                current: tableProps.page,
                onChange: page => {
                  setTableProps(prevState => ({
                    ...prevState,
                    page
                  }));
                }
              }}
              onChange={(pagination, filters, sorter: any) => {
                const order = sorter.order === 'ascend' ? 'asc' : 'desc';
                setTableProps(prevState => ({
                  ...prevState,
                  order,
                  orderField: sorter.field
                }));
              }}
            />
          </div>
        </SplitBox>
        {/* 错误报告弹框 */}
        <ErrorModal
          errorModal={errorModal.visible}
          handleCancel={() => {
            setErrorModal(prevState => ({
              ...prevState,
              visible: false,
              error: ''
            }));
          }}
          errorReport={errorModal.error}
        />
        {multipleFileModal.visible && (
          <MultipleFileTree data={multipleFileModal.data} closeMultipleFileModal={closeMultipleFileModal} />
        )}
      </div>
    </UniversalModal>
  );
};

export default TaskDetailModal;

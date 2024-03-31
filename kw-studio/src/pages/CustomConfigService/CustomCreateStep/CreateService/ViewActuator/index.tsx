import React, { useEffect, useState } from 'react';
import { Select, Table, Button } from 'antd';

import intl from 'react-intl-universal';
import classNames from 'classnames';
import clickView from '@/assets/images/clickView.svg';
import emptyImage from '@/assets/images/empty.svg';
import './style.less';
import _ from 'lodash';
import { selectToExecutor } from './enums';
import { EnvOptions } from '@/pages/CognitiveApplication/CustomService/constants';

const { Option } = Select;
const ViewActuator = (props: any) => {
  const {
    onInsertText,
    actuatorSelectData,
    actuatorAddSelectData,
    addIsDisable,
    setAddIsDisable,
    isDisableClick,
    setIsDisableClick,
    appEnv = '0'
  } = props;
  const [actuatorList, setActuatorList] = useState<any>([]); // 执行器/ 知识组件
  const [inputTable, setInputTable] = useState<any>([]); // input表格数据
  const [outputTable, setOutputTable] = useState<any>([]); // output表格数据
  const [selectProps, setSelectProps] = useState<any>({}); // 选择的props代码
  const [description, setDescription] = useState(''); // 执行器介绍
  const [executorSelect, setExecutorSelect] = useState<any>();
  const [isFirst, setIsFirst] = useState(true);

  useEffect(() => {
    if (_.isEmpty(actuatorSelectData)) return;
    const tempAddSelectData: any[] = [];
    if (!_.isEmpty(actuatorAddSelectData)) {
      const selectDataKeys = actuatorSelectData.map((item: any) => item.name);
      (actuatorAddSelectData[`env_${appEnv}`] as []).forEach((selectDataKey: any) => {
        if (!selectDataKeys.includes(selectDataKey)) {
          tempAddSelectData.push({ name: selectDataKey });
        }
      });
    }
    setActuatorList([...actuatorSelectData, ...tempAddSelectData]);
  }, [actuatorSelectData, actuatorAddSelectData]);

  /**
   * 选择
   */
  const onSelectChange = (e: any) => {
    setExecutorSelect(selectToExecutor?.[e === 'IntentReconitionExecutor' ? 'IntentRecognitionExecutor' : e]);
    const cloneData = _.cloneDeep(actuatorList);
    const selectName = _.filter(cloneData, (item: any) => item?.name === e);
    // props参数说明不展示input_type和output_type
    const filterName = _.filter(
      Object.keys(selectName?.[0]),
      (item: any) => !['input_type', 'output_type', 'description', 'parameters'].includes(item)
    );
    const filterInAndOut = _.filter(selectName?.[0], (item: any, index: any) => filterName.includes(index));
    const handleProps = _.reduce(
      filterInAndOut,
      (pre: any, key: any, index: any) => {
        pre[filterName[index]] = key;
        return pre;
      },
      {}
    );
    setInputTable(selectName?.[0]?.description?.input_type);
    let handleOutPut = [];
    if (e === 'entityLinkingExecutor') {
      handleOutPut.push({ outVertices: selectName?.[0]?.description?.output_type?.[0]?.vertices });
    } else {
      handleOutPut = selectName?.[0]?.description?.output_type;
    }
    if (e === 'PathSimQAExecutor') {
      handleOutPut = _.map(handleOutPut, item => {
        if (item.name === 'rule_answers') {
          return { ...item, name: 'rule_answers_out' };
        }
        return item;
      });
    }
    setOutputTable(handleOutPut);
    setDescription(selectName?.[0]?.description?.description);
    setSelectProps(handleProps);
    setIsFirst(false);
  };

  /**
   * 添加
   */
  const onAdd = () => {
    if (!isDisableClick) return;
    onInsertText(JSON.stringify(selectProps, null, 8));
    setAddIsDisable(true);
    setIsDisableClick(false);
  };

  const column = [
    {
      title: intl.get('customService.name'),
      dataIndex: 'name',
      ellipsis: true,
      width: 216,
      render: (text: any, record: any) => {
        if (text === 'rule_answers_out') {
          return 'rule_answers';
        }
        return text;
      }
    },
    {
      title: intl.get('customService.type'),
      dataIndex: 'type',
      ellipsis: true,
      width: 216
    },
    {
      title: intl.get('customService.description'),
      dataIndex: 'description',
      ellipsis: true,
      width: 216,
      render: (text: any, record: any) => {
        return (
          <div className="kw-ellipsis table-description">
            {text === 'outVertices' ? executorSelect?.outVertices : executorSelect?.[record?.name]}
          </div>
        );
      }
    }
  ];

  return (
    <div className="kw-p-6 kw-pt-6 kw-flex kw-h-100 kw-pb-0 view-actuator-wrap-root">
      <div className="kw-mb-2 title-font kw-c-header">
        {EnvOptions.filter(item => {
          return item.value === appEnv;
        })[0]?.label +
          ': ' +
          intl.get('customService.knowledgeComponents')}
      </div>
      <Select
        className="actuator-select kw-mb-6"
        placeholder={intl.get('cognitiveSearch.intention.select')}
        onChange={value => onSelectChange(value)}
      >
        {_.map(_.orderBy(actuatorList, ['name'], ['asc']), (item: any, index: any) => {
          return (
            <Option key={index} value={item?.name}>
              {item?.name}
            </Option>
          );
        })}
      </Select>
      {_.isEmpty(inputTable) && _.isEmpty(outputTable) && _.isEmpty(selectProps) ? (
        isFirst ? (
          <div className="kw-center kw-w-100 view-icon">
            <img src={clickView} />
            <div className="kw-mt-2">{intl.get('customService.selectKnCs')}</div>
          </div>
        ) : (
          <div className="kw-center kw-w-100 view-icon">
            <img src={emptyImage} />
            <div className="kw-mt-2">{intl.get('customService.emptyDes')}</div>
          </div>
        )
      ) : null}
      <div className="param-message-box kw-pb-6">
        {description ? (
          <div className="kw-w-100 kw-mb-5">
            <div className="kw-c-header kw-mb-2 title-font">{intl.get('customService.knowComponentIntroduce')}</div>
            <div className="kw-c-subtext">{executorSelect?.description}</div>
          </div>
        ) : null}

        {_.isEmpty(inputTable) ? null : (
          <div>
            <div className="kw-c-header title-font kw-mb-2">{intl.get('customService.parameter')}</div>
            <Table columns={column} dataSource={inputTable} pagination={false} />
          </div>
        )}

        {_.isEmpty(outputTable) ? null : (
          <div className="kw-mt-5">
            <div className="kw-c-header title-font kw-mb-2">{intl.get('customService.outPut')}</div>
            <Table columns={column} dataSource={outputTable} pagination={false} />
          </div>
        )}

        {_.isEmpty(selectProps) ? null : (
          <div className="kw-mt-5 param-info">
            <div className="kw-flex">
              <div className="kw-mr-4 kw-c-header kw-c-header title-font kw-mb-2">
                {intl.get('customService.props')}
              </div>
              <div
                className={classNames('kw-pointer add-btn', addIsDisable ? 'btn-default' : 'default-btn')}
                onClick={onAdd}
              >
                {intl.get('customService.add')}
              </div>
            </div>
            <pre className="in-box kw-w-100">{`${JSON.stringify(selectProps, null, 4)}`}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewActuator;

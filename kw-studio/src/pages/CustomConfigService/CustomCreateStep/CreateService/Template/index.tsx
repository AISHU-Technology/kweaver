import React, { useState, useEffect } from 'react';
import { Select, Table, message } from 'antd';
import classNames from 'classnames';

import IconFont from '@/components/IconFont';
import intl from 'react-intl-universal';
import _ from 'lodash';
import { copyToBoardArea } from '@/utils/handleFunction';
import clickView from '@/assets/images/clickView.svg';

import { selectToTemplate } from './enums';

import './style.less';

const { Option } = Select;

const Template = (props: any) => {
  const { onAddTemplate, templateData } = props;
  const [hoverIn, setHoverIn] = useState<any>(false); // 悬停某一个输入显示

  const [templateList, setTemplateList] = useState<any>([]); // 模板
  const [inputTable, setInputTable] = useState<any>([]); // input表格数据
  const [outputTable, setOutputTable] = useState<any>([]); // output表格数据
  const [selectProps, setSelectProps] = useState<any>({}); // 选择的props代码
  const [description, setDescription] = useState(''); // 模板介绍
  const [executorSelect, setExecutorSelect] = useState<any>(); // 模板
  const [selectedKey, setSelectedKey] = useState<string>('Intent-GraphAnalysisCognitionGraph'); // 选择模板的名字

  useEffect(() => {
    if (_.isEmpty(templateData)) return;
    setTemplateList(templateData);
  }, [templateData]);

  /**
   * 复制
   */
  const onCopy = () => {
    const copyTemplate = templateData.find((tem: any) => tem.name === selectedKey) || '';
    copyToBoardArea(JSON.stringify(copyTemplate, null, 8));
    message.success(intl.get('exploreAnalysis.copySuccess'));
  };

  const onMouseOver = () => {
    setHoverIn(true);
  };

  const onMouseLeave = () => {
    setHoverIn(false);
  };

  /**
   * 选择
   */
  const onSelectChange = (e: any) => {
    setSelectedKey(e);
    setExecutorSelect(
      selectToTemplate[e === 'Intent-GraphAnalysisCognitionGraph' ? 'Intent-GraphAnalysisCognitionGraph' : e]
    );

    const cloneData = _.cloneDeep(templateList);
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

    setInputTable(selectName?.[0]?.input_type);
    setOutputTable(selectName?.[0]?.output_type);
    setDescription(selectName?.[0]?.description);
    setSelectProps(handleProps);
  };

  const column = [
    {
      title: intl.get('customService.name'),
      dataIndex: 'name',
      ellipsis: true,
      width: 216
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
            {text === 'outVertices' ? executorSelect.outVertices : executorSelect[record?.name]}
          </div>
        );
      }
    }
  ];

  return (
    <div className="kw-p-6 kw-pt-0 kw-mt-6 custom-config-template-root-wrap kw-h-100">
      <div className="kw-mb-2 title-font kw-c-header">{intl.get('customService.templateTwo')}</div>
      <Select
        className="actuator-select kw-mb-6"
        placeholder={intl.get('cognitiveSearch.intention.select')}
        onChange={value => onSelectChange(value)}
      >
        {_.map(_.orderBy(templateList, ['name'], ['asc']), (item: any, index: any) => {
          return (
            <Option key={index} value={item?.name}>
              {item?.name}
            </Option>
          );
        })}
      </Select>
      {_.isEmpty(inputTable) && _.isEmpty(outputTable) && _.isEmpty(selectProps) ? (
        <div className="kw-center kw-w-100 view-icon">
          <img src={clickView} />
          <div className="kw-mt-2">{intl.get('customService.selectTemps')}</div>
        </div>
      ) : null}
      <div className="param-message-box">
        {description ? (
          <div className="kw-w-100 kw-mb-5">
            <div className="kw-c-header kw-mb-2 title-font">{intl.get('customService.templateIntroduce')}</div>
            <div className="kw-c-subtext">{executorSelect.description}</div>
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

        {_.isEmpty(description) ? null : (
          <>
            <div className="kw-mt-5 kw-mb-2">
              <span className="kw-c-header title-font kw-mr-4">{'JSON'}</span>
              <span className="kw-c-primary kw-pointer" onClick={() => onAddTemplate(selectedKey)}>
                {intl.get('customService.addConfig')}
              </span>
            </div>
            <div className="param-box kw-w-100" onMouseOver={() => onMouseOver()} onMouseLeave={onMouseLeave}>
              <pre className="param-pre kw-h-100">
                {hoverIn ? (
                  <div className="icon-copy kw-pointer" onClick={() => onCopy()}>
                    <IconFont type="icon-copy" style={{ fontSize: '16px' }} />
                  </div>
                ) : null}
                {`${JSON.stringify(templateData.find((tem: any) => tem.name === selectedKey) || '', null, 4)}`}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Template;

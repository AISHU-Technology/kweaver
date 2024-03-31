import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Select, Tooltip, InputNumber, Button } from 'antd';
import { LoadingOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { SelectProps } from 'antd';

import { LouvainConfigType } from '../type';

import './style.less';

const ItemLine = (props: any) => {
  const { label, question, children } = props;
  return (
    <div className="kw-mb-6">
      <div className="kw-mb-2">
        <span>{label}</span>
        {question && (
          <Tooltip title={question} placement="topLeft">
            <QuestionCircleOutlined className="kw-ml-2 kw-c-subtext" />
          </Tooltip>
        )}
      </div>
      <div className="kw-w-100">{children}</div>
    </div>
  );
};

const DIRECTED_OPTION: SelectProps['options'] = [
  { value: 'directed', label: intl.get('exploreGraph.algorithm.directedGraph') },
  { value: 'undirected', label: intl.get('exploreGraph.algorithm.undirectedGraph') }
];

const LouvainConfig = (props: LouvainConfigType) => {
  const { params, isLoading, optionsEdges, optionsWeight } = props;
  const { onAnalysis, onChangeParams } = props;
  const { directed, weightPropertyName, threshold } = params;

  return (
    <div className="kw-pt-6">
      <ItemLine label={intl.get('exploreGraph.algorithm.type')}>
        <Select
          options={DIRECTED_OPTION}
          value={directed ? 'directed' : 'undirected'}
          onChange={onChangeParams('directed')}
        />
      </ItemLine>
      <ItemLine label={intl.get('exploreGraph.algorithm.relationshipClassType')}>
        <Select disabled={true} options={optionsEdges} value={optionsEdges?.[0]?.value} />
      </ItemLine>
      <ItemLine
        label={intl.get('exploreGraph.algorithm.weightAttribute')}
        question={intl.get('exploreGraph.algorithm.weightDefinition')}
      >
        <Select
          options={optionsWeight}
          value={weightPropertyName || null}
          placeholder={intl.get('exploreGraph.algorithm.placeholderWeightProperty')}
          onChange={onChangeParams('weightPropertyName')}
        />
      </ItemLine>
      <ItemLine label={intl.get('exploreGraph.algorithm.stopIterationThreshold')}>
        <InputNumber controls={false} value={threshold} min={0} onChange={onChangeParams('threshold')} />
      </ItemLine>

      <Button
        type="primary"
        style={{ width: '100%' }}
        icon={isLoading && <LoadingOutlined />}
        disabled={isLoading}
        onClick={onAnalysis}
      >
        {intl.get('exploreGraph.algorithm.analyse')}
      </Button>
    </div>
  );
};

export default LouvainConfig;

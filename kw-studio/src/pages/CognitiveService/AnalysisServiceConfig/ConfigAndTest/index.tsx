/**
 * 策略配置与测试
 */

import React from 'react';
import _ from 'lodash';
import GraphSearch from './GraphQuery';
import Neighbors from './Neighbors';
import PathConfiguration from './Path';
import { TestData, BasicData, ActionType } from '../types';
import { ANALYSIS_SERVICES } from '@/enums';

import './style.less';
const { SEARCH_TYPE } = ANALYSIS_SERVICES;

export interface ConfigurationProps {
  step?: number;
  action?: ActionType;
  basicData: BasicData;
  testData: TestData;
  ontoData: any;
  onChange?: (data: Partial<TestData>) => void;
  onPrev?: () => void;
  onNext?: () => void;
  isChange?: boolean;
  setIsSaved: (bool: boolean) => void;
}

const Configuration = (props: ConfigurationProps) => {
  const { basicData, step, action, testData, ontoData, isChange, onChange, onPrev, onNext, setIsSaved } = props;
  return (
    <div className=" kw-h-100">
      {basicData?.operation_type === SEARCH_TYPE.CUSTOM_SEARCH && (
        <GraphSearch
          step={step}
          action={action}
          ontoData={ontoData}
          onChange={onChange}
          basicData={basicData}
          testData={testData}
          onPrev={onPrev}
          onNext={onNext}
          isChange={isChange}
          setIsSaved={setIsSaved}
        />
      )}
      {basicData?.operation_type === SEARCH_TYPE.NEIGHBOR && (
        <Neighbors
          step={step}
          action={action}
          ontoData={ontoData}
          onChange={onChange}
          basicData={basicData}
          testData={testData}
          onPrev={onPrev}
          onNext={onNext}
          isChange={isChange}
          setIsSaved={setIsSaved}
        />
      )}
      {(basicData?.operation_type === SEARCH_TYPE.ALL_PATH ||
        basicData?.operation_type === SEARCH_TYPE.SHOREST_PATH) && (
        <PathConfiguration
          step={step}
          action={action}
          ontoData={ontoData}
          onChange={onChange}
          basicData={basicData}
          testData={testData}
          onPrev={onPrev}
          onNext={onNext}
          isChange={isChange}
          setIsSaved={setIsSaved}
        />
      )}
    </div>
  );
};

export default Configuration;

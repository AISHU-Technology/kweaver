import { useState, useEffect } from 'react';
import _ from 'lodash';
import * as servicesLLMModel from '@/services/llmModel';
import HOOKS from '@/hooks';

import { template } from './template';
import { parseModelConfig } from './utils';

let configCache = {};

export const useModelConfig = () => {
  const language = HOOKS.useLanguage();
  const [modelConfig, setModelConfig] = useState<Record<string, any>>(configCache);

  useEffect(() => {
    getModelConfig();
  }, []);

  const getModelConfig = async () => {
    let response: any;
    try {
      const { res } = (await servicesLLMModel.llmModelConfig()) || {};
      response = res;
    } catch {
      response = template;
    }
    if (_.isEmpty(response)) {
      response = template;
    }
    const config = parseModelConfig(response, language);
    configCache = config;
    setModelConfig(config);
  };

  return [modelConfig];
};

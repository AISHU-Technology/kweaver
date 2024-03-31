import React from 'react';
import { shallow } from 'enzyme';
import KnowledgeMap from '../index';

const defaultProps: any = {
  onPrev: () => {}, // 上一步
  onSave: () => {}, // 保存按钮
  currentStep: 3, // 第几步
  defaultParsingRule: { delimiter: ',', quotechar: '"', escapechar: '"' },
  parsingSet: [],
  setParsingSet: (data: any) => {},
  setParsingTreeChange: (data: any) => {},
  parsingTreeChange: []
};
const init = (props = defaultProps) => shallow(<KnowledgeMap {...props} />);

describe('KnowledgeMapPage', () => {
  it('KnowledgeMapPage is exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

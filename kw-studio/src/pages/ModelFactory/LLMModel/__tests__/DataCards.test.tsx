import React from 'react';
import { mount } from 'enzyme';
import DataCards from '../DataCards';

const defaultProps = {
  disabledStatus: {},
  cardsData: [],
  tableState: {} as any,
  modelConfig: {},
  onOperate: jest.fn()
};
const init = (props = defaultProps) => mount(<DataCards {...props} />);

describe('LLMModel/DataCards', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

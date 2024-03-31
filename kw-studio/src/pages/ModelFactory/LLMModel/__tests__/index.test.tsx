import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import LLMModel from '../index';

jest.mock('@/services/llmModel', () => ({
  llmModelList: jest.fn(() => Promise.resolve({ res: { count: 0, data: [] } })),
  llmModelRemove: jest.fn(() => Promise.resolve({ res: true })),
  llmModelTest: jest.fn(() => Promise.resolve({ res: { status: true } }))
}));

const defaultProps = {};
const init = (props = defaultProps) => mount(<LLMModel {...props} />);

describe('LLMModel', () => {
  it('test', async () => {
    const wrapper = init();
    await sleep();
    expect(wrapper.exists()).toBe(true);
  });
});

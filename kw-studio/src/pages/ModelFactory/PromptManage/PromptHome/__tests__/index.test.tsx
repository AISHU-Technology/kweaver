import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import PromptHome from '../index';

jest.mock('@/services/prompt', () => ({
  promptProjectList: jest.fn(() =>
    Promise.resolve({
      res: {
        data: [
          {
            create_by: 'test',
            create_time: '2024-01-17 14:30:40',
            prompt_item_id: '172309482305435',
            prompt_item_name: '提示词更换里',
            prompt_item_types: [
              {
                id: '172399082305435',
                name: '分组1'
              }
            ],
            update_by: 'conftest_KnowledgeUser_token_display',
            update_time: '2024-01-23 10:20:09'
          },
          {
            create_by: 'test',
            create_time: '2024-01-18 14:30:40',
            prompt_item_id: '172309482390435',
            prompt_item_name: '提示词',
            prompt_item_types: [
              {
                id: '172399082305785',
                name: '分组2'
              }
            ],
            update_by: 'conftest_KnowledgeUser_token_display',
            update_time: '2024-01-24 10:20:09'
          }
        ],
        searchTotal: 2,
        total: 2
      }
    })
  ),
  promptDelete: jest.fn(() => Promise.resolve({ res: true }))
}));

const defaultProps = {};
const init = (props = defaultProps) => mount(<PromptHome {...props} />);

describe('PromptHome', () => {
  it('test', async () => {
    const wrapper = init();
    await sleep();
    expect(wrapper.exists()).toBe(true);
  });
});

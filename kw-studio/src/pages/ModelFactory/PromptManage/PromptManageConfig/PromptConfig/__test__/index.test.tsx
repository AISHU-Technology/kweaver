import React from 'react';

import { mount } from 'enzyme';

import { act } from '@/tests';

import PromptConfig from '..';

const defaultProps = {
  onExit: jest.fn(),
  setIsChange: jest.fn(),
  projectList: [
    {
      create_by: 'ccc',
      create_time: '2024-81-17 14:39:40',
      prompt_item_id: '1747505243341590529',
      prompt_item_type_id: '1747506707879912512',
      prompt_item_type_name: 'c',
      prompt_item_name: '提示词管理',
      prompt_item_types: [
        {
          id: '1747506707879912512',
          name: '分组'
        }
      ],
      update_by: 'userForTestAuth675 dispaly',
      update_time: 'userForTestAuth675 dispaly'
    }
  ]
};
const init = (props = defaultProps) => mount(<PromptConfig {...props} />);

describe('PromptConfig', () => {
  it('exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

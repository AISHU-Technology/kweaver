import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import SaveModal, { SaveModalProps } from '../SaveModal';

const defaultProps = {
  visible: true,
  editInfo: {},
  setVisible: jest.fn(),
  type: 'create',
  onOk: jest.fn()
};
const init = (props: SaveModalProps = defaultProps) => mount(<SaveModal {...props} />);

describe('CognitiveSearch/SaveModal', () => {
  it('test render', async () => {
    const wrapper = init();

    expect(wrapper.exists()).toBe(true);
  });
});

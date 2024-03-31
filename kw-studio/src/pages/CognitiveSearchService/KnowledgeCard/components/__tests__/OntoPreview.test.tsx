import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import OntoPreview from '../OntoPreview';

const defaultProps = {
  visible: true,
  ontoData: {},
  onClose: jest.fn()
};
const init = (props = defaultProps) => mount(<OntoPreview {...props} />);

describe('KnowledgeCard/components/OntoPreview', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

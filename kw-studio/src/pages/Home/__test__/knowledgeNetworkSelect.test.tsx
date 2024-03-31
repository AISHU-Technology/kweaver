import React from 'react';
import { shallow } from 'enzyme';
import KnowledgeNetworkSelect from '../KnowledgeNetworkSelect';

const init = (props: any) => shallow(<KnowledgeNetworkSelect {...props} />);

describe('KnowledgeNetworkSelect', () => {
  it('component is exists', () => {
    const props = {
      items: [],
      visible: true,
      onCancel: () => {},
      onToPageCognitiveApplication: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});

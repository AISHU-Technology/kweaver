import React from 'react';
import { shallow } from 'enzyme';
import AdKnowledgeNetIcon from './AdKnowledgeNetIcon';

const defaultProps = {
  type: 'icon-color-zswl1'
};
const init = (props = defaultProps) => shallow(<AdKnowledgeNetIcon {...props} />);

describe('AdKnowledgeNetIcon UI', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.kw-kn-icon')).toHaveLength(1);
  });
});

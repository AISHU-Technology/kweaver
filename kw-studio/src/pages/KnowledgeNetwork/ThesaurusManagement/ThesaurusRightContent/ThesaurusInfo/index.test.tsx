import React from 'react';
import { shallow } from 'enzyme';
import ThesaurusInfo from './index';

const defaultProps = {
  selectedThesaurus: {
    lexicon_name: 'ciku1',
    id: 1,
    description: 'hhh',
    labels: ['label1', 'label2', 'label3'],
    create_time: '2022-07-25 13:47:46',
    update_time: '2022-07-25 13:47:46',
  },
};
const init = (props = defaultProps) => shallow(<ThesaurusInfo {...props} />);

describe('ThesaurusInfo', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

import React from 'react';
import { mount } from 'enzyme';
import ThesaurusManagemant from './index';

jest.mock('@/services/thesaurus', () => ({
  thesaurusList: () => Promise.resolve({
    res: {
      count: 3,
      df: [
        { id: 1, name: 'ciku1' },
        { id: 2, name: 'ciku2' },
        { id: 3, name: 'ciku3' }
      ]
    }
  }),
  thesaurusInfoBasic: () => Promise.resolve({
    res: {
      id: 1,
      lexicon_name: 'ciku1',
      description: 'xxxxxxxxxxxx',
      labels: ['label1', 'label2', 'label3'],
      create_user: 'xiaoming',
      update_user: 'xiaohong',
      create_time: '2022-07-25 13:47:46',
      update_time: '2022-07-25 13:47:46',
      count: 500,
      columns: ['word', 'homoionym'],
      word_info: [
        { word: '开心', homoionym: '高兴' },
        { word: '不开心', homoionym: '不高兴' },
        { word: '不开心', homoionym: '伤心' }
      ]
    }
  })
}))

const defaultProps = {
  kgData: {},
};
const init = (props = defaultProps) => mount(<ThesaurusManagemant {...props} />);

describe('ThesaurusManagemant', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('getData', () => {
  it('request data', async () => {
    const wrapper = init();
    wrapper.setProps({ kgData: { id: 1 } });
    wrapper.update();
  })
})

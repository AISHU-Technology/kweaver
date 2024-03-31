import React from 'react';
import { shallow } from 'enzyme';
import SearchList from '../SearchList';

const init = (props: any) => shallow(<SearchList {...props} />);

describe('SearchListPage', () => {
  it('SearchListPage is exists', () => {
    const props = {
      data: [],
      selectedLanguage: '',
      value: '',
      onSelect: () => {},
      loading: false,
      searchValue: ''
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});

import React from 'react';
import { mount } from 'enzyme';
import SearchSelect from '../RuleList/SearchSelect';

const defaultProps = {
  selectData: ['1', '11', '222'],
  searchText: '',
  pid: 0,
  inputId: 0,
  onChange: jest.fn(),
  visible: false
};
const init = (props = defaultProps) => mount(<SearchSelect {...props} />);

describe('UI is render', () => {
  // 是否渲染
  it('should render', async () => {
    init();
  });
});

describe('Function is called', () => {
  it('test useEffect called', async () => {
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    div1.setAttribute('id', 'div1');
    div2.setAttribute('id', 'div2');
    document.body.appendChild(div1);
    document.body.appendChild(div2);

    const wrapper = init();

    wrapper.setProps({
      pid: 'div1',
      inputId: 'div2',
      visible: true,
      searchText: '1'
    });
    wrapper.update();
    expect(wrapper.find('.field-select-li').length).toBe(2);
  });
});

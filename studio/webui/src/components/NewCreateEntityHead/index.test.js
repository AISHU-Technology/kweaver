import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { shallow, mount } from 'enzyme';
import NewCreateEntityHead from './index';

const init = (props = {}) => {
  const root = mount(
    <BrowserRouter>
      <NewCreateEntityHead {...props} />
    </BrowserRouter>
  );
  const wrapper = root.find('NewCreateEntityHead').at(0);

  return wrapper;
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<NewCreateEntityHead />);
  });

  it('test render Button with isIncorrect', () => {
    const wrapper = init({
      dataInfoRef: {
        state: {
          checkData: {
            isIncorrect: true
          }
        },
        setActiveKey: () => {}
      }
    });

    const backB = wrapper.find('.handle');

    expect(backB.length).toBe(6);

    backB.forEach((item, index) => {
      item.simulate('click');
    });
  });

  it('test render Button without isIncorrect', () => {
    const wrapper = init({
      dataInfoRef: {
        state: {
          checkData: {
            isIncorrect: false
          }
        },
        setActiveKey: () => {},
        formNameRef: {
          current: {
            validateFields: () => {
              return new Promise((resolve, reject) => {});
            }
          }
        }
      }
    });

    const backB = wrapper.find('.handle');

    expect(backB.length).toBe(6);

    backB.forEach((item, index) => {
      item.simulate('click');
    });
  });
});

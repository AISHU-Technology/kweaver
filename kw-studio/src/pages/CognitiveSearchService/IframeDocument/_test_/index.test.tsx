import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import intl from 'react-intl-universal';
import IframeDocument from '..';

export const knData = {
  id: 2,
  color: 'one',
  knw_name: 'test',
  knw_description: '描述',
  intelligence_score: 1,
  recent_calculate_time: '235432',
  creation_time: '13423',
  update_time: '124324'
};

const defaultProps = {
  knwStudio: 'studio',
  knwData: knData
};

const init = (props = defaultProps) => mount(<IframeDocument {...props} />);

describe('test UI', () => {
  it('test text', () => {
    const wrapper = init();
    //   expect(wrapper.find('.introduction').at(0).find('span').at(0).text()).toBe(
    //     intl.get('cognitiveService.iframeDocument.serviceID')
    //   );
    //   expect(wrapper.find('.introduction').at(0).find('span').at(4).text()).toBe(
    //     intl.get('cognitiveService.iframeDocument.serviceDescription')
    //   );
    // });
    expect(wrapper.exists()).toBe(true);
  });
});

// describe('Function test', () => {
//   it('btn click', async () => {
//     const wrapper = init();
//     act(() => {
//       wrapper.find('.kw-mt-3').at(0).simulate('click');
//     });
//   });
// });

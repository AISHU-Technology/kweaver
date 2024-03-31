import React from 'react';
import { shallow } from 'enzyme';
import PathSearchTool from '../PathSearchTool';

const init = (props: any) => shallow(<PathSearchTool {...props} />);

describe('PathSearchTool', () => {
  it('component is exists', () => {
    const props = {
      className: 'aa',
      zIndex: 9,
      visible: true,
      myStyle: {},
      data: {},
      hideExpandIcon: true,
      canvasInstance: {},
      serviceType: 'path',
      ontoData: {},
      outerResults: {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});

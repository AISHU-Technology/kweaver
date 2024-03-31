import React from 'react';
import { shallow } from 'enzyme';
import OpenApiTrialIframe from '../OpenApiTrialIframe';

jest.mock('@uiw/codemirror-themes', () => ({ createTheme: jest.fn() }));
jest.mock('@lezer/highlight', () => ({ tags: {} }));

describe('IframeBase/OpenApiTrialIframe', () => {
  it('test render', async () => {
    const wrapper = shallow(<OpenApiTrialIframe />);
    expect(wrapper.exists()).toBe(true);
  });
});

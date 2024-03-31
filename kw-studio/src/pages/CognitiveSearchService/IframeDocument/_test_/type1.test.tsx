import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';
import { act } from '@/tests';
import { getParam } from '@/utils/handleFunction';
import Type1 from '../Type1';

const { origin } = window.location;
const { service_id, knw_id } = getParam(['service_id', 's_name', 'knw_id']);
const defaultProps = {
  origin,
  serviceId: service_id,
  appid: '',
  serviceData: {},
  openAppidModal: false,
  knw_id
};
const apiUrl = `${origin}/iframe/search?appid=${defaultProps.appid || '{your appid}'}&knw_id=${knw_id}&service_id=${
  defaultProps.serviceId
}`;

const init = (props = defaultProps) => mount(<Type1 {...props} />);

describe('test UI', () => {
  it('test pc', () => {
    const wrapper = init();
    expect(wrapper.find('.kw-mt-3').at(1).text()).toBe(intl.get('cognitiveService.iframeDocument.urlEmbed'));
    expect(wrapper.find('.url-text').at(0).text()).toBe(apiUrl);
    expect(wrapper.find('.copy-btn').at(0).exists()).toBe(true);
  });
  it('test url-explain', () => {
    const wrapper = init();
    expect(wrapper.find('.url-explain').at(0).find('h2').text()).toBe(
      intl.get('cognitiveService.iframeDocument.urlTitle')
    );
    expect(wrapper.find('.url-explain').at(0).find('div').at(1).text()).toBe(
      intl.get('cognitiveService.iframeDocument.urlExplain1')
    );
    expect(wrapper.find('.url-explain').at(0).find('div').at(2).text()).toBe(
      intl.get('cognitiveService.iframeDocument.urlExplain3')
    );
    expect(wrapper.find('.kw-mt-5').at(0).find('span').at(0).text()).toBe(
      intl.get('cognitiveService.iframeDocument.example1')
    );
    expect(wrapper.find('.urlBox').at(0).text()).toBe(`${apiUrl}&A=aa`);

    expect(wrapper.find('.kw-mt-4').at(0).find('span').at(0).text()).toBe(
      intl.get('cognitiveService.iframeDocument.example2')
    );
    expect(wrapper.find('.urlBox').at(1).text()).toBe(`${apiUrl}&A=aa$$bb`);
    expect(wrapper.find('.params-explain').at(0).find('h2').at(0).text()).toBe(
      intl.get('cognitiveService.iframeDocument.paramTitle')
    );
  });
});

describe('test Function', () => {
  it('test copy', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.copy-btn').at(0).simulate('click');
    });
  });
});

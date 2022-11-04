import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import ConfigurationDetails from '../GraphInfo/ConfigurationDetails';

const init = (props: any) => mount(<ConfigurationDetails isShow={true} {...props} />);

jest.mock('@/hooks', () => ({
  PaginationConfig: () => ({ pagination: { page: 1, pageSize: 10 }, onUpdatePagination: () => {} })
}));

describe('ConfigurationDetails', () => {
  it('test render', () => {
    const props = { selectedData: {}, graphid: {} };
    const wrapper = init(props);
    const headerText = wrapper.find('.header').text();
    expect(headerText.includes(intl.get('graphDetail.categoryInformation'))).toBe(true);
  });
  it('selectedData has value', () => {
    const props = { selectedData: { type: 'entity' }, graphid: {} };
    const wrapper = init(props);
    expect(wrapper.find('.nodeInfo').hasClass('ad-pb-3')).toBe(true);
  });
  it('selectedData has no value', () => {
    const props = { selectedData: {}, graphid: {} };
    const wrapper = init(props);
    const emptyText = wrapper.find('.empty').text();
    expect(emptyText.includes(intl.get('graphDetail.clickTheEntityClassOrRelationship'))).toBe(true);
  });
});

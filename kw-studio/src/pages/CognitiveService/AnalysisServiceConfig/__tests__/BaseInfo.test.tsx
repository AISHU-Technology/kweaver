import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import BaseInfo from '../BaseInfo';

const defaultProps = {
  action: 'create' as const,
  basicData: { knw_id: '1' } as any,
  isConfigured: false,
  disabled: false,
  onChange: jest.fn(),
  onExit: jest.fn(),
  onNext: jest.fn(),
  isExist: false,
  saveImportEntity: {},
  testData: {},
  setIsChange: false
};

jest.mock('@/services/cognitiveSearch', () => ({
  graphGetByKnw: () =>
    Promise.resolve({
      res: {
        count: 2,
        df: [
          {
            status: 'normal',
            graph_db_name: 'u927537de244111ee81ac9ea5d6514880',
            id: 4,
            kgconfid: 4,
            knowledge_type: 'kg',
            name: 'advSearch_Mysql_测试_1689557454'
          },
          {
            status: 'normal',
            graph_db_name: 'u3d87dc72244111ee8df09ea5d6514880',
            id: 3,
            kgconfid: 3,
            knowledge_type: 'kg',
            name: 'advSearch_ASModel_中文_1689557309'
          }
        ]
      }
    })
}));
const init = (props = defaultProps) => mount(<BaseInfo {...props} />);

describe('AnalysisServiceConfig/BaseInfo', () => {
  it('test', async () => {
    const wrapper = init();

    await sleep(10);
    wrapper.update();

    act(() => {
      wrapper.find('.ant-select-selector').at(1).simulate('mousedown');
    });
    wrapper.update();
    // act(() => {
    //   wrapper.find('.ant-select-item-option').at(0).simulate('click');
    // });
    wrapper.update();

    act(() => {
      wrapper.find('.ant-btn').at(1).simulate('click');
    });
  });
});

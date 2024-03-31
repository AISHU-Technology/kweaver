import intl from 'react-intl-universal';

export const EnvOptions = [
  {
    label: intl.get('customService.basicEnv'),
    value: '0'
  },
  {
    label: intl.get('customService.depEnv1'),
    value: '1'
  },
  {
    label: intl.get('customService.depEnv2'),
    value: '2'
  }
];

export const EnvDes = [
  intl.get('customService.envDes1'),
  intl.get('customService.envDes2'),
  intl.get('customService.envDes3')
];

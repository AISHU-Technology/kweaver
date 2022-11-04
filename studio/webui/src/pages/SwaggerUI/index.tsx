import React, { useEffect, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import { RedocStandalone } from 'redoc';
import servicesSwagger from '@/services/swagger';
import failImg from '@/assets/images/LDAPServer.svg';
import './style.less';

const SwaggerUI = () => {
  const [docData, setDocData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      const res = await servicesSwagger.swaggerDocGet();
      res.res ? setDocData(res.res) : setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div>
      {docData.paths && (
        <RedocStandalone
          spec={docData}
          options={{
            hideLoading: true
          }}
          onLoaded={err => setLoading(false)}
        />
      )}

      {loading && (
        <div className="swagger-doc-mask">
          <LoadingOutlined className="l-icon" />
        </div>
      )}

      {!docData.paths && !loading && (
        <div className="swagger-doc-mask">
          <div className="ad-column-center ad-h-100">
            <img src={failImg} alt="fail" className="fail-img" />
            <p>{intl.get('global.loadFail')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwaggerUI;

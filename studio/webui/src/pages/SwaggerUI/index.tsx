import React, { useEffect, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { RedocStandalone } from 'redoc';
import servicesSwagger from '@/services/swagger';
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
      res.paths && setDocData(res);
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
          onLoaded={() => setLoading(false)}
        />
      )}

      {loading && (
        <div className="swagger-doc-loading">
          <LoadingOutlined className="l-icon" />
        </div>
      )}
    </div>
  );
};

export default SwaggerUI;

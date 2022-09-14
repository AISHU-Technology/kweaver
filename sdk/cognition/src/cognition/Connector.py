# -*- coding:utf-8 -*-
import base64
import json
import aiohttp
from nebula3.gclient.net import ConnectionPool
from nebula3.Config import Config
from typing import List, Iterable


class Connector(object):
    """
    Service Connect and Search API
    """
    async def execute(self, *args):
        """
        execute a query
        """
        raise NotImplementedError


class NebulaConnector(Connector):
    """
    Nebula Graph Database Connect and Search API
    """
    def __init__(self, ips: List[str], ports: List[str], user: str, password: str):
        """
        Initialize a Connector
        :param ips: stand-alone service ip or distributed service ips
        :param ports: stand-alone service port or distributed service ports
        :param user: user name to connect the service
        :param password: user password to connect the service
        >>> ips = [10.2.196.57, 10.4.69.133]
        >>> ports = [8080, 8081]
        >>> user = "data"
        >>> password = "data123"
        """
        self.ips = ips
        self.ports = ports
        self.user = user
        self.password = password
        config = Config()
        config.max_connection_pool_size = 3
        self.connect_pool = ConnectionPool()
        assert self.connect_pool.init([(ip, int(port)) for ip, port in zip(self.ips, self.ports)], config)

    async def execute(self, space: str, sql: str) -> Iterable:
        """
        execute a query
        """
        def _parse_result(result):
            records = []
            error_msg = result.error_msg()
            if error_msg:
                raise Exception(error_msg)
            for record in result:
                records.append(record.values())
            return records

        with self.connect_pool.session_context(self.user, self.password) as client:
            sql = "use {space};".format(space=space) + sql
            result = client.execute(sql)
        return _parse_result(result)

    async def execute_json(self, sql):
        with self.connect_pool.session_context(self.user, self.password) as client:
            result = client.execute_json(sql)
        return json.loads(result)

    def __del__(self):
        self.connect_pool.close()


class OrientDBConnector(Connector):
    """
    OrientDB Graph Database Connect and Search API
    """
    headers = {
        "Accept-Encoding": "gzip,deflate",
        "Content-Type": "application/json",
        "Connection": "close"
    }

    def __init__(self, ips: list, ports: list, user: str, password: str):
        """
        Initialize a Connector
        :param ips: stand-alone service ip or distributed service ips
        :param ports: stand-alone service port or distributed service ports
        :param user: user name to connect the service
        :param password: user password to connect the service
        >>> ips = [10.2.196.57, 10.4.69.133]
        >>> ports = [8080, 8081]
        >>> user = "data"
        >>> password = "data123"
        """
        self.ip = ips[0]
        self.port = ports[0]
        self.user = user
        self.password = password
        self.url = 'http://{ip}:{port}/command/{space}/sql/'
        self.class_info_url = 'http://{ip}:{port}/class/{space}/'

        self.space = None

    def set_space(self, space):
        self.space = space

    async def execute(self, body, timeout=300.0):
        """
        execute a query
        """
        timeout = aiohttp.ClientTimeout(total=timeout)
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            url = self.url.format(ip=self.ip, port=self.port, space=self.space)
            response = await session.post(url, json=body, headers=self.headers, timeout=timeout)
            result = await response.text()
        return self._parse_result(result)

    async def get_class_info(self, space, _class, timeout=300.0):
        timeout = aiohttp.ClientTimeout(total=timeout)
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            url = self.class_info_url.format(ip=self.ip, port=self.port, space=space) + _class
            response = await session.get(url, headers=self.headers, timeout=timeout)
            result = await response.text()
        return self._parse_result(result)

    @staticmethod
    def _parse_result(res):
        res = json.loads(res, strict=False)
        if 'errors' in res:
            raise Exception(res['errors'][0]['content'])
        else:
            return res['result']


class OpenSearchConnector(Connector):
    """
    OpenSearch Connect and Search API
    """
    def __init__(self, ips: list, ports: list, user: str, password: str):
        """
        Initialize a Connector
        :param ips: stand-alone service ip or distributed service ips
        :param ports: stand-alone service port or distributed service ports
        :param user: user name to connect the service
        :param password: user password to connect the service
        >>> ips = [10.2.196.57, 10.4.69.133]
        >>> ports = [8080, 8081]
        >>> user = "data"
        >>> password = "data123"
        """
        self.ip = ips[0]
        self.port = ports[0]
        self.user = user
        self.password = password
        self.headers = {
            "Accept-Encoding": "gzip,deflate",
            "Content-Type": "application/json",
            "Connection": "close"
        }
        self.pre_url = 'http://{ip}:{port}/'.format(ip=self.ip, port=self.port)

    async def execute(self, url, body=None, timeout=300.0):
        """
        execute a query
        """
        timeout = aiohttp.ClientTimeout(total=timeout)
        auth = aiohttp.BasicAuth(login=self.user, password=self.password)
        async with aiohttp.ClientSession(auth=auth) as session:
            url = self.pre_url + url
            if body:
                response = await session.get(url, timeout=timeout, json=body, verify_ssl=False, headers=self.headers)
            else:
                response = await session.get(url, timeout=timeout, verify_ssl=False, headers=self.headers)
            result = await response.content.read()

            result = json.loads(result.decode(), strict=False)
        return result


if __name__ == "__main__":
    """
        使用示例
    """
    import asyncio
    import time

    nebula = NebulaConnector(
        ips=["10.4.14.100"],
        ports=["9669"],
        user="root",
        password="root"
    )
    start_time = time.time()

    async def test():
        # run three tasks concurrently
        task1 = asyncio.create_task(nebula.execute("use document230; show tags;"))
        task2 = asyncio.create_task(nebula.execute("use document230; show tags;"))
        task3 = asyncio.create_task(nebula.execute("use document230; show tags;"))
        res1 = await task1
        res2 = await task2
        res3 = await task3
        print(res1)
        print(res2)
        print(res3)
        # run a task separately
        res4 = await nebula.execute("use document230; show tags;")
        print(res4)


    # run top-level entry point test()
    asyncio.run(test())

    end_time = time.time()
    print(end_time - start_time)

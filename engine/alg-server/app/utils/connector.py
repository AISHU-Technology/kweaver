# !/usr/bin/env python
# -*- coding:utf-8 -*-


class AsyncRequestMysql:
    """
        mysql连接器
    """
    def __init__(self, pool):
        self.pool = pool

    async def get(self, sql):
        async with self.pool.acquire() as con:
            async with con.cursor() as cur:
                try:
                    await con.ping(reconnect=True)
                    await cur.execute(sql)
                except Exception as e:
                    raise Exception(e.args[1] + "/" + sql)
                ret = await cur.fetchall()
            await con.commit()
        return ret

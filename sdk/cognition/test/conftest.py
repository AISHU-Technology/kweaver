#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pytest
from cognition.Connector import NebulaConnector

@pytest.fixture(scope='function')
def conn_nebula():
    conn = NebulaConnector(
        ips=["10.4.131.25"],
        ports=["9669"],
        user="root",
        password="root"
    )

    yield conn
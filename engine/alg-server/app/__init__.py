# -*- coding: utf-8 -*-


import inject
import logging

from app import dependencies

logger = logging.getLogger(__name__)

inject.configure(dependencies.bind, bind_in_runtime=False)

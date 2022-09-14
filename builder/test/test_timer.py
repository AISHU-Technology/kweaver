# -*- coding:utf-8 -*-
import unittest
from unittest import mock
from service.task_Service import task_service
from utils.timer_check_parameters import CheckTimedParameters


class AddTimerTest(unittest.TestCase):
    def setUp(self):
        self.checktimedparameters = CheckTimedParameters()
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))

    def test_sucess(self):
        for cycle in ("one", 'day', 'week', 'month'):
            date_time = "3021-12-25 10:05" if cycle == "one" else "16:30"
            date_list = [1, 3] if cycle in ('week', 'month') else []
            params_json = {"task_type": "full", "cycle": cycle, "datetime": date_time, "date_list": date_list}
            http_code, data = self.checktimedparameters.AddTimedTaskPar('1', params_json)
            self.assertEqual(http_code, 200)

    def test_add_fail1(self):
        params_json = {"task_type": "full", "cycle": "one", "datetime": "abc", "date_list": [1]}
        http_code, data = self.checktimedparameters.AddTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 400)

    def test_add_fail2(self):
        params_json = {"task_type": "full", "cycle": "one", "datetime": "2021-12-25 10:05", "date_list": []}
        http_code, data = self.checktimedparameters.AddTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 500)

    def test_add_fail3(self):
        params_json = {}
        http_code, data = self.checktimedparameters.AddTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 400)

    def test_add_fail4(self):
        params_json = {}
        http_code, data = self.checktimedparameters.AddTimedTaskPar('a', params_json)
        self.assertEqual(http_code, 400)


class UpdateTimerTest(unittest.TestCase):
    def setUp(self):
        self.checktimedparameters = CheckTimedParameters(timer_task_id=True)
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))
        task_service.get_timer_by_id = mock.Mock(return_value=(200, {}))

    def test_sucess(self):
        for cycle in ("one", 'day', 'week', 'month'):
            date_time = "3021-12-25 10:05" if cycle == "one" else "16:30"
            date_list = [1, 3] if cycle in ('week', 'month') else []
            params_json = {"task_type": "full", "cycle": cycle, "datetime": date_time, "date_list": date_list,
                           "task_id": "a25f213e-6555-11ec-8dfd-02e913cffdb7"}
            http_code, data = self.checktimedparameters.AddTimedTaskPar('1', params_json)
            self.assertEqual(http_code, 200)
            http_code, data = self.checktimedparameters.UpdateTimedTaskPar('1', params_json)
            self.assertEqual(http_code, 200)

    def test_add_fail1(self):
        params_json = {"task_type": "full", "cycle": "one", "datetime": "abc", "date_list": [1]}
        http_code, data = self.checktimedparameters.AddTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 400)

    def test_add_fail2(self):
        params_json = {"task_type": "full", "cycle": "one", "datetime": "2021-12-25 10:05", "date_list": [],
                       "task_id": "a25f213e-6555-11ec-8dfd-02e913cffdb7"}
        http_code, data = self.checktimedparameters.AddTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 500)

    def test_add_fail3(self):
        params_json = {"task_type": "full", "cycle": "month", "datetime": "2023-12-25 10:05", "date_list": [1, 2],
                       "task_id": "dfsghdfghj"}
        http_code, data = self.checktimedparameters.UpdateTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 400)

    def test_add_fail4(self):
        params_json = {}
        http_code, data = self.checktimedparameters.UpdateTimedTaskPar('cv', params_json)
        self.assertEqual(http_code, 400)


class GetTimerTest(unittest.TestCase):
    def setUp(self):
        self.checktimedparameters = CheckTimedParameters()
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))

    def test_sucess(self):
        params_json = {"graph_id": "1", "page": "1", "size": "10", "order": "descend"}
        http_code, data = self.checktimedparameters.SelectTimedTaskPar(params_json)
        self.assertEqual(http_code, 200)
        task_service.get_timer_data = mock.Mock(return_value=(200, {}))
        http_code, data = task_service.get_timer_data(2, 'desc', 1, 10)
        self.assertEqual(http_code, 200)

    def test_add_fail1(self):
        params_json = {"graph_id": "abfh", "page": "v", "size": "10"}
        http_code, data = self.checktimedparameters.SelectTimedTaskPar(params_json)
        self.assertEqual(http_code, 400)

    def test_add_fail2(self):
        task_service.get_timer_data = mock.Mock(return_value=(500, {}))
        http_code, data = task_service.get_timer_data(2, 'desc', 1, 10)
        self.assertEqual(http_code, 500)


class DeleteTimerTest(unittest.TestCase):
    def setUp(self):
        self.checktimedparameters = CheckTimedParameters()
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))

    def test_sucess(self):
        params_json = {"task_id": ["a25f213e-6555-11ec-8dfd-02e913cffdb7"]}
        http_code, data = self.checktimedparameters.DeleteTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 200)
        task_id_invalid = self.checktimedparameters.check_task_id("a25f213e-6555-11ec-8dfd-02e913cffdb7")
        self.assertEqual(task_id_invalid, False)

    def test_add_fail1(self):
        params_json = {}
        http_code, data = self.checktimedparameters.DeleteTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 400)
        task_id_invalid = self.checktimedparameters.check_task_id("dsg36")
        self.assertEqual(task_id_invalid, True)

    def test_add_fail2(self):
        params_json = {"task_id": "a25f213e-6555-11ec-8dfd-02e913cffdb7"}
        http_code, data = self.checktimedparameters.DeleteTimedTaskPar('1', params_json)
        self.assertEqual(http_code, 400)


class TimerSwitchTest(unittest.TestCase):
    def setUp(self):
        self.checktimedparameters = CheckTimedParameters()
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))

    def test_sucess(self):
        data = {"data": [{'graph_id': 1, 'task_id': 'f037a860-7994-11ec-b5ab-005056ba834d', 'cycle': 'one',
                          'date_time': '2122-01-20 10:17', 'date_list': '[]', 'enabled': 1, 'crontab_id': 56,
                          'task_type': 'increment'}]}
        task_service.get_timer_by_id = mock.Mock(return_value=(200, data))
        params_json = {"task_id": "a25f213e-6555-11ec-8dfd-02e913cffdb7", "enabled": 1}
        http_code, data = self.checktimedparameters.TimedSwitchPar('1', params_json)
        self.assertEqual(http_code, 200)

    def test_add_fail1(self):
        params_json = {"task_id": "hahha", "enabled": 1}
        http_code, data = self.checktimedparameters.TimedSwitchPar('1', params_json)
        self.assertEqual(http_code, 400)

    def test_add_fail2(self):
        task_service.get_timer_by_id = mock.Mock(
            return_value=(500051, {'desc': '', 'detail': '', 'solution': '', 'error_code': ''}))
        params_json = {"task_id": "a25f213e-6555-11ec-8dfd-02e913cffdb7", "enabled": 1}
        http_code, data = self.checktimedparameters.TimedSwitchPar('1', params_json)
        self.assertEqual(http_code, 500)


class GetTimerinfo(unittest.TestCase):
    def setUp(self):
        self.checktimedparameters = CheckTimedParameters()
        task_service.getgraphcountbyid = mock.Mock(return_value=(200, {}))

    def test_sucess(self):
        task_service.get_timer_by_id = mock.Mock(return_value=(200, {"data": ""}))
        params_json = {"task_id": "a25f213e-6555-11ec-8dfd-02e913cffdb7", "graph_id": "1"}
        http_code, data = self.checktimedparameters.GetTimedInfoPar(params_json)
        self.assertEqual(http_code, 200)

    def test_add_fail1(self):
        params_json = {}
        http_code, data = self.checktimedparameters.GetTimedInfoPar(params_json)
        self.assertEqual(http_code, 400)

    def test_add_fail2(self):
        task_service.get_timer_by_id = mock.Mock(
            return_value=(500051, {'desc': '', 'detail': '', 'solution': '', 'error_code': ''}))
        params_json = {"task_id": "a25f213e-6555-11ec-8dfd-02e913cffdb7", "graph_id": "1"}
        http_code, data = self.checktimedparameters.GetTimedInfoPar(params_json)
        self.assertEqual(http_code, 500)


if __name__ == '__main__':
    suite1 = unittest.TestLoader().loadTestsFromTestCase(TimerSwitchTest)
    suite = unittest.TestSuite([suite1])
    unittest.TextTestRunner(verbosity=1).run(suite)

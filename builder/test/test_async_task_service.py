import json
import unittest
from unittest import mock
from unittest.mock import patch

from celery.canvas import Signature

from common.errorcode import codes
from dao.async_task_dao import async_task_dao
from service.async_task_service import async_task_service


class TestAsyncTaskService(unittest.TestCase):

    def setUp(self) -> None:
        self.task_type = 'intelligence'
        self.task_record = [{
            "id": 1,
            "task_type": "intelligence",
            "task_status": "finished",
            "task_name": "intelligence-4",
            "celery_task_id": "9ce3efcd-f2eb-4cdf-aa59-52277fc62668",
            "relation_id": "4",
            "task_params": "{\"graph_id\": 4}",
            "result": None,
            "created_time": "2022-10-19T03:18:32.000Z",
            "finished_time": "2022-10-19T03:18:33.000Z"
        },
            {
                "id": 2,
                "task_type": "intelligence",
                "task_status": "finished",
                "task_name": "intelligence-5",
                "celery_task_id": "f1767077-f650-4aae-b42f-b5bd968c4da8",
                "relation_id": "5",
                "task_params": "{\"graph_id\": 5}",
                "result": None,
                "created_time": "2022-10-19T03:18:37.000Z",
                "finished_time": "2022-10-19T03:18:37.000Z"
            }]

    def tearDown(self) -> None:
        pass

    def test_insert_record(self):
        celery_task_id = 'd1e17ff7-ecbf-422e-a4a1-e404851ff9be'
        async_task_dao.insert_record = mock.Mock(return_value=celery_task_id)
        async_task_service.update = mock.Mock(return_value=(codes.successCode, celery_task_id))

        class Task(object):
            status = 'PENDING'
            id = celery_task_id
            date_done = None

        task = Task()

        Signature.apply_async = mock.Mock(return_value=task)

        param_json = dict()
        param_json['task_type'] = 'intelligence'
        param_json['relation_id'] = 13
        param_json['task_name'] = 'intelligence-{}'.format(12)
        param_json['async_task_name'] = "cel.intelligence_calculate"
        # 设置是否取消正在运行的同图谱任务
        param_json['cancel_pre'] = True
        param_json['task_params'] = json.dumps({"graph_id": 12})

        ret_code, celery_task_id = async_task_service.post(param_json)
        self.assertTrue(isinstance(celery_task_id, str))

    @patch("service.async_task_service.AsyncTaskService.cancel_by_relation_id_list")
    def test_cancel_by_relation_id_list(self, mock_bar):
        task_type = 'intelligence'
        relation_id_list = [12]
        async_task_service.cancel_by_relation_id_list(task_type, relation_id_list)
        self.assertTrue(mock_bar.called)

    @patch("service.async_task_service.AsyncTaskService.cancel_by_relation_id")
    def test_cancel_by_relation_id(self, mock_bar):
        task_type = 'intelligence'
        relation_id = 12
        async_task_service.cancel_by_relation_id(task_type, relation_id)
        self.assertTrue(mock_bar.called)

    @patch("service.async_task_service.AsyncTaskService.cancel_by_id")
    def test_cancel_by_id(self, mock_bar):
        task_type = 'intelligence'
        task_id = 12
        async_task_service.cancel_by_id(task_type, task_id)
        self.assertTrue(mock_bar.called)

    def test_query(self):
        task_params = dict()
        task_params['task_type'] = 'intelligence'
        task_params['id'] = 12

        record_list = async_task_dao.query = mock.Mock(return_value=[self.task_record])
        self.assertIsNotNone(record_list)

    def test_update(self):
        task_id = 12
        param_json = dict()
        param_json['task_status'] = 'PENDING'
        async_task_dao.update = mock.Mock(return_value=(codes.successCode, dict()))
        ret_code, ret_message = async_task_service.update(task_id, param_json)
        self.assertIsNotNone(ret_code, ret_message)

    @patch("service.async_task_service.AsyncTaskService.delete_pre_running_task")
    def test_delete_pre_running_task(self, mock_bar):
        current_task_id = 12
        relation_id = 13
        async_task_service.delete_pre_running_task(self.task_type, current_task_id, relation_id)
        self.assertTrue(mock_bar.called)

    @patch("service.async_task_service.AsyncTaskService.cancel_task")
    def test_delete_pre_running_task(self, mock_bar):
        task_id = 12
        celery_task_id = 'd1e17ff7-ecbf-422e-a4a1-e404851ff9be'
        async_task_service.cancel_task(self.task_type, task_id, celery_task_id)
        self.assertTrue(mock_bar.called)

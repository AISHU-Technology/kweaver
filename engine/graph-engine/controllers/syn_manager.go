package controllers

import (
	"fmt"
	"graph-engine/utils"
	"sync"
)

/*
	ad 同步 kc 任务manager
*/

type SynManager struct {
	Id       int
	TaskPool map[string]*SynTask
	KgPool   map[int]int
}

var instance *SynManager
var once sync.Once

func GetInstance() *SynManager {
	once.Do(func() {
		instance = &SynManager{}
	})
	return instance
}

func (sm *SynManager) SubmitTask(taskId string, conf utils.KGConf, kcIp string, kgId int, kgTs int) {
	quit := make(chan int) // 退出通道

	sycTask := SynTask{TaskId: taskId, Conf: conf, KCIp: kcIp, Sym: sm, KgId: kgId, KgTs: kgTs, Quit: &quit}
	sm.TaskPool = make(map[string]*SynTask)
	sm.TaskPool[taskId] = &sycTask
	sm.KgPool = make(map[int]int)
	sm.KgPool[kgId] = 1

	go sycTask.SynDataV2()
}

type SynTask struct {
	TaskId           string
	TaskStatus       int
	TaskKgTopicTs    int
	TaskTime         int64
	TaskKgTopicCount int
	KCIp             string
	Conf             utils.KGConf
	KgId             int
	KgTs             int
	Sym              *SynManager
	In               *chan int
	Quit             *chan int
}

//func (st *SynTask) SynData() {
//	synRes, err := TopicSyn(st.Conf, st.KCIp, st.KcTs)
//	if err != nil {
//		fmt.Println(err)
//		return
//	}
//
//	st.TaskStatus = 1
//	st.TaskKgTopicCount = synRes.TaskKgTopicCount
//	st.TaskTime = synRes.TaskTime
//	st.Sym.KgPool = make(map[int]int)
//	st.Sym.KgPool[st.KgId] = 0
//}

//var wg sync.WaitGroup

func (st *SynTask) SynDataV2() {
	//utils.UpdateSynKcTaskInfo(st.KgId, "syning")
	synRes, err := TopicSyn(st.Conf, st.KCIp, st.KgTs, st.Quit)
	if err != nil {
		fmt.Println(err)
		return
	}
	st.TaskStatus = 1
	st.TaskKgTopicCount = synRes.TaskKgTopicCount
	st.TaskTime = synRes.TaskTime
	st.Sym.KgPool = make(map[int]int)
	st.Sym.KgPool[st.KgId] = 0

	//utils.UpdateSynKcTaskInfo(st.KgId, "normal")

	callUrl := "%s/api/kc-topic/syntony_task/%s"
	callUrl = fmt.Sprintf(callUrl, st.KCIp, st.TaskId)
	synCallInfo := &CallBackBody{TaskStatus: 1, TaskKgTopicTs: synRes.TaskKgTopicTs, TaskTime: synRes.TaskTime, TaskKgTopicCount: synRes.TaskKgTopicCount}
	httpPostV2(callUrl, *synCallInfo, 0)

}

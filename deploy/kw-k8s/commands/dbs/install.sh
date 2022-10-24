step=1
nodesIps=()

Exit() {
  if [ $1 -ne 0 ];then
     echo -en "\033[31;1m$2\n\033[0m"
     exit $1
  fi
}

CheckEnvironment(){
	echo -en "\033[32;1mPrepare the environment before installation...\n\033[0m"
	#Check whether k8s is available
	r=$(curl -k -s https://"$(kubectl describe  pod kube-apiserver -n kube-system 2>/dev/null | grep Liveness | head -n1 | awk '{print $3}' | cut -f3 -d '/')"/healthz)
	if [ "$r" == "ok" ];then
		helm list >/dev/null 2>&1
		Exit $? "K8s unavailable!"
	else
		Exit 1 "K8s unavailable!"
	fi
	
	if [ ! -x "$(command -v docker)" ]; then
	   echo -en "\033[31;1mdocker unavailable, please install docker.\n\033[0m"
	   exit 0
	fi
}

CheckSuccess() {
  if [ ${#} -eq 1 ] && [ $1 -ne 0 ];then
    exit 2
  fi
  if [ $1 -ne 0 ];then
    echo -en "\033[31;1m$2 failed,please see the'/kweaver/deploy/kw-k8s/log/install.log'\n\033[0m"
    exit 2
  else
    echo -en "\033[32;1m$2 success\n\033[0m"
  fi
}

CheckDBSuccess() {
  if [ ${#} -eq 1 ] && [ $1 -ne 0 ];then
    exit 2
  fi
  if [ $1 -ne 0 ];then
    echo -en "\033[31;1m$2 failed,please see the'/kweaver/deploy/kw-k8s/log/storage_install.log'\n\033[0m"
    exit 2
  else
    echo -en "\033[32;1m$2 success\n\033[0m"
  fi
}

CulStep(){
  step=$((step + 1))
}

NodesIps() {
  i=0
  for nodeIp in `kubectl get nodes -o wide | awk 'NR>1{print $6}'`
  do
    nodesIps[$i]=$nodeIp
    ((i=i+1))
  done

  for nodeIp in ${nodesIps[@]};
  do
	  #Each node creates a log directory
	  ssh root@$nodeIp mkdir -p /kweaver/deploy/kw-k8s/log/
  done
}

SCPToNode(){
  echo -en "\033[37;1m\nStage$step: Nodes dependent synchronization ...\n\033[0m"
  CulStep
  for nodeIp in ${nodesIps[@]};
  do
	  self=$(ifconfig -a|grep inet|grep -v 127.0.0.1|grep -v inet6|awk '{print $2}'|tr -d "addr:")
	  self=$(echo "$self" | grep $nodeIp)
	  if [ "$self" == "" ];then
		ssh root@$nodeIp "mkdir /kweaver/deploy/kw-k8s/conf ">> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		scp -r /kweaver/deploy/kw-k8s/conf/* root@$nodeIp:/kweaver/deploy/kw-k8s/conf >> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		CheckSuccess $? "Synchronize the configuration files to node ${nodeIp}"
    ssh root@$nodeIp chmod 777 /kweaver/deploy/kw-k8s/conf/nginx/error.log /kweaver/deploy/kw-k8s/conf/redis/redis.log
#		ssh root@$nodeIp "mkdir /kweaver/deploy/kw-k8s/images >> /kweaver/deploy/kw-k8s/log/install.log 2>&1"
#		scp -r /kweaver/deploy/kw-k8s/images/* root@$nodeIp:/kweaver/deploy/kw-k8s/images >> /kweaver/deploy/kw-k8s/log/install.log 2>&1
#		CheckSuccess $? "Synchronize the images to node ${nodeIp}"
#		ssh root@$nodeIp "mkdir /kweaver/deploy/kw-k8s/commands >> /kweaver/deploy/kw-k8s/log/install.log 2>&1"
#		scp -r /kweaver/deploy/kw-k8s/commands/* root@$nodeIp:/kweaver/deploy/kw-k8s/commands >> /kweaver/deploy/kw-k8s/log/install.log 2>&1
#		CheckSuccess $? "Synchronize the scripts to node ${nodeIp}"
	  fi
  done
}

DeleteRelease() {
  services=$(helm list | grep "^$1" | cut -f1)
  for service in $services
  do
    helm del --purge $service >> /kweaver/deploy/kw-k8s/log/storage_install.log 2>&1
    uninstall_time=0
    for ((;;));
    do
      if [ $uninstall_time -gt 200 ];then
        echo -en "\033[31;1m\nuninstall ${service} failed,exit the current script,please try to uninstall it manually\n\033[0m"
        exit 2
      fi
      kubectl get pv -n kweaver | grep $service >> /kweaver/deploy/kw-k8s/log/storage_install.log 2>&1
      if [ $? -ne 0 ];then
        break
      fi
      ((uninstall_time=uninstall_time+5))
      sleep 5
    done
  done
}

InstallNS(){
  echo -en "\033[37;1m\nStage$step: Create kweaver namespace ...\n\033[0m"
  CulStep
  namespace=`kubectl get ns | grep kweaver | awk '{print$1}'`
  if [ "$namespace" == "" ];then
    kubectl create ns kweaver >> /kweaver/deploy/kw-k8s/log/install.log 2>&1
	CheckSuccess $? "Create namespace kweaver"
  elif [ "$namespace" == "kweaver" ];then
    echo -en "\033[32;1mCreate namespace kweaver success\n\033[0m"
  fi
  
}

InstallMariadb(){
  echo -e "\033[37;1m\nStage$step: Install MARIADB persistence service\033[0m"
  CulStep
  mariadb_exist_status=`helm list | grep kw-mariadb`
  if [ "$mariadb_exist_status" == "" ];then
    /kweaver/deploy/kw-k8s/commands/mariadb_install.sh ${installNodes[@]}
    CheckDBSuccess $? "Install persistence service mariadb"
  else
    echo -en "\033[32;1mMariadb has been installed,determine whether to uninstall the original installation first(Y/y)\033[0m"
    echo -en "\033[31;1m(Other values skip the installation of the service): \033[0m"
    read dec
    if [ "$dec" == "Y" ] || [ "$dec" == "y" ];then
      DeleteRelease kw-mariadb
      /kweaver/deploy/kw-k8s/commands/mariadb_install.sh ${installNodes[@]}
      CheckDBSuccess $? "Install persistence service mariadb"
    fi
  fi
}

InstallMongo(){
  echo -e "\033[37;1m\nStage$step: Install MONGODB persistence service\033[0m"
  CulStep
  mongo_exist_status=`helm list | grep kw-mongodb`
  if [ "$mongo_exist_status" == "" ];then
    /kweaver/deploy/kw-k8s/commands/mongo_install.sh ${installNodes[@]}
    CheckDBSuccess $? "Install persistence service mongodb"
  else
    echo -en "\033[32;1mMongodb has been installed,determine whether to uninstall the original installation first(Y/y)\033[0m"
    echo -en "\033[31;1m(Other values skip the installation of the service): \033[0m"
    read dec
    if [ "$dec" == "Y" ] || [ "$dec" == "y" ];then
      DeleteRelease kw-mongodb
      /kweaver/deploy/kw-k8s/commands/mongo_install.sh ${installNodes[@]}
      CheckDBSuccess $? "Install persistence service mongodb"
    fi
  fi
}

InstallRedis(){
  echo -e "\033[37;1m\nStage$step: Install REDIS persistence service\033[0m"
  CulStep
  redis_exist_status=`helm list | grep kw-redis`
  if [ "$redis_exist_status" == "" ];then
    /kweaver/deploy/kw-k8s/commands/redis_install.sh ${installNodes[@]}
    CheckDBSuccess $? "Install persistence service redis"
  else
    echo -en "\033[32;1mRedis has been installed,determine whether to uninstall the original installation first(Y/y)\033[0m"
    echo -en "\033[31;1m(Other values skip the installation of the service): \033[0m"
    read dec
    if [ "$dec" == "Y" ] || [ "$dec" == "y" ];then
      DeleteRelease kw-redis
      /kweaver/deploy/kw-k8s/commands/redis_install.sh ${installNodes[@]}
      CheckDBSuccess $? "Install persistence service redis"
    fi
  fi
}

DBInstallType(){
  echo -en "\033[32;1m\nStarting select KWeaver persistence services configuration ...\n\033[0m"
  chmod -R a+x /kweaver/deploy/kw-k8s/commands/*
  step=1
  for((;;))
  do
    echo -en "\033[32;1m\n1-Default configuration\n\033[0m"
    echo -en "\033[32;1m2-Custom configuration\n\033[0m"
    echo -en "\033[32;1mPlease select a configuration mode[1-2]: \033[0m"
    read type
    if [ "$type" == "1" ];then
	  DBDefaultInstall
	  break
    elif [ "$type" == "2" ];then
	  /kweaver/deploy/kw-k8s/commands/customDB.sh
	  break
    fi
    echo -en "\033[31;1mPlease enter the correct mode number.\n\033[0m"
  done
}

DBDefaultInstall(){
  echo -en "\033[32;1m\nStarting install KWeaver persistence services ...\n\033[0m"
  chmod -R a+x /kweaver/deploy/kw-k8s/commands/*
  step=1

  echo -e "\033[37;1m\nStage$step: Configure the installation node for the persistent service\033[0m"
  CulStep
  list_node_str=""
  nodesHas=`kubectl get nodes | awk 'NR>1{print $1}'`
  nodeQueue=()
  index=1
  for node in ${nodesHas[@]};
  do
    if [ "$list_node_str" == "" ];then
      list_node_str="${index}.$node"
    else
      list_node_str="${list_node_str}\n${index}.$node"
    fi
    nodeQueue[$((index-1))]=$index
    index=$((index + 1))
  done
  for((;;));
  do
    nodesLength=0
    echo -en "\033[32;1mThe currently available installation nodes are as follows: \033[0m"
    echo -en "\033[32;1m\n${list_node_str}\n\033[0m"
    echo -en "\033[32;1mPlease specify the node number where the persistence service needs to be installed:[1-${#nodeQueue[@]}]: \033[0m"
    read nodes
#    if [ "$nodes" == "0" ];then
#      nodes=${nodeQueue[@]}
#      break
#    fi
    passTimes=0
    for inode in ${nodes[@]};
    do
      nodesLength=$((nodesLength+1))
    done
    for anode in ${nodeQueue[@]};
    do
      for inode in ${nodes[@]};
      do
        if [ "$inode" == "$anode" ];then
          passTimes=$((passTimes+1))
        fi
      done
    done	
	
    if [ $passTimes -eq $nodesLength ] && [ $nodesLength -eq 1 ];then
      break
    else
      echo -en "\033[31;1mPlease enter the correct node number.\n\033[0m"
    fi
  done
  nodesHas=`kubectl get nodes | awk 'NR>1{print $1}'`
  declare -a nodesHasArr
  ind=0
  for n in $nodesHas;
  do
    nodesHasArr[$ind]=$n
    ind=$((ind+1))
  done
  ind=0
  declare -a installNodes
  for node in $nodes;
  do
    installNodes[$ind]=${nodesHasArr[$((node-1))]}
   ind=$((ind+1))
  done
#  NodesIps ${installNodes[@]}

  InstallMariadb
  InstallMongo
  InstallRedis

  echo -en "\033[32;1m\nKWeaver persistence services were successfully installed.\n\033[0m"
}

Install(){
	CheckEnvironment
	NodesIps
	SCPToNode
	InstallNS
	DBInstallType
}

Install



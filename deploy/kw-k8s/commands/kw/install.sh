installed_basic_services="kw-studio kw-algserver kw-builder kw-engine kw-ingress-nginx"
step=1
nodesIps=()
HTTPS_PORT=""

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

GetChartByName() {
	for item in `ls /kweaver/deploy/kw-k8s/charts`
	do
		if [[ "$item" =~ "$installed_service" ]];then
		  echo "$item"
		  return
		fi
	done
	echo ""
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

DeleteOldService(){

	echo -en "\033[37;1m\nStage$step: Uninstall old version of KWeaver ...\n\033[0m"
	CulStep
	studio=`helm list | grep kw-studio | awk '{print $1}'`
	algserver=`helm list | grep kw-algserver | awk '{print $1}'`
	builder=`helm list | grep kw-builder | awk '{print $1}'`
	engine=`helm list | grep kw-engine | awk '{print $1}'`
	ingress=`helm list | grep kw-ingress-nginx | awk '{print $1}'`
	installed_services="${studio} ${algserver} ${builder} ${engine} ${ingress}"

	for service in $installed_services
	do
	  helm del --purge "$service" >>/kweaver/deploy/kw-k8s/log/install.log 2>&1
	  if [ $? -eq 0 ];then
            echo -e "\033[32;1mUninstall old ${service} success\033[0m"
      fi
	done

}

SCPToNode(){
  echo -en "\033[37;1m\nStage$step: Nodes dependent synchronization ...\n\033[0m"
  CulStep
  chmod 777 /kweaver/deploy/kw-k8s/conf/nginx/error.log /kweaver/deploy/kw-k8s/conf/redis/redis.log
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

GatewayPort(){
  echo -en "\033[32;1m\nStarting install KWeaver ...\n\033[0m"
  step=1
  cuStep=9999
  for ((;;))
    do
      httpsPort=443
      portUsed=`netstat -anp | awk '{print $4}' |grep ":${httpsPort}$"`
	  if [ $cuStep -eq 9999 ];then
         echo -e "\033[37;1mStage$step: KWeaver service port configuration ...\033[0m"
         cuStep=$((cuStep+1))
      fi
      if [ "$portUsed" != "" ];then
        echo -en "\033[32;1mPlease specify KWeaver service https listening port(0-65535,$httpPort Not available): \033[0m"
        read httpsPort
      else
        echo -en "\033[32;1mPlease specify KWeaver service https listening port(0-65535,default 443): \033[0m"
        read httpsPort
        if [ "$httpsPort" == "" ];then
          httpsPort=443
        fi
      fi
      expr $httpsPort "+" 10 &> /dev/null
      if [ $? -ne 0 ] || [ $httpsPort -lt 0 ] || [ $httpsPort -gt 65535 ];then
          echo -e "\033[31;1m$httpsPort port is illegal,please enter again\033[0m"
          continue
      fi
      portUsed=`netstat -anp | awk '{print $4}' |grep ":${httpsPort}$"`
      if [ "$portUsed" == "" ];then
        HTTPS_PORT=$httpsPort
        echo -e ""
        break
      else
        echo -en "\033[31;1m$httpsPort port is occupied,please enter again\033[0m"
      fi
    done
    CulStep
}

KWDepsInstall(){
    echo -e "\033[37;1m\nStage$step: Install KWeaver ...\033[0m"
    CulStep
    type="1"
	replicaCount=$(kubectl get node | awk 'NR>1' | wc -l)
	for installed_service in $installed_basic_services
	do
	  item=$(GetChartByName "$installed_service")
	  if [ "$item" == "" ];then
		continue
	  fi
	  if [ "$item" == "kw-studio" ];then
		helm install /kweaver/deploy/kw-k8s/charts/$item -n kw-studio --set replicaCount=$replicaCount>> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		CheckSuccess $? "Install service ${item}"
	  elif [ "$item" == "kw-algserver" ];then
		helm install /kweaver/deploy/kw-k8s/charts/$item -n kw-algserver --set replicaCount=$replicaCount>> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		CheckSuccess $? "Install service ${item}"
	  elif [ "$item" == "kw-builder" ];then
	    hostip=`hostname -I | awk '{print $1}'`
		hostname="kwhost"
		helm install /kweaver/deploy/kw-k8s/charts/$item -n kw-builder --set hostAliases.ip=${hostip} --set hostAliases.hostnames=${hostname}  --set replicaCount=$replicaCount>> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		CheckSuccess $? "Install service ${item}"
	  elif [ "$item" == "kw-engine" ];then
		helm install /kweaver/deploy/kw-k8s/charts/$item -n kw-engine --set replicaCount=$replicaCount>> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		CheckSuccess $? "Install service ${item}"
	  elif [ "$item" == "kw-ingress-nginx" ];then
	    kwSecret=`kubectl get secret -n kweaver | grep kweaver-https | awk '{print$1}'`
		if [ "$kwSecret" == "" ];then
	      kubectl create secret tls kweaver-https -n kweaver \
		  --cert=/kweaver/deploy/kw-k8s/conf/nginx/https/server.crt \
		  --key=/kweaver/deploy/kw-k8s/conf/nginx/https/server.key>> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		fi
		helm install /kweaver/deploy/kw-k8s/charts/$item -n kw-ingress-nginx \
        --set replicaCount=$replicaCount \
		--set service.hostPortHttps=${HTTPS_PORT}>> /kweaver/deploy/kw-k8s/log/install.log 2>&1
		CheckSuccess $? "Install service ${item}"
	  fi
	done
	
  for ip in `kubectl get node -o wide | awk 'NR>1' | awk '{print $6}'`
  do
    ssh root@$ip "firewall-cmd --add-port ${HTTPS_PORT}/tcp --permanent >> /dev/null 2>&1"
  done
	
  echo -en "\033[32;1m\nKWeaver was successfully installed.\n\033[0m"
}


Install(){
	CheckEnvironment
	NodesIps
	DeleteOldService
	SCPToNode
    InstallNS
	GatewayPort
	KWDepsInstall
}

Install
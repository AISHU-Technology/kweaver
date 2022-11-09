#!/bin/bash


Exit() {
  if [ $1 -ne 0 ];then
     echo -en "\033[31;1m$2\n\033[0m"
     exit $1
  fi
}

CheckSuccess() {
  if [ ${#} -eq 1 ] && [ $1 -ne 0 ];then
    exit 2
  fi
  if [ $1 -ne 0 ];then
    echo -en "\033[31;1m$2 failed,please see the'/kweaver/deploy/kw-k8s/log/uninstall.log'\n\033[0m"
    exit 2
  else
    echo -en "\033[32;1m$2 success\n\033[0m"
  fi

}

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

for nodeIp in `kubectl get nodes -o wide | awk 'NR>1{print $6}'`;
do
  #Each node creates a log directory
  ssh root@$nodeIp mkdir -p /kweaver/deploy/kw-k8s/log/
done

echo -en "\033[32;1m1-Starting to uninstall KWeaver services ...\n\033[0m"
cd /kweaver/deploy/kw-k8s/commands/kw && chmod +x ./uninstall.sh && ./uninstall.sh
if [ $? -ne 0 ];then
   echo -en "\033[31;1mUninstall KWeaver services failed\n\033[0m"
else
  echo -en "\033[32;1mUninstall KWeaver services successfully\n\033[0m"
fi
cd /kweaver/deploy/kw-k8s

echo -en "\033[32;1m\n2-Starting to uninstall DB services ...\n\033[0m"
cd /kweaver/deploy/kw-k8s/commands/dbs && chmod +x ./uninstall.sh && ./uninstall.sh
if [ $? -ne 0 ];then
   echo -en "\033[31;1mUninstall DB services failed\n\033[0m"
else
  echo -en "\033[32;1mUninstall DB services successfully\n\033[0m"
fi
cd /kweaver/deploy/kw-k8s


namespace=`kubectl get ns | grep kweaver | awk '{print$1}'`
if [ "$namespace"x = "kweaver"x ];then
	echo -en "\033[32;1m\n3-Starting to delete the namespace kweaver...\n\033[0m"
	kubectl delete ns kweaver >>/kweaver/deploy/kw-k8s/log/uninstall.log 2>&1
	CheckSuccess $? "Delete namespace kweaver"
fi

echo -en "\033[32;1m\n4-Starting to clear the images...\n\033[0m"
sleep 5
for nodeIp in `kubectl get nodes -o wide | awk 'NR>1{print $6}'`;
do
  ssh root@$nodeIp docker images | grep kw | grep -v 'none' | awk '{print $1":"$2}' | ssh root@$nodeIp xargs docker rmi -f >>/kweaver/deploy/kw-k8s/log/uninstall.log 2>&1
  ssh root@$nodeIp docker images | grep none | awk '{print $3}' | ssh root@$nodeIp xargs docker rmi -f >>/kweaver/deploy/kw-k8s/log/uninstall.log 2>&1
done
echo -en "\033[32;1mImage clearing completed\n\033[0m"


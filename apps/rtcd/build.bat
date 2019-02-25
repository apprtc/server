set curdir=%CD%
cd ../../cmd
statik -src=../apps/assets/dist -f


cd %curdir%
go build
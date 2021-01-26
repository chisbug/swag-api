# Swagger.json to Ts



#### 1. install

```bash
npm install -g @chist/swag-api
```

#### 2. usage

> 参数说明:
>
> -r 如需生成request.ts模板文件, 请使用此参数, 否则勿传, 以免覆盖已有文件!
>
> 命令说明:
>
> create \<swagger url> \<filepath>
>
> ​	swagger url: swagger.json的url
>
> ​	filepath: 保存路径	

1. 命令行方式

```bash
# 项目文件夹下
swagApi -r create https://example.com/swagger/swagger.json ./src/api/api.ts
```

2. script方式

```bash
# package.json
...
"script": {
	"api": "swagApi -r create https://example.com/swagger/swagger.json ./src/api/api.ts"
},
...

# 命令
npm run api 
# 或者
yarn api
```


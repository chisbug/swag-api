# Swagger.json to Ts



#### 1. install

```bash
npm install -g @chist/swag-api
```

#### 2. usage

1. 命令行方式

```bash
# 项目文件夹下
swagApi create https://example.com/swagger/swagger.json ./src/api/api.ts
```

2. script方式

```bash
# package.json
...
"script": {
	"api": "swagApi create https://example.com/swagger/swagger.json ./src/api/api.ts"
},
...

# 命令
npm run api 
# 或者
yarn api
```

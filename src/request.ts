import axios from 'axios';

const request = axios.create({
  withCredentials: true,
  baseURL: process.env.MY_APP_HOST,
});

request.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    return config;
  },
  function (err) {
    // 处理错误
    return Promise.reject(err);
  }
);

request.interceptors.response.use(
  function (response) {
    // 对响应数据做点什么
    return response;
  },
  function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

export default request;

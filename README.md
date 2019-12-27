# kk-vue-log
用于vue项目中的埋点小工具，主要功能有

* 点击事件埋点，可自定义埋点参数和埋点要执行的方法。
* 记录页面停留时间。
* 记录页面跳转来源。

## 开始

安装

``` 
npm install kk-vue-log -S
```

使用

``` 
// 在main.js中

// 引入
import kkVueLog from "kk-vue-log"

// 配置
// options 除了以下几个配置，支持所有的axios配置项

const options = {

    // 埋点数据上传的接口，必填
    url: "//127.0.0.1:3000/login", 

    //埋点数据上传的方法， 可选，不填写默认 'get'
    method: 'post', 

    //请求的 headers，(可选) 建议只放常量  (提示, 若需要加token这一类通过接口或者计算出来的参数, 需要放在请求拦截器里, 否则可能取不到值)
    headers:{ 
        'NAME': 'name'
    },
    // 请求拦截执行函数 config为请求的配置 同axios请求拦截器的配置
    interceptorsRequest:function(config){
      config.headers={
        token: '123456'
      }
    },

    // 路由实例 (可选) 如果需要记录页面停留时间和页面跳转来源则必填
    router, 

    //一个数组，(可选) 需要记录停留时间的页面vue路由path, 若写['*']则为所有页面
    durationRoute:['*'], 

    // 是否需要记录跳转来源 (可选)
    needReferrer: false,

    //跳转来源的页面标记字段 (可选) 例如 http://www.baidu.com?from=baidu
    sign: 'from' 
}

// 使用 
Vue.use(kkVueLog, options)

```

## 点击埋点
在需要埋点的元素或组件中。
```
<div v-log="{params:{a:1,b:2}}">click</div>

```
> 注意 一定要将自定义参数放在 params 对象里。

## 记录页面停留时间
参照开头，将所需字段配置好即可。

页面跳转的时候会自动向配置好的接口地址发送请求，自动携带两个参数: 

``` duration```: 页面停留时间，单位毫秒；

``` url```: 页面url。

## 记录页面跳转来源
同样参照开头，将所需参数配置好即可。

页面跳转的时候会自动向配置好的接口地址发送请求，自动携带一个参数: 字段名为 options配置中sign字段的值，例如开头的例子中，请求参数为 {from: 'baidu'}




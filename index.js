const axios = require("axios")



/**
 * options对象中的参数说明
 * logFunction: 类型 Function, 自定义的埋点方法 
 */

// =====工具函数=====
// 获取url search中的参数


// 发起埋点接口 上报数据
var kkLogUtils = {
    getQueryFromSearch: function (variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        return (false);
    },

    // 获取url hash中的参数
    getQueryFromHash: function (variable) {
        var query = window.location.hash.substring(1);
        if (query.indexOf('?') > -1) {
            query = query.split('?')[1];
        }

        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }
        return (false);
    },

    // 获取url来源标记
    getReferrer: function (sign) {
        let referrer = kkLogUtils.getQueryFromSearch(sign) || kkLogUtils.getQueryFromHash(sign)
        return referrer
    },

    // 提交埋点数据
    submitLog: function (url, method = 'get', params) {
        if (method === 'get') {
            axios.get(url, {
                params
            })
        }
        if (method === 'post') {
            axios.post(url, params)
        }
    }
}

module.exports = function (Vue, options = {}) {
    // 添加请求拦截器
    if(options.interceptorsRequest && options.interceptorsRequest instanceof Function){
        axios.interceptors.request.use(function (config) {
            // 在发送请求之前 执行拦截函数
            options.interceptorsRequest(config);
            return config;
        }, function (error) {
            // 对请求错误做些什么
            return Promise.reject(error);
        });
    }

    // // 添加响应拦截器 暂时不用
    // axios.interceptors.response.use(function (response) {
    //     // 对响应数据做点什么
    //     return response;
    // }, function (error) {
    //     // 对响应错误做点什么
    //     return Promise.reject(error);
    // });

    // 如果配置信息中未配置埋点接口地址(url), 则报错
    if (!options || !options.url) {
        throw '埋点接口地址(url) 未配置'
        return false
    }

    const method = options.method || 'get'; // 埋点接口方法
    const durationRoute = options.durationRoute || null;
    const router = options.router;
    const sign = options.sign;
    // delete options.durationRoute;
    // delete options.router;

    /**
     * v-log指令中的参数说明
     * params: 类型 Object, 埋点需要上传的参数
     */
    Vue.directive('log', function (el, binding) {
        el.onclick = function () {
            // 如果传入的params不是一个对象, 则报错
            if (binding.value['params'] && Object.prototype.toString.call(binding.value['params']) !== '[object Object]') {
                throw 'params必须为一个对象'
                return false
            }

            let params = binding.value['params'] || {};

            //计算点击事件与页面初始化的时间差
            let logStart = (window.sessionStorage.getItem('logStart') || 0) - 0;
            let clickDelay = Date.now() - logStart;
            params.clickDelay = clickDelay;

            // 如果有自定义埋点方法，则执行自定义埋点方法
            if (options.logFunction && options.logFunction instanceof Function) {
                options.logFunction({
                    ...params
                })
                return false
            }

            // ===== 如果有自定义埋点方法, 则使用默认埋点数据上报 =====
            kkLogUtils.submitLog(options.url, method, params)
        }
    })


    // ===== 记录页面进入时间 ======
    if (!router) {
        return false
    }
    router.beforeEach((to, from, next) => {
        (function () {
            let logStart = (window.sessionStorage.getItem('logStart') || 0) - 0;
            // 第一次进入页面，记录时间
            if (!logStart) {
                window.sessionStorage.setItem('logStart', Date.now())
            } else {
                // 每次进入一个新页面的时候，计算出上一个页面的停留时间
                let path = from.path;
                let logEnd = Date.now();
                let logStart = window.sessionStorage.getItem('logStart') - 0
                let duration = logEnd - logStart;

                // 刷新本页面开始时间
                window.sessionStorage.setItem('logStart', Date.now())

                if (!durationRoute || durationRoute.length === 0) {
                    return false
                }

                // 埋点数据上报
                let params = {};
                params.duration = duration;
                params.url = window.location.href;
                if (durationRoute[0] === '*' || durationRoute.indexOf(from.path) > -1) {
                    kkLogUtils.submitLog(options.url, method, params)
                }
            }
        })();
        next()
    })

    // ===== 记录页面来源 ======
    router.afterEach((to, from) => {
        (function () {
            if (!options.needReferrer) {
                return
            }
            let outReferrer = kkLogUtils.getReferrer(sign);
            let inReferrer = from.path;
            let params = {};
            if (!inReferrer || inReferrer === '/') {
                params[sign] = outReferrer
            } else {
                params[sign] = inReferrer
            }
            kkLogUtils.submitLog(options.url, method, params)
        })()
    })

}
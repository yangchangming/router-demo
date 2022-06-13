
(function() {
    var util = {
        //获取路由的路径和详细参数
        getParamsUrl: function() {
            var hashDeatail = location.hash.split("?"),
                hashName = hashDeatail[0].split("#")[1], //路由地址
                params = hashDeatail[1] ? hashDeatail[1].split("&") : [], //参数内容
                query = {};
            for (var i = 0; i < params.length; i++) {
                var item = params[i].split("=");
                query[item[0]] = item[1]
            }
            return {
                path: hashName,
                query: query,
                params: params
            }
        },
        // 闭包返回函数
        closure(name) {
            function fun(currentHash) {
                window.name&&window[name](currentHash)
            }
            return fun;
        },
        // 生成不同的 key
        genKey() {
            var t = 'xxxxxxxx'
            return t.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0
                var v = c === 'x' ? r : (r & 0x3 | 0x8)
                return v.toString(16)
            })
        },
        hasClass: function(elem, cls) {
            cls = cls || '';
            if (cls.replace(/\s/g, '').length == 0) return false; //当cls没有参数时，返回false
            return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
        },
        addClass: function(ele, cls) {
            if (!util.hasClass(ele, cls)) {
                ele.className = ele.className == '' ? cls : ele.className + ' ' + cls;
            }
        },
        removeClass(elem, cls) {
            if (util.hasClass(elem, cls)) {
                var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, '') + ' ';
                while (newClass.indexOf(' ' + cls + ' ') >= 0) {
                    newClass = newClass.replace(' ' + cls + ' ', ' ');
                }
                elem.className = newClass.replace(/^\s+|\s+$/g, '');
            }
        }
    }

    function Router() {
        this.routes = {}; //保存注册的所有路由
        this.beforeFun = null; //切换前
        this.afterFun = null; // 切换后
        this.routerViewId = "#routerView"; // 路由挂载点
        this.redirectRoute = null; // 路由重定向的 hash
        this.stackPages = true; // 多级页面缓存，默认开启
        this.routerMap = []; // 路由遍历
        this.historyFlag = '' // 路由状态，前进，回退，刷新
        this.history = []; // 路由历史
        this.animationName = "fade"
    }

    Router.prototype = {
        init: function(config) {
            var self = this;
            this.routerMap = config ? config.routes : this.routerMap
            this.routerViewId = config ? config.routerViewId : this.routerViewId
            this.stackPages = config ? config.stackPages : this.stackPages

            // var name = document.querySelector('#routerView').getAttribute('data-animationName')
            // if (name) {
            //     this.animationName = name
            // }
            this.animationName = config ? config.animationName : this.animationName

            // if (!this.routerMap.length) {
            //     var selector = this.routerViewId + " .page"
            //     var pages = document.querySelectorAll(selector)
            //     for (var i = 0; i < pages.length; i++) {
            //         var page = pages[i];
            //         var hash = page.getAttribute('data-hash')
            //         var name = hash.substr(1)
            //         var item = {
            //             path: hash,
            //             name: name,
            //             callback: util.closure(name)
            //         }
            //         this.routerMap.push(item)
            //     }
            // }


            this.registerRoute();

            /**
             * 注册链接跳转方法
             * 更新location hash 值即可出发动作
             *
             * @param path
             */
            window.linkTo = function(path) {
                if (path.indexOf("?") !== -1) {
                    window.location.hash = path + '&key=' + util.genKey()
                } else {
                    window.location.hash = path + '?key=' + util.genKey()
                }
            }

            //页面首次加载 匹配路由
            window.addEventListener('load', function(event) {
                // console.log('load', event);
                self.historyChange(event)
            }, false)

            //路由切换
            window.addEventListener('hashchange', function(event) {
                // console.log('hashchange', event);
                self.historyChange(event)
            }, false)

        },

        // 路由事件监听器
        historyChange: function(event) {
            var currentHash = util.getParamsUrl();
            var nameStr = "router-" + (this.routerViewId) + "-history"
            this.history = window.sessionStorage[nameStr] ? JSON.parse(window.sessionStorage[nameStr]) : []

            var back = false,
                refresh = false,
                forward = false,
                index = 0,
                len = this.history.length;

            for (var i = 0; i < len; i++) {
                var h = this.history[i];
                if (h.hash === currentHash.path && h.key === currentHash.query.key) {
                    index = i
                    if (i === len - 1) {
                        refresh = true
                    } else {
                        back = true
                    }
                    break;
                } else {
                    forward = true
                }
            }
            if (back) {
                this.historyFlag = 'back'
                this.history.length = index + 1
            } else if (refresh) {
                this.historyFlag = 'refresh'
            } else {
                this.historyFlag = 'forward'
                var item = {
                    key: currentHash.query.key,
                    hash: currentHash.path,
                    query: currentHash.query
                }
                this.history.push(item)
            }
            console.log('historyFlag ------> ', this.historyFlag)
            // console.log('history :', this.history)

            if (!this.stackPages) {
                this.historyFlag = 'forward'
            }
            window.sessionStorage[nameStr] = JSON.stringify(this.history)
            this._do()
        },

        //页面渲染
        pageRender: function(currentHash) {
            if (this.historyFlag === 'back') {
                return;
            } else if (this.historyFlag === 'forward' || this.historyFlag === 'refresh') {
                if (currentHash){
                    if (this.routes[currentHash.path].callback){
                        this.routes[currentHash.path].callback(currentHash)
                    }else {
                        console.log('未配置页面渲染函数')
                    }
                }
            }
        },

        /**
         * 路由处理核心逻辑
         * 1.路由跳转前的公共过滤器执行
         * 2.再执行个性化前置过滤器
         */
        _do: function() {
            var currentHash = util.getParamsUrl();
            var currentRoute = this.routes[currentHash.path]

            console.log(currentRoute)

            if (currentRoute) {
                var self = this;

                //执行公共前置过滤器
                if (this.beforeFun) {
                    this.beforeFun({
                        to: {
                            path: currentHash.path,
                            query: currentHash.query
                        },
                    })
                }

                //执行具体路由path指定的个性化前置过滤器
                if(currentRoute.beforeFilter && Object.prototype.toString.call(currentRoute.beforeFilter) === '[object Function]'){
                    currentRoute.beforeFilter()
                }

                //继续路由跳转进行页面渲染
                self.pageRender(currentHash)

                //执行具体路由path指定的个性化后置过滤器
                if(currentRoute.afterFilter && Object.prototype.toString.call(currentRoute.afterFilter) === '[object Function]'){
                    currentRoute.afterFilter()
                }

                //执行公共后置过滤器
                if (this.afterFun){
                    this.afterFun()
                }
            } else {
                //不存在的地址,重定向到默认页面
                window.location.hash = this.redirectRoute
            }
        },

        //路由注册
        registerRoute: function() {
            for (var i = 0; i < this.routerMap.length; i++) {
                var route = this.routerMap[i]
                if (route.name === "redirect") {
                    this.redirectRoute = route.path
                } else {
                    this.redirectRoute = this.routerMap[0].path
                }
                var newPath = route.path
                var path = newPath.replace(/\s*/g, ""); //过滤空格
                this.routes[path] = route
            }
        },

        //公共前置过滤器
        commonBeforeFilter: function(callback) {
            if (Object.prototype.toString.call(callback) === '[object Function]') {
                this.beforeFun = callback;
            } else {
                console.trace('路由切换前钩子函数不正确')
            }
        },

        //公共后置过滤器
        commonAfterFilter: function(callback) {
            if (Object.prototype.toString.call(callback) === '[object Function]') {
                this.afterFun = callback;
            } else {
                console.trace('路由切换后回调函数不正确')
            }
        }
    }

    window.Router = Router;  //注册到 window 全局
    window.router = new Router();
})()
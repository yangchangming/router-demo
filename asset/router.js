/**
 * Router class definition
 */
class Router{

    constructor(routes) {
        this.routes = {};
        this.init(routes);
        this.onPopState();
    }

    init(routes){
        let _this = this;
        Object.keys(routes).forEach((item, index, array)=>{
            _this.listen(item, routes[item]);
        });
        this.go('/');
    }

    listen(url, fn){
        this.routes[url] = fn;
    }

    go(url){
        history.pushState({url}, null, url);
        this.routes[url] && this.routes[url]();
    }

    onPopState(){
        let _this = this
        window.addEventListener("popstate", e => {
            let url = e.state && e.state.url;
            console.log(url)
            _this.routes[url] && _this.routes[url]();
        });

        window.addEventListener("load", e => {
            let _this = this
            let url = e.state && e.state.url;
            console.log(url)
            _this.routes[url] && _this.routes[url]();
        });

        window.addEventListener('hashchange', e => {
            let _this = this
            let url = e.state && e.state.url;
            console.log(url)
            _this.routes[url] && _this.routes[url]();
        });
    }
}

const route = new Router({
    "/":()=>render("index"),
    "/case":()=>render("case content"),
    "/tools":()=>render("tools content"),
    "/idea":()=>render("idea content"),
    "/member":()=>render("member content")
});

/**
 * render content that has permission
 * @param content
 */
function render(content){
    document.getElementById("content").innerHTML = content;
}
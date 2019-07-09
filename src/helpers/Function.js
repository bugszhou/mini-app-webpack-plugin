module.exports = `!(function() {
  Function = (function(OriginFunction){
    return function() {
      var args = Array.prototype.slice.call(arguments, 0),
        newFn = new OriginFunction(args);
      if (typeof newFn === 'function') {
        return newFn;
      }
      return function() {
        // console.warn('Function is not return a function!');
        global.requestAnimationFrame=requestAnimationFrame;global.cancelAnimationFrame=cancelAnimationFrame;global.atob=atob;global.setTimeout=setTimeout;global.clearTimeout=clearTimeout;global.setInterval=setInterval;global.clearInterval=clearInterval;global.chrome=chrome;global.__global=__global;global.__wxRoute=__wxRoute;global.__wxRouteBegin=__wxRouteBegin;global.__wxAppCurrentFile__=__wxAppCurrentFile__;global.__wxAppData=__wxAppData;global.__wxAppCode__=__wxAppCode__;global.__vd_version_info__=__vd_version_info__;global.Component=Component;global.Behavior=Behavior;global.definePlugin=definePlugin;global.requirePlugin=requirePlugin;global.$gwx=$gwx;global.__workerVendorCode__=__workerVendorCode__;global.__workersCode__=__workersCode__;global.__WeixinWorker=__WeixinWorker;global.global=global;global.WeixinWorker=WeixinWorker;global.__wxConfig=__wxConfig;global.__devtoolsConfig=__devtoolsConfig;global.$gwxc=$gwxc;global.$gaic=$gaic;global.where=where;global.showDebugInfo=showDebugInfo;global.checkProxy=checkProxy;global.__disPlayURLCheckWarning=__disPlayURLCheckWarning;global.securityDetails=securityDetails;global.setSecurityDetails=setSecurityDetails;global.DeviceOrientation=DeviceOrientation;global.__WAServiceStartTime__=__WAServiceStartTime__;global.__WAServiceEndTime__=__WAServiceEndTime__;global.WeixinJSContext=WeixinJSContext;global.core=core;global.onbeforeunload=onbeforeunload;global.define=define;global.require=require;global.wx=wx;global.Page=Page;global.__webview_engine_version__=__webview_engine_version__;global.App=App;global.getApp=getApp;global.getCurrentPages=getCurrentPages;global.__pageComponent=__pageComponent;global.fn=fn;global.decodePathName=decodePathName;global.self=self;global.window=window;global.location=location;global.document=document;global.top=top;global.parent=parent;global.navigator=navigator;global.innerWidth=innerWidth;global.innerHeight=innerHeight;global.onload=onload;global.performance=performance;
        return global || my;
      };
    };
  })(Function);
})();`;
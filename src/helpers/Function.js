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
        global.App=App;
        global.Behavior=Behavior;
        global.Component=Component;
        // ios9不兼容
        // global.DeviceOrientation=DeviceOrientation;
        global.Page=Page;
        // ios9不兼容
        // global.atob=atob;
        global.clearInterval=clearInterval;
        global.clearTimeout=clearTimeout;
        global.getApp=getApp;
        global.setInterval=setInterval;
        global.setTimeout=setTimeout;
        global.Infinity=Infinity;
        global.Array=Array;
        global.ArrayBuffer=ArrayBuffer;
        global.Boolean=Boolean;
        global.DataView=DataView;
        global.Date=Date;
        global.Error=Error;
        global.EvalError=EvalError;
        global.Float32Array=Float32Array;
        global.Float64Array=Float64Array;
        global.Int8Array=Int8Array;
        global.Int16Array=Int16Array;
        global.Int32Array=Int32Array;
        // ios9不兼容
        // global.Intl=Intl;
        global.JSON=JSON;
        global.Map=Map;
        global.Math=Math;
        global.NaN=NaN;
        global.Number=Number;
        global.Object=Object;
        global.Promise=Promise;
        // ios9不兼容
        // global.Proxy=Proxy;
        global.RangeError=RangeError;
        global.ReferenceError=ReferenceError;
        global.Reflect=Reflect;
        global.RegExp=RegExp;
        global.Set=Set;
        global.String=String;
        global.Symbol=Symbol;
        global.SyntaxError=SyntaxError;
        global.TypeError=TypeError;
        global.URIError=URIError;
        // ios9不兼容
        // global.USBAlternateInterface=USBAlternateInterface;
        // global.USBConfiguration=USBConfiguration;
        // global.USBConnectionEvent=USBConnectionEvent;
        // global.USBDevice=USBDevice;
        // global.USBEndpoint=USBEndpoint;
        // global.USBInTransferResult=USBInTransferResult;
        // global.USBInterface=USBInterface;
        // global.USBIsochronousInTransferPacket=USBIsochronousInTransferPacket;
        // global.USBIsochronousInTransferResult=USBIsochronousInTransferResult;
        // global.USBIsochronousOutTransferPacket=USBIsochronousOutTransferPacket;
        // global.USBIsochronousOutTransferResult=USBIsochronousOutTransferResult;
        // global.USBOutTransferResult=USBOutTransferResult;
        global.Uint8Array=Uint8Array;
        global.Uint8ClampedArray=Uint8ClampedArray;
        global.Uint16Array=Uint16Array;
        global.Uint32Array=Uint32Array;
        global.WeakMap=WeakMap;
        global.WeakSet=WeakSet;
        // ios9不兼容
        // global.WebAssembly=WebAssembly;
        global.console=console;
        global.decodeURI=decodeURI;
        global.decodeURIComponent=decodeURIComponent;
        global.encodeURI=encodeURI;
        global.encodeURIComponent=encodeURIComponent;
        global.escape=escape;
        global.isFinite=isFinite;
        global.isNaN=isNaN;
        global.parseFloat=parseFloat;
        global.parseInt=parseInt;
        global.unescape=unescape;
        // ios9不兼容
        // global.URL=URL;
        return global || my;
      };
    };
  })(Function);
})();`;
module.exports = `!(function() {
  Function = (function(OriginFunction){
    return function() {
      var args = Array.prototype.slice.call(arguments, 0),
        newFn = new OriginFunction(args);
      if (typeof newFn === 'function') {
        return newFn;
      }
      return function() {
        console.warn('Function is not return a function!');
        return global || my;
      };
    };
  })(Function);
})();`;
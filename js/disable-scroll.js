(function(){
  function suppressScroll(e) {
    e.preventDefault();
  }

  window.addEventListener('wheel', suppressScroll, { passive: false });
  window.addEventListener('touchmove', suppressScroll, { passive: false });
})();



function change(){

    action = gsap.timeline({
      defaults:{duration:3, ease: "none"},
      repeat:-1
    })
      .to('.point', {
      motionPath: {
        path: "#egg",
        align: "#egg",
        alignOrigin: [0.5, 0.5],
      }
    })
  
    return action;
  }
  
  // sync 'moving path' with moving point  ===
  function sync(){
    var progress = action.progress(); 
    action.kill(); 
    change().progress(progress); 
  }
  
  function start(){
    
    gsap.to('#egg', {scaleY:0.5, transformOrigin:'center', duration:1.5, ease:'power1.inOut', repeat:-1, yoyo:true});
    
    // just for fun
    gsap.timeline({repeat:-1})
      .to('.point', {
      fill:'red',
      scale:2, transformOrigin:'center',
      duration:1.5, ease:'linear.easeNone',
      repeat:1, yoyo:true
    })
    // ease:'linear.easeNone'  => important
    
    change();
    gsap.ticker.add(sync);
    
  }
  
  start();
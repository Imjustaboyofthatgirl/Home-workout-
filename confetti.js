// Minimalist confetti burst
window.RuhiConfetti = function(){
  const n=120; for(let i=0;i<n;i++){
    const s=document.createElement('span'); s.style.cssText=`
      position:fixed; left:50%; top:50%; width:6px; height:6px; border-radius:50%;
      background:hsl(${Math.random()*360},85%,65%); transform:translate(-50%,-50%);
      pointer-events:none; z-index:9999; animation:pop .8s ease-out forwards;`;
    document.body.appendChild(s)
    const x=(Math.random()*2-1)*140, y=(Math.random()*-1)*200
    s.animate([{transform:`translate(-50%,-50%)`},{transform:`translate(${x}px,${y}px)`}], {duration:800,fill:'forwards'})
    setTimeout(()=> s.remove(), 820)
  }
}

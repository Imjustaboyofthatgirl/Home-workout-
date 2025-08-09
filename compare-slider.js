// Simple before/after slider
function makeCompare(sel, startUrl, endUrl){
  const root = document.querySelector(sel)
  root.innerHTML = ''
  const wrap = document.createElement('div'); wrap.className='compare'
  const a = document.createElement('img'); a.src = startUrl
  const b = document.createElement('img'); b.src = endUrl
  const r = document.createElement('input'); r.type='range'; r.min=0; r.max=100; r.value=50
  wrap.appendChild(a); wrap.appendChild(b); wrap.appendChild(r); root.appendChild(wrap)
  const update = ()=> b.style.clipPath = `inset(0 ${100-r.value}% 0 0)`
  r.oninput = update; update()
}
window.makeCompare = makeCompare

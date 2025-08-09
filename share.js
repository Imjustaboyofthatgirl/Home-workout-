const qs = new URLSearchParams(location.search)
const publicId = qs.get('id'); const monthIndex = qs.get('m')
if(!publicId || !monthIndex){ document.body.innerHTML = '<main class="container"><div class="card"><h1>Invalid link</h1></div></main>'; throw new Error('bad link') }

;(async function(){
  const share = await db.collection('shares').doc(publicId).get()
  if(!share.exists || String(share.data().monthIndex)!==String(monthIndex)){
    document.body.innerHTML = '<main class="container"><div class="card"><h1>Not found</h1></div></main>'; return
  }
  const data = share.data();
  document.getElementById('title').textContent = data.title

  const daysSnap = await db.collection('shares').doc(publicId).collection('days').orderBy(firebase.firestore.FieldPath.documentId()).get()
  const days = daysSnap.docs.map(d=> ({ id:d.id, ...d.data() }))
  const done = days.filter(d=>d.isDone).length; const pct = Math.round(done/30*100)
  document.getElementById('progress').textContent = `${done}/30 days`
  document.getElementById('ring').innerHTML = makeRing(pct)

  // grid readonly
  const grid = document.getElementById('grid'); grid.innerHTML=''
  for(let i=1;i<=30;i++){
    const d = days.find(x=>Number(x.id)===i) || { isDone:false }
    const cell = document.createElement('div'); cell.className = 'cell ' + (d.isDone? 'done':''); cell.textContent = String(i)
    grid.appendChild(cell)
  }

  // photos from public mirror
  const base = `phase-photos-public/${publicId}`
  try{
    const start = await storage.ref(`${base}/start.jpg`).getDownloadURL()
    let end=''; try{ end = await storage.ref(`${base}/end.jpg`).getDownloadURL() }catch{}
    makeCompare('#compare', start, end||start)
  }catch{}
})()

function makeRing(pct){
  const r=28,s=6,c=2*Math.PI*r,d=c*(pct/100)
  return `<svg viewBox="0 0 64 64" width="64" height="64">
    <circle cx="32" cy="32" r="${r}" stroke="#eee" stroke-width="${s}" fill="none"/>
    <circle cx="32" cy="32" r="${r}" stroke="var(--accent)" stroke-width="${s}" fill="none" stroke-linecap="round" stroke-dasharray="${d} ${c}" transform="rotate(-90 32 32)"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="12" font-weight="700">${pct}</text>
  </svg>`
}

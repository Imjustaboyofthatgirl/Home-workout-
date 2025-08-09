const qs = new URLSearchParams(location.search)
const monthIndex = qs.get('m') || '1'

;(async function init(){
  const u = await RUHI.requireUser()
  const monthRef = db.collection('phases').doc(u.uid).collection('months').doc(monthIndex)
  const daysRef = db.collection('days').doc(u.uid).collection('months').doc(monthIndex).collection('days')
  const photosRef = db.collection('photos').doc(u.uid).collection('months').doc(monthIndex)
  const shareRef = db.collection('shares')

  // UI refs
  const titleEl = $('#monthTitle'), progEl = $('#progress'), grid = $('#grid'), ring = $('#ring')
  const lockBtn = $('#lockBtn'), shareBtn = $('#shareBtn')
  const startImg = $('#startImg'), endImg = $('#endImg'), startUpload = $('#startUpload'), endUpload = $('#endUpload')
  const startFile = $('#startFile'), endFile = $('#endFile'), compareWrap = $('#compareWrap')

  // Title + progress
  const monthDoc = await monthRef.get(); if(!monthDoc.exists) location.href='index.html'
  const month = monthDoc.data(); titleEl.textContent = month.title

  let days = (await daysRef.orderBy(firebase.firestore.FieldPath.documentId()).get()).docs.map(d=> ({ id:d.id, ...d.data() }))
  function renderProgress(){
    const done = days.filter(d=>d.isDone).length; const pct = Math.round(done/30*100)
    progEl.textContent = `${done}/30 days`
    ring.innerHTML = makeRing(pct)
    if(done===30) RUHI.toast('Day 30! Add your end photo to compare.')
  }

  function makeRing(pct){
    const r=28,s=6,c=2*Math.PI*r,d=c*(pct/100)
    return `<svg viewBox="0 0 64 64" width="64" height="64">
      <circle cx="32" cy="32" r="${r}" stroke="#eee" stroke-width="${s}" fill="none"/>
      <circle cx="32" cy="32" r="${r}" stroke="var(--accent)" stroke-width="${s}" fill="none" stroke-linecap="round" stroke-dasharray="${d} ${c}" transform="rotate(-90 32 32)"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="12" font-weight="700">${pct}</text>
    </svg>`
  }

  function renderGrid(){
    grid.innerHTML=''
    for(let i=1;i<=30;i++){
      const d = days.find(x=>Number(x.id)===i) || { isDone:false }
      const btn = document.createElement('button')
      btn.className = 'cell ' + (d.isDone? 'done':'')
      btn.textContent = String(i)
      btn.onclick = ()=> openDay(i, d)
      if(!RUHI.isUnlocked()) btn.disabled = true
      grid.appendChild(btn)
    }
  }

  function refreshLock(){ lockBtn.textContent = RUHI.isUnlocked()? 'Lock now' : 'Unlock editing'; $$('.days button').forEach(b=> b.disabled = !RUHI.isUnlocked()) }

  lockBtn.onclick = async ()=>{
    if(RUHI.isUnlocked()){ RUHI.lockNow(); refreshLock(); return }
    const key = prompt('Enter Edit Key')
    if(!key) return
    const hash = await RUHI.sha256(key)
    const prof = await db.collection('profiles').doc(u.uid).get()
    if(!prof.exists || prof.data().editKeyHash !== hash){ RUHI.toast('Wrong key'); return }
    RUHI.unlockFor(window.RUHI_CONFIG.EDIT_UNLOCK_MINUTES); refreshLock(); RUHI.toast('Unlocked')
  }

  // Auto relock visual
  setInterval(()=>{ if(!RUHI.isUnlocked()) refreshLock() }, 5000)
  refreshLock()

  // Day modal
  const modal = $('#dayModal'), modalTitle=$('#modalTitle'), modalDone=$('#modalDone'), modalNote=$('#modalNote')
  $('#modalClose').onclick = ()=> modal.classList.add('hidden')
  $('#modalSave').onclick = async ()=>{
    const i = Number(modal.dataset.day)
    const prev = days.find(d=>Number(d.id)===i)
    const payload = { isDone: modalDone.checked, note: modalNote.value }
    if(payload.isDone && !prev.isDone) payload.completedAt = firebase.firestore.FieldValue.serverTimestamp()

    // Optimistic UI
    const before = JSON.parse(JSON.stringify(days))
    const newDays = days.map(d=> Number(d.id)===i ? { ...d, ...payload } : d)
    if(!newDays.find(d=> Number(d.id)===i)) newDays.push({ id:String(i), ...payload })
    days = newDays; renderGrid(); renderProgress()

    try{
      await daysRef.doc(String(i)).set(payload, { merge:true })
      // Milestones
      const doneCount = days.filter(d=>d.isDone).length
      const hits = window.RUHI_CONFIG.MILESTONES
      if(hits.includes(doneCount)){
        const fired = month.milestoneFired || {}
        if(!fired[String(doneCount)]){
          window.RuhiConfetti?.()
          RUHI.toast(doneCount===30? 'DAY 30! End photo time.' : `Milestone ${doneCount}!`)
          await monthRef.set({ milestoneFired: { ...fired, [doneCount]: true } }, { merge:true })
          month.milestoneFired = { ...fired, [doneCount]: true }
        }
      }
    }catch(e){ days = before; renderGrid(); renderProgress(); RUHI.toast(e.message) }
    modal.classList.add('hidden')
  }

  function openDay(i, data){
    if(!RUHI.isUnlocked()) return RUHI.toast('Unlock editing first')
    modal.dataset.day = String(i); modalTitle.textContent = `Day ${i}`
    modalDone.checked = !!data.isDone; modalNote.value = data.note||''
    modal.classList.remove('hidden')
  }

  // Photos
  async function loadPhotos(){
    const p = await photosRef.get(); const d = p.data()||{}
    if(d.startPath){ startImg.src = await storage.ref(d.startPath).getDownloadURL() }
    if(d.endPath){ endImg.src   = await storage.ref(d.endPath).getDownloadURL() }
    if(d.startPath && d.endPath){
      document.querySelector('#compare').innerHTML=''; makeCompare('#compare', await storage.ref(d.startPath).getDownloadURL(), await storage.ref(d.endPath).getDownloadURL()); compareWrap.classList.remove('hidden')
    }
  }

  async function upload(slot){
    if(!RUHI.isUnlocked()) return RUHI.toast('Unlock editing first')
    const input = slot==='start'? startFile : endFile
    input.click()
    input.onchange = async ()=>{
      const file = input.files[0]; if(!file) return
      const path = `phase-photos/${u.uid}/${monthIndex}/${slot}.jpg`
      const ref = storage.ref(path)
      await ref.put(file)
      await photosRef.set({ [f"{slot}Path".replace("{slot}", slot)]: path }, { merge:true })
      RUHI.toast('Photo uploaded'); loadPhotos()
      if(slot==='end') document.querySelector('#compareWrap').classList.remove('hidden')
    }
  }
  startUpload.onclick = ()=> upload('start')
  endUpload.onclick = ()=> upload('end')

  // Share link (public snapshot + public photo mirror)
  shareBtn.onclick = async ()=>{
    // 1) Create/ensure publicId
    const pub = db.collection('shares').doc()
    const publicId = pub.id
    // 2) Snapshot month + days into shares/{publicId}/...
    const m = (await monthRef.get()).data()
    const sBatch = db.batch()
    sBatch.set(pub, { uid: u.uid, monthIndex: Number(monthIndex), title: m.title, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
    const ds = await daysRef.orderBy(firebase.firestore.FieldPath.documentId()).get()
    for(const d of ds.docs) sBatch.set(pub.collection('days').doc(d.id), d.data())
    // 3) Mirror photos to a public path if present
    const pdoc = await photosRef.get(); const pdata = pdoc.data()||{}
    if(pdata.startPath){
      const src = await storage.ref(pdata.startPath).getDownloadURL()
      const blob = await (await fetch(src)).blob()
      await storage.ref(`phase-photos-public/${publicId}/start.jpg`).put(blob)
    }
    if(pdata.endPath){
      const src = await storage.ref(pdata.endPath).getDownloadURL()
      const blob = await (await fetch(src)).blob()
      await storage.ref(`phase-photos-public/${publicId}/end.jpg`).put(blob)
    }
    await sBatch.commit()
    const url = `${location.origin}${location.pathname.replace('month.html','share.html')}?m=${monthIndex}&id=${publicId}`
    try{ await navigator.clipboard.writeText(url) }catch: ...
    RUHI.toast('Share link copied')
  }

  // Initial render
  renderProgress(); renderGrid(); await loadPhotos()

  // Last workout label
  const lastDone = days.filter(d=>d.isDone).sort((a,b)=> (b.completedAt?.seconds||0)-(a.completedAt?.seconds||0))[0]
  if(lastDone?.completedAt?.toDate) document.getElementById('lastWorkout').textContent = `Last: ${lastDone.completedAt.toDate().toDateString()}`
})()

function makeRing(pct){
  const r=28,s=6,c=2*Math.PI*r,d=c*(pct/100)
  return `<svg viewBox="0 0 64 64" width="64" height="64">
    <circle cx="32" cy="32" r="${r}" stroke="#eee" stroke-width="${s}" fill="none"/>
    <circle cx="32" cy="32" r="${r}" stroke="var(--accent)" stroke-width="${s}" fill="none" stroke-linecap="round" stroke-dasharray="${d} ${c}" transform="rotate(-90 32 32)"/>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="12" font-weight="700">${pct}</text>
  </svg>`
}

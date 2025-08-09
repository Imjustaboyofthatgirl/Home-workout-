async function renderDashboard(){
  const u = await RUHI.requireUser()
  const grid = document.getElementById('grid')
  const statsEl = document.getElementById('stats')
  grid.innerHTML = ''

  // Stats
  const daysSnap = await db.collection('days').doc(u.uid).collection('months').get()
  let total = 0; let last = null
  for(const m of daysSnap.docs){
    const ds = await m.ref.collection('days').where('isDone','==',true).orderBy('completedAt','desc').get()
    total += ds.size
    if(ds.size){ const t = ds.docs[0].data().completedAt?.toDate?.(); if(t && (!last || t>last)) last=t }
  }
  statsEl.textContent = `Total active days: ${total} • Last workout: ${last? last.toDateString(): '—'}`

  // Months cards
  const months = await db.collection('phases').doc(u.uid).collection('months').orderBy(firebase.firestore.FieldPath.documentId()).get()
  for(const doc of months.docs){
    const idx = doc.id; const data = doc.data()
    const doneCount = (await db.collection('days').doc(u.uid).collection('months').doc(idx).collection('days').where('isDone','==',true).get()).size
    const pct = Math.round(doneCount/30*100)

    const card = document.createElement('a'); card.className='card'; card.href=`month.html?m=${idx}`
    card.innerHTML = `
      <div class="row between">
        <div class="row gap"><span class="badge">${idx}</span><div class="title">${data.title}</div></div>
        <div class="muted">${doneCount}/30</div>
      </div>
      <div class="bar"><div style="width:${pct}%"></div></div>
    `
    grid.appendChild(card)
  }
}
window.renderDashboard = renderDashboard

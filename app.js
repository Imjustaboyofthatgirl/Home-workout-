const $ = s => document.querySelector(s)
const $$ = s => Array.from(document.querySelectorAll(s))

function toast(msg){
  const t = $('#toast'); if(!t) return; t.textContent = msg; t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 1600)
}

function authButtons(){
  const nav = $('#authNav'); if(!nav) return
  auth.onAuthStateChanged(u=>{
    if(u){ nav.innerHTML = `<button class="btn sm ghost" id="logout">Logout</button>`; $('#logout').onclick=()=>auth.signOut() }
    else { nav.innerHTML = '' }
  })
}
authButtons()

async function requireUser(){
  const u = auth.currentUser || (await new Promise(r=> auth.onAuthStateChanged(r)))
  if(!u) throw new Error('not signed in')
  return u
}

// SHA-256 helper for Edit Key hashing
async function sha256(text){
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')
}

// Local lock timer
function getUnlock(){ return Number(localStorage.getItem('unlockUntil')||0) }
function isUnlocked(){ return Date.now() < getUnlock() }
function unlockFor(mins){ localStorage.setItem('unlockUntil', String(Date.now()+mins*60*1000)) }
function lockNow(){ localStorage.removeItem('unlockUntil') }

window.RUHI = { $, $$, toast, requireUser, sha256, isUnlocked, unlockFor, lockNow }

// Auth gate on index
if(location.pathname.endsWith('index.html') || location.pathname === '/' ){
  const authGate = $('#authGate'); const setupGate = $('#setupGate'); const dash = $('#dashboard')
  const form = $('#authForm'); const loginBtn = $('#loginBtn'); const signupBtn = $('#signupBtn')

  auth.onAuthStateChanged(async (u)=>{
    if(!u){ authGate.classList.remove('hidden'); setupGate.classList.add('hidden'); dash.classList.add('hidden'); return }

    // Has plan?
    const plan = await db.collection('phases').doc(u.uid).collection('months').limit(1).get()
    if(plan.empty){
      authGate.classList.add('hidden'); setupGate.classList.remove('hidden'); dash.classList.add('hidden');
      // Render 12 inputs
      const titles = $('#titles'); titles.innerHTML = ''
      for(let i=1;i<=12;i++){
        const row = document.createElement('div'); row.className='row gap';
        row.innerHTML = `<span class="muted" style="width:40px">${i}</span><input id="t${i}" placeholder="Month ${i}">`
        titles.appendChild(row)
      }
      $('#saveTitles').onclick = async ()=>{
        const batch = db.batch(); const monthsRef = db.collection('phases').doc(u.uid).collection('months')
        for(let i=1;i<=12;i++){
          const title = document.querySelector(`#t${i}`).value || `Month ${i}`
          batch.set(monthsRef.doc(String(i)), { title, createdAt: firebase.firestore.FieldValue.serverTimestamp(), milestoneFired: {} }, { merge: true })
          // seed 30 days
          const daysRef = db.collection('days').doc(u.uid).collection('months').doc(String(i)).collection('days')
          for(let d=1; d<=30; d++) batch.set(daysRef.doc(String(d)), { isDone:false, note:'', completedAt:null }, { merge: true })
          // photos doc
          const photosRef = db.collection('photos').doc(u.uid).collection('months').doc(String(i))
          batch.set(photosRef, { startPath:null, endPath:null }, { merge: true })
        }
        await batch.commit()
        RUHI.toast('Year plan created'); location.reload()
      }
    } else {
      authGate.classList.add('hidden'); setupGate.classList.add('hidden'); dash.classList.remove('hidden');
      window.renderDashboard?.()
    }
  })

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault(); const email=$('#email').value.trim(); const password=$('#password').value
    try{ await auth.signInWithEmailAndPassword(email,password); RUHI.toast('Signed in') }catch(e){ RUHI.toast(e.message) }
  })
  signupBtn?.addEventListener('click', async ()=>{
    const email=$('#email').value.trim(); const password=$('#password').value
    try{ await auth.createUserWithEmailAndPassword(email,password); RUHI.toast('Account created') }catch(e){ RUHI.toast(e.message) }
  })
}

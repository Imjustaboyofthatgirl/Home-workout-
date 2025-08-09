;(async function(){
  const u = await RUHI.requireUser().catch(()=> location.href='index.html')
  const input = document.getElementById('key'); const btn = document.getElementById('save')
  btn.onclick = async ()=>{
    if(!input.value) return
    const hash = await RUHI.sha256(input.value)
    await db.collection('profiles').doc(u.uid).set({ editKeyHash: hash }, { merge:true })
    alert('Edit Key saved')
  }
})()

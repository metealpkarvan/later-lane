async page => {
 const check=(ok,label)=>{if(!ok)throw Error(label);};const errors=[];page.on('pageerror',e=>errors.push(e.message));page.removeAllListeners('dialog');await page.addInitScript(()=>{window.confirm=()=>true;window.prompt=()=> 'A useful takeaway.';});await page.evaluate(()=>{window.confirm=()=>true;window.prompt=()=> 'A useful takeaway.';});
 await page.setViewportSize({width:1440,height:1050});await page.locator('#demo').click();
 check(await page.locator('#tray .record').count()===3,'three-card sample tray');
 check(await page.locator('#items .record').count()===4,'four sample records');
 await page.locator('#budget').fill('8');await page.locator('#budget').dispatchEvent('change');
 check(await page.locator('#metrics').innerText().then(s=>s.includes('8 / 8')),'budget fits');
 await page.locator('#budget').fill('15');await page.locator('#budget').dispatchEvent('change');
 await page.locator('#tray [data-action=read]').first().click();
 await page.locator('[data-view=read]').click();check(await page.locator('#items .record').count()===1,'read state');check(await page.locator('#items').innerText().then(s=>s.includes('A useful takeaway.')),'takeaway preserved');
 await page.locator('#items [data-action=restore]').click();await page.locator('[data-view=inbox]').click();
 await page.locator('#title').fill('<img src=x onerror=alert(1)> IŞIK');await page.locator('#url').fill('https://example.com/safe');await page.locator('#reason').fill('Search IŞIK without dot mistakes');await page.locator('#save-item').click();
 await page.locator('#search').fill('isik');check(await page.locator('#items .record').count()===1,'Turkish search');check(await page.locator('#items img').count()===0,'HTML is escaped');
 await page.locator('#items [data-action=edit]').click();await page.locator('#title').fill('IŞIK updated');await page.locator('#save-item').click();check(await page.locator('#items').innerText().then(s=>s.includes('updated')),'edit saves');
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#backup').click()]);const backup='output/playwright/later-backup.json';await download.saveAs(backup);
 await page.locator('#import').setInputFiles(backup);check(await page.locator('#items .record').count()===1,'backup round trip');
 await page.locator('#language').click();check(await page.locator('html').getAttribute('lang')==='en','English UI');check(await page.locator('#priority option').first().textContent()==='Needed now','option translation');await page.locator('#language').click();
 await page.locator('#search').fill('');await page.locator('#demo').click();await page.screenshot({path:'output/playwright/later-lane-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'output/playwright/later-lane-mobile.png',fullPage:true});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile width');
 await page.setViewportSize({width:1440,height:1050});await page.reload();check(await page.locator('#items .record').count()===4,'persisted reload');
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.context().setOffline(true);try{await page.reload();check(await page.locator('#tray .record').count()===3,'offline reload');}finally{await page.context().setOffline(false);}
 await page.reload();
 await page.evaluate(()=>localStorage.setItem('community:later-lane','corrupt-original'));await page.reload();check(await page.locator('#storage-warning').isVisible(),'corrupt data warning');await page.locator('#demo').click();check(await page.evaluate(()=>localStorage.getItem('community:later-lane'))==='corrupt-original','corrupt original not overwritten');
 await page.locator('#reset').click();await page.locator('#demo').click();check(await page.locator('#tray .record').count()===3,'recovery reset');
 check(errors.length===0,'page errors '+errors.join('|'));return {app:'later-lane',checks:17,pageErrors:errors};
}

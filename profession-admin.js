import {business} from './business-api.js?v=328f8413b68fb088';

import {compressImage} from './image-upload.mjs?v=328f8413b68fb088';

const root=document.querySelector('#app');
root.innerHTML='<main class="review-shell" dir="rtl"><header><details class="admin-menu"><summary aria-label="قائمة أقسام الإدارة"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></summary><nav aria-label="أقسام الإدارة"><button data-pane="requests" aria-pressed="true">المهن</button><button data-pane="app-settings" aria-pressed="false">إعدادات التطبيق</button><button data-pane="support-tickets" aria-pressed="false">الدعم</button><button data-pane="banners" aria-pressed="false">البنرات</button></nav></details><span class="review-mark" aria-hidden="true">م</span><div><strong>محتاج لك</strong><p>لوحة الإدارة</p></div></header><section id="requests"><h1>طلبات أصحاب المهن</h1><p role="status" aria-live="polite"></p><div class="review-list"></div><button class="more" hidden>عرض المزيد</button></section></main>';
const list=root.querySelector('.review-list');
const status=root.querySelector('[role=status]');
const more=root.querySelector('.more');
let cursor=null;
let requestVersion=0;
async function load(reset=false) {
  const version=++requestVersion;
  if(reset){cursor=null;list.replaceChildren();}
  more.disabled=true;
  status.textContent='جارٍ تحميل الطلبات…';
  try {
    const result=await business('professionRequests',{paginationOpts:{cursor,numItems:25}});
    if(version!==requestVersion)return;
    for(const r of result.page) {
      const card=document.createElement('article');
      const name=document.createElement('h2');
      name.textContent=r.name;
      const details=document.createElement('p');
      details.textContent=['المحافظة: '+r.province,'المهنة: '+r.trade,r.description].filter(Boolean).join(' · ');
      const contact=document.createElement('a');
      const phone=document.createElement('bdi');phone.textContent=r.phone;
      const phoneRow=document.createElement('div');phoneRow.className='review-phone';
      contact.className='review-whatsapp';contact.setAttribute('aria-label','مراسلة '+r.name+' عبر واتساب');contact.title='مراسلة عبر واتساب';
      contact.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M21 11.6a9 9 0 0 1-13.6 7.8L3 20.6l1.2-4.2A9 9 0 1 1 21 11.6Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="currentColor" d="M8.2 6.8c-.8 0-1.4.8-1.4 1.8 0 2.4 3.7 6.6 6.9 7.2 1.4.3 2.7-.6 2.9-1.6l.1-.7-2.6-1.3-1 1c-1.3-.4-3-2-3.5-3.1l.9-1-1.2-2.3Z"/></svg>';
      phoneRow.append('رقم الواتساب ',phone,contact);
      contact.href='https://wa.me/964'+r.phone.slice(1);
      contact.target='_blank';
      contact.rel='noopener noreferrer';
      const approve=document.createElement('button');
      approve.textContent='موافقة';
      approve.onclick=async()=>{
        if(!confirm('توافق على طلب '+r.name+' وتنشر ملفّه في دليل المهن؟'))return;
        approve.disabled=true;
        try {
          await business('approveProfession',{id:r.id});
          card.remove();
          status.textContent='تمت الموافقة على طلب '+r.name;
        } catch(error){status.textContent=error.message;approve.disabled=false;}
      };
      const reject=document.createElement('button');reject.textContent='رفض';
      const form=document.createElement('form');form.hidden=true;
      const label=document.createElement('label');label.textContent='سبب الرفض';
      const reason=document.createElement('textarea');reason.maxLength=500;reason.required=true;
      reason.placeholder='مثلاً: الرقم ليس به واتساب';label.append(reason);
      const send=document.createElement('button');send.textContent='إرسال سبب الرفض';
      const cancel=document.createElement('button');cancel.type='button';cancel.textContent='إلغاء';
      cancel.onclick=()=>{form.hidden=true;approve.disabled=false;reject.hidden=false;};
      reject.onclick=()=>{form.hidden=false;approve.disabled=true;reject.hidden=true;reason.focus();};
      form.onsubmit=async event=>{
        event.preventDefault();if(send.disabled || !reason.value.trim())return;
        send.disabled=cancel.disabled=true;
        try{await business('rejectProfession',{id:r.id,reason:reason.value.trim()});card.remove();status.textContent='رُفض الطلب وأُرسل السبب إلى '+r.name;}
        catch(error){status.textContent=error.message;}
        finally{send.disabled=cancel.disabled=false;}
      };
      form.append(label,send,cancel);
      card.append(name,details,phoneRow,approve,reject,form);
      list.append(card);
    }
    cursor=result.continueCursor;
    more.hidden=result.isDone;
    more.textContent='عرض المزيد';
    status.textContent=list.childElementCount?'':'ماكو طلبات تحت المراجعة حالياً.';
  }catch(error){status.textContent=error.message;more.hidden=false;more.textContent='إعادة المحاولة';}
  finally{more.disabled=false;}
}
more.onclick=()=>load();
load();

const bannerPane=document.createElement('section');
bannerPane.id='banners';
bannerPane.hidden=true;
bannerPane.innerHTML='<h1>بنرات المهن</h1><p>قياس العرض ٢٫٣٥:١</p><button class="add-banner">رفع بنر</button><p role="status" aria-live="polite"></p><div class="banner-list"></div>';
root.querySelector('main').append(bannerPane);
const dialog=document.createElement('dialog');
dialog.className='banner-editor';
dialog.dir='rtl';
dialog.setAttribute('aria-labelledby','banner-editor-title');
dialog.innerHTML=`<form><h2 id="banner-editor-title">رفع بنر</h2>
  <fieldset><legend>نوع البنر</legend><label><input type="radio" name="kind" value="regular" checked> رفع عادي</label><label><input type="radio" name="kind" value="ad"> إعلان لصاحب مهنة</label></fieldset>
  <div class="ad-fields" hidden><label>رقم واتساب صاحب المهنة<input name="phone" type="tel" dir="ltr"></label><p class="lookup" role="status"></p>
  <label>عدد أيام الإعلان<input name="days" type="number" min="1" step="1" inputmode="numeric"></label></div>
  <label class="image-label"><span>صورة البنر</span><input type="file" accept="image/png,image/jpeg,image/webp"></label>
  <p class="form-status" role="status"></p><div><button type="submit">حفظ</button> <button type="button" class="cancel">إلغاء</button></div></form>`;
bannerPane.append(dialog);
const form=dialog.querySelector('form'),picker=form.querySelector('[type=file]');
const save=form.querySelector('[type=submit]'),lookup=form.querySelector('.lookup'),feedback=form.querySelector('.form-status');
let match,lookupTimer,lookupVersion=0,uploaded;
const isAd=()=>form.elements.kind.value==='ad';
function updateForm(){
  form.querySelector('.ad-fields').hidden=!isAd();
  const useAvatar=isAd() && !!match?.avatar;
  picker.required=!useAvatar;
  form.elements.phone.required=form.elements.days.required=isAd();
  form.querySelector('.image-label span').textContent=useAvatar?'صورة الإعلان (اختياري، تُستخدم صورة الملف تلقائياً)':'صورة البنر';
  save.disabled=busy || (isAd() && !match) || (!picker.files.length && !useAvatar);
}
function resetLookup(){
  lookupVersion++;
  clearTimeout(lookupTimer);match=null;uploaded=null;
  lookup.textContent='';feedback.textContent='';updateForm();
}
function findProfession(){
  resetLookup();
  const raw=form.elements.phone.value.trim(),version=lookupVersion;
  const digits=raw.replace(/[٠-٩۰-۹]/g,d=>String(d.codePointAt(0)%16)).replace(/[ ()-]/g,'');
  const phone=digits.replace(/^(?:\+964|00964|964)/,'0');
  if(!/^07\d{9}$/.test(phone)){if(raw)lookup.textContent='أكمل رقم الواتساب العراقي';return;}
  lookup.textContent='جارٍ البحث…';
  lookupTimer=setTimeout(async()=>{
    try{
      const result=await business('bannerLookup',{phone});
      if(lookupVersion!==version)return;
      match=result?{...result,phone}:null;
      lookup.textContent=result?result.name:'ماكو صاحب مهنة معتمد بهذا الرقم';
    }catch(error){if(lookupVersion===version)lookup.textContent=error.message;}
    if(lookupVersion===version)updateForm();
  },250);
}
for(const radio of form.querySelectorAll('[name=kind]'))radio.onchange=()=>{resetLookup();if(isAd())findProfession();};
form.elements.phone.oninput=findProfession;
picker.onchange=()=>{uploaded=null;updateForm();};
form.querySelector('.cancel').onclick=()=>dialog.close();
dialog.oncancel=e=>{if(busy)e.preventDefault();};
const addBanner=bannerPane.querySelector('.add-banner');
const message=bannerPane.querySelector('[role=status]');
const bannerList=bannerPane.querySelector('.banner-list');
let config,busy=false;

function drawBanners() {
  bannerList.replaceChildren();
  addBanner.disabled=busy || !config || config.items.length>=30;
  if(!config)return;
  for(const [index,item] of config.items.entries()){
    const card=document.createElement('article');
    const img=document.createElement('img');
    img.src=item.url;
    img.alt='بنر '+(index+1);
    const controls=document.createElement('div');
    function action(label,fn,disabled=false){
      const control=document.createElement('button');
      control.textContent=label;
      control.disabled=busy || disabled;
      control.onclick=fn;
      controls.append(control);
    }
    function move(to){
      const items=config.items.slice();
      items.splice(to,0,items.splice(index,1)[0]);
      saveBanners(items);
    }
    action('تقديم',()=>move(index-1),index===0);
    action('تأخير',()=>move(index+1),index===config.items.length-1);
    action(item.visible?'إخفاء':'إظهار',()=>saveBanners(config.items.map((v,i)=>i===index?{...v,visible:!v.visible}:v)));
    action('حذف',()=>{if(confirm('تحذف هذا البنر من قائمة المهن؟'))saveBanners(config.items.filter((_,i)=>i!==index));});
    const title=document.createElement('strong');
    title.textContent=(item.ad?'إعلان '+item.ad.name+' · '+item.ad.days+' يوم':'بنر '+(index+1))+' · '+(item.ad?.endsAt<=Date.now()?'منتهي':item.visible?'ظاهر':'مخفي');
    card.append(img,title,controls);
    bannerList.append(card);
  }
}
async function changeBanners(task,success){
  if(busy)return;
  busy=true;
  message.textContent='جارٍ التحميل…';
  drawBanners();
  try{
    config=await task();
    message.textContent=success || (config.items.length?'':'ماكو بنرات حالياً.');
  }catch(error){message.textContent=error.message;}
  finally{busy=false;drawBanners();}
}
const saveBanners=items=>changeBanners(()=>business('bannerSave',{revision:config.revision,items:items.map(({url,visible})=>({url,visible}))}),'انحفظ التغيير');
addBanner.onclick=()=>{form.reset();resetLookup();dialog.showModal();};
form.onsubmit=async event=>{
  event.preventDefault();
  if(busy||save.disabled)return;
  const ad=isAd(),owner=match,days=form.elements.days.valueAsNumber,file=picker.files[0];
  busy=true;
  for(const control of form.elements)control.disabled=true;
  feedback.textContent='جارٍ حفظ البنر…';
  try{
    if(!uploaded){
      let source=file;
      if(!source){
        const response=await fetch(owner.avatar,{credentials:'omit'});
        if(!response.ok)throw Error('تعذّر تحميل صورة الملف. اختَر صورة للإعلان');
        source=await response.blob();
      }
      const blob=await compressImage(source,{maxEdge:1600,maxBytes:500*1024});
      const r=await fetch('/api/images',{method:'POST',headers:{'Content-Type':'image/webp'},body:blob});
      const data=await r.json();
      if(!r.ok || !data.url)throw Error(data.error || 'تعذّر رفع البنر');
      uploaded=data.url;
    }
    config=ad
      ? await business('bannerAd',{revision:config.revision,url:uploaded,listingId:owner.id,phone:owner.phone,days})
      : await business('bannerSave',{revision:config.revision,items:[...config.items.map(({url,visible})=>({url,visible})),{url:uploaded,visible:true}]});
    message.textContent=ad?'تم نشر إعلان صاحب المهنة':'تم رفع البنر وإظهاره';
    dialog.close();
  }catch(error){feedback.textContent=error.message;}
  finally{busy=false;for(const control of form.elements)control.disabled=false;drawBanners();updateForm();}
};
const menu=root.querySelector('.admin-menu');
const trigger=menu.querySelector('summary');
document.addEventListener('pointerdown',event=>{
  if(menu.open && !menu.contains(event.target))menu.open=false;
});
menu.addEventListener('focusout',event=>{
  if(event.relatedTarget && !menu.contains(event.relatedTarget))menu.open=false;
});
document.addEventListener('keydown',event=>{
  if(menu.open && event.key==='Escape'){
    menu.open=false;
    trigger.focus();
  }
});
const settings=document.createElement('section');
settings.id='app-settings';settings.hidden=true;
settings.innerHTML='<h1>إعدادات التطبيق</h1><form><label>رقم الدعم عبر واتساب <input type="tel" dir="ltr" required></label><button>حفظ الرقم</button><p role="status"></p></form>';
root.querySelector('main').append(settings);
const phoneInput=settings.querySelector('input'),settingsStatus=settings.querySelector('p'),savePhone=settings.querySelector('button');
async function loadSettings(){
  phoneInput.disabled=savePhone.disabled=true;
  try{phoneInput.value=(await business('supportSettings')).phone;settingsStatus.textContent='';}
  catch(error){settingsStatus.textContent=error.message;}
  finally{phoneInput.disabled=savePhone.disabled=false;}
}
settings.querySelector('form').onsubmit=async event=>{
  event.preventDefault();savePhone.disabled=true;
  try{phoneInput.value=(await business('supportSetPhone',{phone:phoneInput.value})).phone;settingsStatus.textContent='تم حفظ رقم الدعم';}
  catch(error){settingsStatus.textContent=error.message;}
  finally{savePhone.disabled=false;}
};
const tickets=document.createElement('section');
tickets.id='support-tickets';tickets.hidden=true;
tickets.innerHTML='<h1>تذاكر الدعم</h1><p role="status"></p><div class="review-list"></div><button class="more" hidden>عرض المزيد</button>';
root.querySelector('main').append(tickets);
const ticketList=tickets.querySelector('.review-list'),ticketStatus=tickets.querySelector('[role=status]'),ticketMore=tickets.querySelector('.more');
let ticketCursor=null,ticketVersion=0;
async function loadTickets(reset){
  const version=++ticketVersion;
  if(reset){ticketCursor=null;ticketList.replaceChildren();}
  ticketMore.disabled=true;ticketStatus.textContent='جارٍ تحميل التذاكر…';
  try{
    const data=await business('supportList',{paginationOpts:{cursor:ticketCursor,numItems:25}});
    if(version!==ticketVersion)return;
    for(const ticket of data.page){
      const card=document.createElement('article'),open=document.createElement('button'),details=document.createElement('div');
      function expireCard(closedAt){
        setTimeout(()=>card.remove(),Math.max(0,closedAt+10*86400000-Date.now()));
      }
      if(ticket.closedAt)expireCard(ticket.closedAt);
      open.textContent=ticket.name+(ticket.closedAt?' · مغلقة':ticket.unanswered?' · بانتظار رد الدعم':'');
      open.onclick=async()=>{
        open.disabled=true;
        try{
          const thread=await business('supportThread',{ticketId:ticket.id});
          const messages=document.createElement('div');
          for(const message of thread.messages){
            const line=document.createElement('p');line.textContent=(message.staff?'الدعم الفني':'صاحب التذكرة')+' — '+message.body;messages.append(line);
          }
          const form=document.createElement('form'),answer=document.createElement('textarea'),send=document.createElement('button');
          answer.required=true;answer.maxLength=1500;answer.placeholder='اكتب رد الدعم';answer.setAttribute('aria-label','رد الدعم');
          send.textContent='إرسال الرد';form.append(answer,send);
          let requestId,previous;
          form.onsubmit=async event=>{
            event.preventDefault();const body=answer.value.trim();if(!body||send.disabled)return;
            if(previous!==body){requestId=crypto.randomUUID();previous=body;}
            send.disabled=answer.disabled=true;
            try{
              await business('supportReply',{ticketId:ticket.id,body,requestId});
              open.textContent=ticket.name;await open.onclick();
            }catch(error){ticketStatus.textContent=error.message;}
            finally{send.disabled=answer.disabled=false;}
          };
          const title=document.createElement('h2');title.textContent=ticket.name;
          const top=document.createElement('div');top.className='ticket-heading';
          const menu=document.createElement('details');menu.className='ticket-actions';
          const dots=document.createElement('summary');dots.textContent='••';dots.setAttribute('aria-label','إجراءات الحساب');
          const freeze=document.createElement('button');freeze.textContent=thread.frozen?'الحساب مجمّد':'تجميد الحساب';freeze.disabled=thread.frozen;
          const erase=document.createElement('button');erase.textContent='حذف الحساب';erase.className='danger';
          freeze.onclick=async()=>{
            freeze.disabled=true;
            try{await business('supportFreeze',{ticketId:ticket.id});ticketStatus.textContent='تم تجميد الحساب';await open.onclick();}
            catch(error){ticketStatus.textContent=error.message;freeze.disabled=false;}
          };
          erase.onclick=async()=>{
            if(!confirm('حذف حساب '+ticket.name+' وبياناته نهائياً؟ يمكن التسجيل مجدداً بنفس الرقم.'))return;
            erase.disabled=true;
            try{await business('supportDelete',{ticketId:ticket.id});await loadTickets(true);ticketStatus.textContent='حُذف الحساب وبدأ تنظيف بياناته';}
            catch(error){ticketStatus.textContent=error.message;erase.disabled=false;}
          };
          const close=document.createElement('button');close.textContent='إغلاق التذكرة';close.disabled=!!thread.closedAt;
          close.onclick=async()=>{
            close.disabled=true;
            try{await business('supportClose',{ticketId:ticket.id});open.textContent=ticket.name+' · مغلقة';await open.onclick();}
            catch(error){ticketStatus.textContent=error.message;close.disabled=false;}
          };
          menu.append(dots,freeze,erase,close);top.append(title,menu);
          if(thread.closedAt){
            const note=document.createElement('p');note.textContent='تم إغلاق التذكرة · تُحذف بعد ١٠ أيام من الإغلاق';
            details.replaceChildren(top,messages,note);
            if(!ticket.closedAt){ticket.closedAt=thread.closedAt;expireCard(ticket.closedAt);}
          }else if(thread.accepted)details.replaceChildren(top,messages,form);
          else{
            const accept=document.createElement('button');accept.textContent='قبول التذكرة';
            accept.onclick=async()=>{
              accept.disabled=true;
              try{await business('supportAccept',{ticketId:ticket.id});await open.onclick();}
              catch(error){ticketStatus.textContent=error.message;accept.disabled=false;}
            };
            details.replaceChildren(top,messages,accept);
          }
        }catch(error){ticketStatus.textContent=error.message;}
        finally{open.disabled=false;}
      };
      card.append(open,details);ticketList.append(card);
    }
    ticketCursor=data.continueCursor;ticketMore.hidden=data.isDone;
    ticketStatus.textContent=ticketList.childElementCount?'':'ماكو تذاكر دعم حالياً.';
  }catch(error){ticketStatus.textContent=error.message;}
  finally{if(version===ticketVersion)ticketMore.disabled=false;}
}
ticketMore.onclick=()=>loadTickets(false);

for(const tab of root.querySelectorAll('[data-pane]')){
  tab.onclick=()=>{
    for(const item of root.querySelectorAll('[data-pane]')){
      const selected=item===tab;
      item.setAttribute('aria-pressed',selected);
      root.querySelector('#'+item.dataset.pane).hidden=!selected;
    }
    menu.open=false;
    trigger.focus();
    if(tab.dataset.pane==='requests')load(true);
    if(tab.dataset.pane==='app-settings')loadSettings();
    if(tab.dataset.pane==='support-tickets')loadTickets(true);
    if(tab.dataset.pane==='banners')changeBanners(()=>business('bannerList'),'');
  };
}

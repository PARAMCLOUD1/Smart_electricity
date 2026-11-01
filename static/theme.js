'use strict';
(() => {
  const palettes={volt:{dark:'Volt Midnight',light:'Volt Daylight'},ocean:{dark:'Ocean Depths',light:'Ocean Mist'},orbit:{dark:'Orbit Night',light:'Orbit Pearl'},ember:{dark:'Ember Noir',light:'Ember Sand'}};
  let mode='dark',palette='volt';
  try {mode=localStorage.getItem('electricity-theme')==='light'?'light':'dark';const stored=localStorage.getItem('electricity-palette');if(Object.hasOwn(palettes,stored))palette=stored;}catch{}
  document.documentElement.dataset.theme=mode;document.documentElement.dataset.palette=palette;
  document.addEventListener('DOMContentLoaded',()=>{
    const control=document.createElement('label');control.className='theme-selector';control.htmlFor='palette-select';
    const caption=document.createElement('span');caption.textContent='Theme';control.append(caption);
    const select=document.createElement('select');select.id='palette-select';select.setAttribute('aria-label','Choose a color theme');
    for(const appearance of ['dark','light']){
      const group=document.createElement('optgroup');group.label=appearance==='dark'?'Dark themes (4)':'Light themes (4)';
      for(const [value,names] of Object.entries(palettes)){const option=document.createElement('option');option.value=`${appearance}:${value}`;option.textContent=names[appearance];group.append(option);}select.append(group);
    }
    control.append(select);document.querySelector('header').append(control);
    const button=document.createElement('button');button.id='theme-toggle';button.type='button';document.querySelector('header').append(button);
    function label(){const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'Light mode':'Dark mode';button.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');button.setAttribute('aria-pressed',String(dark));select.value=`${document.documentElement.dataset.theme}:${document.documentElement.dataset.palette}`;}
    function apply(appearance,value){document.documentElement.dataset.theme=appearance;document.documentElement.dataset.palette=value;try{localStorage.setItem('electricity-theme',appearance);localStorage.setItem('electricity-palette',value);}catch{}label();window.dispatchEvent(new Event('themechange'));}
    select.addEventListener('change',()=>{const [appearance,value]=select.value.split(':');apply(appearance,value);});
    button.addEventListener('click',()=>apply(document.documentElement.dataset.theme==='dark'?'light':'dark',document.documentElement.dataset.palette));
    label();
  });
})();

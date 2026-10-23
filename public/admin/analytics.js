const el=document.getElementById('ny-analytics');
if(el){const a=JSON.parse(el.textContent);if(a.enabled&&a.hosts?.includes(location.hostname)&&!location.pathname.startsWith('/admin')){
 const load=src=>{const s=document.createElement('script');s.src=src;s.async=true;document.head.append(s);};window.dataLayer=window.dataLayer||[];
 if(/^GTM-[A-Z0-9]+$/.test(a.gtm||'')){window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});load('https://www.googletagmanager.com/gtm.js?id='+a.gtm);}
 else if(/^G-[A-Z0-9]+$/.test(a.ga4||'')){window.gtag=function(){window.dataLayer.push(arguments);};gtag('js',new Date());gtag('config',a.ga4);load('https://www.googletagmanager.com/gtag/js?id='+a.ga4);}
}}

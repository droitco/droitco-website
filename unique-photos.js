(function(){
function set(alt, path, w, h){
fetch(path).then(function(r){return r.text()}).then(function(b){
document.querySelectorAll('img').forEach(function(img){
if(img.alt===alt){
img.src='data:image/jpeg;base64,'+b.trim();
img.width=w;
img.height=h;
}
});
});
}
function setJoin(alt, p1, p2, w, h){
Promise.all([fetch(p1).then(function(r){return r.text()}), fetch(p2).then(function(r){return r.text()})]).then(function(parts){
var b=(parts[0]+parts[1]).replace(/\s+/g,'');
document.querySelectorAll('img').forEach(function(img){
if(img.alt===alt){
img.src='data:image/jpeg;base64,'+b;
img.width=w;
img.height=h;
}
});
});
}
set('Edgewood Storage, Mosinee — drive-up units','_tmp/edgewood.b64.txt',400,161);
set('Southview Mini Warehouses, Eau Claire — facility exterior','_tmp/southview.b64.txt',400,225);
set('Smart Self Storage, Dayton — drive aisle','_tmp/dayton.b64.txt',400,225);
setJoin('Riverfront Mini Storage, Mankato — facility exterior','_tmp/mankato.a.txt','_tmp/mankato.b.txt',240,150);
document.querySelectorAll('p.lede').forEach(function(p){
if(p.textContent.indexOf('We also develop new facilities')!==-1){
p.innerHTML='More new facilities coming soon. <a href="builds.html">See Builds for more information</a>.';
}
});
})();

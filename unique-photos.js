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
set('Edgewood Storage, Mosinee — drive-up units','_tmp/edgewood.b64.txt',400,161);
set('Southview Mini Warehouses, Eau Claire — facility exterior','_tmp/southview.b64.txt',400,225);
set('Smart Self Storage, Dayton — drive aisle','_tmp/dayton.b64.txt',400,225);
})();

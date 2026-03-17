var map = L.map('map').setView([-9.65,124.3],9);

var osm = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{attribution:'OpenStreetMap'}
).addTo(map);

var rtrwData;

fetch('data/rtrw.geojson')
.then(res=>res.json())
.then(data=>{

rtrwData=data;

L.geoJSON(data,{
style:{
color:"green",
weight:2,
fillOpacity:0.3
}
}).addTo(map);

});

map.on("click",function(e){

if(!rtrwData){
alert("Data RTRW belum dimuat");
return;
}

var titik = turf.point([e.latlng.lng,e.latlng.lat]);

var zonasi="Tidak diketahui";

rtrwData.features.forEach(function(feature){

if(turf.booleanPointInPolygon(titik,feature)){

zonasi = feature.properties.zona;

}

});

var hasil="";

if(zonasi=="Tidak diketahui"){
hasil="Lokasi tidak berada dalam zonasi RTRW";
}else{
hasil="Zonasi : "+zonasi+"<br>Status : Sesuai RTRW";
}

L.popup()
.setLatLng(e.latlng)
.setContent(hasil)
.openOn(map);

});
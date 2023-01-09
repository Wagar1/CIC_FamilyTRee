var chart = null;
var resultData = null;
var compact = 0;
var index = 0;
var isCollapsedAll = null;
const init = async () => {
    let companyData = await getCompanies();
    companyData = companyData.map(x=>{
        if(x.parentId === '?' || !x.parentId) {
            x.parentId = '';             
        }
        return x;
    });	
    d3.json(
        'http://192.168.14.203/otcs/llisapi.dll?func=ll&objId=121958650&objAction=RunReport'
    ).then(dataFlattened => {
		dataFlattened = dataFlattened.map(x=>{
            if(x.parentId === '?') {
                x.parentId = '';             
            }
            return x;
        });
        dataFlattened.pop();
        resultData = [...dataFlattened, ...companyData];
		resultData = resultData.map(x=>{
			if(x.name === 'Upstream'){
				x.amount = '1640 mn USD';
			}else if(x.name === 'Midstream'){
				x.amount = '57 mn USD';
			}else if(x.name === 'Downstream'){
				x.amount = '197 mn USD';
			}else if(x.name === 'Trading & Sale'){
				x.amount = '131 mn USD';
			}else{
				x.amount = '';
			}
			return x;
		});

        chart = new d3.OrgChart()
            .container('.chart-container')
            .data(resultData)
            .nodeWidth(d => 300)
            .initialZoom(0.6)
            .nodeHeight(d => 200)
            .childrenMargin(d => 40)
            .compactMarginBetween(d => 15)
            .compactMarginPair(d => 80) 
            .scaleExtent([0.025, 1.33])
            .nodeContent(function (d, i, arr, state) {
                const svgStr = `<svg width=150 height=75  style="background-color:none"> <path d="M 0,15 L15,0 L135,0 L150,15 L150,60 L135,75 L15,75 L0,60" fill="#2599DD" stroke="#2599DD"/> </svg>`;
                return `
                <div onclick="zoomElement(${d.data.id})" onmouseover="showPopup(${d.data.id})" onmouseleave="leavePopup()" style="cursor: pointer; padding-top:30px;background-color:#00AFC1;margin-left:1px;height:${
                    d.height
                }px;border-radius:2px;overflow:visible;border-radius:40px;display:flex;justify-content:center;overflow:hidden;">
                <div style="height:${
                    d.height - 62
                }px;width:${d.width + 30}px;padding-top:10px;padding-bottom:10px;background-color:white;background-color:#406b7a;display:flex;align-items:center;justify-content:center;position:relative;">
				<div style="margin-right:10px;margin-top:30px;color:#fff;position:absolute;right:10;bottom:10">${
					d.data.amount
				}</div>
                <div style="text-align:center;font-family:'Open Sans';">
                    <div style="color:#fff;font-size:24px;font-weight:bold;"> <span>${
					d.data.name
                    } </span></div>
                </div> 
              </div>     
      </div>
  `;
            })
            .buttonContent(({ node, state }) => {
                return `<div id=${node.data.id} class="expand-button" style="color:#2CAAE5;border-radius:5px;padding:3px;font-size:10px;margin:auto auto;background-color:#040910;border: 1px solid #2CAAE5"> <span style="font-size:9px">${
                  node.children
                    ? `<i class="fas fa-angle-up"></i>`
                    : `<i class="fas fa-angle-down"></i>`
                }</span> ${node.data._directSubordinates}  </div>`;
              })
            .onNodeClick(function (nodeId) {
                if(nodeId == '1500'){
                    if(!chart.getChartState().allNodes[0].data._expanded){
                        chart.setExpanded(nodeId).render().createContextMenu();                  
                    }else if(isCollapsedAll){
                        isCollapsedAll = false;
                        var node = getNode(nodeId);
                        chart.onButtonClick(null, node); 
                        node.data._centered = true;
                        chart.render().createContextMenu();
                    }else{
                        chart.getChartState().allNodes[0].data._expanded = false;
                        isCollapsedAll = true;
                        chart.collapseAll();
                    }
                    return;
                }
                function getNode(id) {
                    var node = chart.getChartState().allNodes.filter(({ data }) => chart.getChartState().nodeId(data) == id)[0];
                    return node;
                }
                var node = getNode(nodeId);
                chart.onButtonClick(null, node); 

                node.data._centered = true;
                chart.render().createContextMenu();
            })
            .render();
            var showOnMap = function (id) {
                window.location.href = 'http://192.168.14.33/otcs/llisapi.dll?func=ll&objId=100072&objAction=RunReport&key=' + id;
            };
            var editElement = function (id) {
                window.location.href = 'http://192.168.14.33/otcs/llisapi.dll/app/cd?func=ll&objId=114637&objAction=RunReport&key=' + id;
            };
            var showOnTree = function (id) {
                window.location.href = 'http://192.168.14.33/otcs/llisapi.dll?func=ll&objId=99047&objAction=RunReport&search=' + id;
            }
            var menu = [
                {
                    title: 'Show on Tree',
                    action: function(elm, d) {
                        showOnTree(d);
                    }
                },
                {
                    title: 'Show on Map',
                    action: function(elm, d) {
                        showOnMap(d);
                    }
                },
                {
                    title: 'Edit',
                    action: function(elm, d) {
                        editElement(d);
                    }
                }
            ];
            chart.createContextMenu = function(){
                d3.selectAll(".node").on('contextmenu',  event => d3.contextMenu(event, menu) );
                return this;
            } 
            if(window.searchParam){
                chart.setCentered(window.searchParam).setUpToTheRootHighlighted(window.searchParam).render();
            }
		    chart.compact(!!(compact++%2)).render().createContextMenu().fit();
            document.getElementsByClassName("chart-container")[0].addEventListener("click", closePopup); 
            d3.selectAll('.node-button-g').on('click', (event,d)=>{
                chart.onButtonClick(event, d);          
                var id = event.currentTarget.__data__.data.id;
                chart.setCentered(id).render();
                chart.createContextMenu();
            })  
    });
}

window.addEventListener('DOMContentLoaded', init);

function centerOnExpand(){
   const buttonsParents = document.getElementsByClassName("node-button-div");
   const buttons = document.getElementsByClassName("expand-button");
   for (let i = 0; i < buttonsParents.length; i++) {
        buttonsParents[i].style.pointerEvents = "auto";
        const centerId =  buttons[i].id; 
        buttons[i].addEventListener("click", ()=>{
            setTimeout(()=>chart.setCentered(centerId.toString()).render().createContextMenu(), 500);
        })   
   }
}


async function getCompanies(){
    let url = 'http://192.168.14.203/otcs/llisapi.dll?func=ll&objId=121958654&objAction=RunReport';
    let result = await fetch(url);
    let data = await result.json();
    data.pop();
    var group = _.groupBy(data, 'id');
    group = _.map(group, x => {
        if (x.length > 0) {
            let res = _.reduce(
                x,
                (pr, cv) => {
                    pr.dataPoints.push({ y: cv.y, label: cv.label });
                    return pr;
                },
                {
                    id: x[0].id,
                    name: x[0].name,
                    parentId: x[0].parentId,
                    size: '',
                    servicename: x[0].servicename,
                    countemp: x[0].countemp,  
                    dataPoints: [],
                }
            );
            return res;
        } else return x;
    });
    return _.flatMap(group);
}

    async function getPopup1(cid) {
        try {
            let url =
                'http://192.168.14.33/otcs/llisapi.dll?func=ll&objId=102419&objAction=RunReport&cid=' +
                cid;
            let result = await fetch(url);
            let data = await result.json();
            return data;
        } catch (e) {
            return null;
        }
    }
    async function getPopup2(cid) {
        try {
            let url =
                'http://192.168.14.33/otcs/llisapi.dll?func=ll&objId=101942&objAction=RunReport&cid=' +
                cid;
            let result = await fetch(url);
            let data = await result.json();
            data.pop();
            return data;
        } catch (e) {
            return null;
        }
    }
    async function getPopup3(cid) {
        try {
            let url =
                'http://192.168.14.33/otcs/llisapi.dll?func=ll&objId=102148&objAction=RunReport&cid=' +
                cid;
            let result = await fetch(url);
            let data = await result.json();
            data.pop();
            return data;
        } catch (e) {
            return null;
        }
    }
    async function getPopup4(cid) {
        try {
            let url =
                'http://192.168.14.33/otcs/llisapi.dll?func=ll&objId=102525&objAction=RunReport&cid=' +
                cid;
            let result = await fetch(url);
            let data = await result.json();
            data.pop();
            return data;
        } catch (e) {
            return null;
        }
    }
    async function getPopup5(cid) {
        try {
            let url =
                'http://192.168.14.33/otcs/llisapi.dll?func=ll&objId=102482&objAction=RunReport&cid=' +
                cid;
            let result = await fetch(url);
            let data = await result.json();
            data.pop();
            return data;
        } catch (e) {
            return null;
        }
    }

    function showSnackbar(text, timer) {
        if (!timer) timer = 3000;
        var x = document.getElementById('snackbar');
        x.className = 'show';
        x.innerText = text;
        setTimeout(function () {
            x.className = x.className.replace('show', '');
        }, timer);
    }
    
    showSnackbar('🔁 Yüklənir', 1500);
    var showPopupTimeout = null;
    async function showPopup(key){ 
    if($("#infoBoxHolder").html() !== '') return;
   
    if(!showPopupTimeout){ 
        showPopupTimeout = setTimeout(async ()=>{
            showSnackbar("🔁 Yüklənir", 1000);
            showPopupTimeout = null;
            document.getElementById("infoBoxHolder").style.display = 'block'
            CanvasJS.addColorSet("greenShades",
                [
                "#3E8E7E",
                "#7CD1B8",
                "#FABB51",
                "#FAEDC6",
                "#FDAF75"                
                ]);
            
            const popup1 = await getPopup1(key);
            const popup2 = await getPopup2(key);
            const popup3 = await getPopup3(key);
            const popup4 = await getPopup4(key);
            const popup5 = await getPopup5(key);
            var infoBoxHolder = document.getElementById("infoBoxHolder");
    
            if(popup1.length === 0 && popup2.length === 0 && popup3.length === 0 && popup4.length === 0 && popup5.length === 0) { 
                showSnackbar("🚫 Məlumat tapılmadı", 1000); 
                return; 
            } 
    
            infoBoxHolder.innerHTML = "";
            const buttonEl = document.createElement('button');
            buttonEl.classList.add('button-close');
            buttonEl.addEventListener("click", closePopup);
            buttonEl.innerHTML = 'x';
            infoBoxHolder.append(buttonEl); 
            var data = resultData.find(x=>x.id == key);
            if(data && data.dataPoints) {      
                var infobox = document.createElement("div");
                infobox.id = "infoBox";
                infoBoxHolder.appendChild(infobox);        
                var chart = new CanvasJS.Chart("infoBox", {
                    colorSet: "greenShades",
                    animationEnabled: true,
                    title: {
                        text: data.text
                    },
                    legend: {
                        cursor: "pointer",
                        itemclick: explodePie,
                    },
                    data: [{
                        type: "pie",
                        startAngle: 240,
                        yValueFormatString: "##0.00\"%\"",
                        indexLabel: "{label} {y}",
                        showInLegend: true,
                        legendText: "{label}",
                        toolTipContent: "<strong>{label}</strong>",
                        dataPoints: data.dataPoints
                    }]
                });
                chart.render();
            }
    
            function createAddInfoBox() {		
                var additionalInfoBox = document.createElement("div");
                additionalInfoBox.id = "additionalInfoBox";
                additionalInfoBox.classList.add("add-info-box");
                additionalInfoBox.classList.add("container");      
                let parents = [
                 {  
                    key: 1,
                    cname: 'Business Units'
                 }, 
                 {
                    key: 29,
                    cname: 'Subsidiaries'
                 },
                 {
                     key: 88,
                     cname: 'Joint Ventures'
                 },
                 {
                     key: 114,
                     cname: 'Associates'
                 },
                 {
                     key: 138,
                     cname: 'PSAs and RSAs in Development and Production Phase'
                 },
                 {
                     key: 162,
                     cname: 'PSAs and RSAs in Exploration and Evaluation Phase'
                 }];
                let keys = parents.map(x=>x.key.toString());
                // if(removedParentObject && keys.includes(removedParentObject.key)){
                   // const obj = parents.find(x=>{
                       // const key = Number.parseInt(removedParentObject.key);
                       // if(x.key === key) return x;
                    // });
                   // var type = `<div class="row mt-2"><div class="col-6"><b>Tipi:</b></div><div class="col-6">${obj.cname}</div></div>`;
                   // additionalInfoBox.innerHTML += type; 
                // }
                
                if(popup4 && popup4.length > 0){
                    let flag = "";
                    for (let i = 0; i < popup4.length; i++) {
                        const el = popup4[i];
                        const tooltip = countries.find(x=>x.ctcode === el[0]).ctname;
                        flag += `<i class="round-flag-icon round-flag-${el}" data-toggle="tooltip" data-placement="bottom" title="${tooltip}"></i>&nbsp;`;
                    }
                    var countryTitle = `<div class="row mt-2"><div class="col-6"><b>Fəaliyyət göstərdiyi ölkə:</b></div><div class="col-6">${flag}</div></div>`;  
                    additionalInfoBox.innerHTML += countryTitle;  
                }                   
    
                if(popup5 && popup5.length > 0){
                    var ceoTitle = `<div class="row mt-2"><div class="col-6"><b>CEO:</b></div><div class="col-6">${popup5[0]}</div></div>`;          
                    additionalInfoBox.innerHTML += ceoTitle;         
                }
    
                if(data.servicename && data.servicename !== '?'){
                    var segmentTitle = `<div class="row mt-2"><div class="col-6"><b>Aid olduğu seqment:</b></div><div class="col-6">${data.servicename}</div></div>`;  
                    additionalInfoBox.innerHTML += segmentTitle;
                }
                
    
                var controlOrganizationsTitleText = ""
                if(popup2 && popup2.length > 0){
                    controlOrganizationsTitleText = " Ümumi Yığıncaq";
                }
                if(popup3 && popup3.length > 0){
                    if(controlOrganizationsTitleText !== "") controlOrganizationsTitleText += ","
                    controlOrganizationsTitleText += " Direktorlar Şurası ";
                }
                if(controlOrganizationsTitleText !== ""){
                    var controlOrganizationsTitle = `<div class="row mt-2"><div class="col-6"><b>İdarəetmə orqanları:</b></div><div class="col-6">${controlOrganizationsTitleText}</div></div>`;
                    additionalInfoBox.innerHTML += controlOrganizationsTitle;
                }
    
                if(data.countemp && data.countemp !== "?"){
                    var numberOfEmployeesTitle = `<div class="row mt-2"><div class="col-6"><b>İşçi sayı:</b></div><div class="col-6">${data.countemp}</div></div>`;            
                    additionalInfoBox.innerHTML += numberOfEmployeesTitle;
                }
                        
    
                if(popup1 && popup1[6]) {
                    var ebitdaTitle = `<div class="row mt-2"><div class="col-6"><b>EBITDA:</b></div><div class="col-6">${popup1[6]}</div></div>`;
                    additionalInfoBox.innerHTML += ebitdaTitle;
                }
                if(popup1 && popup1[7]) {
                    var incomeTitle = `<div class="row mt-2"><div class="col-6"><b>Xalis Mənfəət /(Zərər):</b></div><div class="col-6">${popup1[7]}</div></div>`;
                    additionalInfoBox.innerHTML += incomeTitle;
                }						
                infoBoxHolder.append(additionalInfoBox);
    
                if(popup1.length > 0 || popup2.length > 0 || popup3.length > 0){
                    var moreInfoLinkDiv = document.createElement("div");
                    moreInfoLinkDiv.id = "moreInfoLinkDiv";	
                    moreInfoLinkDiv.classList.add("row");	
                    const next = () => {
                        const el = document.getElementById("additionalInfoBox");
                        el.parentNode.removeChild(el);
                        const el2 = document.getElementById("moreInfoLinkDiv");
                        el2.parentNode.removeChild(el2);
                        createMoreDiv();
                        
                    }
                    moreInfoLinkDiv.innerHTML = `<div class="d-flex mt-2 justify-content-center"><button id="nextBtn" class="btn btn-dark">Find out more &#8680;</button></div>`;    
                    infoBoxHolder.append(moreInfoLinkDiv);
                    document.getElementById("nextBtn").onclick = next;
                }	
            }
               
            function createMoreDiv(){
                var moreInfoDiv = document.createElement("div");
                moreInfoDiv.classList.add("container");
                moreInfoDiv.classList.add("add-info-box");
                moreInfoDiv.id = "moreInfoDiv";
                
                var popup2Text = '';
                for (let i = 0; i < popup2.length; i++) {
                    const element = popup2[i];
                    popup2Text += element[1];
                    if(i !== popup2.length -1){
                        popup2Text += ',';
                    }
                }
    
                if(popup2Text){
                    var p1 = `<div class="row mt-2"><div class="col-6"><b>Təsisçilərin Ümumi Yığıncaqda Təmsilçiləri:</b></div><div class="col-6">${popup2Text}</div></div>`;
                    moreInfoDiv.innerHTML += p1;
                }			
    
                var popup3Text = '';
                for (let i = 0; i < popup3.length; i++) {
                    const element = popup3[i];
                    popup3Text += element[1];
                    if(i !== popup3.length -1){
                        popup3Text += ',';
                    }
                }
                if(popup3Text){
                    var p2 = `<div class="row mt-2"><div class="col-6"><b>Direktorlar Şurasının Üzvləri:</b></div><div class="col-6">${popup3Text}</div></div>`;
                    moreInfoDiv.innerHTML += p2;
                }    
    
                if(popup1 && popup1[2]){
                    var p3 = `<div class="row mt-2"><div class="col-6"><b>Fəaliyyət sahəsi:</b></div><div class="col-6">${popup1[1]}</div></div>`;
                    moreInfoDiv.innerHTML += p3;
                }
                
                if(popup1 && popup1[3]){
                    var p4 = `<div class="row mt-2"><div class="col-6"><b>Cəmi Aktivlər:</b></div><div class="col-6">${popup1[3]}</div></div>`;
                    moreInfoDiv.innerHTML += p4;
                }	
    
                if(popup1 && popup1[4]){
                    var p5 = `<div class="row mt-2"><div class="col-6"><b>Cəmi Kapital:</b></div><div class="col-6">${popup1[4]}</div></div>`;
                    moreInfoDiv.innerHTML += p5;
                }
    
                if(popup1 && popup1[5]){
                    var p6 = `<div class="row mt-2"><div class="col-6"><b>Cəmi Öhdəliklər:</b></div><div class="col-6">${popup1[5]}</div></div>`;
                    moreInfoDiv.innerHTML += p6;
                }
    
                if(popup1 && popup1[8]){
                    var p7 = `<div class="row mt-2"><div class="col-6"><b>Ödənilmiş mənfəət vergisi:</b></div><div class="col-6">${popup1[8]}</div></div>`;
                    moreInfoDiv.innerHTML += p7;
                }	
    
                if(popup1 && popup1[9]){
                    var p8 = `<div class="row mt-2"><div class="col-6"><b>Ödənilmiş əmlak vergisi:</b></div><div class="col-6">${popup1[9]}</div></div>`;
                    moreInfoDiv.innerHTML += p8;
                }	
    
                if(popup1 && popup1[10] && popup1[10] !== "?"){
                    var p9 = `<div class="row mt-2"><div class="col-6"><b>Bütün təsisçilərə ödənilən dividendlər:</b></div><div class="col-6">${popup1[10]}</div></div>`;
                    moreInfoDiv.innerHTML += p9;
                }	
    
                if(popup1 && popup1[11] && popup1[11] !== "?"){
                    var p10 = `<div class="row mt-2"><div class="col-6"><b>SOCAR-a ödənilən dividendlər:</b></div><div class="col-6">${popup1[11]}</div></div>`;
                    moreInfoDiv.innerHTML += p10;
                }	
    
                infoBoxHolder.append(moreInfoDiv);
    
                if(popup1.length > 0 || popup2.length > 0 || popup3.length > 0){
                    var backDiv = document.createElement("div");
                    backDiv.id = "backDiv";
                    backDiv.classList.add("row");
                    const back = () => {
                        const el = document.getElementById("moreInfoDiv");
                        el.parentNode.removeChild(el);
                        const el2 = document.getElementById("backDiv");
                        el2.parentNode.removeChild(el2);
                        createAddInfoBox();
                        
                    }
                    backDiv.innerHTML = `<div class="d-flex mt-2 justify-content-center"><button id="backBtn" class="btn btn-dark">&#8678; Back</button></div>`;      
                    infoBoxHolder.append(backDiv);
                    document.getElementById("backBtn").onclick = back;
                }
            }	
            createAddInfoBox(); 
        }, 2500);
    }
  
    }

$(document).mouseup(function(e) 
{
    chart.clearHighlighting();
    var container = $("#infoBoxHolder");

    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0) 
    {
        container.html("");
        container.hide();
    }
});

function closePopup(){
    var container = $("#infoBoxHolder");
    container.html("");
    container.hide();
}

function leavePopup(){
    if(showPopupTimeout){
        clearTimeout(showPopupTimeout);
        showPopupTimeout = null;
    }
}

function zoomElement(id){
    chart.clearHighlighting();
    chart.setUpToTheRootHighlighted(id.toString()).render();
    chart.setCentered(id.toString()).render();
}

var countries = [
    {
        "cid": 42,
        "ctid": 105,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 43,
        "ctid": 106,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 49,
        "ctid": 215,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 52,
        "ctid": 107,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 54,
        "ctid": 98,
        "ctcode": "cy",
        "ctname": "Kipr"
    },
    {
        "cid": 56,
        "ctid": 301,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 58,
        "ctid": 108,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 59,
        "ctid": 216,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 76,
        "ctid": 73,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 171,
        "ctid": 233,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 172,
        "ctid": 234,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 173,
        "ctid": 235,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 174,
        "ctid": 236,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 175,
        "ctid": 237,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 176,
        "ctid": 238,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 177,
        "ctid": 239,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 178,
        "ctid": 240,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 179,
        "ctid": 241,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 180,
        "ctid": 242,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 181,
        "ctid": 243,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 182,
        "ctid": 244,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 185,
        "ctid": 245,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 186,
        "ctid": 246,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 187,
        "ctid": 247,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 188,
        "ctid": 248,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 189,
        "ctid": 249,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 190,
        "ctid": 250,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 191,
        "ctid": 251,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 192,
        "ctid": 252,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 193,
        "ctid": 253,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 194,
        "ctid": 254,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 195,
        "ctid": 255,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 197,
        "ctid": 256,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 198,
        "ctid": 257,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 199,
        "ctid": 258,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 200,
        "ctid": 259,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 202,
        "ctid": 260,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 204,
        "ctid": 261,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 205,
        "ctid": 109,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 207,
        "ctid": 110,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 208,
        "ctid": 111,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 209,
        "ctid": 112,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 210,
        "ctid": 113,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 211,
        "ctid": 114,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 212,
        "ctid": 115,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 213,
        "ctid": 116,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 214,
        "ctid": 117,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 215,
        "ctid": 118,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 217,
        "ctid": 119,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 219,
        "ctid": 120,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 236,
        "ctid": 55,
        "ctcode": "at",
        "ctname": "Avstria"
    },
    {
        "cid": 236,
        "ctid": 74,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 237,
        "ctid": 56,
        "ctcode": "at",
        "ctname": "Avstria"
    },
    {
        "cid": 238,
        "ctid": 57,
        "ctcode": "at",
        "ctname": "Avstria"
    },
    {
        "cid": 238,
        "ctid": 75,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 239,
        "ctid": 58,
        "ctcode": "at",
        "ctname": "Avstria"
    },
    {
        "cid": 239,
        "ctid": 76,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 240,
        "ctid": 59,
        "ctcode": "at",
        "ctname": "Avstria"
    },
    {
        "cid": 241,
        "ctid": 60,
        "ctcode": "at",
        "ctname": "Avstria"
    },
    {
        "cid": 243,
        "ctid": 77,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 245,
        "ctid": 78,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 246,
        "ctid": 79,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 247,
        "ctid": 80,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 248,
        "ctid": 81,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 249,
        "ctid": 82,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 252,
        "ctid": 22,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 253,
        "ctid": 23,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 254,
        "ctid": 24,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 255,
        "ctid": 25,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 256,
        "ctid": 26,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 256,
        "ctid": 160,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 257,
        "ctid": 27,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 257,
        "ctid": 161,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 258,
        "ctid": 28,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 258,
        "ctid": 162,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 259,
        "ctid": 29,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 259,
        "ctid": 163,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 260,
        "ctid": 30,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 260,
        "ctid": 164,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 261,
        "ctid": 31,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 261,
        "ctid": 165,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 262,
        "ctid": 32,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 262,
        "ctid": 166,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 263,
        "ctid": 33,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 263,
        "ctid": 167,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 264,
        "ctid": 34,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 264,
        "ctid": 168,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 265,
        "ctid": 35,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 265,
        "ctid": 83,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 266,
        "ctid": 36,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 266,
        "ctid": 231,
        "ctcode": "sg",
        "ctname": "Sinqapur"
    },
    {
        "cid": 267,
        "ctid": 37,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 267,
        "ctid": 84,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 268,
        "ctid": 38,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 268,
        "ctid": 169,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 269,
        "ctid": 39,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 269,
        "ctid": 170,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 270,
        "ctid": 40,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 270,
        "ctid": 171,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 271,
        "ctid": 41,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 271,
        "ctid": 172,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 272,
        "ctid": 42,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 273,
        "ctid": 302,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 274,
        "ctid": 303,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 275,
        "ctid": 304,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 276,
        "ctid": 305,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 277,
        "ctid": 306,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 278,
        "ctid": 307,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 279,
        "ctid": 308,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 280,
        "ctid": 309,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 281,
        "ctid": 310,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 282,
        "ctid": 311,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 283,
        "ctid": 312,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 284,
        "ctid": 313,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 285,
        "ctid": 314,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 286,
        "ctid": 315,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 287,
        "ctid": 99,
        "ctcode": "cy",
        "ctname": "Kipr"
    },
    {
        "cid": 287,
        "ctid": 316,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 288,
        "ctid": 317,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 289,
        "ctid": 318,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 290,
        "ctid": 319,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 291,
        "ctid": 320,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 292,
        "ctid": 321,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 293,
        "ctid": 322,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 294,
        "ctid": 323,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 295,
        "ctid": 324,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 296,
        "ctid": 325,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 297,
        "ctid": 326,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 298,
        "ctid": 327,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 299,
        "ctid": 328,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 300,
        "ctid": 329,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 301,
        "ctid": 330,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 302,
        "ctid": 331,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 303,
        "ctid": 332,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 304,
        "ctid": 333,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 305,
        "ctid": 334,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 306,
        "ctid": 335,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 307,
        "ctid": 336,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 308,
        "ctid": 337,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 309,
        "ctid": 338,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 310,
        "ctid": 339,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 311,
        "ctid": 340,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 312,
        "ctid": 341,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 313,
        "ctid": 342,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 314,
        "ctid": 343,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 315,
        "ctid": 344,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 316,
        "ctid": 345,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 317,
        "ctid": 346,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 318,
        "ctid": 347,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 319,
        "ctid": 348,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 320,
        "ctid": 349,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 321,
        "ctid": 350,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 322,
        "ctid": 351,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 333,
        "ctid": 177,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 333,
        "ctid": 217,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 334,
        "ctid": 178,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 334,
        "ctid": 218,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 335,
        "ctid": 179,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 335,
        "ctid": 219,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 344,
        "ctid": 220,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 345,
        "ctid": 221,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 355,
        "ctid": 121,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 356,
        "ctid": 122,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 360,
        "ctid": 123,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 361,
        "ctid": 124,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 438,
        "ctid": 125,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 439,
        "ctid": 126,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 440,
        "ctid": 100,
        "ctcode": "cy",
        "ctname": "Kipr"
    },
    {
        "cid": 440,
        "ctid": 127,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 441,
        "ctid": 128,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 442,
        "ctid": 21,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 442,
        "ctid": 180,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 442,
        "ctid": 222,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 446,
        "ctid": 129,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 447,
        "ctid": 130,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 448,
        "ctid": 131,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 449,
        "ctid": 132,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 450,
        "ctid": 133,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 451,
        "ctid": 134,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 452,
        "ctid": 135,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 453,
        "ctid": 136,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 454,
        "ctid": 137,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 455,
        "ctid": 138,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 456,
        "ctid": 139,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 457,
        "ctid": 140,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 460,
        "ctid": 141,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 461,
        "ctid": 142,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 462,
        "ctid": 143,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 464,
        "ctid": 144,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 465,
        "ctid": 145,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 466,
        "ctid": 146,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 467,
        "ctid": 147,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 469,
        "ctid": 148,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 472,
        "ctid": 149,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 475,
        "ctid": 153,
        "ctcode": "gr",
        "ctname": "Yunanıstan"
    },
    {
        "cid": 480,
        "ctid": 262,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 487,
        "ctid": 52,
        "ctcode": "ai",
        "ctname": "Anguilla"
    },
    {
        "cid": 489,
        "ctid": 181,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 490,
        "ctid": 182,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 491,
        "ctid": 183,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 492,
        "ctid": 184,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 493,
        "ctid": 61,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 493,
        "ctid": 185,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 494,
        "ctid": 62,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 494,
        "ctid": 186,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 495,
        "ctid": 63,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 495,
        "ctid": 187,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 496,
        "ctid": 188,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 497,
        "ctid": 189,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 498,
        "ctid": 190,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 499,
        "ctid": 191,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 500,
        "ctid": 192,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 501,
        "ctid": 193,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 502,
        "ctid": 194,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 503,
        "ctid": 195,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 504,
        "ctid": 196,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 505,
        "ctid": 197,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 506,
        "ctid": 198,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 507,
        "ctid": 64,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 507,
        "ctid": 199,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 508,
        "ctid": 65,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 508,
        "ctid": 200,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 509,
        "ctid": 66,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 509,
        "ctid": 201,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 510,
        "ctid": 67,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 510,
        "ctid": 202,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 512,
        "ctid": 68,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 512,
        "ctid": 203,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 513,
        "ctid": 69,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 513,
        "ctid": 204,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 514,
        "ctid": 70,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 514,
        "ctid": 205,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 515,
        "ctid": 71,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    },
    {
        "cid": 515,
        "ctid": 206,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 516,
        "ctid": 207,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 517,
        "ctid": 208,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 518,
        "ctid": 209,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 519,
        "ctid": 210,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 521,
        "ctid": 211,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 521,
        "ctid": 223,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 522,
        "ctid": 212,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 522,
        "ctid": 224,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 523,
        "ctid": 213,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 523,
        "ctid": 225,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 524,
        "ctid": 226,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 525,
        "ctid": 227,
        "ctcode": "ro",
        "ctname": "Rumıniya"
    },
    {
        "cid": 526,
        "ctid": 154,
        "ctcode": "gr",
        "ctname": "Yunanıstan "
    },
    {
        "cid": 527,
        "ctid": 85,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 527,
        "ctid": 101,
        "ctcode": "cy",
        "ctname": "Kipr"
    },
    {
        "cid": 527,
        "ctid": 155,
        "ctcode": "gr",
        "ctname": "Yunanıstan"
    },
    {
        "cid": 528,
        "ctid": 102,
        "ctcode": "cy",
        "ctname": "Kipr"
    },
    {
        "cid": 528,
        "ctid": 150,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 528,
        "ctid": 156,
        "ctcode": "gr",
        "ctname": "Yunanıstan "
    },
    {
        "cid": 529,
        "ctid": 103,
        "ctcode": "cy",
        "ctname": "Kipr"
    },
    {
        "cid": 529,
        "ctid": 151,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 529,
        "ctid": 157,
        "ctcode": "gr",
        "ctname": "Yunanıstan "
    },
    {
        "cid": 530,
        "ctid": 158,
        "ctcode": "gr",
        "ctname": "Yunanıstan "
    },
    {
        "cid": 531,
        "ctid": 53,
        "ctcode": "ai",
        "ctname": "Anguilla"
    },
    {
        "cid": 532,
        "ctid": 54,
        "ctcode": "ai",
        "ctname": "Anguilla"
    },
    {
        "cid": 533,
        "ctid": 263,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 534,
        "ctid": 264,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 535,
        "ctid": 265,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 536,
        "ctid": 266,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 537,
        "ctid": 267,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 538,
        "ctid": 268,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 539,
        "ctid": 269,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 540,
        "ctid": 270,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 541,
        "ctid": 271,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 542,
        "ctid": 272,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 543,
        "ctid": 273,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 544,
        "ctid": 274,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 545,
        "ctid": 275,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 546,
        "ctid": 276,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 548,
        "ctid": 277,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 549,
        "ctid": 278,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 550,
        "ctid": 279,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 552,
        "ctid": 280,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 553,
        "ctid": 281,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 554,
        "ctid": 282,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 555,
        "ctid": 283,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 556,
        "ctid": 284,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 557,
        "ctid": 285,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 558,
        "ctid": 286,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 559,
        "ctid": 287,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 560,
        "ctid": 288,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 561,
        "ctid": 289,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 562,
        "ctid": 290,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 563,
        "ctid": 291,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 564,
        "ctid": 292,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 565,
        "ctid": 293,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 566,
        "ctid": 294,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 567,
        "ctid": 295,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 569,
        "ctid": 296,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 570,
        "ctid": 297,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 571,
        "ctid": 298,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 572,
        "ctid": 299,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 573,
        "ctid": 228,
        "ctcode": "ru",
        "ctname": "Rusiya"
    },
    {
        "cid": 575,
        "ctid": 229,
        "ctcode": "ru",
        "ctname": "Rusiya"
    },
    {
        "cid": 576,
        "ctid": 230,
        "ctcode": "ru",
        "ctname": "Rusiya"
    },
    {
        "cid": 577,
        "ctid": 352,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 578,
        "ctid": 399,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 579,
        "ctid": 400,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 580,
        "ctid": 353,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 581,
        "ctid": 354,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 582,
        "ctid": 355,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 583,
        "ctid": 356,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 584,
        "ctid": 357,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 585,
        "ctid": 358,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 586,
        "ctid": 359,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 587,
        "ctid": 360,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 588,
        "ctid": 361,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 589,
        "ctid": 362,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 590,
        "ctid": 363,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 591,
        "ctid": 364,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 592,
        "ctid": 365,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 593,
        "ctid": 366,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 594,
        "ctid": 367,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 595,
        "ctid": 368,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 596,
        "ctid": 369,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 597,
        "ctid": 370,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 598,
        "ctid": 371,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 599,
        "ctid": 372,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 600,
        "ctid": 373,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 601,
        "ctid": 374,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 602,
        "ctid": 375,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 603,
        "ctid": 376,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 604,
        "ctid": 377,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 605,
        "ctid": 378,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 606,
        "ctid": 379,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 607,
        "ctid": 380,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 608,
        "ctid": 381,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 609,
        "ctid": 401,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 610,
        "ctid": 382,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 611,
        "ctid": 383,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 612,
        "ctid": 384,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 613,
        "ctid": 385,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 614,
        "ctid": 386,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 615,
        "ctid": 387,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 616,
        "ctid": 388,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 617,
        "ctid": 389,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 618,
        "ctid": 390,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 619,
        "ctid": 391,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 620,
        "ctid": 392,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 621,
        "ctid": 393,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 622,
        "ctid": 394,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 623,
        "ctid": 395,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 624,
        "ctid": 396,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 625,
        "ctid": 397,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 626,
        "ctid": 398,
        "ctcode": "ua",
        "ctname": "Ukrayna"
    },
    {
        "cid": 627,
        "ctid": 86,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 629,
        "ctid": 87,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 629,
        "ctid": 173,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 630,
        "ctid": 88,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 631,
        "ctid": 89,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 631,
        "ctid": 402,
        "ctcode": "us",
        "ctname": "ABŞ"
    },
    {
        "cid": 632,
        "ctid": 90,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 632,
        "ctid": 300,
        "ctcode": "tr",
        "ctname": "Türkiyə"
    },
    {
        "cid": 633,
        "ctid": 91,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 633,
        "ctid": 104,
        "ctcode": "gb",
        "ctname": "Birləşmiş Krallıq"
    },
    {
        "cid": 634,
        "ctid": 92,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 634,
        "ctid": 232,
        "ctcode": "sg",
        "ctname": "Sinqapur"
    },
    {
        "cid": 635,
        "ctid": 93,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 635,
        "ctid": 176,
        "ctcode": "ne",
        "ctname": "Nigergiya"
    },
    {
        "cid": 636,
        "ctid": 43,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 636,
        "ctid": 94,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 640,
        "ctid": 95,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 641,
        "ctid": 96,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 641,
        "ctid": 159,
        "ctcode": "mc",
        "ctname": "Monako knyazlığı"
    },
    {
        "cid": 642,
        "ctid": 97,
        "ctcode": "ch",
        "ctname": "İsveçrə"
    },
    {
        "cid": 642,
        "ctid": 174,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 681,
        "ctid": 44,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 681,
        "ctid": 175,
        "ctcode": "mt",
        "ctname": "Malta"
    },
    {
        "cid": 682,
        "ctid": 45,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 682,
        "ctid": 214,
        "ctcode": "nl",
        "ctname": "Niderland"
    },
    {
        "cid": 683,
        "ctid": 46,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 685,
        "ctid": 47,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 686,
        "ctid": 48,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 687,
        "ctid": 49,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 687,
        "ctid": 152,
        "ctcode": "ge",
        "ctname": "Gürcüstan"
    },
    {
        "cid": 688,
        "ctid": 50,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 689,
        "ctid": 51,
        "ctcode": "ae",
        "ctname": "BƏƏ"
    },
    {
        "cid": 689,
        "ctid": 72,
        "ctcode": "az",
        "ctname": "Azərbaycan "
    }
]
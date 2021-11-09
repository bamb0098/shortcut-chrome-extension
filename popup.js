import punycode from "./punycode.js"

let list;
let formElement = document.querySelector('.form');

class shortcut {
    constructor(origin, destination) {
        this.origin = origin;
        this.destination = destination;
    }
}
function drawSet(){
    let listElement = document.querySelector('.list');
    listElement.innerHTML='';
    for(let i=0;i<list.length;i++){
        let cur = list[i];
        let setElement = document.querySelector('.prototype .set').cloneNode(true);
        let keyElement = setElement.querySelector('.key');
        let valueElement = setElement.querySelector('.value');
        let deleteElement = setElement.querySelector('.delete');
        
        keyElement.innerText = cur.origin;
        valueElement.innerText = cur.destination;
        deleteElement.dataset['index']=i;
        deleteElement.addEventListener('click', function () {
            deleteList(parseInt(this.dataset["index"]));
        }, false);
    
        document.querySelector('.list').appendChild(setElement);
    }
    
    formElement.querySelector('.key input').value='';
    formElement.querySelector('.value input').value='';
    chrome.storage.sync.set({'key':'','value':''});
    // chrome.declarativeNetRequest.getDynamicRules((res)=>{console.log(res)})
}
function addSet(key,value){
    value = value.replaceAll(/(https?:\/\/|\/$)/g,'')
    list=list.concat(new shortcut(key,value))
    chrome.storage.sync.set({"shortcut":list})
    for(let i=0;i<list.length;i++){
        let cur = list[i];
        chrome.declarativeNetRequest.updateDynamicRules(
            {addRules:[{
               "id": i+1,
               "priority": 1,
               "action": { "type": "redirect" , "redirect": { "url": "https://"+punycode.toASCII(cur.destination) }},
               "condition": {"regexFilter": '://'+punycode.toASCII(cur.origin), "resourceTypes": ["main_frame"] }}
              ],
              removeRuleIds: [i+1]
            }
        )
    }
    drawSet();
}

function truncateList(){
    for(let i=0;i<list.length;i++){
        chrome.declarativeNetRequest.updateDynamicRules(
            {removeRuleIds: [i+1]}
        )
    }
    list=[];
    drawSet();
}

function deleteList(i){
    list.splice(i,1);
    chrome.storage.sync.set({"shortcut":list})
    chrome.declarativeNetRequest.updateDynamicRules(
        {removeRuleIds: [i+1]}
    )
    drawSet();
}

function autosave(type,value){
    chrome.storage.sync.set({[type]:value});
}

formElement.querySelector('.append').addEventListener('click', function () {
    let key = formElement.querySelector('.key input').value;
    let value = formElement.querySelector('.value input').value;
    addSet(key,value);
}, false);
formElement.querySelector('.truncate').addEventListener('click', function () {
    truncateList()
}, false);

formElement.querySelector('.key input').addEventListener('keyup',function(e){autosave('key',e.target.value)}, false);
formElement.querySelector('.value input').addEventListener('keyup',function(e){autosave('value',e.target.value)}, false);

chrome.storage.sync.get(["shortcut","key","value"],function(res) {
    console.log(res)
    if(!res["shortcut"]){
        chrome.storage.sync.set({"shortcut":[]});
        list=[];
        return false;
    };
    list = res["shortcut"];
    drawSet();
    
    formElement.querySelector('.key input').value=res["key"];
    formElement.querySelector('.value input').value=res["value"];
});
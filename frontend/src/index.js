import {
    newQuesBtn,
    submitQuesBtn,
    quesForm,
    quesRes,
    showQuestion,
    showSubject,
    subText,
    quesText,
    list,
    resetQuesBtn,
    responses,
    responderName,
    respondText,
    submitResBtn,
    searchQues,
    resolveBtn
} from './getElements.js';

let quesObj = {}, id = 1, selectedId, selectedQuesElement;
let firstFavElement = false;

class TimePeriod {
    constructor(ms) {
        this.sec = Math.round(ms / 1000);
        this.min = Math.round(this.sec / 60);
        this.hr = Math.round(this.min / 60);
        this.day = Math.round(this.hr / 24);
        this.month = Math.round(this.day / 30);
        this.year = Math.round(this.day / 365);
    }
    getString() {
        for (let unit of ['year', 'month', 'day', 'hr', 'min', 'sec']) {
            if (this[unit] != 0) {
                return `${this[unit]} ${unit} ago`;
            }
        }
        return 'just now';
    }
}
class Ques {
    constructor(subject, ques, resArr = [], isFavourite = false) {
        this.subject = subject,
            this.ques = ques,
            this.res = resArr,
            this.isFavourite = isFavourite,
            this.createdOn = Date.now()
    }
}
class Response {
    constructor(name, response, upvotes = 0, downvotes = 0) {
        this.name = name;
        this.response = response;
        this.upvotes = upvotes;
        this.downvotes = downvotes;
    }
}
//initialisation code
(async function getData() {
    let data = localStorage.getItem('quesObj');
    if (data != null && data != undefined)
        quesObj = JSON.parse(data);
    else {
        //fetch from server
        let response = await fetch('http://localhost:3005/data', {
            method: 'GET'
        })
        data = await response.json();
        quesObj = data;
        saveQuesData();
    }
    renderQues();
})();


newQuesBtn.addEventListener('click', showBlankQuesForm);
submitQuesBtn.addEventListener('click', createNewQues);
resetQuesBtn.addEventListener('click', () => {
    toggle([submitQuesBtn], [resetQuesBtn]);
    resetForm();
})
submitResBtn.addEventListener('click', createNewResp);
subText.addEventListener('change', () => toggle([submitQuesBtn], [resetQuesBtn]));
quesText.addEventListener('change', () => toggle([submitQuesBtn], [resetQuesBtn]));
resolveBtn.addEventListener('click', resolveQuestion)
setInterval(updateTime, 5000);


//render Questions at left pane
function renderQues(idArr = Object.keys(quesObj), quesOb = quesObj) {
    for (let key of idArr) {
        let li = document.createElement('li');
        li.innerHTML = `<div class='flex'>
                            <div class='grow'>
                                <h3 class='text-xl'>
                                    ${quesOb[key].subject}
                                </h3>
                                <p class='text-sm'>
                                    ${quesOb[key].ques}
                                </p>
                            </div>
                            <div class='w-1/5 flex items-center justify-center'>
                                <button id='favBtn-${key}' class='text-2xl hover:text-3xl hover:text-orange-300 transition-all'>★</button>
                            </div>
                        </div>
                        <p class='timeBefore'>

                        </p>`
            ;
        //onclick='favHandler(event)' in innerHTML will work or not? was working previously but not now
        li.querySelector('button').addEventListener('click', (e) => favHandler(e));
        li.setAttribute('id', key);
        li.classList.add('ring', 'm-2', 'rounded', 'p-1', 'hover:shadow-lg', 'hover:bg-slate-50');
        li.addEventListener('click', quesListHandler)

        if (quesOb[key].isFavourite) {
            list.prepend(li);
            if (firstFavElement == false)
                firstFavElement = li;
        }
        else {
            if (firstFavElement != false)
                firstFavElement.after(li);
            else
                list.prepend(li);
        }

        changeFavCSS(key);
        updateTime();
        id = Number(key) + 1;
    }
}

// render response of question at right pane
function renderRes(startingIndex = 0) {
    if (startingIndex == 0 && quesObj[selectedId].res.length != 1)
        responses.innerHTML = '';
    for (let i = Number(startingIndex); i < quesObj[selectedId].res.length; i++) {
        //create element
        const div = document.createElement('div');
        const h3 = document.createElement('h3');
        const p = document.createElement('p');
        const upvoteBtn = document.createElement('button');
        const downvoteBtn = document.createElement('button');

        //add data
        div.setAttribute('id', 'res-' + i);
        h3.innerText = quesObj[selectedId].res[i].name;
        p.innerText = quesObj[selectedId].res[i].response;

        //add css
        div.classList.add('ring-2', 'm-2', 'rounded', 'p-1', 'relative');
        h3.classList.add('text-lg');
        p.classList.add('text-sm');
        upvoteBtn.classList.add('m-1', 'z-50', 'absolute', 'right-16', 'inset-y-0', 'text-xl', 'font-medium', 'hover:text-2xl', 'transition-all');
        downvoteBtn.classList.add('m-1', 'z-50', 'absolute', 'right-5', 'inset-y-0', 'text-xl', 'font-medium', 'hover:text-2xl', 'transition-all');

        //add event listener
        upvoteBtn.addEventListener('click', voteHandler);
        downvoteBtn.addEventListener('click', voteHandler);
        //append
        div.append(h3, p, upvoteBtn, downvoteBtn);

        // div.append(upvoteBtn);
        responses.prepend(div);

        updateVotes(i);
    }
}

async function saveQuesData() {
    localStorage.setItem('quesObj', JSON.stringify(quesObj));
    let response = await fetch('http://localhost:3005/data', {
        method: 'POST',
        body: JSON.stringify(quesObj)
    })
    let saved = await response.text();
    if (saved != 'saved')
        alert("Couldn't save your data, check your internet connection");
    else
        console.log("data saved");
}

function showBlankQuesForm() {
    toggle([quesForm], [quesRes]);
    resetForm();
}

async function createNewQues() {
    if (subText.value == '' || quesText.value == '') {
        alert("Enter the value!");
        return;
    }

    let obj = new Ques(subText.value, quesText.value);

    quesObj[id] = obj;

    //save data
    await saveQuesData();

    //update the list
    renderQues([id]);

    toggle([resetQuesBtn],[submitQuesBtn]);
}

function toggle(turnOnList, turnOffList) {
    for (let element of turnOnList)
        element.classList.remove('hidden');
    for (let element of turnOffList)
        element.classList.add('hidden');
}

function createNewResp() {
    const name = responderName.value;
    const response = respondText.value;
    if (name == '' || respondText == '') {
        alert("Enter the value!");
        return;
    }
    quesObj[selectedId].res.push(new Response(name, response));
    //only one response should be added
    renderRes(quesObj[selectedId].res.length - 1);
    saveQuesData();
}

function resetForm() {
    subText.value = "";
    quesText.value = "";
}

function quesListHandler(e) {
    toggle([quesRes], [quesForm]);

    //get id from li and the target itself
    selectedId = e.currentTarget.id;
    selectedQuesElement = e.currentTarget;

    //show question and subject on response pane
    showSubject.innerText = quesObj[selectedId].subject;
    showQuestion.innerText = quesObj[selectedId].ques;

    // responses.innerHTML = '';

    renderRes();
}

function voteHandler(e) {
    // console.log(e.target);
    let resId = e.target.parentElement.id;
    // console.log(resId);
    let [, resIdd] = resId.split('-'), index1, index2;
    // console.log('--'+Number(resIdd)+'--');
    if (e.target.firstChild.textContent == '👍') {

        quesObj[selectedId].res[resIdd].upvotes++;
        [index1, index2] = calculateChangeInPos('upvote', resIdd);
        // console.log("clicked up", index1, index2);

    }
    else {
        quesObj[selectedId].res[resIdd].downvotes++;
        // console.log(quesObj[selectedId].res)
        let [index1, index2] = calculateChangeInPos('downvote', resIdd);
        // console.log("clicked down", index1, index2);
    }
    if (index1 != index2) {
        swapInArr(index1, index2);
        // swapInDOM(index1,index2);
        renderRes();

    }
    updateVotes(resIdd);
}

function calculateChangeInPos(typeOfVote, resId) {
    resId = Number(resId);
    const responseArr = quesObj[selectedId].res;
    const netVotes = responseArr[resId].upvotes - responseArr[resId].downvotes;
    let i;
    //if upvote, it's sure that position to replace with will be at higher index
    if (typeOfVote == 'upvote') {
        for (i = resId + 1; i < responseArr.length; i++) {
            let netVotes2 = responseArr[i].upvotes - responseArr[i].downvotes
            if (netVotes2 >= netVotes)
                break;
        }
        return [resId, i - 1];
    }
    //and in downvote, the position to replace will at lower index
    else if (typeOfVote == 'downvote') {
        for (i = resId - 1; i >= 0; i--) {
            let netVotes2 = responseArr[i].upvotes - responseArr[i].downvotes
            if (netVotes2 <= netVotes)
                break;
        }
        // return [resId, i];``
        return [resId, i + 1]
    }

}
function swapInArr(index1, index2) {
    const responseArr = quesObj[selectedId].res;
    let temp = responseArr[index1];
    responseArr[index1] = responseArr[index2];
    responseArr[index2] = temp;
}
function swapInDOM(id1, id2) {
    let responseDiv1 = responses.querySelector(`#res-${id1}`);
    let responseDiv2 = responses.querySelector(`#res-${id2}`);
    console.log(responseDiv1);
    console.log(responseDiv2);
    let nextSib1 = responseDiv1.nextSibling !== responseDiv2 ? responseDiv1.nextSibling : responseDiv1;
    let nextSib2 = responseDiv2.nextSibling !== responseDiv1 ? responseDiv1.nextSibling : responseDiv2;
    responses.insertBefore(responseDiv1, nextSib2);
    responses.insertBefore(responseDiv2, nextSib1);

    // let div1Clone = responseDiv1.cloneNode(true);
    // let div2Clone = responseDiv2.cloneNode(true);

    // responseDiv1.parentElement.replaceChild(div2Clone,responseDiv1);
    // responseDiv1.parentElement.replaceChild(div2Clone,responseDiv1);
    // responses.replaceChild(div2Clone,responseDiv1);
    // responses.replaceChild(div1Clone,responseDiv2);

    // console.log(div1Clone.children[2].addEventListener('click',upvoteBtnHandler))
    // console.log(div1Clone.children[3].addEventListener('click',downvoteBtnHandler))

    // console.log(div2Clone.children[2].addEventListener('click',upvoteBtnHandler))
    // console.log(div2Clone.children[3].addEventListener('click',downvoteBtnHandler))
}
function updateVotes(index) {
    // console.log(index);
    let [upvoteBtn, downvoteBtn] = responses.querySelectorAll(`#res-${index} button`)
    // console.log(upvoteBtn, downvoteBtn)

    let upvotes = quesObj[selectedId].res[index].upvotes;
    let downvotes = quesObj[selectedId].res[index].downvotes;
    upvoteBtn.innerHTML = `👍<span class='text-sm'>${upvotes}</span>`;
    downvoteBtn.innerHTML = `👎<span class='text-sm'>${downvotes}</span>`;
}
function favHandler(e) {
    let btn = e.target;
    let li = btn.parentElement.parentElement.parentElement;
    let id = li.id;
    quesObj[id].isFavourite = !quesObj[id].isFavourite;
    changeFavCSS(id);
    //remove element
    console.log(parent);
    list.removeChild(li);
    // console.log("child removed")
    //prepend
    if (quesObj[id].isFavourite)
        list.prepend(li);
    //append
    else
        list.append(li);

    saveQuesData();
    // console.log('fav btn', btn, id);
}
function changeFavCSS(id) {
    let btn = document.getElementById(`favBtn-${id}`);
    if (quesObj[id].isFavourite) {
        btn.classList.add('text-orange-300')
        console.log("fav color added");
    }
    else
        btn.classList.remove('text-orange-300')
}

searchQues.addEventListener('input', (e) => {
    let value = e.target.value;
    list.innerHTML = "";
    //take another copy of quesObj
    let quesObjCopy = JSON.parse(JSON.stringify(quesObj));
    let renderOrNot;
    //search in quesObj
    if (value == '' || value == null)
        renderQues();

    for (let key in quesObjCopy) {
        renderOrNot = false;
        // console.log(quesObjCopy[key]['subject']);
        let tempObj = { ques: 'ques', subject: 'subject' };
        for (let keyInQues in tempObj) {
            //         //search in ques 
            let indexes = getAllIndex(quesObjCopy[key][keyInQues], value);
            console.log("indexes: ", indexes);
            //         //add span or mark before and after 
            if (indexes.length > 0)
                quesObjCopy[key][keyInQues] = insertAroundInStr(quesObjCopy[key][keyInQues], indexes, value);

            if (renderOrNot || indexes.length > 0)
                renderOrNot = true;
        }
        if (renderOrNot)
            renderQues([key], quesObjCopy);
    }

})

function getAllIndex(mainStr, subStr) {
    let indexes = [], pos = 0;
    while (pos >= 0 && pos < mainStr.length) {
        pos = mainStr.indexOf(subStr, pos);
        if (pos >= 0) {
            indexes.push(pos);
            pos += 1;
        }
    }
    return indexes;
}
function insertAroundInStr(mainStr, indexArr, value, first = '<mark>', second = '</mark>') {
    for (let i = 0; i < indexArr.length; i++) {
        console.log(typeof (mainStr));
        let mainArr = mainStr.split('');
        mainArr.splice(indexArr[i], value.length, `${first}${value}${second}`);
        mainStr = mainArr.join('');
        console.log(mainStr);
        return mainStr;
    }
}
function resolveQuestion() {
    delete quesObj[selectedId];
    selectedQuesElement.remove();
    toggle([quesForm],[quesRes])
    saveQuesData();
}

function updateTime() {
    let elements = document.querySelectorAll('.timeBefore');

    elements.forEach((element) => {
        if (element.firstChild)
            element.removeChild(element.firstChild);
        let id = element.parentElement.id;
        let DiffTimeObj = new TimePeriod(Date.now() - quesObj[id].createdOn);
        element.append(document.createTextNode(DiffTimeObj.getString()));
    })
}



/*
scrap code
function upvoteBtnHandler(e) {
    let resId = e.target.parentElement.id;
    // console.log(resId);
    let [, resIdd] = resId.split('-');
    // console.log('--'+Number(resIdd)+'--');
    quesObj[selectedId].res[resIdd].upvotes++;
    let [index1, index2] = calculateChangeInPos('upvote', resIdd);
    console.log("clicked up", index1, index2);
    if (index1 != index2) {
        swapInArr(index1, index2);
        // swapInDOM(index1,index2);
        renderRes();

    }
    updateVotes(resIdd);
    console.log(quesObj[selectedId].res)

    // console.log(quesObj[selectedId].res[resId].netvotes)
}
function downvoteBtnHandler(e) {
    let resId = e.target.parentElement.id;
    // console.log(resId);
    let [, resIdd] = resId.split('-');
    // console.log('--',resIdd);
    quesObj[selectedId].res[resIdd].downvotes++;
    console.log(quesObj[selectedId].res)
    let [index1, index2] = calculateChangeInPos('downvote', resIdd);
    console.log("clicked down", index1, index2);
    if (index1 != index2) {
        swapInArr(index1, index2);
        // [index1,index2] = [index2,index1];
        // swapInDOM(index1,index2);
        renderRes();
    }
    updateVotes(resIdd);

}
*/
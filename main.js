const express = require('express')
const app = express()
const port = 80
//var io = require('socket.io')(server);
var fs = require('fs');

//범용 함수 정의
function readHTML(name){ //html 읽기
    var html = fs.readFileSync('html/' + name + '.html', 'utf-8');
    return html
}

function replaceAll(str, searchStr, replaceStr){
    return str.split(searchStr).join(replaceStr); 
}
function removeTag(text){ //태그 지우기
  return text.replace(/</gi, '&lt').replace(/>/gi, '&gt')
}
function changeElements(original, elist){ //요소 변경하기
  var text = original
  for(var i = 0; i < elist.length; i++){
    text = replaceAll(text, '${' + elist[i]['key'] + '}', elist[i]['value'])
  }
  return text
}
function toHTMLText(text){ //태그 제거
  return replaceAll(replaceAll(replaceAll(text, '>', '&gt;'), '<', '&lt;'), '\n', '<br>')
}

keywords = {}
ranks = []

//검색 시도시
function searchKeyword(keyword){
    //키워드가 존재하지 않을 때
    if(Object.keys(keywords).indexOf(keyword) == -1){
        keywords[keyword] = {'count': 1}
    }
    else{ //키워드가 이미 존재할 때
        keywords[keyword]['count']+=1
    }
}

//키워드 정렬
function sortKeywords(){
    ranks = Object.keys(keywords)
    ranks.sort((a, b) => keywords[b]['count'] - keywords[a]['count'])
}

//저장하기
function saveDB(name, data){
    fs.writeFileSync('DB/' + name + '.json', JSON.stringify(data))
}

//읽기
function readDB(name){
    if(!fs.existsSync('DB/' + name + '.json')){
        fs.writeFileSync('DB/' + name + '.json', '{}')
        return {}
    }
    else{
        return JSON.parse(fs.readFileSync('DB/' + name + '.json'))
    }
}


keywords = readDB('search01')
sortKeywords()



//메인 화면
app.get('/', (req, res) => {
    var html = readHTML('index')
    var keywordText = readHTML('keyword-unit')
    var keywordsText = ''

    //표시 시작할 순위
    dpStart = 0
    dpEnd = ranks.length > 20 ? 20 : ranks.length

    
    if(ranks.length > 0){
        var maxCount = keywords[ranks[dpStart]]['count']
    }

    for(var i = dpStart; i < dpEnd; i++){
        keywordsText += changeElements(keywordText, [{'key': 'keyword', 'value': toHTMLText(ranks[i])}, 
                                                    {'key': 'count', 'value': keywords[ranks[i]]['count'] + '회'},
                                                    {'key': 'rank', 'value': i+1 + '위'},
                                                    {'key': 'height', 'value': (keywords[ranks[i]]['count']/maxCount)*100},
                                                    {'key': 'id', 'value': i == 0 ? "now-search" : ""}])
    }
    html = changeElements(html, [{'key': 'keywords', 'value': keywordsText}])
    res.send(html)
})

//특정한 키워드 보기
app.get('/view/:keyword', (req, res) => {
    var html = readHTML('index')
    var keywordText = readHTML('keyword-unit')
    var keywordsText = ''

    var keyword = req.params.keyword

    //표시 시작할 순위
    dpStart = ranks.indexOf(keyword) < 20 ? 0 : ranks.indexOf(keyword) - 20
    dpEnd = ranks.length - ranks.indexOf(keyword) < 20 ? ranks.length : ranks.indexOf(keyword) + 20

    nowPos = (ranks.indexOf(keyword) - dpStart) / (dpEnd - dpStart)
    
    if(ranks.length > 0){
        var maxCount = keywords[ranks[dpStart]]['count']
    }

    for(var i = dpStart; i < dpEnd; i++){
        keywordsText += changeElements(keywordText, [{'key': 'keyword', 'value': ranks[i]}, 
                                                    {'key': 'count', 'value': keywords[ranks[i]]['count'] + '회'},
                                                    {'key': 'rank', 'value': i+1 + '위'},
                                                    {'key': 'height', 'value': (keywords[ranks[i]]['count']/maxCount)*100},
                                                    {'key': 'id', 'value': i == ranks.indexOf(keyword) ? "now-search" : ""}
                                                ])
    }
    html = changeElements(html, [{'key': 'keywords', 'value': keywordsText}])
    res.send(html)
})

app.get('/search', (req, res) => {
    var html = readHTML('index')
    var keywordText = readHTML('keyword-unit')
    var keywordsText = ''

    console.log(req.query.q)

    var qu = req.query.q.trim()

    //공백일 시 무효
    if(qu == ''){
        return res.redirect('/')
    }

    searchKeyword(qu)
    sortKeywords()
    saveDB('search01', keywords)

    return res.redirect('/view/' + qu)
})


app.use((req, res, next) => {
    return res.redirect('/')
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
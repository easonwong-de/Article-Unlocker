
chrome.tabs.onUpdated.addListener(startup);

chrome.tabs.onActivated.addListener(startup);

function startup() {
  var title = '';
  var oldURL = '';
  var response = '';
  var article = '';
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    oldURL = tabs[0].url;
    if (oldURL.includes('theinitium.com/article')){
      console.log('Article page detected, starting up.');
      chrome.tabs.sendMessage(tabs[0].id, {message: 'request_title'}, function(titleResponse) {
        console.log('Title request sent.');
        if (titleResponse != undefined){
          title = titleResponse.value;
          console.log('Title: ' + title);
          console.log('URL: ' + URLConverter(title, oldURL, 0));
          let xhr = new XMLHttpRequest();
          xhr.open("GET", URLConverter(title, oldURL, 0), false);
          xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
              xhrResponse = xhr.responseText;
              console.log(xhrResponse);
              if (xhrResponse.includes('<h1>404</h1>')){
                chrome.tabs.sendMessage(tabs[0].id, {message: 'delete_button'}, function(r) {console.log('Content 404.');});
              }else{
                article = xhrResponse.substring(xhrResponse.indexOf('<p>'),xhrResponse.lastIndexOf('</p>',xhrResponse.lastIndexOf('</p>') - 1) + 4);
                if (article.indexOf('<h4') > 0) article = article.substring(0, article.indexOf('<h4') - 1);
                chrome.tabs.sendMessage(tabs[0].id, {message: article}, function(r) {console.log('Article sent to content script.');});
              }
            }else{
              chrome.tabs.sendMessage(tabs[0].id, {message: 'delete_button'}, function(r) {console.log('Connection failed.');});
            }
          }
          xhr.send();
        }
      });
    }else if (oldURL.includes('theinitium.com')){
      chrome.tabs.sendMessage(tabs[0].id, {message: 'delete_button'}, function(r) {console.log('Not article page.');});
    }
  });
}

function URLConverter(title, oldURL, x) {
  let replace = ['，', '。', '、', '=', '⋯', '？', '！', '；' ,'：' ,'「', '」', '『', '』', '《', '》']; //need to be expanded
  for (i of replace){
    title = title.replaceAll(i,'');
  }
  let month = parseInt(oldURL[35] + oldURL[36]);
  let date = parseInt(oldURL[37] + oldURL[38]) + x; //need to be upgraded
  if (month.toString().length == 1) month = '0' + month.toString();
  if (date.toString().length == 1) date = '0' + date.toString();
  return 'https://telegra.ph/' + title + '端傳媒-Initium-Media-' + month + '-' + date;
}



browser.tabs.onUpdated.addListener(startup);

browser.tabs.onActivated.addListener(startup);

function startup() {
  var title = "";
  var oldURL = "";
  var article = "";
  browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    oldURL = tabs[0].url;
    if (oldURL.includes("theinitium.com/article")) {
      console.log("Article page detected, starting up.");
      browser.tabs.sendMessage(tabs[0].id, { message: "request_title" }, (titleResponse) => {
        console.log("Title request sent.");
        if (titleResponse != undefined) {
          title = titleResponse.value;
          console.log("Title: " + title);
          console.log("URL: " + URLConverter(title, oldURL, 0));
          let xhr = new XMLHttpRequest();
          xhr.open("GET", URLConverter(title, oldURL, 0), false);
          xhr.onreadystatechange = () => {
            if (xhr.readyState == 4) {
              xhrResponse = xhr.responseText;
              console.log(xhrResponse);
              if (xhrResponse.includes("<h1>404</h1>")) {
                browser.tabs.sendMessage(tabs[0].id, { message: "delete_button" }, () => { console.log("Content 404."); });
              } else {
                article = xhrResponse.substring(xhrResponse.indexOf("<p>"), xhrResponse.lastIndexOf("</p>", xhrResponse.lastIndexOf("</p>") - 1) + 4);
                if (article.indexOf("<h4") > 0)
                  article = article.substring(0, article.indexOf("<h4") - 1);
                browser.tabs.sendMessage(tabs[0].id, { message: article }, () => { console.log("Article sent to content script."); });
              }
            } else {
              browser.tabs.sendMessage(tabs[0].id, { message: "delete_button" }, () => { console.log("Connection failed."); });
            }
          };
          xhr.send();
        }
      });
    } else if (oldURL.includes("theinitium.com")) {
      browser.tabs.sendMessage(tabs[0].id, { message: "delete_button" }, () => { console.log("Not article page."); });
    }
  });
}

function URLConverter(title, oldURL, x) {
  let replace = ["，", "。", "、", "=", "⋯", "？", "！", "；", "：", "︰", "（", "）", "「", "」", "『", "』", "《", "》", ",", ".", ":", ";", "—", "【", "】"]; //need to be expanded
  for (i of replace) {
    title = title.replaceAll(i, "");
  }
  title = title.replaceAll(" ", "-"); //mystery dash needs to be solve
  let month = parseInt(oldURL[35] + oldURL[36]);
  let date = parseInt(oldURL[37] + oldURL[38]) + x; //need to be upgraded
  if (month.toString().length == 1) month = "0" + month.toString();
  if (date.toString().length == 1) date = "0" + date.toString();
  return "https://telegra.ph/" + title + "端傳媒-Initium-Media-" + month + "-" + date;
}

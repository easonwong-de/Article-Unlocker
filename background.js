
browser.tabs.onUpdated.addListener(startup);
browser.tabs.onActivated.addListener(startup);

function startup() {
  browser.tabs.query({ active: true }, tabs => tabs.forEach(tab => scanEachTab(tab)));
}

function scanEachTab(tab) {
  let url = tab.url;
  if (url.includes("theinitium.com/article")) {
    console.log("Original URL: " + url + "\nArticle page detected, start searching for article source.");
    browser.tabs.sendMessage(tab.id, "request_title", title => {
      title ? searchForArticle(title, url, tab, 0) : console.error("Can't get article title. Maybe the article isn't loaded.");
    });
  } else if (url.includes("theinitium.com")) {
    browser.tabs.sendMessage(tab.id, "delete_button", () => { console.log("Not article page."); });
  }
}

function searchForArticle(title, url, tab, i) {
  console.log("Article title: " + title + "\nArticle URL: " + URLConverter(title, url, i));
  let xhr = new XMLHttpRequest();
  xhr.open("GET", URLConverter(title, url, i), false);
  xhr.onreadystatechange = () => {
    if (xhr.readyState == 4) { //HTML request fullfilled
      let html_text = xhr.responseText;
      if (html_text.includes("<h1>404</h1>") || !html_text.includes("@chotamreaderbot")) {
        browser.tabs.sendMessage(tab.id, "delete_button");
        if (i < 3) {
          console.log("Attempt: " + i + "\nContent unavailable.");
          searchForArticle(title, url, tab, ++i);
        } else {
          console.log("Too many attempts, giving up.");
        }
      } else { //article extracted successfully
        article = html_text.substring(html_text.indexOf("<p>"), html_text.lastIndexOf("</p>", html_text.lastIndexOf("</p>") - 1) + 4);
        if (article.indexOf("<h4") > 0) article = article.substring(0, article.indexOf("<h4") - 1); //Get rid of a banner
        browser.tabs.sendMessage(tab.id, article, () => { console.log("Article sent to content script."); });
      }
    } else {
      browser.tabs.sendMessage(tab.id, "delete_button", () => { console.log("Connection failed."); });
    }
  };
  xhr.send();
}

function URLConverter(title, url, i) {
  let replace = ["，", "。", "、", "=", "⋯", "？", "！", "；", "：", "︰", "（", "）", "「", "」", "『", "』", "《", "》", ",", ".", ":", ";", "—", "【", "】"];
  for (symbol of replace) title = title.replaceAll(symbol, "");
  title = title.replaceAll(" ", "-");
  let month = parseInt(url[35] + url[36]);
  let date = parseInt(url[37] + url[38]) + i;
  if (date > 31) {
    month++;
    date = date - 31;
  }
  if (month.toString().length == 1) month = "0" + month.toString();
  if (date.toString().length == 1) date = "0" + date.toString();
  return "https://telegra.ph/" + title + "端傳媒-Initium-Media-" + month + "-" + date;
}

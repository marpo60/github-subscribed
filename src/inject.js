"use strict";

window.listSubscribed = (() => {
  var isNotifications = () => /\/notifications(\/participating)?/.test(location.pathname);

  function setup() {
    if (isNotifications()) {
      insertSubscribedLink();
    }
  }

  function insertSubscribedLink() {
    var a = document.createElement("a");
    a.className = "filter-item js-subscribed";
    a.innerHTML = `<span class="count"></span>Subscribed`;
    document.getElementsByClassName("filter-list")[0].append(a);

    chrome.storage.local.get(null, function(items) {
      document.querySelector(".js-subscribed .count").innerHTML = Object.keys(items).length;
    });

    a.addEventListener("click", function(e) {
      if (!e.target.classList.contains("selected")) {
        cleanPage();

        insertTemplate().then(function(){
          moveToSubscribedTab(e);
          insertSubscribedItems();
        });
      }
    });
  }

  function moveToSubscribedTab(e) {
    document.querySelector(".filter-list .selected").classList.remove("selected");
    e.target.classList.add("selected");
  }

  function insertSubscribedItems() {
    chrome.storage.local.get(null, function(items) {
      items = Object.values(items);

      items.forEach(function(item) {
        addRepoBox(item);
        addItem(item);
      });
    });
  }

  function addRepoBox(item) {
    if (document.querySelector(`[data-repo="${item.repo}"]`) === null) {
      var a,clone, repoTemplate, at, ul;

      repoTemplate = document.querySelector('#repo');

      ul = repoTemplate.content.querySelector("ul");
      ul.dataset.repo = item.repo;

      a = repoTemplate.content.querySelector(".notifications-repo-link");
      a.href = `https://github.com/${item.repo}`;
      a.textContent = item.repo;
      a.dataset.repo = item.repo;

      at = document.querySelector(".col-9.float-right");
      clone = document.importNode(repoTemplate.content, true);
      at.appendChild(clone);
    }
  }

  function addItem(item) {
    var a,clone, rowTemplate, at;

    rowTemplate = document.querySelector('#row');

    a = rowTemplate.content.querySelector(".js-notification-target");
    a.href = item.url;
    a.textContent = item.name;

    at = document.querySelector(`ul[data-repo="${item.repo}"]`);
    clone = document.importNode(rowTemplate.content, true);
    at.appendChild(clone);
  }

  function cleanPage() {
    //repo list from Unread section
    document.querySelectorAll(".col-3.float-left > *:nth-child(n+2)").forEach(function(el) {el.remove();});
    //Actions: 'Mark all as read' from Unread
    document.querySelectorAll(".tabnav .float-right").forEach(function(el) {el.remove();});

    var node = document.querySelector(".col-9");
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function insertTemplate() {
    return fetch(chrome.runtime.getURL("src/template.html")).then(function(response) {
      return response.text();
    }).then(function(text){
      var inject = document.createElement("div");
      inject.innerHTML = text;
      document.body.append(inject);
    });
  }

  return { setup };
})();

window.overloadSubscribeButton = (() =>{
  function setup() {
    var form = document.querySelector(".thread-subscribe-form");
    if (form) {
      attachEventToForm();
      var sidebar = document.querySelector('.sidebar-notifications');
      if (sidebar) {
        new MutationObserver(() => attachEventToForm()).
          observe(document.querySelector('.sidebar-notifications'), {childList: true});
      }
    }
  }

  function attachEventToForm() {
    var form = document.querySelector(".thread-subscribe-form");

    form.addEventListener('submit', function(e){
      var fd = new FormData(e.target);
      var threadId = fd.get("thread_id");

      if (fd.get("id") === "subscribe") {
        chrome.storage.local.set({[threadId]: {
          repo: document.querySelector(".public").outerText,
          name: document.querySelector(".js-issue-title").innerHTML.trim(),
          url: window.location.href
        }});
      } else {
        chrome.storage.local.remove([threadId]);
      }
    });
  }

  return { setup };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.listSubscribed.setup();
  window.overloadSubscribeButton.setup();
});

document.addEventListener('pjax:success', () => {
  window.listSubscribed.setup();
});

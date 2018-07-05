"use strict";

window.listSubscribed = (() => {
  var isNotifications = () => /\/notifications(\/participating)?/.test(location.pathname);

  function setup() {
    if (isNotifications()) {
      insertSubscribedLink();
      insertStyles();
    }
  }

  function insertStyles() {
    var css = '.notifications .list-group-item-name.long { max-width: none; }',
      style = document.createElement('style');

    style.appendChild(document.createTextNode(css));

    document.head.appendChild(style);
  }

  function insertSubscribedLink() {
    var a = document.createElement("a");
    a.className = "filter-item js-subscribed";
    a.innerHTML = `<span class="count"></span>Subscribed`;
    document.getElementsByClassName("filter-list")[0].append(a);

    addCountToSubscribedLink();

    a.addEventListener("click", function(e) {
      if (!e.target.classList.contains("selected")) {
        cleanPage();

        moveToSubscribedTab(e);
        insertSubscribedItems();
      }
    });
  }

  function moveToSubscribedTab(e) {
    var selectedOption = document.querySelector(".filter-list .selected");

    if (selectedOption) {
      selectedOption.classList.remove("selected");
    }

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

  function addCountToSubscribedLink() {
    chrome.storage.local.get(null, function(items) {
      document.querySelector(".js-subscribed .count").innerHTML = Object.keys(items).length;
    });
  }

  function destroyRepoBox(e) {
    var repoBox = e.target.closest(".notifications-list");

    chrome.storage.local.get(null, function(items) {
      Object.keys(items).forEach(function (key) {
        var item = items[key];
        if (item.repo === repoBox.dataset.repo) {
          chrome.storage.local.remove([key]);
        }
      });

      addCountToSubscribedLink();
    });

    repoBox.remove();
  }

  function addRepoBox(item) {
    if (document.querySelector(`.notifications-list[data-repo="${item.repo}"]`) === null) {
      var innerText, div;
      innerText = `<div class="notifications-list" data-repo="${item.repo}">
                     <div class="boxed-group flush js-notifications-browser">
                       <h3>
                         <a href="https://github.com/${item.repo}" data-repo="${item.repo}" class="css-truncate css-truncate-target notifications-repo-link">${item.repo}</a>
                         <div class="notification-actions">
                         <button class="btn-link js-gs-destroy">
                          <svg class="octicon octicon-trashcan" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true">
                            <path fill-rule="evenodd" d="M11 2H9c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1H2c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1v9c0 .55.45 1 1 1h7c.55 0 1-.45 1-1V5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 12H3V5h1v8h1V5h1v8h1V5h1v8h1V5h1v9zm1-10H2V3h9v1z"></path>
                          </svg>
                         </button>
                         </div>
                       </h3>
                       <ul class="boxed-group-inner list-group notifications" data-repo="${item.repo}"></ul>
                     </div>
                   </div>`;

      div = document.createElement('div');
      div.innerHTML = innerText;

      div.querySelector(".js-gs-destroy").addEventListener("click", destroyRepoBox);
      document.querySelector(".col-9.float-right").appendChild(div.firstChild);
    }
  }

  function addItem(item) {
    var innerText, div;
    innerText = `<li class="list-group-item js-notification js-navigation-item unread issue-notification">
                   <span class="list-group-item-name long css-truncate">
                     <a class="css-truncate-target js-notification-target js-navigation-open list-group-item-link" href="${item.url}">${item.name}</a>
                   </span>
                </li>`;

    div = document.createElement('div');
    div.innerHTML = innerText;
    document.querySelector(`ul[data-repo="${item.repo}"]`).appendChild(div.firstChild);
  }

  function cleanPage() {
    //Repo list from Unread section
    document.querySelectorAll(".col-3.float-left > *:nth-child(n+2)").forEach(function(el) {el.remove();});
    //Actions: 'Mark all as read' from Unread
    document.querySelectorAll(".tabnav .float-right").forEach(function(el) {el.remove();});

    var node = document.querySelector(".col-9");
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  return { setup };
})();

window.overloadSubscribeButton = (() =>{
  function setup() {
    if (window.Utils.subscribeForm()) {
      attachEventToForm();
      var sidebar = document.querySelector('.sidebar-notifications');
      if (sidebar) {
        new MutationObserver(() => attachEventToForm()).observe(
          sidebar,
          { childList: true }
        );
      }
    }
  }

  function attachEventToForm() {
    var form = window.Utils.subscribeForm();

    form.addEventListener('submit', function(){
      var threadId = window.Utils.threadId(form);

      if (window.Utils.isSubscribed(form)) {
        chrome.storage.local.remove([threadId]);
      } else {
        chrome.storage.local.set({[threadId]: {
          repo: window.Utils.repo(),
          name: window.Utils.threadName(),
          url: window.location.href
        }});
      }
    });
  }

  return { setup };
})();

window.Utils = (() => {
  function subscribeForm() {
    return document.querySelector(".thread-subscribe-form");
  }

  function isSubscribed(form) {
    var fd = new FormData(form);

    return fd.get("id") !== "subscribe";
  }

  function repo() {
    var [, owner, repoName] = location.pathname.split('/');

    return `${owner}/${repoName}`;
  }

  function threadId(form) {
    var fd = new FormData(form);

    return fd.get("thread_id");
  }

  function threadName() {
    return document.querySelector(".js-issue-title").innerHTML.trim();
  }

  return {
    subscribeForm,
    isSubscribed,
    repo,
    threadId,
    threadName
  };
})();

window.addToListIfSubscribed = (() => {
  function setup() {
    var form = window.Utils.subscribeForm();

    if (form && window.Utils.isSubscribed(form)) {
      chrome.storage.local.set({[window.Utils.threadId(form)]: {
        repo: window.Utils.repo(),
        name: window.Utils.threadName(),
        url: window.location.href
      }});
    }
  }

  return { setup };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.listSubscribed.setup();
  window.addToListIfSubscribed.setup();
  window.overloadSubscribeButton.setup();
});

document.addEventListener('pjax:success', () => {
  window.listSubscribed.setup();
});

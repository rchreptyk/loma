importScripts('lunr.js');

function log() {
  var msg = Array.prototype.slice.call(arguments, 0).join(' ');
  postMessage({type: 'log', data: msg});
}

log('Loaded lunr v' + lunr.version);

var index = lunr(function() {
  this.field('app_url', {boost: 25});
  this.field('slug', {boost: 20});
  this.field('name', {boost: 20});
  this.field('html_title', {boost: 17});
  this.field('meta_keywords', {boost: 15});
  this.field('keywords', {boost: 14});
  this.field('category', {boost: 10});

  this.field('title', {boost: 20});
  this.field('description', {boost: 5});

  this.ref('_id');
});

function run(data) {
  log('GET', data.url);
  var xhr = new XMLHttpRequest();
  xhr.onload = loadDocs;
  xhr.open('get', data.url, true);
  xhr.send();
}

var docs = {};

function loadDocs() {
  var list = JSON.parse(this.responseText);

  var _id;
  list.forEach(function indexDoc(doc) {
    _id = doc[index._ref].toString();
    docs[_id] = doc;
    index.add(doc);
  });

  log('Indexed ' + list.length +
      ' doc' + (list.length === 1 ? '' : 's'));

  postMessage({type: 'loaded'});
}

function searchDocs(data) {
  var results;
  var timeStart = data.timeStart;
  var query = data.query;
  log('Searching lunr for "' + query + '"');

  if (query) {
    // Return document for each match.
    results = index.search(query).map(function(v) {
      return {
        doc: docs[v.ref],
        score: v.score
      };
    });
  } else {
    // Return all documents if no query was provided.
    results = Object.keys(docs).map(function(v) {
      return {
        doc: docs[v]
      };
    });
  }

  postMessage({
    type: 'results',
    data: {
      query: query,
      results: results,
      timeStart: timeStart
    }
  });
}

var methods = {
  run: run,
  search: searchDocs
};

addEventListener('message', function(e) {
  var method = methods[e.data.type];
  if (method) {
    method(e.data.data);
  }
}, false);

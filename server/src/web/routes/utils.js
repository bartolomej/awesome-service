const emojiMap = require('../public/emojis.json');
const List = require('../../models/list');
const { validationResult } = require('express-validator');
const AwesomeError = require('../../error');


function validateReqParams (req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AwesomeError(AwesomeError.types.INVALID_REQUEST, errors.array()));
  } else {
    return next();
  }
}

function serializeSearchResult (response, minify = false) {
  return {
    ...response,
    result: response.result.map(o => (
      o instanceof List ? serializeList(o, minify) : serializeLink(o, minify)
    ))
  }
}

function serializeList (list) {
  return {
    uid: list.uid,
    object_type: 'list',
    title: list.title,
    description: list.description,
    emojis: serializeEmojis(list.emojis),
    url: list.url,
    website_name: list.websiteName,
    image_url: list.image,
    icon_url: list.icon,
    tags: list.tags,
    stars: list.stars,
    forks: list.forks,
  }
}

function serializeLink (link) {
  return {
    uid: link.uid,
    object_type: 'link',
    title: link.title,
    description: link.description,
    emojis: serializeEmojis(link.emojis),
    url: link.url,
    website_name: link.websiteName,
    website_type: link.websiteType,
    icon_url: link.icon,
    image_url: link.image,
    screenshot_url: link.screenshot,
    tags: link.tags,
    source: serializeSource(link.source)
  }
}

function serializeSource (source) {
  // source could be either list uid of type string
  // or a full embedded object of type List
  if (source instanceof List) {
    return {
      uid: source.uid,
      title: source.title,
      image_url: source.image,
    }
  } else {
    return source;
  }
}

function serializeEmojis (emojis) {
  return emojis.map(k => ({
    key: k,
    url: emojiMap[k]
  }))
}

function serializeStats (stats) {
  return {
    link_count: stats.linkCount,
    list_count: stats.listCount,
    search_count: stats.searchCount,
    object_index: stats.objectIndex,
    keywords_index: stats.keywordsIndex
  }
}

module.exports = {
  serializeList,
  serializeLink,
  serializeEmojis,
  serializeSource,
  serializeStats,
  serializeSearchResult,
  validateReqParams
}
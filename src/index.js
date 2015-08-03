'use strict';

var express = require('express')
  , fs = require('fs-extra')
  , path = require('path')
  , fallback = require('fallback')
  , debug = require('debug')('prostore:site')
  , rho = require('rho')
  , fm = require('json-matter');

var router = module.exports = exports = new express.Router();

/**
 * Добавляет расширение `.html` для запросов без расширений.
 *
 * Таким образом, страницы могут отдаваться либо совсем без расширений,
 * либо с расширением `.html`.
 */
router.get('/*', function (req, res, next) {
  var ext = path.extname(req.url);
  if (!ext)
    req.url += '.html';
  next();
});

/**
 * Маршруты для работы с редактируемыми страницами.
 *
 * В `res.render` должен находиться шаблонизатор ProStore.
 * В `res.locals.root` должен лежать путь к корню магазина.
 */
router.get('/*.html', function (req, res, next) {
  var id = req.params[0].replace(/\.html$/, '');
  var root = path.join(res.locals.root, 'pages')
    , file = path.join(root, id + '.rho')
    , fallbackFile = path.join(root, path.basename(file, '.rho'), 'index.rho');
  fallback([file, fallbackFile], function (file, cb) {
    debug('Trying %s', file);
    fs.readFile(file, 'utf-8', function (ignoredErr, text) {
      if (!text) return cb();
      var page = fm.parse(text);
      rho.render(page.__content__, function (ignoredErr, html) {
        page.html = html || '';
        cb(null, page);
      });
    });
  }, function (err, page) {
    if (err)
      return next(err);
    if (!page)
      return next();
    res.render(page.template || 'pages/default.html', {
      page: page
    });
  });
});

/**
 * Маршруты для отрисовки страниц сайта с помощью встроенного шаблонизатора.
 * Эти маршруты применяется ко всем URL, обработка которых не завершилась выше,
 * поэтому должен использоваться в самом конце.
 *
 * Логика работы:
 *
 *   1. шаблонизатор поддерживает SVG, файлы отрисовываются и отдаются
 *      с `Content-Type: image/svg+xml`
 *   2. шаблонизатор пробует отрисовать страницу `<templates>/site/<url>.html`
 *   3. если с шагом 2 возникли проблемы, пробуем отрисовать страницу
 *      `<templates>/site/<url>/index.html`
 *
 * Поиск шаблонов осуществляется в директории `site` папки с шаблонами
 * (т.е. `<storeRoot>/templates/site`).
 *
 * В `res.render` должен находиться шаблонизатор ProStore.
 */
router.get('/*.svg', function (req, res) {
  res.type('image/svg+xml');
  res.render('site' + req.url);
});

router.get('/*.html', function (req, res, next) {
  var file = path.join('site', req.url)
    , fallbackFile = path.join(
      path.dirname(file), path.basename(file, '.html'), 'index.html');
  fallback([file, fallbackFile], function (file, cb) {
    debug('Trying %s', file);
    res.render(file, function (err, html) {
      if (err) return cb();
      cb(null, html);
    });
  }, function (err, html) {
    if (err)
      return next(err);
    if (!html)
      return next();
    res.send(html);
  });
});

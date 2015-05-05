"use strict";

var express = require('express')
  , async = require('async')
  , fs = require('fs-extra')
  , path = require('path')
  , fallback = require('fallback')
  , debug = require('debug')('prostore:site');

var router = module.exports = exports = new express.Router();

/**
 * Маршруты для работы с редактируемыми страницами.
 *
 * В `res.render` должен находиться шаблонизатор ProStore.
 * В `res.locals.root` должен лежать путь к корню магазина.
 */
router.get('/*', function(req, res, next) {
  var id = req.params[0].replace(/\.html$/, '');
  var file = path.join(res.locals.root, 'pages', id + '.json');
  debug('Trying %s', file);
  fs.readJsonFile(file, 'utf-8', function(err, page) {
    if (!page) return next();
    // Render page blocks
    async.map(page.blocks || [], function(block, cb) {
      res.render('blocks/' + (block.type || 'default') + '.html', {
        block: block
      }, function(err, html) {
        if (err) return cb(err);
        block.html = html;
        cb(null, block);
      });
    }, function(err, blocks) {
      if (err) return next(err);
      page.id = id;
      page.html = blocks.map(function(block) { return block.html }).join('\n');
      res.render(page.template || 'pages/default.html', {
        page: page
      });
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
 *   1. если URL не содержит расширения, подразумевается `.html`
 *   2. шаблонизатор поддерживает SVG, файлы отрисовываются и отдаются
 *      с `Content-Type: image/svg+xml`
 *   3. шаблонизатор пробует отрисовать страницу `<templates>/site/<url>.html`
 *   4. если с шагом 3 возникли проблемы, пробуем отрисовать страницу
 *      `<templates>/site/<url>/index.html`
 *
 * Поиск шаблонов осуществляется в директории `site` папки с шаблонами
 * (т.е. `<storeRoot>/templates/site`).
 *
 * В `res.render` должен находиться шаблонизатор ProStore.
 */
router.get('/*', function(req, res, next) {
  var ext = path.extname(req.url);
  if (!ext)
    req.url += '.html';
  next();
});

router.get('/*.svg', function(req, res, next) {
  res.type('image/svg+xml');
  res.render('site' + req.url);
});

router.get('/*.html', function(req, res, next) {
  var file = path.join('site', req.url)
    , fallbackFile = path.join(
      path.dirname(file), path.basename(file, '.html'), 'index.html');
  fallback([file, fallbackFile], function(file, cb) {
    debug('Trying %s', file);
    res.render(file, function(err, html) {
      if (err) return cb();
      cb(null, html);
    });
  }, function(err, html) {
    if (err)
      return next(err);
    if (!html)
      return next();
    res.send(html);
  });
});

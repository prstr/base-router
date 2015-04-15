"use strict";

var express = require('express')
  , path = require('path')
  , fallback = require('fallback');

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
 */
var router = module.exports = exports = new express.Router();

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
    res.render(file, function(err, html) {
      /* istanbul ignore if */
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

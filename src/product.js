"use strict";

var $ = require('./index');

/**
 * Маршруты для отрисовки витрины товара.
 *
 * Логика работы:
 *
 *   * если URL не совпадает с каноническим URL товара (например, если URL
 *     запроса был переписан, либо если пользователь обратился по старой ссылке),
 *     то сервер отвечает редиректом на канонический URL;
 *   * шаблонизатор отрисовывает шаблон, заданный переменной `product.template`,
 *     либо `product/view.html`.
 *
 * Данные:
 *
 *   * `store` — дескриптор магазина
 *   * `product` — дескриптор товара
 */

$.get('/product/:id', function(req, res, next) {
  var product = res.locals.product;
  // Redirect to canonical product URL
  if (req.originalUrl != product.url)
    return res.redirect(product.url);
  res.render(product.template || 'product/view.html');
});

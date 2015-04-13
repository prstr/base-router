"use strict";

var $ = require('./index');

/**
 * Маршруты для отрисовки списка товаров в категории.
 *
 * Логика работы:
 *
 *   * если URL не совпадает с каноническим URL категории (например, если URL
 *     запроса был переписан, либо если пользователь обратился по старой ссылке),
 *     то сервер отвечает редиректом на канонический URL;
 *   * шаблонизатор отрисовывает шаблон, заданный переменной `category.template`,
 *     либо `category/view.html`.
 *
 * Данные:
 *
 *   * `store` — дескриптор магазина
 *   * `category` — дескриптор категории
 *   * `products` — товары, найденные по фильтрам
 */

$.get('/category/:id', function(req, res, next) {
  var category = res.locals.category;
  // Redirect to canonical category URL
  if (req.originalUrl != category.url)
    return res.redirect(category.url);
  res.render(category.template || 'category/view.html');
});

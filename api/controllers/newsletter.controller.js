// controllers/newsletter.controller.js

const newsletterService = require('../../services/newsletter.service');

exports.getAllNewsletterItems = async (req, res, next) => {
  try {
    const items = await newsletterService.getAllNewsletterItems(req.query);
    res.json(items);
  } catch (error) {
    next(error);
  }
};

exports.getNewsletterItemById = async (req, res, next) => {
  try {
    const item = await newsletterService.getNewsletterItemById(req.params.id);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

exports.createNewsletterItem = async (req, res, next) => {
  try {
    const usuarioId = req.user?.id || null;
    const item = await newsletterService.createNewsletterItem(req.body, usuarioId);
    res.status(201).json({ newsletterItem: item });
  } catch (error) {
    next(error);
  }
};

exports.updateNewsletterItem = async (req, res, next) => {
  try {
    const usuarioId = req.user?.id || null;
    const item = await newsletterService.updateNewsletterItem(req.params.id, req.body, usuarioId);
    res.json({ newsletterItem: item });
  } catch (error) {
    next(error);
  }
};

exports.deleteNewsletterItem = async (req, res, next) => {
  try {
    await newsletterService.deleteNewsletterItem(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.getHistorialNotificaciones = async (req, res, next) => {
  try {
    const historial = await newsletterService.getHistorialNotificaciones();
    res.json(historial);
  } catch (error) {
    next(error);
  }
};


import { Router } from 'express';
import {
  MenuCardTag,
  MenuRepository,
  MenuTagType,
  SuggestionRepository,
} from '../repositories/MenuRepository';

export function createMenuRouter(menuRepo: MenuRepository, suggestionRepo: SuggestionRepository) {
  const router = Router();
  const validTagTypes: MenuTagType[] = ['bestseller', 'new', 'hot', 'cold'];

  const isValidCategoryId = (value: unknown) =>
    typeof value === 'string' && ['hot-teas', 'milk-drinks', 'cold-drinks', 'snacks'].includes(value);

  const isValidTagType = (value: unknown): value is MenuTagType =>
    typeof value === 'string' && validTagTypes.includes(value as MenuTagType);

  const isTagRecord = (tag: unknown): tag is MenuCardTag =>
    Boolean(
      tag &&
        typeof tag === 'object' &&
        isValidTagType((tag as { type?: unknown }).type) &&
        typeof (tag as { label?: unknown }).label === 'string'
    );

  const isValidTags = (value: unknown): value is MenuCardTag[] | undefined =>
    value === undefined || (Array.isArray(value) && value.every(isTagRecord));

  router.get('/', async (req, res) => {
    const menu = await menuRepo.getAll();
    res.json(menu);
  });

  router.get('/card', async (req, res) => {
    const menu = await menuRepo.getMenuCard();
    res.json(menu);
  });

  router.post('/card/items', async (req, res) => {
    const { name, description, price, categoryId, tags } = req.body ?? {};

    if (
      typeof name !== 'string' ||
      typeof description !== 'string' ||
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      !isValidCategoryId(categoryId) ||
      !isValidTags(tags)
    ) {
      return res.status(400).json({ error: 'Invalid menu itemgit payload' });
    }

    const createdItem = await menuRepo.createMenuCardItem({
      name: name.trim(),
      description: description.trim(),
      price,
      categoryId,
      tags,
    });

    return res.status(201).json(createdItem);
  });

  router.patch('/card/items/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { name, description, price, categoryId, tags } = req.body ?? {};

    if (
      (name !== undefined && typeof name !== 'string') ||
      (description !== undefined && typeof description !== 'string') ||
      (price !== undefined && (typeof price !== 'number' || !Number.isFinite(price))) ||
      (categoryId !== undefined && !isValidCategoryId(categoryId)) ||
      !isValidTags(tags)
    ) {
      return res.status(400).json({ error: 'Invalid menu item update payload' });
    }

    const updatedItem = await menuRepo.updateMenuCardItem(itemId, {
      name: typeof name === 'string' ? name.trim() : undefined,
      description: typeof description === 'string' ? description.trim() : undefined,
      price,
      categoryId,
      tags,
    });

    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    return res.json(updatedItem);
  });

  router.delete('/card/items/:itemId', async (req, res) => {
    const deleted = await menuRepo.deleteMenuCardItem(req.params.itemId);
    if (!deleted) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    return res.status(204).send();
  });

  router.get('/suggestions', async (req, res) => {
    const suggestions = await suggestionRepo.getAll();
    res.json(suggestions);
  });

  return router;
}

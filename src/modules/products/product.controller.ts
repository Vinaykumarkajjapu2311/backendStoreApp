import type { Request, Response } from 'express';
import { createProductSchema, updateProductSchema } from './product.schema.js';
import { createProduct, deactivateProduct, getProduct, listCategories, listProducts, updateProduct } from './product.service.js';
import { ApiError } from '../../utils/api-error.js';

function productId(request: Request) {
  const id = request.params.id;
  if (typeof id !== 'string') throw new ApiError(400, 'INVALID_PRODUCT_ID', 'Invalid product id');
  return id;
}

export async function listProductsController(request: Request, response: Response) {
  const products = await listProducts(request.user?.role === 'ADMIN');
  response.json({ success: true, products });
}

export async function getProductController(request: Request, response: Response) {
  const product = await getProduct(productId(request), request.user?.role === 'ADMIN');
  response.json({ success: true, product });
}

export async function listCategoriesController(_request: Request, response: Response) {
  const categories = await listCategories();
  response.json({ success: true, categories });
}

export async function createProductController(request: Request, response: Response) {
  const product = await createProduct(createProductSchema.parse(request.body));
  response.status(201).json({ success: true, product });
}

export async function updateProductController(request: Request, response: Response) {
  const product = await updateProduct(productId(request), updateProductSchema.parse(request.body));
  response.json({ success: true, product });
}

export async function deactivateProductController(request: Request, response: Response) {
  const product = await deactivateProduct(productId(request));
  response.json({ success: true, product });
}
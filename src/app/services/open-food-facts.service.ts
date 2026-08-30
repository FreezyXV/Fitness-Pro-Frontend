// open-food-facts.service.ts - Base alimentaire ouverte.
//
// La base locale contient 54 aliments generiques : un utilisateur francais n'y
// trouve ni sa baguette, ni son yaourt, ni le moindre produit de marque. Sans
// base large et sans scan de code-barres, le suivi nutritionnel est une
// fonction morte — c'est exactement ce que MyFitnessPal a compris avant tout
// le monde.
//
// OpenFoodFacts est choisi parce que : gratuit, sans cle d'API, CORS ouvert,
// et sa couverture francaise est la meilleure du marche (le projet est ne en
// France). Contrepartie : les donnees sont contributives, donc parfois
// incompletes. Les resultats sont marques comme tels dans l'interface — on ne
// presente jamais une donnee communautaire comme une donnee verifiee.
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import {
  Food,
  FoodCategory,
  Season,
  SustainabilityLevel,
  PriceRange,
} from '@features/nutrition/food-database';

/** Domaine francais : priorise les produits distribues en France. */
const OFF_BASE = 'https://fr.openfoodfacts.org';

/**
 * On demande explicitement les champs utiles. Sans ce filtre, OpenFoodFacts
 * renvoie ~200 champs par produit : la recherche pese alors plusieurs Mo,
 * inacceptable sur le reseau d'une salle de sport.
 */
const FIELDS = [
  'code',
  'product_name',
  'product_name_fr',
  'generic_name_fr',
  'brands',
  'categories_tags',
  'image_front_small_url',
  'nutriscore_grade',
  'allergens_tags',
  'serving_size',
  'nutriments',
].join(',');

const REQUEST_TIMEOUT = 8000;

export interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  generic_name_fr?: string;
  brands?: string;
  categories_tags?: string[];
  image_front_small_url?: string;
  nutriscore_grade?: string;
  allergens_tags?: string[];
  serving_size?: string;
  nutriments?: Record<string, number | string>;
}

@Injectable({ providedIn: 'root' })
export class OpenFoodFactsService {
  private readonly http = inject(HttpClient);

  /**
   * Recherche plein texte. Retourne [] en cas d'echec plutot qu'une erreur :
   * la base locale doit continuer a repondre meme si OpenFoodFacts est
   * indisponible.
   */
  search(query: string, limit = 20): Observable<Food[]> {
    if (query.trim().length < 2) return of([]);

    const params = new HttpParams()
      .set('search_terms', query.trim())
      .set('search_simple', '1')
      .set('action', 'process')
      .set('json', '1')
      .set('page_size', String(limit))
      // Tri par popularite : verifie sur l'API, il change tout. Sans lui,
      // "yaourt" remonte des references marocaines confidentielles ; avec lui,
      // on obtient Danone, Yoplait, Les 2 Vaches — ce que l'utilisateur a
      // reellement dans son frigo. (`unique_scans_n` est ignore par l'API.)
      .set('sort_by', 'popularity_key')
      .set('fields', FIELDS);

    return this.http.get<{ products?: OffProduct[] }>(`${OFF_BASE}/cgi/search.pl`, { params }).pipe(
      timeout(REQUEST_TIMEOUT),
      map(response => (response?.products ?? [])
        .map(product => toFood(product))
        .filter((food): food is Food => food !== null)),
      catchError(() => of([]))
    );
  }

  /** Recherche par code-barres (EAN-8, EAN-13, UPC). */
  lookupBarcode(barcode: string): Observable<Food | null> {
    const clean = barcode.replace(/\D/g, '');
    if (clean.length < 8) return of(null);

    const params = new HttpParams().set('fields', FIELDS);

    return this.http
      .get<{ status?: number; product?: OffProduct }>(
        `${OFF_BASE}/api/v2/product/${clean}.json`,
        { params }
      )
      .pipe(
        timeout(REQUEST_TIMEOUT),
        map(response => (response?.status === 1 && response.product
          ? toFood(response.product)
          : null)),
        catchError(() => of(null))
      );
  }
}

// =============================================
// CONVERSION VERS LE MODELE INTERNE
// =============================================

/**
 * Un produit sans nom ou sans apport energetique est inutilisable pour un
 * suivi calorique : on l'ecarte plutot que d'afficher une ligne a 0 kcal que
 * l'utilisateur ajouterait sans s'en rendre compte.
 */
function toFood(product: OffProduct): Food | null {
  const name =
    product.product_name_fr?.trim() ||
    product.product_name?.trim() ||
    product.generic_name_fr?.trim();

  if (!name || !product.code) return null;

  const n = product.nutriments ?? {};
  const calories = num(n['energy-kcal_100g']);
  if (calories <= 0) return null;

  const brand = product.brands?.split(',')[0]?.trim() ?? '';

  return {
    // Prefixe explicite : evite toute collision avec les identifiants de la
    // base locale et permet de reconnaitre l'origine d'un aliment enregistre.
    id: `off:${product.code}`,
    name: brand ? `${name} — ${brand}` : name,
    nameEn: name,
    category: guessCategory(product.categories_tags ?? []),
    subcategory: brand,
    description: product.generic_name_fr?.trim() ?? '',

    // Valeurs pour 100 g, comme le reste de la base.
    calories: Math.round(calories),
    protein: num(n['proteins_100g']),
    carbs: num(n['carbohydrates_100g']),
    fat: num(n['fat_100g']),
    fiber: num(n['fiber_100g']),
    sugar: num(n['sugars_100g']),
    // OpenFoodFacts exprime le sodium en grammes, le modele interne en mg.
    sodium: Math.round(num(n['sodium_100g']) * 1000),
    potassium: Math.round(num(n['potassium_100g']) * 1000),
    calcium: Math.round(num(n['calcium_100g']) * 1000),
    iron: round1(num(n['iron_100g']) * 1000),
    magnesium: Math.round(num(n['magnesium_100g']) * 1000),
    phosphorus: Math.round(num(n['phosphorus_100g']) * 1000),
    zinc: round1(num(n['zinc_100g']) * 1000),

    // Micronutriments rarement renseignes sur OpenFoodFacts. Ils restent a 0,
    // et l'interface signale que la fiche est incomplete.
    vitaminA: Math.round(num(n['vitamin-a_100g']) * 1000000),
    vitaminC: round1(num(n['vitamin-c_100g']) * 1000),
    vitaminD: 0,
    vitaminE: 0,
    vitaminK: 0,
    vitaminB1: 0,
    vitaminB2: 0,
    vitaminB3: 0,
    vitaminB6: 0,
    vitaminB12: 0,
    folate: 0,
    omega3: 0,
    omega6: 0,
    saturatedFat: num(n['saturated-fat_100g']),
    monounsaturatedFat: num(n['monounsaturated-fat_100g']),
    polyunsaturatedFat: num(n['polyunsaturated-fat_100g']),

    cookingMethods: [],
    allergens: [],
    dietaryRestrictions: [],
    glycemicIndex: 0,
    season: [Season.ALL_YEAR],
    storageMethod: '',
    preparationTips: [],
    healthBenefits: [],

    // false, toujours : la donnee est contributive, pas verifiee par nos soins.
    verified: false,
    popularityScore: 0,
    imageUrl: product.image_front_small_url ?? '',
    alternativeNames: brand ? [brand] : [],
    origin: 'OpenFoodFacts',
    sustainability: SustainabilityLevel.MEDIUM,
    priceRange: PriceRange.MODERATE,

    source: 'openfoodfacts',
    barcode: product.code,
    nutriScore: (product.nutriscore_grade ?? '').toUpperCase() || undefined,
  };
}

/** Deduit une categorie interne a partir des tags OpenFoodFacts. */
function guessCategory(tags: string[]): FoodCategory {
  const joined = tags.join(' ');

  const rules: Array<[RegExp, FoodCategory]> = [
    [/viandes|meats|volaille|poultry|charcuteries/, FoodCategory.PROTEINS],
    [/poissons|fish|seafood|fruits-de-mer/, FoodCategory.SEAFOOD],
    [/produits-laitiers|dairies|fromages|cheeses|yaourts|yogurts/, FoodCategory.DAIRY],
    [/legumes|vegetables/, FoodCategory.VEGETABLES],
    [/fruits/, FoodCategory.FRUITS],
    [/legumineuses|legumes-secs|pulses/, FoodCategory.LEGUMES],
    [/cereales|breads|pains|pastas|pates|rice|riz/, FoodCategory.GRAINS],
    [/noix|nuts|graines|seeds/, FoodCategory.NUTS_SEEDS],
    [/huiles|oils|matieres-grasses|fats/, FoodCategory.OILS_FATS],
    [/boissons|beverages|drinks/, FoodCategory.BEVERAGES],
    [/epices|spices|condiments|herbes/, FoodCategory.HERBS_SPICES],
    [/complements|supplements/, FoodCategory.SUPPLEMENTS],
  ];

  for (const [pattern, category] of rules) {
    if (pattern.test(joined)) return category;
  }
  return FoodCategory.GRAINS;
}

function num(value: unknown): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : (value as number);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

import re
import difflib
from typing import Any, Dict, List, Optional, Tuple

import logging
logger = logging.getLogger(__name__)


def compute_products_data_for_project(
    project: Any,
    list_items: List[Dict[str, Any]],
    loaded_default_guide_products: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Equivalente a tu useEffect que calcula productsData.

    - project: instancia de Project (MongoEngine) o dict con:
        - project_guide_products / projectGuideProducts (lista de dicts)
    - list_items: típicamente line_items de la sales order
    - loaded_default_guide_products: lista (ProjectDefaultGuideProduct)
    """
    try:
        logger.info("Computing products data for project ID: %s", getattr(project, "id", "unknown"))
        if not list_items:
            return []

        # 1) crear el scope array base
        base_items = create_scope_array(
            list_items=list_items,
            loaded_default_guide_products=loaded_default_guide_products,
        )

        # 2) filtrar quantity > 0 y marcar is_new / checked
        items = []
        for item in base_items:
            if item.get("quantity", 0) > 0:
                items.append(
                    {
                        **item,
                        "isNew": False,
                        "checked": item.get("checked", False),
                    }
                )

        project_guide_products = (
            getattr(project, "project_guide_products", None)
            or getattr(project, "projectGuideProducts", None)
            or []
        )

        # 3) fusionar con lo que ya tenga el project.projectGuideProducts
        last_items: List[Dict[str, Any]] = []

        for item in items:
            pid = item.get("id")
            product = next(
                (p for p in project_guide_products if p.get("id") == pid),
                None,
            )

            name_item = item.get("name", "")
            is_mullion = "mullion" in name_item.lower()

            final_item = {
                **item,
                "name": (product or {}).get("name", name_item),
                "price": (product or {}).get(
                    "price",
                    0 if is_mullion else item.get("price", 0),
                ),
                "quantity": (product or {}).get("quantity", item.get("quantity", 0)),
                "notes": (product or {}).get("notes", ""),
                "checked": (product or {}).get("checked", False),
                "deleted": (product or {}).get("deleted", False),
            }
            last_items.append(final_item)

        last_ids = {it["id"] for it in last_items if "id" in it}

        # 4) newItems: projectGuideProducts que no estén en last_items
        new_items = [
            p for p in project_guide_products
            if p.get("id") not in last_ids
        ]

        joined_items = last_items + new_items

        # 5) filtrar deleted
        final_items = [it for it in joined_items if not it.get("deleted")]

        # 6) ordenar por id y combinar por nombre (o como lo tengas definido)
        final_items_sorted = sorted(final_items, key=lambda x: x.get("id", 0))

        products_data = combine_by_name(final_items_sorted)
        
        logger.info("Computed products data count: %d", len(products_data))

        return products_data
    except Exception as exc:
        logger.warning("Error computing products data for project ID %s: %s", getattr(project, "id", "unknown"), exc)
        logger.error("Exception details: %s", exc, exc_info=True)
        return []


def compute_materials_for_project(
    project: Any,
    products_data: List[Dict[str, Any]],
    loaded_default_materials: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Devuelve el array de materials para el proyecto:

    - Si ya tiene projectMaterials, los combina por nombre.
    - Si no, los construye con build_materials_report(product_data, defaults).
    """
    
    logger.info("Computing materials data for project ID: %s", getattr(project, "id", "unknown"))
    
    try:
    
        project_materials = (
            getattr(project, "project_materials", None)
            or getattr(project, "projectMaterials", None)
            or []
        )

        if project_materials and len(project_materials) > 0:
            # ya tiene materiales guardados → solo normalizamos / combinamos
            return combine_by_name(project_materials)

        # no tiene materiales → construirlos desde products_data + defaults
        materials = build_materials_report(products_data, loaded_default_materials)
        logger.info("Computed materials data count: %d", len(materials))
        return materials

    except Exception as exc:
        logger.warning("Error computing materials for project ID %s: %s", getattr(project, "id", "unknown"), exc)
        logger.error("Exception details: %s", exc, exc_info=True)
        return []


# ---------------------------------------------------------------------
# count_char  (equivalente a countChar de JS)
# ---------------------------------------------------------------------
def count_char(s: Optional[str], char: str) -> int:
    """
    Cuenta apariciones de 'char' dentro de 's' (case-insensitive).
    Si s es None, retorna 0.
    """
    if not s:
        return 0
    escaped_char = re.escape(char)
    matches = re.findall(escaped_char, s, flags=re.IGNORECASE)
    return len(matches)


# ---------------------------------------------------------------------
# extract_dimensions  (equivalente a extractDimensions de JS)
# ---------------------------------------------------------------------
def parse_fraction(raw: str) -> float | None:
    """
    Convierte cadenas con posibles fracciones a float.

    Ejemplos válidos:
      "57"          -> 57.0
      "57.125"      -> 57.125
      "57 1/8"      -> 57.125
      "57\n1/8"     -> 57.125
      "1/2"         -> 0.5
      "19.875\n1/8" -> 20.0  (19.875 + 0.125)
    """

    if raw is None:
        return None

    # Normaliza TODOS los espacios (incluye \n, \t) a un solo espacio
    s = " ".join(str(raw).split()).strip()

    if not s:
        return None

    try:
        # Caso: "57 1/8" o "19.875 1/8"
        if " " in s and "/" in s:
            whole_part, frac_part = s.split(" ", 1)
            whole_part = whole_part.strip()
            frac_part = frac_part.strip()

            # Parse decimal / entero
            whole = float(whole_part)

            # Parse fracción tipo "1/8"
            if "/" in frac_part:
                num_str, den_str = frac_part.split("/", 1)
                num = float(num_str.strip())
                den = float(den_str.strip())
                if den != 0:
                    return whole + num / den
                return whole

        # Caso solo fracción: "1/8"
        if "/" in s:
            num_str, den_str = s.split("/", 1)
            num = float(num_str.strip())
            den = float(den_str.strip())
            if den != 0:
                return num / den
            return None

        # Caso normal: "57" o "57.125"
        return float(s)

    except Exception as exc:
        logger.warning("parse_fraction: no se pudo parsear '%s': %s", raw, exc)
        return None


def extract_dimensions(text: str) -> Optional[Tuple[float, float]]:
    if not text:
        return None

    patterns = [
        # 1) "36", "36.5", "36 3/4", "3/8" con o sin comillas, separados por X/x
        re.compile(
            r'(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?)(?:["”])?\s*[xX]\s*'
            r'(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?)(?:["”])?(?:\s*[A-Za-z]+)?'
        ),
        # 2) Variante sin 'x', solo con comillas: 36.0" 48.0"
        re.compile(r'(\d+(?:\.\d+)?)(?:["])\s+(\d+(?:\.\d+)?)(?:["])'),
        # 3) Formato con W= y H1=, pueden incluir fracciones, por ejemplo:
        #    "W=48 X H1=57 1/8"
        re.compile(r'W\s*=\s*([\d\s/\.]+)\s*[xX]\s*H1\s*=\s*([\d\s/\.]+)', re.I),
        # 4) Opcionalmente "Mg" + dígitos, luego número con comillas, espacio, número con comillas:
        #    "Mg1000 36" 48""
        re.compile(
            r'(?:Mg\d+\s+)?(\d+(?:\.\d+)?)(?:["])\s+(\d+(?:\.\d+)?)(?:["])',
            re.I,
        ),
    ]

    match = None
    for pattern in patterns:
        match = pattern.search(text)
        if match:
            break

    if not match:
        return None

    raw_w = match.group(1)
    raw_h = match.group(2)

    width = parse_fraction(raw_w)
    height = parse_fraction(raw_h)

    if width is None or height is None:
        return None

    return width, height


# ---------------------------------------------------------------------
# combine_by_name  (equivalente a combineByName de JS)
# ---------------------------------------------------------------------
def combine_by_name(arr: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Agrupa por nombre (case-insensitive, trimmed) y suma 'quantity'.
    """
    grouped: Dict[str, Dict[str, Any]] = {}

    for cur in arr:
        name = (cur.get("name") or "").strip()
        key = name.lower()
        if not key:
            # si no tiene name, lo dejamos pasar tal cual (opcional)
            key = f"__no_name_{id(cur)}"

        if key not in grouped:
            grouped[key] = cur.copy()
        else:
            # Suma de cantidades
            q1 = grouped[key].get("quantity", 0) or 0
            q2 = cur.get("quantity", 0) or 0
            grouped[key]["quantity"] = float(q1) + float(q2)

    return list(grouped.values())


# ---------------------------------------------------------------------
# create_scope_array  (equivalente a createScopeArray de JS)
# ---------------------------------------------------------------------
def create_scope_array(
    *,
    list_items: Optional[List[Dict[str, Any]]],
    loaded_default_guide_products: Optional[List[Dict[str, Any]]],
) -> List[Dict[str, Any]]:
    """
    Traducción fiel de createScopeArray (JS) a Python.
    """
    
    try:
        logger.info(
            "Creating scope array: %d list items, %d default guide products",
            len(list_items or []),
            len(loaded_default_guide_products or []),
        )

        # scopeArray inicial con los productos por defecto
        scope_array: List[Dict[str, Any]] = [
            {
                "id": item.get("order"),
                "name": item.get("name"),
                "price": item.get("price", 0),
                "quantity": 0,
                "predefined": True,
            }
            for item in (loaded_default_guide_products or [])
        ]

        for item in (list_items or []):
            desc_raw = item.get("description") or ""
            name_raw = item.get("name") or ""
            quantity = item.get("quantity", 0) or 0
            line_item_id = item.get("line_item_id")

            description = desc_raw.strip()
            name = name_raw.strip()

            name_lower = name.lower()
            desc_lower = description.lower()

            # === filteredDescriptionJson ===
            properties_json = filtered_description_json(description)

            # === dimensions ===
            # JS:
            # const dimensions = propertiesJson?.Size
            #   ? extractDimensions(item.description)
            #   : item.description
            #     ? extractDimensions(item.description)
            #     : null;
            #
            # En la práctica SIEMPRE que hay description llama a extractDimensions,
            # así que hacemos lo mismo:
            dimensions = extract_dimensions(description) if description else None

            # === config ===
            # const config =
            #   propertiesJson?.Config ||
            #   propertiesJson?.config ||
            #   propertiesJson?.Size   ||
            #   propertiesJson?.size;
            config = (
                properties_json.get("Config")
                or properties_json.get("config")
                or properties_json.get("Size")
                or properties_json.get("size")
            )

            # === Contar 'O' para scopeArray[2] ===
            # if (config?.length > 0) { ... }
            if config is not None:
                config_str = str(config)
                if len(config_str) > 0 and len(scope_array) > 2:
                    scope_array[2] = {
                        **scope_array[2],
                        "quantity": scope_array[2]["quantity"] + count_char(config_str, "O"),
                    }

            # === Clasificación principal por dimensiones ===
            if dimensions:
                width, height = dimensions  # extract_dimensions ya debe devolver floats

                # WINDOW
                if "window" in name_lower:
                    if width <= 74:
                        if len(scope_array) > 0:
                            scope_array[0] = {
                                **scope_array[0],
                                "quantity": scope_array[0]["quantity"] + quantity,
                            }
                    else:
                        if len(scope_array) > 1:
                            scope_array[1] = {
                                **scope_array[1],
                                "quantity": scope_array[1]["quantity"] + quantity,
                            }

                # FRENCH DOOR
                elif (
                    ("french" in name_lower and "door" in name_lower)
                    or ("french" in desc_lower and "door" in desc_lower)
                    or ("fd" in desc_lower)
                ):
                    x_count = count_char(str(config or ""), "X")
                    qty_to_add = x_count if x_count > 1 else quantity

                    if width <= 39:
                        if len(scope_array) > 3:
                            scope_array[3] = {
                                **scope_array[3],
                                "quantity": scope_array[3]["quantity"] + qty_to_add,
                            }
                    else:
                        if len(scope_array) > 4:
                            scope_array[4] = {
                                **scope_array[4],
                                "quantity": scope_array[4]["quantity"] + qty_to_add,
                            }

                # SLIDING GLASS DOOR (SGD)
                elif (
                    ("slid" in name_lower and "door" in name_lower)
                    or ("slid" in desc_lower and "door" in desc_lower)
                    or ("sgd" in name_lower)
                    or ("sgd" in desc_lower)
                ):
                    if width <= 72:
                        if len(scope_array) > 5:
                            scope_array[5] = {
                                **scope_array[5],
                                "quantity": scope_array[5]["quantity"] + quantity,
                            }
                    else:
                        if len(scope_array) > 6:
                            scope_array[6] = {
                                **scope_array[6],
                                "quantity": scope_array[6]["quantity"] + quantity,
                            }

                # STOREFRONT
                elif ("store" in name_lower and "front" in name_lower):
                    if len(scope_array) > 7:
                        scope_array[7] = {
                            **scope_array[7],
                            "quantity": scope_array[7]["quantity"] + quantity,
                            "price": ((width * height) / 144.0) * 10.0,
                        }

                # OTROS
                else:
                    scope_array.append(
                        {
                            "id": len(scope_array),
                            "name": name,
                            "price": 0,
                            "quantity": quantity,
                            "predefined": False,
                            "itemId": line_item_id,
                        }
                    )

            else:
                # SIN dimensiones → va a "otros" igual que en JS
                scope_array.append(
                    {
                        "id": len(scope_array),
                        "name": name,
                        "price": 0,
                        "quantity": quantity,
                        "predefined": False,
                        "itemId": line_item_id,
                    }
                )

        # Igual que en JS: se combinan por nombre dos veces
        final_array = combine_by_name(scope_array)
        return combine_by_name(final_array)
    except Exception as exc:
        logger.error("Error in create_scope_array: %s", exc, exc_info=True)
        return []

# ---------------------------------------------------------------------
# filtered_description_json  (equivalente a filteredDescriptionJson de JS)
# ---------------------------------------------------------------------

def filtered_description_json(description: str) -> dict:
    """
    Equivalente Python de filteredDescriptionJson de JS.

    Toma un string con líneas tipo:
        "Size: 36 x 48"
        "Config: OOX"
    y devuelve:
        {
            "Size": "36 x 48",
            "Config": "OOX",
        }
    """
    if not description:
        return {}

    result = {}

    for line in description.split('\n'):
        parts = line.split(':')
        if len(parts) >= 2:
            key = parts[0].strip()
            value = ':'.join(parts[1:]).strip()
            if value != '':
                result[key] = value

    return result

def string_similarity(a: str, b: str) -> float:
    """
    Similaridad aproximada entre 0 y 1 (equivalente a compareTwoStrings).
    """
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()


def build_materials_report(
    product_data: List[Dict[str, Any]],
    loaded_default_materials: List[Dict[str, Any]],
    threshold: float = 0.8,
) -> List[Dict[str, Any]]:
    """
    Equivalente Python de buildMaterialsReport(productData, loadedDefaultMaterials).

    product_data: lista de dicts con al menos:
        - id
        - name
        - quantity
        - notes (opcional)

    loaded_default_materials: lista de dicts/objetos con:
        - id
        - name
        - price
        - quantity
        - is_packaged (bool)
        - package_quantity (num)
        - default_guide_products: lista de dicts con:
            - name
            - order  (id de la guía/producto)
    """
    try:
        logger.info(
            "Building materials report: %d products, %d default materials",
            len(product_data),
            len(loaded_default_materials),
        )
        items = []

        for mat in loaded_default_materials:
            logger.info("Processing default material ID %s: %s", mat.get("_id"), mat)
            mat_id = mat.get("_id") or mat.get("id")
            mat_name = mat["name"]
            mat_price = mat.get("price", 0)
            mat_quantity = mat.get("quantity", 1)
            mat_is_packaged = mat.get("is_packaged") or mat.get("isPackaged", False)
            mat_package_qty = mat.get("package_quantity") or mat.get("packageQuantity", 1)

            default_gps = mat.get("default_guide_products") or mat.get("defaultGuideProducts") or []

            # 1) buscamos match entre defaultGuideProducts y product_data
            matches = []
            for dgp in default_gps:
                dgp_name = dgp.get("name", "")
                dgp_order = dgp.get("order")

                # ¿Coincide por ID?
                has_exact_id = any(pd.get("id") == dgp_order for pd in product_data)

                # ¿O por similitud de nombre?
                has_similar_name = any(
                    string_similarity(dgp_name, pd.get("name", "")) >= threshold
                    for pd in product_data
                )

                if has_exact_id or has_similar_name:
                    matches.append(dgp)

            # 2) para cada defaultGuideProduct que matchea, calculamos el material
            for dgp in matches:
                dgp_name = dgp.get("name", "")
                dgp_order = dgp.get("order")

                # buscar el product_data correspondiente
                pd = next(
                    (
                        pdi
                        for pdi in product_data
                        if pdi.get("id") == dgp_order
                        or string_similarity(dgp_name, pdi.get("name", "")) >= threshold
                    ),
                    None,
                )

                if pd is None:
                    continue

                pd_qty = pd.get("quantity", 0) or 0
                pd_notes = pd.get("notes", "")

                base_qty = mat_quantity * pd_qty

                if mat_is_packaged:
                    from math import ceil
                    quantity = ceil(base_qty / (mat_package_qty or 1))
                else:
                    quantity = base_qty

                items.append(
                    {
                        "id": str(mat_id),
                        "name": mat_name,
                        "quantity": quantity,
                        "ticket": "",
                        "cost": mat_price,
                        "store": "",
                        "notes": pd_notes,
                    }
                )

        # agrupar por id y sumar quantity
        grouped: Dict[Any, Dict[str, Any]] = {}
        for cur in items:
            mat_id = cur["id"]
            if mat_id not in grouped:
                grouped[mat_id] = {**cur}
            else:
                grouped[mat_id]["quantity"] += cur["quantity"]

        return list(grouped.values())
    except Exception as exc:
        logger.error("Error in build_materials_report: %s", exc, exc_info=True)
        return []


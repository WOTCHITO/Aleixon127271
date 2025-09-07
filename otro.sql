-- OMITIR ESTA LÍNEA SI LA COLUMNA "search_vector" YA EXISTE
-- ALTER TABLE public.mods
-- ADD COLUMN search_vector tsvector;

-- Crear o reemplazar una función para actualizar el search_vector
-- Es seguro ejecutar esto varias veces
CREATE OR REPLACE FUNCTION public.update_mods_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('spanish', NEW.name || ' ' || NEW.description || ' ' || NEW.developer);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- OMITIR ESTA LÍNEA SI EL DISPARADOR "update_mods_search_vector_trigger" YA EXISTE
-- CREATE TRIGGER update_mods_search_vector_trigger
-- BEFORE INSERT OR UPDATE ON public.mods
-- FOR EACH ROW EXECUTE FUNCTION public.update_mods_search_vector();

-- Crear un índice GIN para una búsqueda eficiente
-- Si el índice ya existe, esto generará un error. Puedes omitirlo si ya lo creaste.
CREATE INDEX IF NOT EXISTS mods_search_vector_idx
ON public.mods
USING GIN (search_vector);

-- Opcionalmente, actualizar las filas existentes (seguro de ejecutar varias veces)
UPDATE public.mods
SET search_vector = to_tsvector('spanish', name || ' ' || description || ' ' || developer)
WHERE search_vector IS NULL;

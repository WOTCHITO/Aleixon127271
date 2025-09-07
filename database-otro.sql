-- Agregar columna search_vector a la tabla mods
ALTER TABLE public.mods
ADD COLUMN search_vector tsvector;

-- Crear una función para actualizar el search_vector
CREATE OR REPLACE FUNCTION public.update_mods_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('spanish', NEW.name || ' ' || NEW.description || ' ' || NEW.developer);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear un disparador para llamar a la función antes de insertar o actualizar
CREATE TRIGGER update_mods_search_vector_trigger
BEFORE INSERT OR UPDATE ON public.mods
FOR EACH ROW EXECUTE FUNCTION public.update_mods_search_vector();

-- Crear un índice GIN para una búsqueda eficiente
CREATE INDEX mods_search_vector_idx
ON public.mods
USING GIN (search_vector);

-- Opcionalmente, actualizar las filas existentes
UPDATE public.mods
SET search_vector = to_tsvector('spanish', name || ' ' || description || ' ' || developer)
WHERE search_vector IS NULL;
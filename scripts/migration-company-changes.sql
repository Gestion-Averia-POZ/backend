-- =====================================================
-- MIGRACIÓN: Agregar company_id a users y crear company_category
-- =====================================================

-- 1. Agregar columna company_id a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES company(id);

-- 2. Crear índice para company_id en users
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- 3. Crear tabla company_category
CREATE TABLE IF NOT EXISTS company_category (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Evitar duplicados
  UNIQUE(category_id, company_id)
);

-- 4. Crear índices para company_category
CREATE INDEX IF NOT EXISTS idx_company_category_category_id ON company_category(category_id);
CREATE INDEX IF NOT EXISTS idx_company_category_company_id ON company_category(company_id);

-- 5. Eliminar tabla company_service si existe
DROP TABLE IF EXISTS company_service CASCADE;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la columna company_id existe en users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'company_id';

-- Verificar que la tabla company_category existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'company_category';

-- Verificar que la tabla company_service fue eliminada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'company_service';

COMMENT ON COLUMN users.company_id IS 'ID de la empresa a la que pertenece el usuario (para roles COMPANY y WORKER)';
COMMENT ON TABLE company_category IS 'Relación entre empresas y categorías de servicios que manejan';

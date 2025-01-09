import { SchemaType, useApexStore } from '@/hooks/useApexStore'
import { useMemo, useRef } from 'react'

export default function GoSchemaDisplay({ schemaName }: { schemaName: string }) {
  const { apex } = useApexStore()
  const processedSchemas = useRef(new Set<string>()) // Prevent duplicate processing

  const schemas = useMemo(() => {
    processedSchemas.current = new Set<string>() // Reset processed schemas
    const main = apex.schemas.find(({ name }) => name === schemaName)
    if (!main) return []
    const schemas = collectGoSchemasRecursively(main, apex.schemas, processedSchemas.current).map(({ name }) => name)
    return Array.from((processedSchemas.current = new Set(schemas)))
  }, [apex.schemas, processedSchemas, schemaName])

  if (!schemas.length) return <p className="text-red-500">Schema "{schemaName}" not found.</p>

  return (
    <div className="border p-4 bg-card rounded-md font-mono text-sm">
      <pre>{schemas.map((s) => formatGoSchema(apex.schemas.find(({ name }) => name === s) as SchemaType, apex.schemas)).join('\n')}</pre>
    </div>
  )
}

// ✅ Recursively collect schemas, ensuring nested structures are included
function collectGoSchemasRecursively(schema: SchemaType, allSchemas: SchemaType[], processedSchemas: Set<string>): SchemaType[] {
  if (processedSchemas.has(schema.name)) return [] // Prevent duplicates
  processedSchemas.add(schema.name)

  const collectedSchemas = [schema] // Start with the main schema

  for (const value of Object.values(schema.fields)) {
    let referencedSchemaName: string | null = null

    if (typeof value === 'string' && allSchemas.find(({ name }) => name === value)) {
      referencedSchemaName = value
    } else if (typeof value === 'object' && value.type === 'array') {
      referencedSchemaName = value.arrayType
    }

    if (referencedSchemaName) {
      const referencedSchema = allSchemas.find(({ name }) => name === referencedSchemaName)
      if (referencedSchema) {
        collectedSchemas.push(...collectGoSchemasRecursively(referencedSchema, allSchemas, processedSchemas))
      }
    }
  }

  return collectedSchemas
}

// ✅ Format schema as Go struct definitions
function formatGoSchema(schema: SchemaType, allSchemas: SchemaType[], processedSchemas = new Set<string>()): string {
  if (!schema.fields) return ''

  // Prevent duplicate struct generation
  if (processedSchemas.has(schema.name)) return ''
  processedSchemas.add(schema.name)

  let result = `type ${schema.name} struct {\n`

  for (const [key, value] of Object.entries(schema.fields)) {
    const fieldType = resolveGoType(value, allSchemas)

    result += `\t${capitalizeGo(key)} ${fieldType} \`json:"${key}"\`\n`
  }

  result += `}\n\n`

  return result
}

// ✅ Recursively resolve Go types (primitives, arrays, custom types)
function resolveGoType(value: string | { type: 'array'; arrayType: string }, allSchemas: SchemaType[]): string {
  if (typeof value === 'string') {
    switch (value) {
      case 'string':
        return 'string'
      case 'number':
        return 'float64'
      case 'boolean':
        return 'bool'
      default:
        return value // Custom type
    }
  }

  if (typeof value === 'object' && value.type === 'array') {
    return `[]${resolveGoType(value.arrayType, allSchemas)}`
  }

  return 'interface{}' // Fallback for unknown types
}

function capitalizeGo(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

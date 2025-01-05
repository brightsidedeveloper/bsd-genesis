import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useMemo, useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export const Route = createLazyFileRoute('/projects/$name/schemas')({
  component: RouteComponent,
})

function RouteComponent() {
  const [schema, setSchema] = useState<string>('')
  const [schemasData, setSchemasData] = useState<SomeType>(some)

  const [edit, setEdit] = useState(false)

  useEffect(() => {
    setEdit(false)
  }, [schema])

  const data = useMemo(() => schemasData[schema] ?? null, [schema, schemasData])

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Schemas</h2>
      <hr />
      <div className="flex relative">
        <ScrollArea className="flex-1 h-[calc(100vh-var(--header-height)-40px-64px)]">
          {schema ? (
            <div className="flex flex-col gap-4  pr-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{schema}</h3>
                <Button onClick={() => setEdit((prev) => !prev)} size="sm">
                  {edit ? 'Save' : 'Edit'}
                </Button>
              </div>
              {data ? (
                edit ? (
                  <RecursiveEditor
                    value={data}
                    onChange={(newSchema) =>
                      setSchemasData((prev) => ({
                        ...prev,
                        [schema]: newSchema,
                      }))
                    }
                    path={schema}
                  />
                ) : (
                  <SchemaPreview schema={data} />
                )
              ) : (
                <p className="text-gray-500">No schema selected.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <h3 className="text-lg font-semibold">Select or create a schema</h3>
            </div>
          )}
        </ScrollArea>
        <ScrollArea className="w-52 h-[calc(100vh-var(--header-height)-40px-64px)] border-l pl-4 pb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Schemas</h3>
            <Button
              onClick={() => {
                const newSchemaName = `NewSchema${Object.keys(schemasData).length + 1}`
                setSchemasData((prev) => ({
                  ...prev,
                  [newSchemaName]: { properties: {} },
                }))
                setSchema(newSchemaName)
              }}
              size="sm"
              className="font-light hover:text-blue-500"
            >
              + New
            </Button>
          </div>
          <Input className="mb-2" placeholder="Search" />
          <div className="flex flex-col gap-2">
            {Object.keys(schemasData).map((s) => (
              <button
                key={s}
                onClick={() => setSchema((c) => (c === s ? '' : s))}
                className={cn(s === schema && 'bg-primary/15', 'hover:bg-primary/10 rounded-lg p-2')}
              >
                {s}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function SchemaPreview({ schema }: { schema: SchemaType }) {
  const formattedSchema = useMemo(() => formatSchemaToTs(schema), [schema])

  return <pre className="p-4 bg-gray-900 text-white font-mono rounded-lg overflow-auto">{formattedSchema}</pre>
}

// 🛠️ Utility Function: Converts Schema to TypeScript-like Format
function formatSchemaToTs(schema: SchemaType, indent = 0): string {
  const indentation = '  '.repeat(indent)
  let result = `{\n`

  Object.entries(schema.properties || {}).forEach(([key, propValue]) => {
    const optional = propValue.optional ? '?' : ''
    if (propValue.type === 'object' && propValue.properties) {
      result += `${indentation}  ${key}${optional}: ${formatSchemaToTs(propValue, indent + 1)};\n`
    } else if (propValue.type === 'array' && propValue.items) {
      const arrayType =
        propValue.items.type === 'object' && propValue.items.properties
          ? formatSchemaToTs(propValue.items, indent + 1)
          : propValue.items.type
      result += `${indentation}  ${key}${optional}: ${arrayType}[];\n`
    } else {
      result += `${indentation}  ${key}${optional}: ${propValue.type};\n`
    }
  })

  result += `${indentation}}`
  return result
}

// 🟢 Recursive Editor Component for Editing Schema Properties
function RecursiveEditor({ value, onChange, path }: { value: SchemaType; onChange: (newValue: SchemaType) => void; path: string }) {
  // Keep local input state to avoid re-renders on every keystroke
  const [editedFields, setEditedFields] = useState<Record<string, string>>(
    Object.keys(value.properties || {}).reduce((acc, key) => ({ ...acc, [key]: key }), {})
  )

  // ✅ Add a new field
  const handleAddField = useCallback(() => {
    const newKey = `newField${Object.keys(value.properties || {}).length + 1}`
    onChange({
      ...value,
      properties: {
        ...(value.properties || {}),
        [newKey]: { type: 'string' },
      },
    })
    setEditedFields((prev) => ({ ...prev, [newKey]: newKey }))
  }, [onChange, value])

  // ✅ Delete a field
  const handleDeleteField = useCallback(
    (key: string) => {
      const updatedProperties = { ...value.properties }
      delete updatedProperties[key]
      onChange({ ...value, properties: updatedProperties })
    },
    [onChange, value]
  )

  // ✅ Update the field name (without losing focus)
  const handleRenameField = useCallback((oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return // Prevent empty names
    setEditedFields((prev) => ({ ...prev, [oldKey]: newKey }))
  }, [])

  // ✅ Save the renamed field **only on blur**
  const handleRenameFieldBlur = useCallback(
    (oldKey: string) => {
      const newKey = editedFields[oldKey]
      if (!newKey.trim() || oldKey === newKey) return

      const updatedProperties = { ...value.properties }
      updatedProperties[newKey] = updatedProperties[oldKey]
      delete updatedProperties[oldKey]

      onChange({ ...value, properties: updatedProperties })
    },
    [onChange, value, editedFields]
  )

  // ✅ Change field type
  const handleTypeChange = useCallback(
    (key: string, newType: string) => {
      const updatedProperties = { ...value.properties }
      if (newType === 'object') {
        updatedProperties[key] = { type: 'object', properties: {} }
      } else if (newType === 'array') {
        updatedProperties[key] = { type: 'array', items: { type: 'string' } }
      } else {
        updatedProperties[key] = { type: newType }
      }
      onChange({ ...value, properties: updatedProperties })
    },
    [onChange, value]
  )

  return (
    <div className="p-2 border mb-4">
      <h4 className="text-lg font-bold mb-2">Schema Properties</h4>
      {Object.entries(value.properties || {}).map(([key, propValue]) => (
        <div key={key} className="mb-4">
          <label className="block text-sm font-light mb-1">Field Name:</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={editedFields[key] || key}
              onChange={(e) => handleRenameField(key, e.target.value)}
              onBlur={() => handleRenameFieldBlur(key)}
              className="p-1 border bg-gray-800 text-white w-full"
            />
            <button onClick={() => handleDeleteField(key)} className="text-red-500 text-sm">
              Delete
            </button>
          </div>

          <label className="block text-sm font-light mb-1">Type:</label>
          <select
            value={propValue.type}
            onChange={(e) => handleTypeChange(key, e.target.value)}
            className="w-full p-1 bg-gray-800 text-white"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
          </select>

          {propValue.type === 'array' && propValue.items && (
            <div className="ml-4 border-l pl-4 mt-2">
              <label className="block text-sm font-light mb-1">Array Item Type:</label>
              <select
                value={propValue.items.type}
                onChange={(e) =>
                  onChange({
                    ...value,
                    properties: {
                      ...value.properties,
                      [key]: {
                        type: 'array',
                        items: { type: e.target.value, properties: e.target.value === 'object' ? {} : undefined },
                      },
                    },
                  })
                }
                className="w-full p-1 bg-gray-800 text-white"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
              </select>

              {propValue.items.type === 'object' && (
                <div className="ml-4 border-l pl-4 mt-2">
                  <RecursiveEditor
                    value={propValue.items}
                    onChange={(newValue) =>
                      onChange({
                        ...value,
                        properties: { ...value.properties, [key]: { type: 'array', items: newValue } },
                      })
                    }
                    path={`${path}.${key}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <button onClick={handleAddField} className="text-blue-500">
        + Add Field
      </button>
    </div>
  )
}

// 🟢 Type Definitions
type SchemaType = {
  properties: Record<
    string,
    { type: 'string' | 'number' | 'boolean' | 'object' | 'array'; properties?: SchemaType['properties']; items?: SchemaType }
  >
}

type SomeType = Record<string, SchemaType>

// 🟢 Example Initial Data
const some: SomeType = {
  User: {
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      profile: {
        type: 'object',
        properties: {
          age: { type: 'number' },
          location: { type: 'string' },
        },
      },
    },
  },
}

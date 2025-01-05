import Go from '@/Go'
import { toast } from 'sonner'
import { z } from 'zod'
import { create } from 'zustand'

// ✅ Endpoint Schema
export const EndpointSchema = z.object({
  path: z.string(),
  methods: z.array(z.union([z.literal('GET'), z.literal('POST'), z.literal('PUT'), z.literal('DELETE'), z.literal('PATCH')])),
  secured: z.array(z.union([z.literal('GET'), z.literal('POST'), z.literal('PUT'), z.literal('DELETE'), z.literal('PATCH')])),
})

// ✅ Base Field Schema (Handles Primitive Types & Objects)
const BaseFieldSchema = z.union([
  z.string(), // Basic Type (e.g., "string", "number", "boolean")
  z.object({ type: z.string(), required: z.boolean().optional() }), // Object field
  z.array(z.string()), // Array of basic types
  z.array(z.object({ type: z.string(), required: z.boolean().optional() })), // Array of objects
])

// ✅ Query Schema (Only Key-Value Pairs, No Nesting)
export const QuerySchema = z.object({
  name: z.string(),
  type: z.literal('Query'),
  fields: z.record(z.string()), // Only simple key-value pairs (no nesting)
})

// ✅ Body Schema (Nested Fields Allowed)
export const BodySchema = z.object({
  name: z.string(),
  type: z.literal('Body'), // Unique discriminator value
  fields: z.record(BaseFieldSchema).default({}), // Supports nested fields, allows empty fields
})

// ✅ Response Schema (Nested Fields Allowed)
export const ResponseSchema = z.object({
  name: z.string(),
  type: z.literal('Response'), // Unique discriminator value
  fields: z.record(BaseFieldSchema).default({}), // Supports nested fields, allows empty fields
})

// ✅ Custom Schema (Recursive Type, Can Reference Other Schemas)
export const CustomSchema = z.object({
  name: z.string(),
  type: z.literal('Custom'),
  fields: z.record(z.union([BaseFieldSchema, z.string()])), // Allows using another schema as a field
})

// ✅ General Schema (Combines All Types)
export const SchemaSchema = z.discriminatedUnion('type', [QuerySchema, BodySchema, ResponseSchema, CustomSchema])

// ✅ Operation Schema
export const OperationSchema = z
  .object({
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']), // Ensure valid HTTP methods
    querySchema: z.string().optional(),
    bodySchema: z.string().optional(),
    responseSchema: z.string(), // Required field
  })
  .refine(
    (data) => {
      if (data.method === 'GET') {
        return !data.bodySchema // GET should not have a body
      }
      return true
    },
    {
      message: 'GET requests cannot have a bodySchema.',
      path: ['bodySchema'],
    }
  )
  .refine(
    (data) => {
      if (['POST', 'PUT', 'DELETE'].includes(data.method)) {
        return !data.querySchema // POST, PUT, DELETE should not have query parameters
      }
      return true
    },
    {
      message: 'POST, PUT, and DELETE requests cannot have a querySchema.',
      path: ['querySchema'],
    }
  )

// ✅ Apex Schema (Full Structure)
export const ApexSchema = z.object({
  endpoints: z.array(EndpointSchema),
  schemas: z.array(SchemaSchema),
  operations: z.array(OperationSchema),
})

export type EndpointType = z.infer<typeof EndpointSchema>
export type QuerySchemaType = z.infer<typeof QuerySchema>
export type BodySchemaType = z.infer<typeof BodySchema>
export type ResponseSchemaType = z.infer<typeof ResponseSchema>
export type CustomSchemaType = z.infer<typeof CustomSchema>
export type SchemaType = z.infer<typeof SchemaSchema>
export type OperationType = z.infer<typeof OperationSchema>
export type ApexDataType = z.infer<typeof ApexSchema>

// Zustand Store
interface ApexStore {
  apex: ApexDataType
  originalApex: ApexDataType
  reset: () => void
  clear: () => void
  loadApex: (dir: string) => Promise<void>
  addEndpoint: (endpoint: EndpointType) => void
  updateEndpoint: (path: string, updated: EndpointType) => void
  deleteEndpoint: (path: string) => void
  addSchema: (schema: SchemaType) => void
  updateSchema: (name: string, updated: SchemaType) => void
  deleteSchema: (name: string) => void
  addOperation: (operation: OperationType) => void
  updateOperation: (name: string, updated: OperationType) => void
  deleteOperation: (name: string) => void
  saveApex: (dir: string) => Promise<void>
}

export const useApexStore = create<ApexStore>()((set, get) => ({
  apex: { endpoints: [], schemas: [], operations: [] },
  originalApex: { endpoints: [], schemas: [], operations: [] },

  reset: () => set({ apex: get().originalApex }),
  clear: () => set({ apex: { endpoints: [], schemas: [], operations: [] } }),
  // Load apex.json from backend
  loadApex: async (dir) => {
    try {
      const rawApex = await Go.apex.get(dir)
      const apex = ApexSchema.parse(rawApex)
      set({ apex, originalApex: apex })
    } catch (error) {
      console.error('❌ Error loading APEX data:', error)
    }
  },

  // CRUD Functions for Endpoints
  addEndpoint: (endpoint) => set((state) => ({ apex: { ...state.apex, endpoints: [...state.apex.endpoints, endpoint] } })),
  updateEndpoint: (path, updated) =>
    set((state) => {
      const endpoints = [...state.apex.endpoints]
      const index = endpoints.findIndex((e) => e.path === path)
      if (index === -1) return state
      endpoints[index] = updated
      return { apex: { ...state.apex, endpoints } }
    }),
  deleteEndpoint: (path) =>
    set((state) => {
      const endpoints = [...state.apex.endpoints]
      // TODO Delete all operations that use this endpoint
      const index = endpoints.findIndex((e) => e.path === path)
      if (index === -1) return state
      endpoints.splice(index, 1)
      return { apex: { ...state.apex, endpoints } }
    }),

  // CRUD Functions for Schemas
  addSchema: (schema) => set((state) => ({ apex: { ...state.apex, schemas: [...state.apex.schemas, schema] } })),
  updateSchema: (name, updated) =>
    set((state) => {
      const schemas = [...state.apex.schemas]
      const index = schemas.findIndex((e) => e.name === name)
      if (index === -1) return state
      schemas[index] = updated
      return { apex: { ...state.apex, schemas } }
    }),
  deleteSchema: (name) =>
    set((state) => {
      const schemas = [...state.apex.schemas]
      const index = schemas.findIndex((e) => e.name === name)
      if (index === -1) return state
      schemas.splice(index, 1)
      return { apex: { ...state.apex, schemas } }
    }),

  // CRUD Functions for Operations
  addOperation: (operation) => set((state) => ({ apex: { ...state.apex, operations: [...state.apex.operations, operation] } })),
  updateOperation: (name, updated) =>
    set((state) => {
      const operations = [...state.apex.operations]
      const index = operations.findIndex((e) => e.endpoint === name)
      if (index === -1) return state
      operations[index] = updated
      return { apex: { ...state.apex, operations } }
    }),
  deleteOperation: (name) =>
    set((state) => {
      const operations = [...state.apex.operations]
      const index = operations.findIndex((e) => e.endpoint === name)
      if (index === -1) return state
      operations.splice(index, 1)
      return { apex: { ...state.apex, operations } }
    }),

  // Save changes to apex.json
  saveApex: async (dir) => {
    Go.apex
      .save(dir, get().apex)
      .then(() => {
        toast.success('APEX data saved successfully')
        Go.apex
          .get(dir)
          .then((rawApex) => {
            const apex = ApexSchema.parse(rawApex)
            set({ apex, originalApex: apex })
          })
          .catch((error) => {
            console.error('❌ Error loading APEX data:', error)
            toast.error('Error loading APEX data')
          })
      })
      .catch((error) => {
        console.error('❌ Error saving APEX data:', error)
        toast.error('Error saving APEX data')
      })
  },
}))

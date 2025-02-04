import { z } from 'zod'

export const ProjectJSONSchema = z.object({
  name: z.string(),
  description: z.string().optional(),

  database: z.literal('postgres'),
})

export type ProjectJSONType = z.infer<typeof ProjectJSONSchema>

export const GetProjectsSchema = z
  .array(
    z.object({
      dir: z.string(),
      project: ProjectJSONSchema,
    })
  )
  .default([])

export type GetProjectsType = z.infer<typeof GetProjectsSchema>

export const CreateProjectSchema = z.object({
  dir: z.string(),
  name: z.string(),
  description: z.string().optional(),
  database: z.literal('postgres'),
})

export type CreateProjectType = z.infer<typeof CreateProjectSchema>

export const GetServerStatusSchema = z.object({
  db: z.union([z.literal('running'), z.literal('stopped')]),
  server: z.union([z.literal('running'), z.literal('stopped')]),
})

export type GetServerStatusType = z.infer<typeof GetServerStatusSchema>

export const GetClientAppsSchema = z.array(
  z.object({
    type: z.union([z.literal('web'), z.literal('mobile'), z.literal('desktop')]),
    exists: z.boolean(),
  })
)

export type GetClientAppsType = z.infer<typeof GetClientAppsSchema>

export const GetClientDevServersSchema = z.object({
  web: z.boolean(),
  mobile: z.boolean(),
  desktop: z.boolean(),
})

export type GetClientDevServersType = z.infer<typeof GetClientDevServersSchema>

export const SQLQuerySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  query: z.string(),
  timestamp: z.string(),
})
export const GetSQLHistorySchema = z.object({
  queries: z.array(SQLQuerySchema),
})

export type GetSQLHistoryType = z.infer<typeof GetSQLHistorySchema>
export type SQLQueryType = z.infer<typeof SQLQuerySchema>

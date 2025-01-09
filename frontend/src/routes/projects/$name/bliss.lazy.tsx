import Combobox from '@/components/Combobox'
import DialogForm from '@/components/DialogForm'
import Selecty from '@/components/Selecty'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import UpdateSchema from '@/components/UpdateSchema'
import { useApexStore } from '@/hooks/useApexStore'
import useCombobox from '@/hooks/useCombobox'
import useDialogForm from '@/hooks/useDialogForm'
import useDirAndName from '@/hooks/useDirAndName'
import { Label } from '@radix-ui/react-dropdown-menu'
import { createLazyFileRoute } from '@tanstack/react-router'
import isEqual from 'lodash.isequal'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createLazyFileRoute('/projects/$name/bliss')({
  component: RouteComponent,
})

function RouteComponent() {
  const { dir } = useDirAndName()
  const { apex, originalApex, addEndpoint, addSchema, updateEndpoint, loadApex } = useApexStore()
  useEffect(() => {
    loadApex(dir)
  }, [dir, loadApex])

  const isDirty = useMemo(() => !isEqual(apex, originalApex), [apex, originalApex])

  const [opName, setOpName] = useState('')

  const endpointComboboxProps = useCombobox('', {
    items: apex.endpoints.map(({ path }) => ({ value: path })),
  })

  const activeEndpoint = useMemo(
    () => apex.endpoints.find((e) => e.path === endpointComboboxProps.value),
    [apex.endpoints, endpointComboboxProps.value]
  )

  const createEndpointDialogProps = useDialogForm(
    ({ namespace, path }) => {
      const trimmedNamespace = namespace.trim()
      const trimmedPath = path.trim()
      if (!trimmedNamespace) {
        toast.error('Namespace is required')
        return false
      }
      if (!trimmedPath) {
        toast.error('Path is required')
        return false
      }
      if (trimmedNamespace.includes(' ') || trimmedNamespace.includes('/')) {
        toast.error('Namespace cannot contain spaces or slashes')
        return false
      }
      if (trimmedPath.includes(' ') || trimmedPath.endsWith('/')) {
        toast.error('Path cannot contain spaces or end in slashes')
        return false
      }
      const newPath = '/api/' + trimmedNamespace + '/' + trimmedPath
      if (apex.endpoints.some((e) => e.path === newPath)) {
        toast.error('Endpoint already exists')
        return false
      }
      addEndpoint({
        methods: [],
        path: newPath,
        secured: [],
      })
      return true
    },
    z.object({ namespace: z.string(), path: z.string() })
  )

  const methods = useMemo(() => activeEndpoint?.methods ?? [], [activeEndpoint?.methods])
  const secured = useMemo(() => activeEndpoint?.secured ?? [], [activeEndpoint?.secured])

  const methodSelectProps = useCombobox('', {
    items: activeEndpoint?.methods.map((m) => ({ value: m })) ?? [],
  })

  useEffect(() => {
    if (!methodSelectProps.value || activeEndpoint?.methods.includes(methodSelectProps.value)) return
    methodSelectProps.setValue('')
  }, [activeEndpoint?.methods, methodSelectProps, methodSelectProps.value])

  const activeMethod = useMemo(
    () => activeEndpoint?.methods.find((m) => m === methodSelectProps.value),
    [activeEndpoint, methodSelectProps.value]
  )

  const queryParamsComboboxProps = useCombobox('', {
    items: apex.schemas.filter(({ type }) => type === 'Query').map(({ name }) => ({ value: name })) ?? [],
  })

  const activeQueryParam = useMemo(
    () => apex.schemas.find((s) => s.name === queryParamsComboboxProps.value),
    [apex.schemas, queryParamsComboboxProps.value]
  )

  const [editQueryParams, setEditQueryParams] = useState(false)

  const createQueryParamDialogProps = useDialogForm(
    ({ name }) => {
      const cleanName = name.replace(/[^\w]/g, '')
      const finalName = cleanName + 'Query'
      if (!finalName) {
        toast.error('Name is required')
        return false
      }
      if (finalName.includes(' ')) {
        toast.error('Name cannot contain spaces')
        return false
      }

      if (apex.schemas.some((s) => s.name === finalName)) {
        toast.error('Schema already exists')
        return false
      }
      addSchema({ name: finalName, type: 'Query', fields: {}, required: [] })

      return true
    },
    z.object({ name: z.string() })
  )
  const createResponseDialogProps = useDialogForm(
    ({ name }) => {
      const cleanName = name.replace(/[^\w]/g, '')
      const finalName = cleanName + 'Response'
      if (!finalName) {
        toast.error('Name is required')
        return false
      }
      if (finalName.includes(' ')) {
        toast.error('Name cannot contain spaces')
        return false
      }

      if (apex.schemas.some((s) => s.name === finalName)) {
        toast.error('Schema already exists')
        return false
      }
      addSchema({ name: finalName, type: 'Response', fields: {}, required: [] })

      return true
    },
    z.object({ name: z.string() })
  )

  const [editBody, setEditBody] = useState(false)

  const createBodyDialogProps = useDialogForm(
    ({ name }) => {
      const cleanName = name.replace(/[^\w]/g, '')
      const finalName = cleanName + 'Body'
      if (!finalName) {
        toast.error('Name is required')
        return false
      }
      if (finalName.includes(' ')) {
        toast.error('Name cannot contain spaces')
        return false
      }

      if (apex.schemas.some((s) => s.name === finalName)) {
        toast.error('Schema already exists')
        return false
      }
      addSchema({ name: finalName, type: 'Body', fields: {}, required: [] })

      return true
    },
    z.object({ name: z.string() })
  )

  const bodyParamsComboboxProps = useCombobox('', {
    items: apex.schemas.filter(({ type }) => type === 'Body').map(({ name }) => ({ value: name })) ?? [],
  })

  const activeBodyParam = useMemo(
    () => apex.schemas.find((s) => s.name === bodyParamsComboboxProps.value),
    [apex.schemas, bodyParamsComboboxProps.value]
  )

  const [tab, setTab] = useState<'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CUSTOM'>('SELECT')

  const responseSchemaComboboxProps = useCombobox('', {
    items: apex.schemas.filter(({ type }) => type === 'Response').map(({ name }) => ({ value: name })) ?? [],
  })

  const activeResponseSchema = useMemo(
    () => apex.schemas.find((s) => s.name === responseSchemaComboboxProps.value),
    [apex.schemas, responseSchemaComboboxProps.value]
  )

  return (
    <div>
      <h3 className="text-2xl font-bold">Bliss</h3>
      <hr className="my-2" />
      <div className="flex flex-col gap-2">
        <Label>Operation Name</Label>
        <Input value={opName} onChange={(e) => setOpName(e.target.value)} />
        {opName && (
          <>
            <hr />
            <Label>Endpoint</Label>
            <div className="flex gap-4">
              <Combobox emptyStr="No Endpoints Found" placeholder="Search..." {...endpointComboboxProps}>
                Select an endpoint
              </Combobox>
              <DialogForm
                title="Create Endpoint"
                desc="Create a new endpoint"
                submitText="Create"
                triggerText="Add Endpoint"
                {...createEndpointDialogProps}
              >
                <Input name="namespace" placeholder="Endpoint Namespace" />
                <Input name="path" placeholder="Endpoint Path" />
              </DialogForm>
            </div>
          </>
        )}
        <div className="flex justify-between">
          {activeEndpoint &&
            METHODS.map((m) => (
              <div key={m} className="flex gap-4">
                <Label className="text-lg">{m}</Label>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label>Enabled</Label>
                    <Checkbox
                      id={'enabled-' + m}
                      checked={methods.includes(m)}
                      onCheckedChange={(checked) =>
                        updateEndpoint(activeEndpoint.path, {
                          ...activeEndpoint,
                          methods: checked ? Array.from(new Set([...methods, m])) : methods.filter((i) => i !== m),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Secured</Label>
                    <Checkbox
                      disabled={!methods.includes(m)}
                      checked={secured.includes(m)}
                      onCheckedChange={(checked) =>
                        updateEndpoint(activeEndpoint.path, {
                          ...activeEndpoint,
                          secured: checked ? Array.from(new Set([...secured, m])) : secured.filter((i) => i !== m),
                        })
                      }
                      id={'secured-' + m}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
        {!!methods.length && (
          <>
            <hr />
            <Label>Method</Label>
            <Selecty {...methodSelectProps} />
          </>
        )}
        {activeMethod === 'GET' && (
          <>
            <hr />
            <Label>Query Params</Label>
            <div className="flex gap-4">
              <Combobox placeholder="Search..." emptyStr="No Query Params Found" {...queryParamsComboboxProps}>
                Select a query param
              </Combobox>
              <DialogForm
                title="Create Query Param"
                desc="Create a new query param"
                submitText="Create"
                triggerText="Add Query Param"
                {...createQueryParamDialogProps}
              >
                <Input name="name" placeholder="Query Param Name" />
              </DialogForm>
            </div>
            {activeQueryParam && <UpdateSchema schema={activeQueryParam} />}
          </>
        )}
        {(activeBodyParam || activeQueryParam) && (
          <>
            <hr />
            <Label>Query</Label>
            <Tabs value={tab} onValueChange={(t) => setTab(t as 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CUSTOM')}>
              <div className="flex justify-center mb-4">
                <TabsList>
                  <TabsTrigger value="SELECT">SELECT</TabsTrigger>
                  <TabsTrigger value="INSERT">INSERT</TabsTrigger>
                  <TabsTrigger value="UPDATE">UPDATE</TabsTrigger>
                  <TabsTrigger value="DELETE">DELETE</TabsTrigger>
                  <TabsTrigger value="CUSTOM">CUSTOM</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="SELECT">
                <div className="flex flex-col gap-2">
                  <Textarea placeholder="SELECT name, email FROM public.profile p WHERE p.id {userID}" />
                  <Label>Response Schema</Label>
                  <div className="flex gap-4">
                    <Combobox placeholder="Search..." emptyStr="No Response Schemas Found" {...responseSchemaComboboxProps}>
                      Select a response schema
                    </Combobox>
                    <DialogForm
                      title="Response Schema"
                      desc="Create a new response aligned with the select"
                      submitText="Create"
                      triggerText="Add Response"
                      {...createResponseDialogProps}
                    >
                      <Input name="name" placeholder="Response Name" />
                    </DialogForm>
                  </div>
                  {activeResponseSchema && <UpdateSchema schema={activeResponseSchema} />}
                </div>
              </TabsContent>
              <TabsContent value="CUSTOM">
                <div className="flex flex-col gap-2">
                  <Label>Custom</Label>
                  <Textarea placeholder="Custom Query" />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

// {activeMethod && activeMethod !== 'GET' && (
//   <>
//     <hr />
//     <Label>Body Params</Label>
//     <div className="flex gap-4">
//       <Combobox {...bodyParamsComboboxProps} placeholder="Search..." emptyStr="No Bodies Found">
//         Select a body
//       </Combobox>
//       <DialogForm
//         title="Create Body Param"
//         desc="Create a new body param"
//         submitText="Create"
//         triggerText="Add Body Param"
//         {...createBodyDialogProps}
//       >
//         <Input name="name" placeholder="Body Param Name" />
//       </DialogForm>
//     </div>
//     {activeBodyParam &&
//       (editBody ? (
//         <>
//           <Button onClick={() => setEditBody(false)}>Done</Button>
//           <UpdateSchema schema={activeBodyParam} />
//         </>
//       ) : (
//         <>
//           <Button onClick={() => setEditBody(true)}>Edit</Button>
//           <GoSchemaDisplay schemaName={activeBodyParam.name} />
//         </>
//       ))}
//   </>
// )}

import React, { FormEventHandler } from 'react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'

export default function DialogForm({ handleSubmit, title, desc, submitText, closeRef, triggerText, children }: DialogFormProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{triggerText ?? 'Open Dialog'}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button ref={closeRef} type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">{submitText ?? 'Submit'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DialogFormProps {
  title: string
  desc?: string
  triggerText?: string
  submitText?: string
  handleSubmit: FormEventHandler
  closeRef: React.RefObject<HTMLButtonElement>
  children: React.ReactNode
}

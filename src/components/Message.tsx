import { h, FunctionComponent } from 'preact'

export const MessageComponent: FunctionComponent<{ message?: string }> = ({ message }) => (
  <p class="font-bold">Lorem asdf: {message}</p>
)

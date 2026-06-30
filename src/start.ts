import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

/** TanStack Start instance with CSRF protection for server functions. */
export const startInstance = createStart(() => {
  return {
    requestMiddleware: [csrfMiddleware],
  }
})